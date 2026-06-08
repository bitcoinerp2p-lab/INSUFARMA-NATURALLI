import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createHmac } from "crypto";

async function writeAuditLog(opts: {
  action: "SALE";
  entity: string;
  entityId: string;
  details: object;
}) {
  await prisma.auditLog.create({
    data: {
      action: opts.action,
      entity: opts.entity,
      entityId: opts.entityId,
      details: opts.details,
    },
  });
}

// EFI Bank sends POST to this endpoint when payment status changes.
// We must always return 200 — EFI retries on failure which can cause duplicate processing.
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  let payload: Record<string, unknown>;

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }

  const eventType = (payload.event as string) ?? "unknown";

  // Verify signature if secret is configured
  const secret = process.env.EFI_WEBHOOK_SECRET;
  if (secret) {
    const signature = req.headers.get("x-efi-signature") ?? "";
    const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
    if (signature !== expected) {
      await prisma.efiWebhookEvent.create({
        data: { eventType, payload: payload as object, processed: false, error: "invalid_signature" },
      });
      return NextResponse.json({ ok: false }, { status: 200 });
    }
  }

  const event = await prisma.efiWebhookEvent.create({
    data: { eventType, payload: payload as object, processed: false },
  });

  try {
    await processEfiEvent(payload, eventType);
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
    console.error("[efi-webhook]", msg);
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}

async function processEfiEvent(payload: Record<string, unknown>, eventType: string) {
  // EFI Bank payment confirmation events
  const isPaymentConfirmed =
    eventType === "payment.confirmed" ||
    eventType === "charge.paid" ||
    (payload.status as string) === "paid" ||
    (payload.status as string) === "approved";

  if (!isPaymentConfirmed) return;

  const efiPaymentId =
    (payload.charge_id as string) ??
    (payload.id as string) ??
    (payload.payment_id as string);

  if (!efiPaymentId) throw new Error("no efi_payment_id in payload");

  const order = await prisma.order.findFirst({
    where: { efiPaymentId },
    include: {
      items: { include: { product: true } },
      user: true,
      affiliate: true,
    },
  });

  if (!order) throw new Error(`order not found for efiPaymentId=${efiPaymentId}`);
  if (order.status === "PAID") return; // already processed

  await prisma.order.update({ where: { id: order.id }, data: { status: "PAID" } });

  const grossAmount = Number(order.totalAmount);

  // Calculate financial breakdown from order items
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

  // Create one Sale per order (main product = first item)
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
      efiPaymentId,
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

    // Mark last click as converted
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

  void writeAuditLog({
    action: "SALE",
    entity: "sale",
    entityId: sale.id,
    details: { orderId: order.id, grossAmount, affiliateAmount, netAmount },
  });
}
