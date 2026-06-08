import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminPayload, writeAudit, getIp } from "@/lib/admin-helpers";

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  commissionRate: z.number().positive().optional(),
  commissionType: z.enum(["PERCENTAGE", "FIXED"]).optional(),
  status: z.enum(["PENDING", "ACTIVE", "SUSPENDED", "BLOCKED"]).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = getAdminPayload(req);
  if (!admin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const affiliate = await prisma.affiliate.findUnique({
      where: { id: params.id },
      include: {
        wallet: true,
        links: { orderBy: { createdAt: "desc" }, take: 10 },
        sales: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: { product: { select: { name: true } } },
        },
        commissions: {
          select: { amount: true, status: true },
        },
      },
    });

    if (!affiliate) {
      return NextResponse.json({ error: "Afiliado não encontrado" }, { status: 404 });
    }

    const commissionsSummary = affiliate.commissions.reduce(
      (acc, c) => {
        acc.total += Number(c.amount);
        if (c.status === "PAID") acc.paid += Number(c.amount);
        if (c.status === "PENDING") acc.pending += Number(c.amount);
        if (c.status === "AVAILABLE") acc.available += Number(c.amount);
        return acc;
      },
      { total: 0, paid: 0, pending: 0, available: 0 }
    );

    return NextResponse.json({
      affiliate: { ...affiliate, commissionsSummary },
    });
  } catch (err) {
    console.error("[admin/affiliates/[id] GET]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

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

    const affiliate = await prisma.affiliate.update({
      where: { id: params.id },
      data: parsed.data,
    });

    await writeAudit({
      userId: admin.id,
      action: "COMMISSION_CHANGE",
      entity: "Affiliate",
      entityId: affiliate.id,
      details: parsed.data,
      ip: getIp(req),
    });

    return NextResponse.json({ affiliate });
  } catch (err) {
    console.error("[admin/affiliates/[id] PUT]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = getAdminPayload(req);
  if (!admin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const affiliate = await prisma.affiliate.update({
      where: { id: params.id },
      data: { status: "BLOCKED" },
    });

    await writeAudit({
      userId: admin.id,
      action: "AFFILIATE_SUSPEND",
      entity: "Affiliate",
      entityId: affiliate.id,
      details: { reason: "deleted by admin" },
      ip: getIp(req),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/affiliates/[id] DELETE]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
