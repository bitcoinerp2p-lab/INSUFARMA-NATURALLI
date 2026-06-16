import { NextRequest, NextResponse } from "next/server";
import { processPayment } from "@/lib/processPayment";
import { createHmac } from "crypto";

const log = {
  info: (msg: string, data?: object) => console.info(`[webhook] ${msg}`, data ?? ""),
  warn: (msg: string, data?: object) => console.warn(`[webhook] ${msg}`, data ?? ""),
  error: (msg: string, err: unknown, data?: object) =>
    console.error(`[webhook] ${msg}`, err, data ?? ""),
};

export async function POST(req: NextRequest) {
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
  // MP sends data.id as a number — convert explicitly
  const paymentId = String((body.data as Record<string, unknown>)?.id ?? "").trim();

  if (type !== "payment" || !paymentId) {
    log.info(`Ignoring webhook type=${type}`);
    return NextResponse.json({ ok: true });
  }

  log.info(`[Mercado Pago] Webhook recebido com o ID: ${paymentId}`, { type });

  await processPayment(paymentId);

  return NextResponse.json({ ok: true });
}
