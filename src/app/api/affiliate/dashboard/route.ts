import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "insufarma-secret-key-change-in-prod"
);

async function getAffiliateId(req: NextRequest): Promise<string | null> {
  const token = req.cookies.get("affiliate-token")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.affiliateId as string;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const affiliateId = await getAffiliateId(req);
  if (!affiliateId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const [affiliate, clicks, sales, commissions, referredClients] = await Promise.all([
      prisma.affiliate.findUnique({
        where: { id: affiliateId },
        include: { wallet: true },
      }),
      prisma.affiliateClick.count({ where: { affiliateId } }),
      prisma.sale.findMany({
        where: { affiliateId },
        select: { grossAmount: true, affiliateAmount: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      prisma.commission.findMany({
        where: { affiliateId },
        select: { amount: true, status: true },
      }),
      prisma.user.count({ where: { referredByAffiliateId: affiliateId } }),
    ]);

    if (!affiliate) {
      return NextResponse.json({ error: "Afiliado não encontrado" }, { status: 404 });
    }

    const totalSales = sales.length;
    const conversion = clicks > 0 ? (totalSales / clicks) * 100 : 0;
    const grossTotal = sales.reduce((s, x) => s + Number(x.grossAmount), 0);
    const avgTicket = totalSales > 0 ? grossTotal / totalSales : 0;

    const commissionPending = commissions
      .filter((c) => c.status === "PENDING")
      .reduce((s, c) => s + Number(c.amount), 0);
    const commissionAvailable = commissions
      .filter((c) => c.status === "AVAILABLE")
      .reduce((s, c) => s + Number(c.amount), 0);
    const commissionPaid = commissions
      .filter((c) => c.status === "PAID")
      .reduce((s, c) => s + Number(c.amount), 0);

    const recentSales = sales.slice(0, 10).map((s) => ({
      grossAmount: Number(s.grossAmount),
      commission: Number(s.affiliateAmount),
      date: s.createdAt.toISOString(),
    }));

    return NextResponse.json({
      stats: {
        clicks,
        referredClients,
        totalSales,
        conversion: Number(conversion.toFixed(2)),
        avgTicket: Number(avgTicket.toFixed(2)),
        commissionPending,
        commissionAvailable,
        commissionPaid,
        walletPending: Number(affiliate.wallet?.pendingBalance ?? 0),
        walletAvailable: Number(affiliate.wallet?.availableBalance ?? 0),
        totalEarned: Number(affiliate.wallet?.totalEarned ?? 0),
      },
      recentSales,
      affiliate: {
        id: affiliate.id,
        name: affiliate.name,
        code: affiliate.code,
        commissionRate: Number(affiliate.commissionRate),
        commissionType: affiliate.commissionType,
      },
    });
  } catch (err) {
    console.error("[affiliate/dashboard]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
