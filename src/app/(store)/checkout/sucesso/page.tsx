"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/context/CartContext";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

function SucessoContent() {
  const searchParams = useSearchParams();
  // pedido=orderId é sempre passado. MP também envia external_reference.
  const orderId =
    searchParams.get("pedido") ??
    searchParams.get("external_reference") ??
    null;
  // MP Checkout Pro envia collection_id / payment_id após o redirect.
  const collectionId =
    searchParams.get("collection_id") ??
    searchParams.get("payment_id") ??
    null;
  const collectionStatus =
    searchParams.get("collection_status") ??
    searchParams.get("status") ??
    null;

  const { clearCart } = useCart();
  const [orderStatus, setOrderStatus] = useState<string | null>(null);
  const [phase, setPhase] = useState<"confirming" | "done">("confirming");

  useEffect(() => {
    clearCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Passo 1 — confirmação via endpoint: verifica com a API do MP e processa pedido
  useEffect(() => {
    if (!collectionId || collectionStatus !== "approved") {
      setPhase("done");
      return;
    }

    fetch(`${BASE}/api/payments/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentId: collectionId }),
    })
      .then((r) => r.json())
      .then((d: { orderStatus?: string; status?: string }) => {
        setOrderStatus(d.orderStatus ?? null);
      })
      .catch(() => {
        /* silencioso — polling abaixo é o fallback */
      })
      .finally(() => setPhase("done"));
  }, [collectionId, collectionStatus]);

  // Passo 2 — polling do status do pedido até PAID (fallback para webhook)
  useEffect(() => {
    if (!orderId || orderStatus === "PAID" || phase === "confirming") return;

    let attempts = 0;
    const iv = setInterval(async () => {
      attempts++;
      if (attempts > 20) {
        clearInterval(iv);
        return;
      }
      try {
        const r = await fetch(`${BASE}/api/orders/${orderId}`);
        if (!r.ok) return;
        const d = await r.json() as { order?: { status?: string } };
        if (d.order?.status === "PAID") {
          setOrderStatus("PAID");
          clearInterval(iv);
        }
      } catch {
        /* ignore */
      }
    }, 3000);

    return () => clearInterval(iv);
  }, [orderId, orderStatus, phase]);

  const isPaid = orderStatus === "PAID";
  const isConfirming = phase === "confirming";

  return (
    <div className="min-h-screen bg-gray-50/80 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Brand bar */}
          <div className="bg-brand-red px-6 py-4 flex items-center justify-center">
            <div className="flex flex-col leading-none items-center">
              <span className="text-white font-display font-bold text-lg tracking-wide">INSUFARMA</span>
              <span className="text-brand-gold font-semibold text-[10px] tracking-[0.2em] uppercase">NATURALLI</span>
            </div>
          </div>

          {/* Content */}
          <div className="px-8 py-8 text-center">
            {isConfirming ? (
              <>
                {/* Spinner */}
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-5">
                  <div className="w-8 h-8 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
                <h1 className="font-display text-2xl font-bold text-gray-900 mb-2">
                  Confirmando pagamento…
                </h1>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Aguarde enquanto processamos seu pagamento.
                </p>
              </>
            ) : (
              <>
                {/* Check icon */}
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
                  <svg
                    className="w-8 h-8 text-emerald-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>

                <h1 className="font-display text-2xl font-bold text-gray-900 mb-2">
                  Pedido Confirmado!
                </h1>
                <p className="text-gray-500 text-sm leading-relaxed mb-5">
                  {isPaid
                    ? "Pagamento confirmado! Seu pedido está sendo preparado."
                    : "Recebemos seu pedido. Você receberá a confirmação do pagamento em breve."}
                </p>

                {orderId && (
                  <div className="bg-gray-50 rounded-xl px-4 py-3 mb-6 border border-gray-100">
                    <p className="text-xs text-gray-400 mb-0.5">Número do pedido</p>
                    <p className="font-mono font-semibold text-gray-800 text-sm tracking-wider">
                      #{orderId.slice(-8).toUpperCase()}
                    </p>
                    {isPaid && (
                      <p className="text-xs text-emerald-600 font-semibold mt-1">✓ Pago</p>
                    )}
                  </div>
                )}

                {/* Próximos passos */}
                <div className="space-y-2.5 text-left mb-7">
                  {[
                    { step: "1", text: "E-mail de confirmação enviado" },
                    { step: "2", text: "Separação e embalagem do pedido" },
                    { step: "3", text: "Envio com código de rastreio" },
                  ].map((s) => (
                    <div key={s.step} className="flex items-center gap-3 text-sm text-gray-600">
                      <span className="w-5 h-5 rounded-full bg-brand-red/10 text-brand-red text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                        {s.step}
                      </span>
                      {s.text}
                    </div>
                  ))}
                </div>

                <div className="space-y-2.5">
                  <Link href="/conta" className="btn-primary w-full block py-3.5 text-center">
                    Ver meus pedidos
                  </Link>
                  <Link
                    href="/produtos"
                    className="w-full block py-3 text-sm text-gray-500 hover:text-brand-red transition-colors font-medium"
                  >
                    Continuar comprando
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Security note */}
        <div className="flex items-center justify-center gap-1.5 mt-4">
          <svg
            className="w-3.5 h-3.5 text-green-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          <p className="text-xs text-gray-400">Compra realizada com segurança via Mercado Pago</p>
        </div>
      </div>
    </div>
  );
}

export default function SucessoPage() {
  return (
    <Suspense>
      <SucessoContent />
    </Suspense>
  );
}
