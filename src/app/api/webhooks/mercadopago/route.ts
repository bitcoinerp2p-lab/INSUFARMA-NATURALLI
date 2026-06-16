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

const ORDER_INCLUDE = {
  items: { include: { product: { select: { supplierCost: true } } } },
  user: { select: { name: true, email: true } },
  affiliate: { select: { id: true, commissionRate: true, commissionType: true } },
} as const;

async function findOrderById(id: string) {
  return prisma.order.findUnique({ where: { id }, include: ORDER_INCLUDE });
}

async function findOrderByMpPreferenceId(mpPaymentId: string) {
  return prisma.order.findFirst({ where: { mpPaymentId }, include: ORDER_INCLUDE });
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
  // MP sends data.id as a number — convert explicitly to avoid type ambiguity
  const paymentId = String((body.data as Record<string, unknown>)?.id ?? "").trim();

  if (type !== "payment" || !paymentId) {
    log.info(`Ignoring webhook type=${type}`);
    return NextResponse.json({ ok: true });
  }

  log.info(`[Mercado Pago] Webhook recebido com o ID: ${paymentId}`, { type });

  // ── 4. Fetch payment from Mercado Pago ────────────────────────────────────
  let payment: Record<string, unknown>;
  try {
    payment = await getPayment(paymentId);
  } catch (err) {
    log.error(`Failed to fetch payment ${paymentId} from MP`, err);
    return NextResponse.json({ ok: true });
  }

  const mpStatus = payment.status as string;
  const externalRef = (payment.external_reference as string | null | undefined) ?? null;
  // preference_id links the payment back to the Checkout Pro preference we created.
  // Order.mpPaymentId stores that same preference ID — used as fallback when
  // external_reference is null (happens in sandbox and some production edge cases).
  const mpPreferenceId = (payment.preference_id as string | null | undefined) ?? null;

  log.info(`[Mercado Pago] Status consultado na API: ${mpStatus}`, {
    paymentId,
    externalRef: externalRef ?? "(null)",
    preferenceId: mpPreferenceId ?? "(null)",
  });

  // ── 5. Load order — external_reference first, preference_id as fallback ───
  let order: Awaited<ReturnType<typeof findOrderById>> | null = null;

  if (externalRef) {
    order = await findOrderById(externalRef).catch((err: unknown) => {
      log.error(`DB error loading order by external_reference ${externalRef}`, err);
      return null;
    });
  }

  if (!order && mpPreferenceId) {
    log.info(
      `external_reference ${externalRef ?? "ausente"} não localizou pedido — buscando por preference_id ${mpPreferenceId}`,
    );
    order = await findOrderByMpPreferenceId(mpPreferenceId).catch((err: unknown) => {
      log.error(`DB error loading order by preference_id ${mpPreferenceId}`, err);
      return null;
    });
  }

  if (!order) {
    log.warn(`Pedido não encontrado`, {
      externalRef: externalRef ?? "null",
      preferenceId: mpPreferenceId ?? "null",
    });
    return NextResponse.json({ ok: true });
  }

  const orderId = order.id;
  log.info(`Pedido ${orderId} encontrado`, { status: order.status, mpStatus });

  // ── 6. Idempotency: check Sale existence ──────────────────────────────────
  // Anchored on Sale (not Order.status) so a crash between step 8 and 11 is
  // retryable. Edge case: Sale exists but Order is still PENDING (step 8 had
  // previously failed) — we repair the status here before returning.
  const existingSale = await prisma.sale
    .findUnique({ where: { orderId } })
    .catch(() => null);

  if (existingSale) {
    if (order.status === "PENDING" && mpStatus === "approved") {
      log.warn(
        `Sale ${existingSale.id} já existe mas pedido ${orderId} ainda PENDING — reparando status`,
      );
      await prisma.order
        .update({ where: { id: orderId }, data: { status: "PAID" } })
        .catch((err: unknown) =>
          log.error(`Failed to repair PENDING status for order ${orderId}`, err),
        );
    }
    log.info(`[Mercado Pago] Sale ${existingSale.id} já existe para o pedido ${orderId} — idempotente`);
    return NextResponse.json({ ok: true });
  }

  // ── 7. Handle rejection / cancellation ───────────────────────────────────
  if (mpStatus === "rejected" || mpStatus === "cancelled") {
    try {
      if (order.status !== "CANCELLED") {
        await prisma.order.update({ where: { id: orderId }, data: { status: "CANCELLED" } });
        log.info(`Pedido ${orderId} marcado CANCELLED`);
      }
    } catch (err) {
      log.error(`Failed to cancel order ${orderId}`, err);
    }
    return NextResponse.json({ ok: true });
  }

  if (mpStatus !== "approved") {
    log.info(`Payment ${paymentId} status=${mpStatus} — nenhuma ação necessária`);
    return NextResponse.json({ ok: true });
  }

  // ── 8. Mark order PAID (isolated — PRIORIDADE MÁXIMA) ────────────────────
  try {
    await prisma.order.update({ where: { id: orderId }, data: { status: "PAID" } });
    log.info(`[Sistema] Status do Pedido ${orderId} atualizado para PAGO`);
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

  log.info(`Financials pedido ${orderId}`, { grossAmount, supplierAmount, affiliateAmount, netAmount });

  // ── 10. Guard: order must have items ─────────────────────────────────────
  const mainItem = order.items[0];
  if (!mainItem) {
    log.error(`Pedido ${orderId} sem itens — Sale não criada`, new Error("empty items"));
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
        utmSource: order.utmSource ?? null,
        utmMedium: order.utmMedium ?? null,
        utmCampaign: order.utmCampaign ?? null,
        utmContent: order.utmContent ?? null,
        trafficOrigin: order.trafficOrigin ?? null,
        mpPaymentId: paymentId,
        mpStatus: "approved",
      },
      select: { id: true },
    });
    saleId = sale.id;
    log.info(`[Sistema] Sale ${saleId} criada para o pedido ${orderId}`);
  } catch (err) {
    log.error(`CRITICAL: Falha ao criar Sale para o pedido ${orderId}`, err);
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
        `[Sistema] Sucesso ao processar comissão do Afiliado: R$${affiliateAmount.toFixed(2)} para afiliado ${order.affiliateId}`,
        { saleId },
      );
    } catch (err) {
      log.error(
        `Comissão do afiliado falhou para pedido ${orderId} — Sale ${saleId} já salva`,
        err,
        { affiliateId: order.affiliateId, saleId, affiliateAmount },
      );
    }
  }

  // ── 13. Mark most-recent affiliate click as converted (isolated) ──────────
  if (order.affiliateId) {
    try {
      const latestClick = await prisma.affiliateClick.findFirst({
        where: { affiliateId: order.affiliateId, convertedAt: null, saleId: null },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });
      if (latestClick) {
        await prisma.affiliateClick.update({
          where: { id: latestClick.id },
          data: { convertedAt: new Date(), saleId },
        });
      }
    } catch (err) {
      log.error(`Failed to mark affiliate click converted for order ${orderId}`, err);
    }
  }

  // ── 14. Audit log (isolated — non-fatal) ──────────────────────────────────
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

  log.info(`Pedido ${orderId} processado com sucesso em ${Date.now() - startedAt}ms`, { saleId });

  return NextResponse.json({ ok: true });
}
