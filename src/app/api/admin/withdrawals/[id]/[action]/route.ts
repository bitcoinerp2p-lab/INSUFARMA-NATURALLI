import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminPayload, writeAudit, getIp } from "@/lib/admin-helpers";

type Params = { params: { id: string; action: string } };

export async function POST(req: NextRequest, { params }: Params) {
  const admin = getAdminPayload(req);
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id, action } = params;
  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  }

  const existing = await prisma.withdrawal.findUnique({
    where: { id },
    include: { wallet: true },
  });
  if (!existing) return NextResponse.json({ error: "Saque não encontrado" }, { status: 404 });
  if (existing.status !== "PENDING") {
    return NextResponse.json({ error: "Saque não está pendente" }, { status: 422 });
  }

  try {
    if (action === "approve") {
      const withdrawal = await prisma.$transaction(async (tx) => {
        const w = await tx.withdrawal.update({
          where: { id },
          data: { status: "APPROVED", approvedBy: admin.id, approvedAt: new Date() },
        });
        await tx.affiliateWallet.update({
          where: { id: existing.walletId },
          data: { availableBalance: { decrement: Number(existing.amount) } },
        });
        return w;
      });

      await writeAudit({
        userId: admin.id,
        action: "WITHDRAWAL",
        entity: "Withdrawal",
        entityId: withdrawal.id,
        details: { action: "approve" },
        ip: getIp(req),
      });

      return NextResponse.json({ withdrawal });
    }

    const withdrawal = await prisma.withdrawal.update({
      where: { id },
      data: { status: "REJECTED" },
    });

    await writeAudit({
      userId: admin.id,
      action: "WITHDRAWAL",
      entity: "Withdrawal",
      entityId: withdrawal.id,
      details: { action: "reject" },
      ip: getIp(req),
    });

    return NextResponse.json({ withdrawal });
  } catch (err) {
    console.error("[admin/withdrawals/[id]/[action] POST]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
