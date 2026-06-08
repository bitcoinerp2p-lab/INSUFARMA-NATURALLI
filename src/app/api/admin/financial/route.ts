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

  try {
    const [salesAgg, commissionAgg, paidCommissionAgg] = await Promise.all([
      prisma.sale.aggregate({
        _sum: { grossAmount: true, supplierAmount: true, netAmount: true, affiliateAmount: true },
        where: { createdAt: { gte: from, lte: to }, efiStatus: { not: "cancelled" } },
      }),
      prisma.commission.aggregate({
        _sum: { amount: true },
        where: { createdAt: { gte: from, lte: to } },
      }),
      prisma.commission.aggregate({
        _sum: { amount: true },
        where: { createdAt: { gte: from, lte: to }, status: "PAID" },
      }),
    ]);

    const grossRevenue = Number(salesAgg._sum.grossAmount ?? 0);
    const supplierCosts = Number(salesAgg._sum.supplierAmount ?? 0);
    const netRevenue = Number(salesAgg._sum.netAmount ?? 0);
    const totalAffiliateCommissions = Number(commissionAgg._sum.amount ?? 0);
    const paidCommissions = Number(paidCommissionAgg._sum.amount ?? 0);
    const pendingCommissions = totalAffiliateCommissions - paidCommissions;
    const profitMargin = grossRevenue > 0 ? (netRevenue / grossRevenue) * 100 : 0;

    return NextResponse.json({
      grossRevenue,
      supplierCosts,
      netRevenue,
      totalAffiliateCommissions,
      paidCommissions,
      pendingCommissions,
      profitMargin,
      period: { from, to },
    });
  } catch (err) {
    console.error("[admin/financial GET]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
