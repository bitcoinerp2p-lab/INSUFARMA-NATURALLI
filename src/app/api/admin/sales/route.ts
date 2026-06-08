import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminPayload, periodDates } from "@/lib/admin-helpers";

export async function GET(req: NextRequest) {
  const admin = getAdminPayload(req);
  if (!admin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "20")));
  const period = searchParams.get("period") ?? undefined;
  const affiliateId = searchParams.get("affiliateId") ?? undefined;
  const productId = searchParams.get("productId") ?? undefined;
  const startDate = searchParams.get("startDate") ?? undefined;
  const endDate = searchParams.get("endDate") ?? undefined;

  const where: Record<string, unknown> = {};
  if (affiliateId) where.affiliateId = affiliateId;
  if (productId) where.productId = productId;
  if (period || startDate) {
    const { from, to } = periodDates(period ?? "custom", startDate, endDate);
    where.createdAt = { gte: from, lte: to };
  }

  try {
    const [total, sales] = await Promise.all([
      prisma.sale.count({ where }),
      prisma.sale.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          product: { select: { id: true, name: true } },
          affiliate: { select: { id: true, name: true } },
        },
      }),
    ]);

    return NextResponse.json({ sales, total, page, limit });
  } catch (err) {
    console.error("[admin/sales GET]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
