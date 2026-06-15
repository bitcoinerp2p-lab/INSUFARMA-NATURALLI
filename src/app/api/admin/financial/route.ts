import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminPayload, periodDates } from "@/lib/admin-helpers";

export async function GET(req: NextRequest) {
  const admin = getAdminPayload(req);
  if (!admin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") ?? "30days";
  const startDate = searchParams.get("startDate") ?? undefined;
  const endDate = searchParams.get("endDate") ?? undefined;

  const { from, to } = periodDates(period, startDate, endDate);

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  try {
    const [
      salesAgg,
      commissionAgg,
      paidCommissionAgg,
      revenueToday,
      revenueWeek,
      revenueMonth,
      pendingOrders,
      paidOrders,
      totalSalesCount,
      paymentsPaidCount,
      paymentsPendingCount,
      paymentsExpiredCount,
      paymentsCancelledCount,
      lastTransactionsResult,
    ] = await Promise.all([
      prisma.sale.aggregate({
        _sum: { grossAmount: true, supplierAmount: true, netAmount: true, affiliateAmount: true },
        where: { createdAt: { gte: from, lte: to } },
      }),
      prisma.commission.aggregate({
        _sum: { amount: true },
        where: { createdAt: { gte: from, lte: to } },
      }),
      prisma.commission.aggregate({
        _sum: { amount: true },
        where: { createdAt: { gte: from, lte: to }, status: "PAID" },
      }),
      prisma.sale.aggregate({
        _sum: { grossAmount: true },
        where: { createdAt: { gte: todayStart } },
      }),
      prisma.sale.aggregate({
        _sum: { grossAmount: true },
        where: { createdAt: { gte: weekStart } },
      }),
      prisma.sale.aggregate({
        _sum: { grossAmount: true },
        where: { createdAt: { gte: monthStart } },
      }),
      prisma.order.count({
        where: { status: "PENDING", createdAt: { gte: from, lte: to } },
      }),
      prisma.order.count({
        where: { status: "PAID", createdAt: { gte: from, lte: to } },
      }),
      prisma.sale.count({ where: { createdAt: { gte: from, lte: to } } }),
      prisma.payment.count({ where: { status: "PAID" } }),
      prisma.payment.count({ where: { status: "PENDING" } }),
      prisma.payment.count({ where: { status: "EXPIRED" } }),
      prisma.payment.count({ where: { status: "CANCELLED" } }),
      prisma.payment.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, txid: true, valor: true, status: true, orderId: true, createdAt: true },
      }),
    ]);

    const grossRevenue = Number(salesAgg._sum.grossAmount ?? 0);
    const supplierCosts = Number(salesAgg._sum.supplierAmount ?? 0);
    const netRevenue = Number(salesAgg._sum.netAmount ?? 0);
    const totalAffiliateCommissions = Number(commissionAgg._sum.amount ?? 0);
    const paidCommissions = Number(paidCommissionAgg._sum.amount ?? 0);
    const pendingCommissions = totalAffiliateCommissions - paidCommissions;
    const profitMargin = grossRevenue > 0 ? (netRevenue / grossRevenue) * 100 : 0;
    const avgTicket = totalSalesCount > 0 ? grossRevenue / totalSalesCount : 0;
    const conversionRate = (pendingOrders + paidOrders) > 0 ? (paidOrders / (pendingOrders + paidOrders)) * 100 : 0;

    // Monthly data for chart (last 6 months)
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const monthlySales = await prisma.sale.groupBy({
      by: ["createdAt"],
      _sum: { grossAmount: true, supplierAmount: true },
      where: { createdAt: { gte: sixMonthsAgo } },
    });

    const monthlyMap = new Map<string, { revenue: number; cost: number }>();
    for (const s of monthlySales) {
      const key = `${s.createdAt.getFullYear()}-${String(s.createdAt.getMonth() + 1).padStart(2, "0")}`;
      const existing = monthlyMap.get(key) ?? { revenue: 0, cost: 0 };
      existing.revenue += Number(s._sum.grossAmount ?? 0);
      existing.cost += Number(s._sum.supplierAmount ?? 0);
      monthlyMap.set(key, existing);
    }

    const monthlyData = Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month: new Date(month + "-01").toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
        revenue: data.revenue,
        cost: data.cost,
      }));

    return NextResponse.json({
      grossRevenue,
      supplierCost: supplierCosts,
      netRevenue,
      paidCommissions,
      pendingCommissions,
      margin: profitMargin,
      avgTicket,
      revenueToday: Number(revenueToday._sum.grossAmount ?? 0),
      revenueWeek: Number(revenueWeek._sum.grossAmount ?? 0),
      revenueMonth: Number(revenueMonth._sum.grossAmount ?? 0),
      pendingOrdersCount: pendingOrders,
      paidOrdersCount: paidOrders,
      conversionRate,
      monthlyData,
      period: { from, to },
      paymentsPaid: paymentsPaidCount,
      paymentsPending: paymentsPendingCount,
      paymentsExpired: paymentsExpiredCount,
      paymentsCancelled: paymentsCancelledCount,
      lastTransactions: lastTransactionsResult.map((tx) => ({
        id: tx.id,
        txid: tx.txid,
        valor: Number(tx.valor),
        status: tx.status,
        orderId: tx.orderId,
        createdAt: tx.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error("[admin/financial GET]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
