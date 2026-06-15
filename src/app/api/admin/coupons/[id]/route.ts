import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminPayload, writeAudit, getIp } from "@/lib/admin-helpers";

const updateSchema = z.object({
  type: z.enum(["PERCENTAGE", "FIXED", "FREE_SHIPPING"]).optional(),
  value: z.number().nonnegative().optional(),
  minOrderValue: z.number().nonnegative().nullable().optional(),
  maxUses: z.number().int().positive().nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  active: z.boolean().optional(),
  affiliateId: z.string().uuid().nullable().optional(),
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
    const coupon = await prisma.coupon.findUnique({
      where: { id: params.id },
      include: { affiliate: { select: { id: true, name: true } } },
    });

    if (!coupon) {
      return NextResponse.json({ error: "Cupom não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ coupon });
  } catch (err) {
    console.error("[admin/coupons/[id] GET]", err);
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

    const { expiresAt, ...rest } = parsed.data;
    const coupon = await prisma.coupon.update({
      where: { id: params.id },
      data: {
        ...rest,
        ...(expiresAt !== undefined
          ? { expiresAt: expiresAt ? new Date(expiresAt) : null }
          : {}),
      },
    });

    await writeAudit({
      userId: admin.id,
      action: "COUPON_CHANGE",
      entity: "Coupon",
      entityId: coupon.id,
      details: parsed.data,
      ip: getIp(req),
    });

    return NextResponse.json({ coupon });
  } catch (err) {
    console.error("[admin/coupons/[id] PUT]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = getAdminPayload(req);
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = z.object({ active: z.boolean() }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  try {
    const coupon = await prisma.coupon.update({
      where: { id: params.id },
      data: { active: parsed.data.active },
    });

    await writeAudit({
      userId: admin.id,
      action: "COUPON_CHANGE",
      entity: "Coupon",
      entityId: coupon.id,
      details: { active: parsed.data.active },
      ip: getIp(req),
    });

    return NextResponse.json({ coupon });
  } catch (err) {
    console.error("[admin/coupons/[id] PATCH]", err);
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
    const coupon = await prisma.coupon.update({
      where: { id: params.id },
      data: { active: false },
    });

    await writeAudit({
      userId: admin.id,
      action: "COUPON_CHANGE",
      entity: "Coupon",
      entityId: coupon.id,
      details: { deactivated: true },
      ip: getIp(req),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/coupons/[id] DELETE]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
