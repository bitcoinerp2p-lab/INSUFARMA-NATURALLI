const MP_BASE = "https://api.mercadopago.com";

function getAccessToken(): string {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN ?? "";
  if (!token) throw new Error("MERCADO_PAGO_ACCESS_TOKEN não configurado");
  return token;
}

export interface MpItem {
  title: string;
  quantity: number;
  unit_price: number;
  currency_id?: string;
}

export interface MpPayer {
  name?: string;
  email: string;
  identification?: { type: string; number: string };
}

export interface MpPreferenceInput {
  items: MpItem[];
  payer?: MpPayer;
  external_reference?: string;
  back_urls?: { success?: string; failure?: string; pending?: string };
  auto_return?: "approved" | "all";
  notification_url?: string;
  payment_methods?: {
    excluded_payment_types?: Array<{ id: string }>;
    installments?: number;
  };
}

export interface MpPreference {
  id: string;
  init_point: string;
  sandbox_init_point: string;
  external_reference: string;
}

export async function createPreference(input: MpPreferenceInput): Promise<MpPreference> {
  const token = getAccessToken();
  const isSandbox = process.env.MP_SANDBOX === "true";

  const body = {
    ...input,
    items: input.items.map((i) => ({ ...i, currency_id: i.currency_id ?? "BRL" })),
  };

  const res = await fetch(`${MP_BASE}/checkout/preferences`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Mercado Pago error ${res.status}: ${err}`);
  }

  const data = await res.json() as MpPreference;
  if (isSandbox) console.info("[mp] Sandbox preference created:", data.id);
  return data;
}

export interface MpTransparentPayer {
  email: string;
  first_name: string;
  last_name: string;
  identification: { type: "CPF"; number: string };
  address?: {
    zip_code: string;
    street_name: string;
    street_number: string;
    neighborhood: string;
    city: string;
    federal_unit: string;
  };
}

export async function createTransparentPayment(input: {
  transaction_amount: number;
  payment_method_id: "pix" | "bolbradesco";
  description: string;
  external_reference: string;
  notification_url: string;
  payer: MpTransparentPayer;
  date_of_expiration?: string;
}) {
  const token = getAccessToken();
  const res = await fetch(`${MP_BASE}/v1/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-Idempotency-Key": `${input.external_reference}-${input.payment_method_id}`,
    },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Mercado Pago error ${res.status}: ${err}`);
  }

  return res.json();
}

export async function getPayment(paymentId: string) {
  const token = getAccessToken();
  const res = await fetch(`${MP_BASE}/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Mercado Pago error ${res.status}: ${err}`);
  }
  return res.json();
}
