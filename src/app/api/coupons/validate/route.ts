import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const validateSchema = z.object({
  code: z.string().min(1, "Código obrigatório"),
  orderTotal: z.number().positive("Total do pedido inválido"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = validateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { code, orderTotal } = parsed.data;

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon || !coupon.active) {
      return NextResponse.json({ error: "Cupom inválido ou inativo" }, { status: 404 });
    }

    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return NextResponse.json({ error: "Cupom expirado" }, { status: 422 });
    }

    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({ error: "Cupom esgotado" }, { status: 422 });
    }

    const minOrder = coupon.minOrderValue && coupon.type !== "FREE_SHIPPING" ? Number(coupon.minOrderValue) : 0;
    if (orderTotal < minOrder) {
      return NextResponse.json(
        { error: `Pedido mínimo de R$ ${minOrder.toFixed(2)} para usar este cupom` },
        { status: 422 }
      );
    }

    let discountAmount = 0;
    let discountLabel = "";

    if (coupon.type === "PERCENTAGE") {
      discountAmount = (orderTotal * Number(coupon.value)) / 100;
      discountLabel = `${Number(coupon.value)}% de desconto`;
    } else if (coupon.type === "FIXED") {
      discountAmount = Math.min(Number(coupon.value), orderTotal);
      discountLabel = `R$ ${Number(coupon.value).toFixed(2)} de desconto`;
    } else if (coupon.type === "FREE_SHIPPING") {
      discountAmount = 0;
      discountLabel = "Frete grátis";
    }

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: Number(coupon.value),
        discountAmount,
        discountLabel,
        freeShipping: coupon.type === "FREE_SHIPPING",
      },
    });
  } catch (err) {
    console.error("[coupons/validate]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
