import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminPayload } from "@/lib/admin-helpers";

export async function GET(req: NextRequest) {
  const admin = getAdminPayload(req);
  if (!admin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const months = Math.min(24, Math.max(1, Number(searchParams.get("months") ?? "12")));

  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);

  try {
    const sales = await prisma.sale.findMany({
      where: { createdAt: { gte: from }, efiStatus: { not: "cancelled" } },
      select: { createdAt: true, grossAmount: true, netAmount: true },
    });

    const commissions = await prisma.commission.findMany({
      where: { createdAt: { gte: from } },
      select: { createdAt: true, amount: true, status: true },
    });

    const byMonth = new Map<
      string,
      { grossRevenue: number; netRevenue: number; commissionsPaid: number; commissionsPending: number }
    >();

    for (const s of sales) {
      const key = s.createdAt.toISOString().slice(0, 7);
      const existing = byMonth.get(key) ?? {
        grossRevenue: 0,
        netRevenue: 0,
        commissionsPaid: 0,
        commissionsPending: 0,
      };
      existing.grossRevenue += Number(s.grossAmount);
      existing.netRevenue += Number(s.netAmount);
      byMonth.set(key, existing);
    }

    for (const c of commissions) {
      const key = c.createdAt.toISOString().slice(0, 7);
      const existing = byMonth.get(key) ?? {
        grossRevenue: 0,
        netRevenue: 0,
        commissionsPaid: 0,
        commissionsPending: 0,
      };
      if (c.status === "PAID") {
        existing.commissionsPaid += Number(c.amount);
      } else {
        existing.commissionsPending += Number(c.amount);
      }
      byMonth.set(key, existing);
    }

    const rows = Array.from(byMonth.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([month, data]) => {
        const gross = data.grossRevenue;
        const cost = gross - data.netRevenue;
        const commissions = data.commissionsPaid + data.commissionsPending;
        const net = data.netRevenue;
        const margin = gross > 0 ? (net / gross) * 100 : 0;
        return { month, gross, cost, net, commissions, margin };
      });

    return NextResponse.json({ rows });
  } catch (err) {
    console.error("[admin/reports/financial GET]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
