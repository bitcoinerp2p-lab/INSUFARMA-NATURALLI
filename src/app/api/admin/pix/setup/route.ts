import { NextRequest, NextResponse } from "next/server";
import { getAdminPayload } from "@/lib/admin-helpers";
import { configureWebhook } from "@/lib/efi";

export async function POST(req: NextRequest) {
  const admin = getAdminPayload(req);
  if (!admin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const pixKey = process.env.EFI_PIX_KEY ?? "";
  if (!pixKey) {
    return NextResponse.json({ error: "EFI_PIX_KEY não configurada" }, { status: 500 });
  }

  const webhookUrl =
    process.env.EFI_WEBHOOK_URL ??
    "https://insufarma-naturalli-production.up.railway.app/api/webhooks/efi?ignorar=";

  try {
    await configureWebhook(pixKey, webhookUrl);
    return NextResponse.json({ ok: true, webhookUrl, pixKey });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[admin/pix/setup] configureWebhook error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
