import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminPayload, periodDates } from "@/lib/admin-helpers";

export async function GET(req: NextRequest) {
  const admin = getAdminPayload(req);
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") ?? "30days";
  const startDate = searchParams.get("startDate") ?? undefined;
  const endDate = searchParams.get("endDate") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "20")));
  const skip = (page - 1) * limit;

  const { from, to } = periodDates(period, startDate, endDate);

  const where = {
    createdAt: { gte: from, lte: to },
    ...(status ? { status: status as "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELLED" } : {}),
  };

  try {
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          items: { include: { product: { select: { id: true, name: true, sku: true } } } },
          address: { select: { city: true, state: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    const mapped = orders.map((o) => ({
      id: o.id,
      status: o.status,
      paymentMethod: o.paymentMethod,
      totalAmount: Number(o.totalAmount),
      discountAmount: Number(o.discountAmount),
      customerName: o.user.name,
      customerEmail: o.user.email,
      customerPhone: o.user.phone,
      city: o.address.city,
      state: o.address.state,
      products: o.items.map((i) => ({ name: i.product.name, sku: i.product.sku, quantity: i.quantity })),
      mpPaymentId: o.mpPaymentId,
      paymentLink: o.paymentLink,
      couponCode: o.couponCode,
      createdAt: o.createdAt.toISOString(),
    }));

    return NextResponse.json({ orders: mapped, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("[admin/orders GET]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
