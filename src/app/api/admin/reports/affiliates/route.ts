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
  const fromParam = searchParams.get("from") ?? searchParams.get("startDate") ?? undefined;
  const toParam = searchParams.get("to") ?? searchParams.get("endDate") ?? undefined;

  const { from, to } = periodDates(period, fromParam, toParam);

  try {
    const affiliates = await prisma.affiliate.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        name: true,
        code: true,
        email: true,
        clicks: {
          where: { createdAt: { gte: from, lte: to } },
          select: { id: true },
        },
        sales: {
          where: { createdAt: { gte: from, lte: to } },
          select: { grossAmount: true, affiliateAmount: true },
        },
      },
    });

    const report = affiliates.map((a) => {
      const clicks = a.clicks.length;
      const sales = a.sales.length;
      const conversionRate = clicks > 0 ? (sales / clicks) * 100 : 0;
      const revenue = a.sales.reduce((sum, s) => sum + Number(s.grossAmount), 0);
      const commissions = a.sales.reduce((sum, s) => sum + Number(s.affiliateAmount), 0);

      return {
        affiliateId: a.id,
        name: a.name,
        code: a.code,
        email: a.email,
        clicks,
        sales,
        conversionRate,
        revenue,
        commission: commissions,
      };
    });

    const rows = report.sort((a, b) => b.revenue - a.revenue);

    return NextResponse.json({ rows, period: { from, to } });
  } catch (err) {
    console.error("[admin/reports/affiliates GET]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
