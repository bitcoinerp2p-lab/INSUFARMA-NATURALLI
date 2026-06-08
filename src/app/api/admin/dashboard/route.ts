import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminPayload, periodDates } from "@/lib/admin-helpers";

export async function GET(req: NextRequest) {
  const admin = getAdminPayload(req);
  if (!admin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") ?? "today";
  const startDate = searchParams.get("startDate") ?? undefined;
  const endDate = searchParams.get("endDate") ?? undefined;

  const { from, to } = periodDates(period, startDate, endDate);

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - 7);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  try {
    const [
      salesToday,
      salesWeek,
      salesMonth,
      salesAll,
      totalAffiliates,
      totalSalesCount,
      totalClicks,
      topProducts,
      salesByDay,
      salesByProduct,
      salesByAffiliate,
      revenueByMonthRaw,
      trafficByOriginRaw,
    ] = await Promise.all([
      prisma.sale.aggregate({
        _sum: { grossAmount: true },
        where: { createdAt: { gte: startOfToday }, efiStatus: { not: "cancelled" } },
      }),
      prisma.sale.aggregate({
        _sum: { grossAmount: true },
        where: { createdAt: { gte: startOfWeek }, efiStatus: { not: "cancelled" } },
      }),
      prisma.sale.aggregate({
        _sum: { grossAmount: true },
        where: { createdAt: { gte: startOfMonth }, efiStatus: { not: "cancelled" } },
      }),
      prisma.sale.aggregate({
        _sum: { grossAmount: true },
        _count: true,
        where: { efiStatus: { not: "cancelled" } },
      }),
      prisma.affiliate.count({ where: { status: "ACTIVE" } }),
      prisma.sale.count({ where: { createdAt: { gte: from, lte: to } } }),
      prisma.affiliateClick.count({ where: { createdAt: { gte: from, lte: to } } }),
      prisma.sale.groupBy({
        by: ["productId"],
        _sum: { grossAmount: true },
        _count: true,
        where: { createdAt: { gte: from, lte: to }, efiStatus: { not: "cancelled" } },
        orderBy: { _sum: { grossAmount: "desc" } },
        take: 5,
      }),
      prisma.sale.findMany({
        where: { createdAt: { gte: from, lte: to }, efiStatus: { not: "cancelled" } },
        select: { createdAt: true, grossAmount: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.sale.groupBy({
        by: ["productId"],
        _sum: { grossAmount: true },
        where: { createdAt: { gte: from, lte: to }, efiStatus: { not: "cancelled" } },
        orderBy: { _sum: { grossAmount: "desc" } },
        take: 10,
      }),
      prisma.sale.groupBy({
        by: ["affiliateId"],
        _sum: { grossAmount: true },
        where: {
          createdAt: { gte: from, lte: to },
          efiStatus: { not: "cancelled" },
          affiliateId: { not: null },
        },
        orderBy: { _sum: { grossAmount: "desc" } },
        take: 10,
      }),
      prisma.sale.findMany({
        where: { createdAt: { gte: twelveMonthsAgo }, efiStatus: { not: "cancelled" } },
        select: { createdAt: true, grossAmount: true },
      }),
      prisma.affiliateClick.groupBy({
        by: ["utmSource"],
        _count: true,
        where: { createdAt: { gte: from, lte: to } },
      }),
    ]);

    const grossTotal = Number(salesAll._sum.grossAmount ?? 0);
    const totalCount = salesAll._count;
    const avgTicket = totalCount > 0 ? grossTotal / totalCount : 0;
    const conversionRate = totalClicks > 0 ? (totalSalesCount / totalClicks) * 100 : 0;

    const productIds = Array.from(new Set([
      ...topProducts.map((p) => p.productId),
      ...salesByProduct.map((p) => p.productId),
    ]));
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p.name]));

    const affiliateIds = salesByAffiliate
      .map((s) => s.affiliateId)
      .filter(Boolean) as string[];
    const affiliates = await prisma.affiliate.findMany({
      where: { id: { in: affiliateIds } },
      select: { id: true, name: true },
    });
    const affiliateMap = new Map(affiliates.map((a) => [a.id, a.name]));

    const salesByDayMap = new Map<string, { count: number; revenue: number }>();
    for (const sale of salesByDay) {
      const dateKey = sale.createdAt.toISOString().slice(0, 10);
      const existing = salesByDayMap.get(dateKey) ?? { count: 0, revenue: 0 };
      salesByDayMap.set(dateKey, {
        count: existing.count + 1,
        revenue: existing.revenue + Number(sale.grossAmount),
      });
    }

    const revenueByMonthMap = new Map<string, number>();
    for (const sale of revenueByMonthRaw) {
      const monthKey = sale.createdAt.toISOString().slice(0, 7);
      revenueByMonthMap.set(
        monthKey,
        (revenueByMonthMap.get(monthKey) ?? 0) + Number(sale.grossAmount)
      );
    }

    return NextResponse.json({
      revenueToday: Number(salesToday._sum.grossAmount ?? 0),
      revenueWeek: Number(salesWeek._sum.grossAmount ?? 0),
      revenueMonth: Number(salesMonth._sum.grossAmount ?? 0),
      revenueTotal: grossTotal,
      avgTicket,
      totalAffiliates,
      totalSales: totalSalesCount,
      conversionRate,
      topProducts: topProducts.map((p) => ({
        productId: p.productId,
        name: productMap.get(p.productId) ?? "",
        quantity: p._count,
        revenue: Number(p._sum.grossAmount ?? 0),
      })),
      salesByDay: Array.from(salesByDayMap.entries()).map(([date, v]) => ({
        date,
        count: v.count,
        revenue: v.revenue,
      })),
      salesByProduct: salesByProduct.map((p) => ({
        productId: p.productId,
        name: productMap.get(p.productId) ?? "",
        revenue: Number(p._sum.grossAmount ?? 0),
      })),
      salesByAffiliate: salesByAffiliate.map((s) => ({
        affiliateId: s.affiliateId,
        name: affiliateMap.get(s.affiliateId ?? "") ?? "",
        revenue: Number(s._sum.grossAmount ?? 0),
      })),
      revenueByMonth: Array.from(revenueByMonthMap.entries()).map(([month, revenue]) => ({
        month,
        revenue,
      })),
      trafficByOrigin: trafficByOriginRaw.map((t) => ({
        origin: t.utmSource ?? "direct",
        count: t._count,
      })),
    });
  } catch (err) {
    console.error("[admin/dashboard]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
