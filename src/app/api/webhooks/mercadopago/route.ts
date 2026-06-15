import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPayment } from "@/lib/mercadopago";
import { createHmac } from "crypto";

// Mercado Pago sends webhook notifications
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();

    // Optional: verify signature using MP secret
    const secret = process.env.MP_WEBHOOK_SECRET;
    if (secret) {
      const xSignature = req.headers.get("x-signature") ?? "";
      const xRequestId = req.headers.get("x-request-id") ?? "";
      const url = req.url;
      const dataId = new URL(url).searchParams.get("data.id") ?? "";
      const manifest = `id:${dataId};request-id:${xRequestId};ts:${xSignature.split(",").find((p) => p.startsWith("ts="))?.split("=")[1] ?? ""}`;
      const expectedSig = createHmac("sha256", secret).update(manifest).digest("hex");
      const receivedSig = xSignature.split(",").find((p) => p.startsWith("v1="))?.split("=")[1] ?? "";
      if (receivedSig && expectedSig !== receivedSig) {
        console.warn("[mp-webhook] Signature mismatch");
        return NextResponse.json({ ok: false }, { status: 200 });
      }
    }

    const body = JSON.parse(rawBody);
    const type = body.type as string;
    const paymentId = body.data?.id as string;

    if (type !== "payment" || !paymentId) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const payment = await getPayment(paymentId);
    const orderId = payment.external_reference as string;
    const status = payment.status as string;

    if (!orderId) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: true } },
        user: true,
        affiliate: true,
      },
    });

    if (!order || order.status === "PAID") {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    if (status === "approved") {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: "PAID" },
      });

      const grossAmount = Number(order.totalAmount);
      let supplierAmount = 0;
      for (const item of order.items) {
        supplierAmount += Number(item.product.supplierCost) * item.quantity;
      }

      let affiliateAmount = 0;
      if (order.affiliate) {
        const aff = order.affiliate;
        affiliateAmount = aff.commissionType === "PERCENTAGE"
          ? (grossAmount * Number(aff.commissionRate)) / 100
          : Number(aff.commissionRate);
      }

      const netAmount = Math.max(0, grossAmount - supplierAmount - affiliateAmount);
      const mainItem = order.items[0];

      const sale = await prisma.sale.create({
        data: {
          orderId: order.id,
          affiliateId: order.affiliateId ?? null,
          productId: mainItem.productId,
          customerId: order.userId,
          customerName: order.user.name,
          customerEmail: order.user.email,
          grossAmount,
          supplierAmount,
          netAmount,
          affiliateAmount,
          couponCode: order.couponCode ?? null,
          mpPaymentId: String(paymentId),
          mpStatus: "approved",
        },
      });

      if (order.affiliateId && affiliateAmount > 0) {
        const availableAt = new Date();
        availableAt.setDate(availableAt.getDate() + 7);

        await prisma.commission.create({
          data: {
            affiliateId: order.affiliateId,
            saleId: sale.id,
            amount: affiliateAmount,
            status: "PENDING",
            availableAt,
          },
        });

        await prisma.affiliateWallet.upsert({
          where: { affiliateId: order.affiliateId },
          create: {
            affiliateId: order.affiliateId,
            pendingBalance: affiliateAmount,
            totalEarned: affiliateAmount,
          },
          update: {
            pendingBalance: { increment: affiliateAmount },
            totalEarned: { increment: affiliateAmount },
          },
        });
      }

      await prisma.auditLog.create({
        data: {
          action: "SALE",
          entity: "sale",
          entityId: sale.id,
          details: { orderId: order.id, mpPaymentId: paymentId, grossAmount, affiliateAmount } as object,
        },
      });

      console.info(`[mp-webhook] Order ${orderId} marked PAID via Mercado Pago`);
    } else if (status === "rejected" || status === "cancelled") {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED" },
      });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("[mp-webhook]", err);
    return NextResponse.json({ ok: true }, { status: 200 });
  }
}
