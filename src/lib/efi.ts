import https from "https";
import fs from "fs";

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface EfiPixCharge {
  txid: string;
  status: "ATIVA" | "CONCLUIDA" | "REMOVIDA_PELO_USUARIO_RECEBEDOR" | "REMOVIDA_PELO_PSP";
  pixCopiaECola: string;
  loc: { id: number; location: string; tipoCob: string };
  valor: { original: string };
  chave: string;
  calendario: { criacao: string; expiracao: number };
  revisao: number;
}

export interface EfiQrCode {
  qrcode: string;
  imagemQrcode: string; // "data:image/png;base64,..."
}

export interface CreatePixInput {
  valor: string;           // "10.00"
  chave: string;           // Pix key registered in EFI account
  expiracaoSegundos?: number;
  devedorCpf?: string;
  devedorNome?: string;
  solicitacaoPagador?: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

function isSandbox(): boolean {
  return process.env.EFI_SANDBOX === "true";
}

function baseUrl(): string {
  return isSandbox()
    ? "https://pix-h.api.efipay.com.br"
    : "https://pix.api.efipay.com.br";
}

// ─── mTLS Agent — cached per process to avoid disk I/O on every request ───────

let _cachedAgent: https.Agent | null = null;
let _cachedCertKey = "";

function buildAgent(): https.Agent {
  // Prefer base64 env var (Railway / cloud deployments — files not in git)
  const certBase64 = isSandbox()
    ? (process.env.EFI_HOMOLOG_CERT_BASE64 ?? "")
    : (process.env.EFI_PROD_CERT_BASE64 ?? "");

  const certPath = isSandbox()
    ? (process.env.EFI_HOMOLOG_CERT_PATH ?? "")
    : (process.env.EFI_PROD_CERT_PATH ?? "");

  const cacheKey = certBase64 ? `b64:${certBase64.slice(0, 16)}` : certPath;
  if (_cachedAgent && _cachedCertKey === cacheKey) return _cachedAgent;
  _cachedCertKey = cacheKey;

  if (certBase64) {
    try {
      const pfx = Buffer.from(certBase64, "base64");
      _cachedAgent = new https.Agent({ pfx, passphrase: "" });
      console.info("[efi] mTLS loaded from base64 env var");
      return _cachedAgent;
    } catch (err) {
      console.error("[efi] Failed to decode base64 certificate:", err);
    }
  }

  if (certPath) {
    try {
      const pfx = fs.readFileSync(certPath);
      _cachedAgent = new https.Agent({ pfx, passphrase: "" });
      console.info("[efi] mTLS loaded from file:", certPath);
      return _cachedAgent;
    } catch (err) {
      console.error("[efi] Certificate file not found:", certPath, err);
    }
  }

  console.warn("[efi] No certificate configured — mTLS disabled (will fail on production EFI API)");
  _cachedAgent = new https.Agent();
  return _cachedAgent;
}

// ─── Token cache ──────────────────────────────────────────────────────────────

let _tokenCache: { value: string; expiresAt: number } | null = null;

function rawRequest<T>(
  method: string,
  endpoint: string,
  body?: object,
  authHeader?: string
): Promise<T> {
  return new Promise((resolve, reject) => {
    const host = new URL(baseUrl()).hostname;
    const bodyStr = body ? JSON.stringify(body) : undefined;

    const options: https.RequestOptions = {
      hostname: host,
      port: 443,
      path: endpoint,
      method,
      agent: buildAgent(),
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
        ...(bodyStr ? { "Content-Length": Buffer.byteLength(bodyStr) } : {}),
      },
    };

    const req = https.request(options, (res) => {
      let raw = "";
      res.on("data", (c: string) => { raw += c; });
      res.on("end", () => {
        try {
          const parsed = JSON.parse(raw) as T;
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`EFI HTTP ${res.statusCode}: ${raw}`));
          } else {
            resolve(parsed);
          }
        } catch {
          reject(new Error(`EFI JSON parse failed (status ${res.statusCode}): ${raw}`));
        }
      });
    });

    req.on("error", reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function getToken(): Promise<string> {
  if (_tokenCache && Date.now() < _tokenCache.expiresAt - 60_000) {
    return _tokenCache.value;
  }

  const clientId = process.env.EFI_CLIENT_ID ?? "";
  const clientSecret = process.env.EFI_CLIENT_SECRET ?? "";

  if (!clientId || !clientSecret) {
    throw new Error("EFI_CLIENT_ID e EFI_CLIENT_SECRET são obrigatórios");
  }

  const creds = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await rawRequest<{ access_token: string; expires_in: number }>(
    "POST",
    "/oauth/token",
    { grant_type: "client_credentials" },
    `Basic ${creds}`
  );

  _tokenCache = {
    value: res.access_token,
    expiresAt: Date.now() + res.expires_in * 1000,
  };

  console.info("[efi] Access token obtained, expires in", res.expires_in, "s");
  return _tokenCache.value;
}

async function apiRequest<T>(
  method: string,
  endpoint: string,
  body?: object
): Promise<T> {
  const token = await getToken();
  return rawRequest<T>(method, endpoint, body, `Bearer ${token}`);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function createPixCharge(input: CreatePixInput): Promise<EfiPixCharge> {
  const body: Record<string, unknown> = {
    calendario: { expiracao: input.expiracaoSegundos ?? 3600 },
    valor: { original: input.valor },
    chave: input.chave,
  };

  if (input.devedorNome && input.devedorCpf) {
    body.devedor = {
      cpf: input.devedorCpf.replace(/\D/g, ""),
      nome: input.devedorNome,
    };
  }

  if (input.solicitacaoPagador) {
    body.solicitacaoPagador = input.solicitacaoPagador;
  }

  return apiRequest<EfiPixCharge>("POST", "/v2/cob", body);
}

export async function getPixCharge(txid: string): Promise<EfiPixCharge> {
  return apiRequest<EfiPixCharge>("GET", `/v2/cob/${txid}`);
}

export async function getPixQrCode(locId: number): Promise<EfiQrCode> {
  return apiRequest<EfiQrCode>("GET", `/v2/loc/${locId}/qrcode`);
}

export async function cancelPixCharge(txid: string): Promise<EfiPixCharge> {
  return apiRequest<EfiPixCharge>("PATCH", `/v2/cob/${txid}`, {
    status: "REMOVIDA_PELO_USUARIO_RECEBEDOR",
  });
}

export async function configureWebhook(chave: string, webhookUrl: string): Promise<void> {
  await apiRequest<unknown>("PUT", `/v2/webhook/${chave}`, { webhookUrl });
  console.info("[efi] Webhook configured for key:", chave);
}

export async function listReceivedPix(inicio: string, fim: string) {
  return apiRequest<unknown>("GET", `/v2/pix?inicio=${inicio}&fim=${fim}`);
}
