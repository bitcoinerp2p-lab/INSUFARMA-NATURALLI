"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatCurrency, cn } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import toast from "react-hot-toast";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export default function CarrinhoPage() {
  const router = useRouter();
  const { items, coupon, subtotal, couponDiscount, shipping, total, itemCount, removeItem, setQty, setCoupon } = useCart();
  const [couponInput, setCouponInput] = useState(coupon?.code ?? "");
  const [couponLoading, setCouponLoading] = useState(false);

  async function handleCoupon() {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    try {
      const res = await fetch(`${BASE}/api/coupons/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponInput.trim().toUpperCase(), orderTotal: subtotal }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Cupom inválido"); return; }
      const { coupon: c } = data;
      setCoupon({ code: c.code, discount: c.discountAmount, freeShipping: c.freeShipping ?? false });
      if (c.freeShipping) {
        toast.success("Cupom aplicado! Frete grátis no seu pedido.");
      } else {
        toast.success(`Cupom aplicado! Desconto de ${formatCurrency(c.discountAmount)}`);
      }
    } catch {
      toast.error("Erro ao validar cupom");
    } finally {
      setCouponLoading(false);
    }
  }

  function removeCoupon() {
    setCoupon(null);
    setCouponInput("");
    toast.success("Cupom removido");
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-5 text-center px-4">
        <span className="text-6xl">🛒</span>
        <h1 className="font-display text-2xl font-bold text-gray-900">Seu carrinho está vazio</h1>
        <p className="text-gray-500">Adicione produtos para continuar comprando.</p>
        <Link href="/produtos" className="btn-primary">Ver Produtos</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-gray-900">
            Carrinho ({itemCount} {itemCount === 1 ? "item" : "itens"})
          </h1>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const price = item.product.salePrice ?? item.product.price;
              return (
                <div key={item.product.id} className="bg-white rounded-2xl p-4 sm:p-6 flex gap-4 border border-gray-100">
                  <Link href={`/produto/${item.product.slug}`} className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-gray-50">
                    {item.product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">🌿</div>
                    )}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/produto/${item.product.slug}`}>
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base leading-snug hover:text-brand-red transition-colors line-clamp-2">
                        {item.product.name}
                      </h3>
                    </Link>
                    {item.product.brand && <p className="text-xs text-gray-400 mt-0.5">{item.product.brand}</p>}
                    <div className="flex items-center justify-between mt-3 flex-wrap gap-3">
                      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                        <button type="button" onClick={() => setQty(item.product.id, item.quantity - 1)} className="px-2.5 py-1.5 text-gray-600 hover:bg-gray-50 font-bold text-sm">−</button>
                        <span className="px-3 py-1.5 text-sm font-semibold min-w-[2.5rem] text-center">{item.quantity}</span>
                        <button type="button" onClick={() => setQty(item.product.id, item.quantity + 1)} className="px-2.5 py-1.5 text-gray-600 hover:bg-gray-50 font-bold text-sm">+</button>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{formatCurrency(price * item.quantity)}</p>
                        {item.quantity > 1 && <p className="text-xs text-gray-400">{formatCurrency(price)} cada</p>}
                      </div>
                    </div>
                  </div>
                  <button type="button" onClick={() => removeItem(item.product.id)} aria-label="Remover"
                    className="flex-shrink-0 text-gray-300 hover:text-red-500 transition-colors self-start p-1">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            })}
            <Link href="/produtos" className="inline-flex items-center gap-2 text-sm text-brand-red hover:underline">
              ← Continuar comprando
            </Link>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-24">
              <h2 className="font-semibold text-gray-900 text-lg mb-4">Resumo do Pedido</h2>

              {/* Coupon */}
              <div className="mb-4">
                {coupon ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    <span className="text-green-700 text-sm font-medium">
                      🏷️ {coupon.code} — {coupon.freeShipping ? "Frete grátis" : `-${formatCurrency(coupon.discount)}`}
                    </span>
                    <button type="button" onClick={removeCoupon} className="text-green-600 hover:text-green-800 text-xs underline">Remover</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === "Enter" && handleCoupon()}
                      placeholder="Código do cupom"
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red"
                    />
                    <button type="button" onClick={handleCoupon} disabled={couponLoading || !couponInput.trim()}
                      className={cn("px-4 py-2 bg-brand-red text-white text-sm font-medium rounded-lg transition-opacity", (couponLoading || !couponInput.trim()) && "opacity-50 cursor-not-allowed")}>
                      {couponLoading ? "…" : "Aplicar"}
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2 text-sm border-t border-gray-100 pt-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Desconto</span>
                    <span>-{formatCurrency(couponDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Frete</span>
                  <span>
                    {coupon?.freeShipping
                      ? <span className="text-green-600 font-medium">Grátis 🏷️</span>
                      : shipping === 0
                        ? <span className="text-green-600 font-medium">Grátis</span>
                        : formatCurrency(shipping)
                    }
                  </span>
                </div>
                {shipping > 0 && (
                  <p className="text-xs text-gray-400">Frete grátis acima de R$ 199,00</p>
                )}
                <div className="flex justify-between font-bold text-gray-900 text-lg border-t border-gray-100 pt-3 mt-2">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>

              <button type="button" onClick={() => router.push("/checkout")} className="btn-primary w-full mt-6 text-base py-3.5">
                Finalizar Pedido
              </button>
              <p className="text-xs text-gray-400 text-center mt-3">🔒 Compra 100% segura</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
