import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminPayload, writeAudit, getIp } from "@/lib/admin-helpers";

const createSchema = z.object({
  affiliateId: z.string().uuid(),
  amount: z.number().positive(),
  pixKey: z.string().min(1),
});

export async function GET(req: NextRequest) {
  const admin = getAdminPayload(req);
  if (!admin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "20")));
  const status = searchParams.get("status") ?? undefined;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  try {
    const [total, withdrawals] = await Promise.all([
      prisma.withdrawal.count({ where }),
      prisma.withdrawal.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          affiliate: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);

    return NextResponse.json({ withdrawals, total, page, limit });
  } catch (err) {
    console.error("[admin/withdrawals GET]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const admin = getAdminPayload(req);
  if (!admin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { affiliateId, amount, pixKey } = parsed.data;

    const wallet = await prisma.affiliateWallet.findUnique({
      where: { affiliateId },
    });

    if (!wallet) {
      return NextResponse.json({ error: "Carteira não encontrada" }, { status: 404 });
    }

    if (Number(wallet.availableBalance) < amount) {
      return NextResponse.json({ error: "Saldo insuficiente" }, { status: 422 });
    }

    const withdrawal = await prisma.withdrawal.create({
      data: {
        affiliateId,
        walletId: wallet.id,
        amount,
        pixKey,
        status: "PENDING",
      },
    });

    await writeAudit({
      userId: admin.id,
      action: "WITHDRAWAL",
      entity: "Withdrawal",
      entityId: withdrawal.id,
      details: { affiliateId, amount },
      ip: getIp(req),
    });

    return NextResponse.json({ withdrawal }, { status: 201 });
  } catch (err) {
    console.error("[admin/withdrawals POST]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
