import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminPayload } from "@/lib/admin-helpers";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = getAdminPayload(req);
  if (!admin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const wallet = await prisma.affiliateWallet.findUnique({
      where: { affiliateId: params.id },
      include: {
        withdrawals: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!wallet) {
      return NextResponse.json({ error: "Carteira não encontrada" }, { status: 404 });
    }

    const commissions = await prisma.commission.findMany({
      where: { affiliateId: params.id },
      select: { amount: true, status: true, availableAt: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const breakdown = commissions.reduce(
      (acc, c) => {
        if (c.status === "PENDING") acc.pending += Number(c.amount);
        if (c.status === "AVAILABLE") acc.available += Number(c.amount);
        if (c.status === "PAID") acc.paid += Number(c.amount);
        return acc;
      },
      { pending: 0, available: 0, paid: 0 }
    );

    return NextResponse.json({ wallet, commissions, breakdown });
  } catch (err) {
    console.error("[admin/affiliates/[id]/wallet GET]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
