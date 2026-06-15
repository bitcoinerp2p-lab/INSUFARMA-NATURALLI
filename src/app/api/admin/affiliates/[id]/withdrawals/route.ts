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
    const withdrawals = await prisma.withdrawal.findMany({
      where: { affiliateId: params.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      withdrawals: withdrawals.map((w) => ({
        id: w.id,
        amount: Number(w.amount),
        status: w.status,
        pixKey: w.pixKey,
        notes: w.notes,
        approvedAt: w.approvedAt?.toISOString() ?? null,
        paidAt: w.paidAt?.toISOString() ?? null,
        createdAt: w.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error("[admin/affiliates/[id]/withdrawals GET]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
