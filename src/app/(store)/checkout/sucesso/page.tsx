"use client";

import { useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/context/CartContext";

function SucessoContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("pedido");
  const { clearCart } = useCart();

  useEffect(() => {
    clearCart();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            {/* Check icon */}
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
              </svg>
            </div>

            <h1 className="font-display text-2xl font-bold text-gray-900 mb-2">Pedido Confirmado!</h1>
            <p className="text-gray-500 text-sm leading-relaxed mb-5">
              Recebemos seu pedido com sucesso. Você receberá um e-mail de confirmação com os detalhes de envio.
            </p>

            {orderId && (
              <div className="bg-gray-50 rounded-xl px-4 py-3 mb-6 border border-gray-100">
                <p className="text-xs text-gray-400 mb-0.5">Número do pedido</p>
                <p className="font-mono font-semibold text-gray-800 text-sm tracking-wider">
                  #{orderId.slice(-8).toUpperCase()}
                </p>
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
              <Link href="/produtos"
                className="w-full block py-3 text-sm text-gray-500 hover:text-brand-red transition-colors font-medium">
                Continuar comprando
              </Link>
            </div>
          </div>
        </div>

        {/* Security note */}
        <div className="flex items-center justify-center gap-1.5 mt-4">
          <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
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
