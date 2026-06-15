import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { createTransparentPayment } from "@/lib/mercadopago";

const schema = z.object({
  orderId: z.string().uuid(),
  cpf: z.string().regex(/^\d{11}$/, "CPF inválido — informe 11 dígitos"),
});

function getAuth(req: NextRequest) {
  try {
    const token = req.cookies.get("auth-token")?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch { return null; }
}

export async function POST(req: NextRequest) {
  const auth = getAuth(req);
  if (!auth) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

  const { orderId, cpf } = parsed.data;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { id: true, name: true, email: true, cpf: true } },
      address: true,
    },
  });

  if (!order) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  if (order.userId !== auth.id) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  if (order.status !== "PENDING") return NextResponse.json({ error: "Pedido já processado" }, { status: 422 });

  if (!order.user.cpf) {
    await prisma.user.update({ where: { id: auth.id }, data: { cpf } }).catch(() => {});
  }

  const parts = order.user.name.trim().split(" ");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const notifUrl = process.env.MP_WEBHOOK_URL ?? `${siteUrl}/api/webhooks/mercadopago`;

  const expires = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

  try {
    const payment = await createTransparentPayment({
      transaction_amount: Number(order.totalAmount),
      payment_method_id: "bolbradesco",
      description: "Insufarma Naturalli",
      external_reference: orderId,
      notification_url: notifUrl,
      date_of_expiration: expires,
      payer: {
        email: order.user.email,
        first_name: parts[0],
        last_name: parts.slice(1).join(" ") || parts[0],
        identification: { type: "CPF", number: (order.user.cpf ?? cpf).replace(/\D/g, "") },
        address: {
          zip_code: order.address.cep.replace(/\D/g, ""),
          street_name: order.address.street,
          street_number: order.address.number,
          neighborhood: order.address.neighborhood,
          city: order.address.city,
          federal_unit: order.address.state,
        },
      },
    });

    await prisma.order.update({
      where: { id: orderId },
      data: { mpPaymentId: String(payment.id), paymentMethod: "boleto" },
    });

    return NextResponse.json({
      paymentId: payment.id,
      barcode: payment.barcode?.content ?? null,
      url: payment.transaction_details?.external_resource_url ?? null,
    });
  } catch (err) {
    console.error("[payments/boleto]", err);
    return NextResponse.json({ error: "Erro ao gerar boleto. Tente novamente." }, { status: 502 });
  }
}
