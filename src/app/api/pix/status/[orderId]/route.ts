import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

type Params = { params: { orderId: string } };

export async function GET(req: NextRequest, { params }: Params) {
  let auth: { id: string; role: string } | null = null;
  try {
    const token = req.cookies.get("auth-token")?.value;
    if (!token) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    auth = verifyToken(token);
  } catch {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const order = await prisma.order.findUnique({
    where: { id: params.orderId },
    select: {
      id: true,
      userId: true,
      status: true,
      pixCopiaCola: true,
      pixQrCode: true,
      pixExpiresAt: true,
      efiPaymentId: true,
      totalAmount: true,
      paymentMethod: true,
    },
  });

  if (!order) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  if (auth.role !== "ADMIN" && order.userId !== auth.id) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const isExpired =
    order.status === "PENDING" &&
    order.pixExpiresAt !== null &&
    order.pixExpiresAt < new Date();

  return NextResponse.json({
    orderId: order.id,
    status: order.status,
    paymentMethod: order.paymentMethod,
    txid: order.efiPaymentId,
    pixCopiaCola: order.pixCopiaCola,
    pixQrCode: order.pixQrCode,
    pixExpiresAt: order.pixExpiresAt?.toISOString() ?? null,
    isExpired,
    totalAmount: Number(order.totalAmount),
  });
}
