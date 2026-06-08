import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminPayload, writeAudit, getIp } from "@/lib/admin-helpers";

const updateSchema = z.object({
  action: z.enum(["approve", "reject", "paid"]),
  notes: z.string().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = getAdminPayload(req);
  if (!admin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { action, notes } = parsed.data;

    const existing = await prisma.withdrawal.findUnique({
      where: { id: params.id },
      include: { wallet: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Saque não encontrado" }, { status: 404 });
    }

    if (action === "approve") {
      const withdrawal = await prisma.$transaction(async (tx) => {
        const w = await tx.withdrawal.update({
          where: { id: params.id },
          data: {
            status: "APPROVED",
            approvedBy: admin.id,
            approvedAt: new Date(),
            notes: notes ?? null,
          },
        });
        await tx.affiliateWallet.update({
          where: { id: existing.walletId },
          data: {
            availableBalance: { decrement: Number(existing.amount) },
          },
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

    if (action === "paid") {
      const withdrawal = await prisma.$transaction(async (tx) => {
        const w = await tx.withdrawal.update({
          where: { id: params.id },
          data: { status: "PAID", paidAt: new Date(), notes: notes ?? null },
        });
        await tx.affiliateWallet.update({
          where: { id: existing.walletId },
          data: { totalWithdrawn: { increment: Number(existing.amount) } },
        });
        return w;
      });

      await writeAudit({
        userId: admin.id,
        action: "WITHDRAWAL",
        entity: "Withdrawal",
        entityId: withdrawal.id,
        details: { action: "paid" },
        ip: getIp(req),
      });

      return NextResponse.json({ withdrawal });
    }

    const withdrawal = await prisma.withdrawal.update({
      where: { id: params.id },
      data: { status: "REJECTED", notes: notes ?? null },
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
    console.error("[admin/withdrawals/[id] PUT]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
