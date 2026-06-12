/**
 * Registers the Pix webhook URL with EFI Bank.
 * Run once after deploy: npx ts-node scripts/setup-efi-webhook.ts
 */

void (async () => {
  // Load .env.local if present and env vars are not already set
  try {
    const fs = await import("fs");
    const path = await import("path");
    const envPath = path.resolve(process.cwd(), ".env.local");
    if (fs.existsSync(envPath)) {
      for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
        const eq = line.indexOf("=");
        if (eq < 1) continue;
        const key = line.slice(0, eq).trim();
        const val = line.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
        if (key && !process.env[key]) process.env[key] = val;
      }
    }
  } catch {
    // env already injected by Railway/OS
  }

  const { configureWebhook } = await import("../src/lib/efi");

  const pixKey = process.env.EFI_PIX_KEY ?? "";
  const webhookUrl =
    process.env.EFI_WEBHOOK_URL ??
    "https://insufarma-naturalli-production.up.railway.app/api/webhooks/efi?ignorar=";

  if (!pixKey) {
    console.error("EFI_PIX_KEY nao definida.");
    process.exit(1);
  }
  if (!process.env.EFI_CLIENT_ID || !process.env.EFI_CLIENT_SECRET) {
    console.error("EFI_CLIENT_ID e EFI_CLIENT_SECRET sao obrigatorios.");
    process.exit(1);
  }

  const sandbox = process.env.EFI_SANDBOX === "true";
  console.log("Ambiente:", sandbox ? "HOMOLOGACAO" : "PRODUCAO");
  console.log("Chave Pix:", pixKey);
  console.log("Webhook URL:", webhookUrl);

  try {
    await configureWebhook(pixKey, webhookUrl);
    console.log("Webhook registrado com sucesso na EFI Bank!");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Falha ao registrar webhook:", msg);
    process.exit(1);
  }
})();
