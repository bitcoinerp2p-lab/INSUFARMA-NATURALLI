import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createHmac } from "crypto";

// EFI Bank Pix webhook payload shape
interface EfiPixItem {
  endToEndId: string;
  txid: string;
  chave: string;
  valor: string;
  horario: string;
  infoPagador?: string;
}

interface EfiWebhookPayload {
  pix?: EfiPixItem[];
  // Legacy / non-Pix events (kept for compatibility)
  event?: string;
  status?: string;
  charge_id?: string;
  id?: string;
  payment_id?: string;
}

// EFI retries on non-2xx — always return 200 to avoid duplicate processing
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  let payload: EfiWebhookPayload;

  try {
    payload = JSON.parse(rawBody) as EfiWebhookPayload;
  } catch {
    console.error("[efi-webhook] Invalid JSON body");
    return NextResponse.json({ ok: false }, { status: 200 });
  }

  // Optional HMAC signature verification (when EFI_WEBHOOK_SECRET is set)
  const secret = process.env.EFI_WEBHOOK_SECRET;
  if (secret) {
    const signature = req.headers.get("x-efi-signature") ?? "";
    const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
    if (signature !== expected) {
      console.warn("[efi-webhook] Signature mismatch — rejecting event");
      await prisma.efiWebhookEvent.create({
        data: { eventType: "unknown", payload: payload as object, processed: false, error: "invalid_signature" },
      });
      return NextResponse.json({ ok: false }, { status: 200 });
    }
  }

  // Handle EFI Pix webhook format: payload.pix is an array of payments
  if (Array.isArray(payload.pix) && payload.pix.length > 0) {
    for (const pixItem of payload.pix) {
      const event = await prisma.efiWebhookEvent.create({
        data: {
          eventType: "pix.received",
          payload: pixItem as object,
          processed: false,
        },
      });

      try {
        await processPixPayment(pixItem);
        await prisma.efiWebhookEvent.update({
          where: { id: event.id },
          data: { processed: true },
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await prisma.efiWebhookEvent.update({
          where: { id: event.id },
          data: { error: msg },
        });
        console.error("[efi-webhook] processPixPayment error:", msg);
      }
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  }

  // Fallback: legacy event format
  const eventType = (payload.event as string) ?? payload.status ?? "unknown";
  const event = await prisma.efiWebhookEvent.create({
    data: { eventType, payload: payload as object, processed: false },
  });

  const isConfirmed =
    eventType === "payment.confirmed" ||
    eventType === "charge.paid" ||
    payload.status === "paid" ||
    payload.status === "approved";

  if (isConfirmed) {
    const legacyId =
      (payload.charge_id as string) ??
      (payload.id as string) ??
      (payload.payment_id as string);

    if (legacyId) {
      try {
        await processOrderByEfiId(legacyId, legacyId, "0.00");
        await prisma.efiWebhookEvent.update({ where: { id: event.id }, data: { processed: true } });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await prisma.efiWebhookEvent.update({ where: { id: event.id }, data: { error: msg } });
        console.error("[efi-webhook] legacy event error:", msg);
      }
    }
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}

async function processPixPayment(pixItem: EfiPixItem) {
  await processOrderByEfiId(pixItem.txid, pixItem.endToEndId, pixItem.valor);
}

async function processOrderByEfiId(txid: string, endToEndId: string, valor: string) {
  const order = await prisma.order.findFirst({
    where: { efiPaymentId: txid },
    include: {
      items: { include: { product: true } },
      user: true,
      affiliate: true,
    },
  });

  if (!order) throw new Error(`order not found for txid=${txid}`);
  if (order.status === "PAID") return; // idempotent

  await prisma.order.update({
    where: { id: order.id },
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
    if (aff.commissionType === "PERCENTAGE") {
      affiliateAmount = (grossAmount * Number(aff.commissionRate)) / 100;
    } else {
      affiliateAmount = Number(aff.commissionRate);
    }
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
      utmSource: order.utmSource ?? null,
      utmMedium: order.utmMedium ?? null,
      utmCampaign: order.utmCampaign ?? null,
      utmContent: order.utmContent ?? null,
      trafficOrigin: order.trafficOrigin ?? null,
      efiPaymentId: txid,
      efiStatus: "paid",
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
        availableBalance: 0,
        totalEarned: affiliateAmount,
        totalWithdrawn: 0,
      },
      update: {
        pendingBalance: { increment: affiliateAmount },
        totalEarned: { increment: affiliateAmount },
      },
    });

    await prisma.affiliateClick.updateMany({
      where: {
        affiliateId: order.affiliateId,
        convertedAt: null,
        saleId: null,
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      data: { convertedAt: new Date(), saleId: sale.id },
    });

    await prisma.affiliateLink.updateMany({
      where: { affiliateId: order.affiliateId },
      data: { conversions: { increment: 1 } },
    });
  }

  await prisma.auditLog.create({
    data: {
      action: "SALE",
      entity: "sale",
      entityId: sale.id,
      details: { orderId: order.id, txid, endToEndId, grossAmount, affiliateAmount, netAmount } as object,
    },
  });

  console.info(`[efi-webhook] Order ${order.id} marked PAID — sale ${sale.id}`);
}
