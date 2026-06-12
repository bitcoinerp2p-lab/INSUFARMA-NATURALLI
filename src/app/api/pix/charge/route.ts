import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { createPixCharge, getPixQrCode, cancelPixCharge } from "@/lib/efi";
import { Prisma } from "@prisma/client";

function getAuth(req: NextRequest) {
  try {
    const token = req.cookies.get("auth-token")?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

const schema = z.object({ orderId: z.string().uuid() });

// Generate or regenerate Pix charge for an order
export async function POST(req: NextRequest) {
  const auth = getAuth(req);
  if (!auth) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "orderId inválido" }, { status: 400 });
  }

  const { orderId } = parsed.data;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: { select: { name: true, cpf: true } } },
  });

  if (!order) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  if (auth.role !== "ADMIN" && order.userId !== auth.id) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }
  if (order.status === "PAID") {
    return NextResponse.json({ error: "Pedido já pago" }, { status: 422 });
  }

  const pixKey = process.env.EFI_PIX_KEY ?? "";
  if (!pixKey) {
    return NextResponse.json({ error: "Chave Pix não configurada no servidor" }, { status: 500 });
  }

  // Cancel previous charge if exists
  if (order.efiPaymentId) {
    try {
      await cancelPixCharge(order.efiPaymentId);
      await prisma.payment.updateMany({
        where: { txid: order.efiPaymentId },
        data: { status: "CANCELLED" },
      }).catch(() => {});
    } catch {
      // Ignore — charge may already be expired/cancelled
    }
  }

  try {
    const charge = await createPixCharge({
      valor: Number(order.totalAmount).toFixed(2),
      chave: pixKey,
      expiracaoSegundos: 3600,
      devedorCpf: order.user.cpf ?? undefined,
      devedorNome: order.user.name ?? undefined,
      solicitacaoPagador: `Pedido #${order.id.slice(-8).toUpperCase()} — Insufarma Naturalli`,
    });

    let qrCodeImage: string | null = null;
    try {
      const qrData = await getPixQrCode(charge.loc.id);
      qrCodeImage = qrData.imagemQrcode;
    } catch {
      // QR code image is optional
    }

    const expiresAt = new Date(Date.now() + 3600 * 1000);

    await prisma.order.update({
      where: { id: orderId },
      data: {
        efiPaymentId: charge.txid,
        pixQrCode: qrCodeImage,
        pixCopiaCola: charge.pixCopiaECola,
        pixExpiresAt: expiresAt,
        pixLocationId: charge.loc.id,
        paymentMethod: "pix",
      },
    });

    // Upsert payment record
    await prisma.payment.upsert({
      where: { txid: charge.txid },
      create: {
        txid: charge.txid,
        orderId,
        valor: new Prisma.Decimal(charge.valor.original),
        status: "PENDING",
        payload: charge as unknown as import("@prisma/client").Prisma.InputJsonValue,
      },
      update: {
        status: "PENDING",
        orderId,
        payload: charge as unknown as import("@prisma/client").Prisma.InputJsonValue,
      },
    }).catch((err: unknown) => console.error("[pix/charge] Payment upsert failed:", err));

    return NextResponse.json({
      txid: charge.txid,
      pixCopiaECola: charge.pixCopiaECola,
      qrCodeImage,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (err) {
    console.error("[pix/charge POST]", err);
    return NextResponse.json({ error: "Erro ao gerar cobrança Pix" }, { status: 500 });
  }
}
