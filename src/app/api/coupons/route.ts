import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { Prisma } from "@prisma/client";

function requireAdmin(req: NextRequest): boolean {
  try {
    const token = req.cookies.get("auth-token")?.value;
    if (!token) return false;
    const payload = verifyToken(token);
    return payload.role === "ADMIN";
  } catch {
    return false;
  }
}

const createCouponSchema = z.object({
  code: z.string().min(1, "Código obrigatório").toUpperCase(),
  type: z.enum(["PERCENTAGE", "FIXED", "FREE_SHIPPING"]),
  value: z.number().min(0, "Valor deve ser maior ou igual a zero"),
  minOrderValue: z.number().positive().nullable().optional(),
  maxUses: z.number().int().positive().nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  active: z.boolean().default(true),
});

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ coupons });
  } catch (err) {
    console.error("[coupons GET]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = createCouponSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const {
      code,
      type,
      value,
      minOrderValue,
      maxUses,
      expiresAt,
      active,
    } = parsed.data;

    const coupon = await prisma.coupon.create({
      data: {
        code,
        type,
        value: new Prisma.Decimal(value),
        minOrderValue: minOrderValue != null ? new Prisma.Decimal(minOrderValue) : null,
        maxUses: maxUses ?? null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        active,
      },
    });

    return NextResponse.json({ coupon }, { status: 201 });
  } catch (err) {
    console.error("[coupons POST]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
