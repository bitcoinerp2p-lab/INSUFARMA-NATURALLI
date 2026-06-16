import { prisma } from "@/lib/prisma";
import { getPayment } from "@/lib/mercadopago";

const log = {
  info: (msg: string, data?: object) => console.info(`[processPayment] ${msg}`, data ?? ""),
  warn: (msg: string, data?: object) => console.warn(`[processPayment] ${msg}`, data ?? ""),
  error: (msg: string, err: unknown, data?: object) =>
    console.error(`[processPayment] ${msg}`, err, data ?? ""),
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

export interface PaymentProcessResult {
  status: string;
  orderId: string | null;
  orderStatus?: string;
  saleId?: string;
  skipped?: boolean;
  message?: string;
}

export async function processPayment(paymentId: string): Promise<PaymentProcessResult> {
  const startedAt = Date.now();

  // ── 1. Fetch payment from Mercado Pago ────────────────────────────────────
  let payment: Record<string, unknown>;
  try {
    payment = await getPayment(paymentId);
  } catch (err) {
    log.error(`Failed to fetch payment ${paymentId} from MP`, err);
    return { status: "error", orderId: null, message: "Failed to fetch payment from MP" };
  }

  const mpStatus = payment.status as string;
  const externalRef = (payment.external_reference as string | null | undefined) ?? null;
  const mpPreferenceId = (payment.preference_id as string | null | undefined) ?? null;

  log.info(`[Mercado Pago] Status consultado na API: ${mpStatus}`, {
    paymentId,
    externalRef: externalRef ?? "(null)",
    preferenceId: mpPreferenceId ?? "(null)",
  });

  // ── 2. Load order (external_reference first, preference_id fallback) ──────
  let order: Awaited<ReturnType<typeof findOrderById>> | null = null;

  if (externalRef) {
    order = await findOrderById(externalRef).catch((err: unknown) => {
      log.error(`DB error loading order by external_reference ${externalRef}`, err);
      return null;
    });
  }

  if (!order && mpPreferenceId) {
    log.info(`Buscando pedido por preference_id ${mpPreferenceId}`);
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
    return { status: mpStatus, orderId: null, message: "Order not found" };
  }

  const orderId = order.id;
  log.info(`Pedido ${orderId} encontrado`, { status: order.status, mpStatus });

  // ── 3. Idempotency: check Sale existence ──────────────────────────────────
  const existingSale = await prisma.sale.findUnique({ where: { orderId } }).catch(() => null);

  if (existingSale) {
    if (order.status === "PENDING" && mpStatus === "approved") {
      log.warn(`Sale ${existingSale.id} existe mas pedido ${orderId} ainda PENDING — reparando status`);
      await prisma.order
        .update({ where: { id: orderId }, data: { status: "PAID" } })
        .catch((err: unknown) => log.error(`Failed to repair order ${orderId} status`, err));
    }
    log.info(`Sale ${existingSale.id} já existe — idempotente`);
    return { status: mpStatus, orderId, orderStatus: "PAID", saleId: existingSale.id, skipped: true };
  }

  // ── 4. Handle rejection / cancellation ───────────────────────────────────
  if (mpStatus === "rejected" || mpStatus === "cancelled") {
    if (order.status !== "CANCELLED") {
      await prisma.order
        .update({ where: { id: orderId }, data: { status: "CANCELLED" } })
        .catch(console.error);
    }
    return { status: mpStatus, orderId, orderStatus: "CANCELLED" };
  }

  if (mpStatus !== "approved") {
    return { status: mpStatus, orderId, orderStatus: order.status };
  }

  // ── 5. Mark order PAID (PRIORIDADE MÁXIMA — isolated) ────────────────────
  try {
    await prisma.order.update({ where: { id: orderId }, data: { status: "PAID" } });
    log.info(`[Sistema] Status do Pedido ${orderId} atualizado para PAGO`);
  } catch (err) {
    log.error(`Failed to mark order ${orderId} PAID`, err);
  }

  // ── 6. Calculate financial figures ────────────────────────────────────────
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

  const mainItem = order.items[0];
  if (!mainItem) {
    log.error(`Pedido ${orderId} sem itens — Sale não criada`, new Error("empty items"));
    return { status: mpStatus, orderId, orderStatus: "PAID", message: "Order has no items" };
  }

  // ── 7. Create Sale (CRITICAL — isolated try/catch) ────────────────────────
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
    return { status: mpStatus, orderId, orderStatus: "PAID", message: "Sale creation failed" };
  }

  // ── 8. Affiliate commission (isolated) ───────────────────────────────────
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
      log.error(`Comissão do afiliado falhou para pedido ${orderId} — Sale ${saleId} já salva`, err, {
        affiliateId: order.affiliateId,
        saleId,
        affiliateAmount,
      });
    }
  }

  // ── 9. Mark most-recent affiliate click as converted (isolated) ───────────
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

  // ── 10. Audit log (isolated) ──────────────────────────────────────────────
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

  log.info(`Order ${orderId} processado com sucesso em ${Date.now() - startedAt}ms`, { saleId });
  return { status: "approved", orderId, orderStatus: "PAID", saleId };
}
