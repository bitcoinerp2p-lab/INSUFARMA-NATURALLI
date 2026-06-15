import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminPayload, writeAudit, getIp } from "@/lib/admin-helpers";

const createSchema = z.object({
  code: z.string().min(2).max(30).toUpperCase(),
  type: z.enum(["PERCENTAGE", "FIXED", "FREE_SHIPPING"]),
  value: z.number().nonnegative(),
  minOrderValue: z.number().nonnegative().nullable().optional(),
  maxUses: z.number().int().positive().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
  affiliateId: z.string().uuid().nullable().optional(),
  productId: z.string().uuid().nullable().optional(),
});

export async function GET(req: NextRequest) {
  const admin = getAdminPayload(req);
  if (!admin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "20")));
  const active = searchParams.get("active");

  const where: Record<string, unknown> = {};
  if (active !== null) where.active = active === "true";

  try {
    const [total, coupons] = await Promise.all([
      prisma.coupon.count({ where }),
      prisma.coupon.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          affiliate: { select: { id: true, name: true } },
        },
      }),
    ]);

    return NextResponse.json({ coupons, total, page, limit });
  } catch (err) {
    console.error("[admin/coupons GET]", err);
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

    const data = parsed.data;

    const coupon = await prisma.coupon.create({
      data: {
        code: data.code,
        type: data.type,
        value: data.type === "FREE_SHIPPING" ? 0 : data.value,
        minOrderValue: data.minOrderValue ?? null,
        maxUses: data.maxUses ?? null,
        expiresAt: data.expiresAt
          ? new Date(data.expiresAt.includes("T") ? data.expiresAt : `${data.expiresAt}T23:59:59.000Z`)
          : null,
        affiliateId: data.affiliateId ?? null,
        productId: data.productId ?? null,
      },
    });

    await writeAudit({
      userId: admin.id,
      action: "COUPON_CHANGE",
      entity: "Coupon",
      entityId: coupon.id,
      details: { code: coupon.code, type: coupon.type },
      ip: getIp(req),
    });

    return NextResponse.json({ coupon }, { status: 201 });
  } catch (err) {
    console.error("[admin/coupons POST]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
