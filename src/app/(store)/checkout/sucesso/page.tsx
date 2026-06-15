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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center max-w-sm w-full shadow-sm">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Pagamento Aprovado!</h2>
        <p className="text-gray-500 text-sm mb-6">
          Seu pedido foi confirmado. Entraremos em contato em breve com as informações de envio.
        </p>
        {orderId && (
          <p className="text-xs text-gray-400 mb-6 font-mono">
            Pedido #{orderId.slice(-8).toUpperCase()}
          </p>
        )}
        <Link href="/conta" className="btn-primary block">
          Ver meus pedidos
        </Link>
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
