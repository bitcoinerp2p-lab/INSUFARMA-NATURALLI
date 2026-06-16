import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPayment } from "@/lib/mercadopago";
import { createHmac } from "crypto";

const log = {
  info: (msg: string, data?: object) => console.info(`[webhook] ${msg}`, data ?? ""),
  warn: (msg: string, data?: object) => console.warn(`[webhook] ${msg}`, data ?? ""),
  error: (msg: string, err: unknown, data?: object) =>
    console.error(`[webhook] ${msg}`, err, data ?? ""),
};

async function loadOrder(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { product: { select: { supplierCost: true } } } },
      user: { select: { name: true, email: true } },
      affiliate: { select: { id: true, commissionRate: true, commissionType: true } },
    },
  });
}

export async function POST(req: NextRequest) {
  const startedAt = Date.now();

  // ── 1. Parse raw body ──────────────────────────────────────────────────────
  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch (err) {
    log.error("Failed to read request body", err);
    return NextResponse.json({ ok: true });
  }

  // ── 2. Verify HMAC signature (warn only — never block) ────────────────────
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (secret) {
    try {
      const xSig = req.headers.get("x-signature") ?? "";
      const xReqId = req.headers.get("x-request-id") ?? "";
      const dataId = new URL(req.url).searchParams.get("data.id") ?? "";
      const ts = xSig.split(",").find((p) => p.startsWith("ts="))?.split("=")[1] ?? "";
      const manifest = `id:${dataId};request-id:${xReqId};ts:${ts}`;
      const expected = createHmac("sha256", secret).update(manifest).digest("hex");
      const received = xSig.split(",").find((p) => p.startsWith("v1="))?.split("=")[1] ?? "";
      if (received && expected !== received) {
        log.warn("HMAC mismatch — processing anyway", { received: received.slice(0, 8) });
      }
    } catch (err) {
      log.warn("HMAC verification error — processing anyway", { err: String(err) });
    }
  }

  // ── 3. Parse payload ───────────────────────────────────────────────────────
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody);
  } catch {
    log.warn("Invalid JSON payload — ignoring");
    return NextResponse.json({ ok: true });
  }

  const type = body.type as string;
  const paymentId = (body.data as Record<string, unknown>)?.id as string;

  if (type !== "payment" || !paymentId) {
    log.info(`Ignoring webhook type=${type}`);
    return NextResponse.json({ ok: true });
  }

  log.info("Received payment webhook", { paymentId, type });

  // ── 4. Fetch payment from Mercado Pago ────────────────────────────────────
  let payment: Record<string, unknown>;
  try {
    payment = await getPayment(paymentId);
  } catch (err) {
    log.error(`Failed to fetch payment ${paymentId} from MP`, err);
    return NextResponse.json({ ok: true });
  }

  const orderId = payment.external_reference as string;
  const mpStatus = payment.status as string;

  log.info(`Payment ${paymentId} status=${mpStatus}`, { orderId });

  if (!orderId) {
    log.warn(`Payment ${paymentId} has no external_reference — ignoring`);
    return NextResponse.json({ ok: true });
  }

  // ── 5. Load order ─────────────────────────────────────────────────────────
  const order = await loadOrder(orderId).catch((err: unknown) => {
    log.error(`DB error loading order ${orderId}`, err);
    return null;
  });

  if (!order) {
    log.warn(`Order ${orderId} not found in DB`);
    return NextResponse.json({ ok: true });
  }

  // ── 6. Idempotency: check Sale existence (NOT order.status) ───────────────
  // Anchoring on Sale — not Order.status — covers the crash window where
  // the order was set PAID but Sale creation failed. On retry we can still
  // create the Sale.
  const existingSale = await prisma.sale
    .findUnique({ where: { orderId } })
    .catch(() => null);

  if (existingSale) {
    log.info(`Order ${orderId} already has Sale ${existingSale.id} — skipping`);
    return NextResponse.json({ ok: true });
  }

  // ── 7. Handle rejection / cancellation ───────────────────────────────────
  if (mpStatus === "rejected" || mpStatus === "cancelled") {
    try {
      if (order.status !== "CANCELLED") {
        await prisma.order.update({ where: { id: orderId }, data: { status: "CANCELLED" } });
        log.info(`Order ${orderId} marked CANCELLED`);
      }
    } catch (err) {
      log.error(`Failed to cancel order ${orderId}`, err);
    }
    return NextResponse.json({ ok: true });
  }

  if (mpStatus !== "approved") {
    log.info(`Payment ${paymentId} status=${mpStatus} — no action needed`);
    return NextResponse.json({ ok: true });
  }

  // ── 8. Mark order PAID ────────────────────────────────────────────────────
  try {
    await prisma.order.update({ where: { id: orderId }, data: { status: "PAID" } });
    log.info(`Order ${orderId} marked PAID`);
  } catch (err) {
    log.error(`Failed to mark order ${orderId} PAID`, err);
    // Non-fatal: continue to ensure Sale is recorded
  }

  // ── 9. Calculate financial figures ────────────────────────────────────────
  const grossAmount = Number(order.totalAmount);

  let supplierAmount = 0;
  for (const item of order.items) {
    supplierAmount += Number(item.product.supplierCost) * item.quantity;
  }

  let affiliateAmount = 0;
  if (order.affiliate) {
    affiliateAmount =
      order.affiliate.commissionType === "PERCENTAGE"
        ? (grossAmount * Number(order.affiliate.commissionRate)) / 100
        : Number(order.affiliate.commissionRate);
  }

  const netAmount = Math.max(0, grossAmount - supplierAmount - affiliateAmount);

  log.info(`Financials for order ${orderId}`, {
    grossAmount,
    supplierAmount,
    affiliateAmount,
    netAmount,
  });

  // ── 10. Guard: order must have items ─────────────────────────────────────
  const mainItem = order.items[0];
  if (!mainItem) {
    log.error(`Order ${orderId} has no items — cannot create Sale`, new Error("empty items"));
    return NextResponse.json({ ok: true });
  }

  // ── 11. Create Sale (CRITICAL — isolated try/catch) ───────────────────────
  let saleId: string;
  try {
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
      select: { id: true },
    });
    saleId = sale.id;
    log.info(`Sale ${saleId} created for order ${orderId}`);
  } catch (err) {
    log.error(`CRITICAL: Failed to create Sale for order ${orderId}`, err);
    // Return 200 so MP does not retry forever; this order needs manual reconciliation.
    return NextResponse.json({ ok: true });
  }

  // ── 12. Affiliate commission (isolated — never blocks Sale) ───────────────
  if (order.affiliateId && affiliateAmount > 0) {
    try {
      const availableAt = new Date();
      availableAt.setDate(availableAt.getDate() + 7);

      await prisma.commission.create({
        data: {
          affiliateId: order.affiliateId,
          saleId,
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

      log.info(
        `Commission R$${affiliateAmount.toFixed(2)} registered for affiliate ${order.affiliateId}`,
      );
    } catch (err) {
      log.error(
        `Affiliate commission failed for order ${orderId} — Sale ${saleId} already saved`,
        err,
        { affiliateId: order.affiliateId, saleId, affiliateAmount },
      );
    }
  }

  // ── 13. Audit log (isolated — non-fatal) ──────────────────────────────────
  try {
    await prisma.auditLog.create({
      data: {
        action: "SALE",
        entity: "sale",
        entityId: saleId,
        details: {
          orderId: order.id,
          mpPaymentId: paymentId,
          grossAmount,
          affiliateAmount,
        } as object,
      },
    });
  } catch (err) {
    log.error(`AuditLog failed for sale ${saleId}`, err);
  }

  log.info(`Order ${orderId} fully processed in ${Date.now() - startedAt}ms`, { saleId });

  return NextResponse.json({ ok: true });
}
