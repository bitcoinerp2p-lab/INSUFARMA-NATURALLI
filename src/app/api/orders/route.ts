import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { createPixCharge, getPixQrCode } from "@/lib/efi";
import { Prisma } from "@prisma/client";

function getAuthPayload(req: NextRequest): { id: string; role: string; email: string } | null {
  try {
    const token = req.cookies.get("auth-token")?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

const createOrderSchema = z.object({
  addressId: z.string().uuid("Endereço inválido"),
  couponCode: z.string().optional(),
  paymentMethod: z.string().optional(),
  affiliateCode: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid("Produto inválido"),
        quantity: z.number().int().positive("Quantidade deve ser positiva"),
      })
    )
    .min(1, "Pedido deve ter ao menos um item"),
});

export async function GET(req: NextRequest) {
  const auth = getAuthPayload(req);
  if (!auth) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const orders = await prisma.order.findMany({
      where: { userId: auth.id },
      include: {
        items: { include: { product: true } },
        address: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ orders });
  } catch (err) {
    console.error("[orders GET]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = getAuthPayload(req);
  if (!auth) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { addressId, couponCode, paymentMethod, affiliateCode, items } = parsed.data;

    // Validate PIX availability before touching the database
    if (paymentMethod === "pix" && !process.env.EFI_PIX_KEY) {
      return NextResponse.json(
        { error: "Pagamento via PIX não disponível no momento. Escolha outro método de pagamento." },
        { status: 503 }
      );
    }

    // Resolve affiliate: explicit code in body → stored referral on user → null
    let resolvedAffiliateId: string | null = null;
    if (affiliateCode) {
      const aff = await prisma.affiliate.findUnique({
        where: { code: affiliateCode.toUpperCase(), status: "ACTIVE" },
      });
      if (aff) resolvedAffiliateId = aff.id;
    }
    if (!resolvedAffiliateId) {
      const usr = await prisma.user.findUnique({
        where: { id: auth.id },
        select: { referredByAffiliateId: true },
      });
      resolvedAffiliateId = usr?.referredByAffiliateId ?? null;
    }

    // Validate products and stock
    const productIds = items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, active: true },
    });

    if (products.length !== productIds.length) {
      return NextResponse.json(
        { error: "Um ou mais produtos não foram encontrados ou estão inativos" },
        { status: 422 }
      );
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const item of items) {
      const product = productMap.get(item.productId)!;
      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Estoque insuficiente para "${product.name}"` },
          { status: 422 }
        );
      }
    }

    // Calculate totals
    let subtotal = 0;
    for (const item of items) {
      const product = productMap.get(item.productId)!;
      const unitPrice = product.salePrice ?? product.price;
      subtotal += Number(unitPrice) * item.quantity;
    }

    // Validate coupon
    let discountAmount = 0;
    let resolvedCouponCode: string | null = null;

    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode.toUpperCase() },
      });

      if (!coupon || !coupon.active) {
        return NextResponse.json({ error: "Cupom inválido" }, { status: 422 });
      }

      if (coupon.expiresAt && coupon.expiresAt < new Date()) {
        return NextResponse.json({ error: "Cupom expirado" }, { status: 422 });
      }

      if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
        return NextResponse.json({ error: "Cupom esgotado" }, { status: 422 });
      }

      const minOrder = coupon.minOrderValue ? Number(coupon.minOrderValue) : 0;
      if (subtotal < minOrder) {
        return NextResponse.json(
          { error: `Pedido mínimo de R$ ${minOrder.toFixed(2)} para este cupom` },
          { status: 422 }
        );
      }

      if (coupon.type === "PERCENTAGE") {
        discountAmount = (subtotal * Number(coupon.value)) / 100;
      } else if (coupon.type === "FIXED") {
        discountAmount = Math.min(Number(coupon.value), subtotal);
      }

      resolvedCouponCode = coupon.code;
    }

    const totalAmount = Math.max(0, subtotal - discountAmount);

    // Create order in transaction
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId: auth.id,
          addressId,
          totalAmount: new Prisma.Decimal(totalAmount),
          discountAmount: new Prisma.Decimal(discountAmount),
          couponCode: resolvedCouponCode,
          paymentMethod: paymentMethod ?? null,
          affiliateId: resolvedAffiliateId,
          items: {
            create: items.map((item) => {
              const product = productMap.get(item.productId)!;
              const unitPrice = product.salePrice ?? product.price;
              return {
                productId: item.productId,
                quantity: item.quantity,
                price: unitPrice,
              };
            }),
          },
        },
        include: {
          items: { include: { product: true } },
          address: true,
          user: { select: { id: true, name: true, email: true, phone: true, cpf: true } },
        },
      });

      // Decrement stock
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // Increment coupon usage
      if (resolvedCouponCode) {
        await tx.coupon.update({
          where: { code: resolvedCouponCode },
          data: { usedCount: { increment: 1 } },
        });
      }

      return newOrder;
    });

    // Generate Pix charge if payment method is pix
    let pixData: {
      txid: string;
      pixCopiaECola: string;
      qrCodeImage: string | null;
      expiresAt: string;
    } | null = null;

    if (paymentMethod === "pix") {
      const pixKey = process.env.EFI_PIX_KEY ?? "";
      if (pixKey) {
        try {
          const charge = await createPixCharge({
            valor: totalAmount.toFixed(2),
            chave: pixKey,
            expiracaoSegundos: 3600,
            devedorCpf: order.user.cpf ?? undefined,
            devedorNome: order.user.name ?? undefined,
            solicitacaoPagador: `Pedido #${order.id.slice(-8).toUpperCase()} — Insufarma Naturalli`,
          });

          let qrCodeImage: string | null = null;
          try {
            const qrData = await getPixQrCode(charge.loc.id);
            qrCodeImage = qrData.imagemQrcode;
          } catch {
            // QR code image is optional
          }

          const expiresAt = new Date(Date.now() + 3600 * 1000);

          await prisma.order.update({
            where: { id: order.id },
            data: {
              efiPaymentId: charge.txid,
              pixQrCode: qrCodeImage,
              pixCopiaCola: charge.pixCopiaECola,
              pixExpiresAt: expiresAt,
              pixLocationId: charge.loc.id,
            },
          });

          // Record payment for dashboard tracking
          await prisma.payment.create({
            data: {
              txid: charge.txid,
              orderId: order.id,
              valor: new Prisma.Decimal(totalAmount),
              status: "PENDING",
              payload: charge as unknown as import("@prisma/client").Prisma.InputJsonValue,
            },
          }).catch((err: unknown) => console.error("[orders] Payment record failed:", err));

          pixData = {
            txid: charge.txid,
            pixCopiaECola: charge.pixCopiaECola,
            qrCodeImage,
            expiresAt: expiresAt.toISOString(),
          };
        } catch (err) {
          console.error("[orders] Pix charge generation failed:", err);
          // pixData stays null — checkout will retry via /api/pix/charge
        }
      }
    }

    return NextResponse.json({ order, pix: pixData }, { status: 201 });
  } catch (err) {
    console.error("[orders POST]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
