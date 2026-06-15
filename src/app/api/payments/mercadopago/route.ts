import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { createPreference } from "@/lib/mercadopago";

const schema = z.object({ orderId: z.string().uuid() });

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
  if (!parsed.success) return NextResponse.json({ error: "orderId inválido" }, { status: 400 });

  const { orderId } = parsed.data;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { product: { select: { name: true } } } },
      user: { select: { name: true, email: true, cpf: true } },
    },
  });

  if (!order) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  if (auth.role !== "ADMIN" && order.userId !== auth.id) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }
  if (order.status === "PAID") {
    return NextResponse.json({ error: "Pedido já pago" }, { status: 422 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const notifUrl = process.env.MP_WEBHOOK_URL ?? `${siteUrl}/api/webhooks/mercadopago`;

  try {
    const preference = await createPreference({
      items: order.items.map((item) => ({
        title: item.product.name,
        quantity: item.quantity,
        unit_price: Number(item.price),
        currency_id: "BRL",
      })),
      payer: {
        name: order.user.name,
        email: order.user.email,
        ...(order.user.cpf ? { identification: { type: "CPF", number: order.user.cpf.replace(/\D/g, "") } } : {}),
      },
      external_reference: orderId,
      back_urls: {
        success: `${siteUrl}/checkout/sucesso?pedido=${orderId}`,
        failure: `${siteUrl}/conta?pedido=${orderId}&erro=1`,
        pending: `${siteUrl}/conta?pedido=${orderId}&pendente=1`,
      },
      auto_return: "approved",
      notification_url: notifUrl,
      payment_methods: {
        excluded_payment_types: [
          { id: "bank_transfer" },
          { id: "ticket" },
        ],
        installments: 12,
      },
    });

    const checkoutUrl =
      process.env.MP_SANDBOX === "true" ? preference.sandbox_init_point : preference.init_point;

    await prisma.order.update({
      where: { id: orderId },
      data: { paymentLink: checkoutUrl, mpPaymentId: preference.id, paymentMethod: "card" },
    });

    return NextResponse.json({ checkoutUrl, preferenceId: preference.id });
  } catch (err) {
    console.error("[payments/mercadopago]", err);
    return NextResponse.json({ error: "Erro ao criar preferência de pagamento" }, { status: 500 });
  }
}
