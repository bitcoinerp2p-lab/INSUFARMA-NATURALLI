"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatCurrency, formatCEP, cn } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import toast from "react-hot-toast";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

interface Address {
  id: string;
  name: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;
  isDefault: boolean;
}

interface User { id: string; name: string; email: string }

const emptyAddr = { name: "", cep: "", street: "", number: "", complement: "", neighborhood: "", city: "", state: "" };

export default function CheckoutPage() {
  const router = useRouter();
  const { items, coupon, subtotal, couponDiscount, shipping, total, clearCart } = useCart();

  const [user, setUser] = useState<User | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddr, setSelectedAddr] = useState<string>("");
  const [showNewAddr, setShowNewAddr] = useState(false);
  const [newAddr, setNewAddr] = useState(emptyAddr);
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE}/api/auth/me`)
      .then((r) => r.json())
      .then((d) => {
        if (d.user) { setUser(d.user); loadAddresses(); }
        else router.push(`/login?redirect=/checkout`);
      })
      .catch(() => router.push(`/login?redirect=/checkout`))
      .finally(() => setAuthLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadAddresses() {
    const r = await fetch(`${BASE}/api/addresses`);
    if (r.ok) {
      const d = await r.json();
      setAddresses(d.addresses ?? []);
      const def = (d.addresses ?? []).find((a: Address) => a.isDefault);
      if (def) setSelectedAddr(def.id);
    }
  }

  async function handleCEP(cep: string) {
    const clean = cep.replace(/\D/g, "");
    if (clean.length === 8) {
      try {
        const r = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
        const d = await r.json();
        if (!d.erro) {
          setNewAddr((a) => ({ ...a, street: d.logradouro, neighborhood: d.bairro, city: d.localidade, state: d.uf }));
        }
      } catch { /* ignore */ }
    }
  }

  async function saveAddress() {
    if (!newAddr.name || !newAddr.cep || !newAddr.street || !newAddr.number || !newAddr.neighborhood || !newAddr.city || !newAddr.state) {
      toast.error("Preencha todos os campos obrigatórios"); return;
    }
    const r = await fetch(`${BASE}/api/addresses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newAddr, cep: newAddr.cep.replace(/\D/g, ""), isDefault: addresses.length === 0 }),
    });
    const d = await r.json();
    if (!r.ok) { toast.error(d.error ?? "Erro ao salvar endereço"); return; }
    toast.success("Endereço salvo!");
    setAddresses((prev) => [...prev, d.address]);
    setSelectedAddr(d.address.id);
    setShowNewAddr(false);
    setNewAddr(emptyAddr);
  }

  async function placeOrder() {
    if (!selectedAddr) { toast.error("Selecione um endereço de entrega"); return; }
    if (items.length === 0) { toast.error("Carrinho vazio"); return; }
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addressId: selectedAddr,
          couponCode: coupon?.code,
          paymentMethod,
          items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        }),
      });
      const d = await r.json();
      if (!r.ok) { toast.error(d.error ?? "Erro ao criar pedido"); return; }
      clearCart();
      toast.success("Pedido realizado com sucesso!");
      router.push(`/conta?pedido=${d.order.id}`);
    } catch {
      toast.error("Erro ao finalizar pedido");
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-pulse text-gray-400">Carregando…</div></div>;
  if (items.length === 0) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-4">
      <span className="text-5xl">🛒</span>
      <h1 className="text-xl font-bold">Carrinho vazio</h1>
      <Link href="/produtos" className="btn-primary">Ver produtos</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="font-display text-2xl font-bold text-gray-900">Finalizar Pedido</h1>
          {user && <p className="text-sm text-gray-500 mt-1">Olá, {user.name.split(" ")[0]}</p>}
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Addresses */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="font-semibold text-gray-900 text-lg mb-4">Endereço de Entrega</h2>
              {addresses.length > 0 && (
                <div className="space-y-3 mb-4">
                  {addresses.map((addr) => (
                    <label key={addr.id} className={cn("flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-colors", selectedAddr === addr.id ? "border-brand-red bg-brand-red/5" : "border-gray-100 hover:border-gray-200")}>
                      <input type="radio" name="address" value={addr.id} checked={selectedAddr === addr.id} onChange={() => setSelectedAddr(addr.id)} className="mt-0.5 accent-brand-red" />
                      <div className="text-sm">
                        <p className="font-semibold text-gray-900">{addr.name}</p>
                        <p className="text-gray-600">{addr.street}, {addr.number}{addr.complement ? `, ${addr.complement}` : ""}</p>
                        <p className="text-gray-600">{addr.neighborhood} — {addr.city}/{addr.state}</p>
                        <p className="text-gray-400">{formatCEP(addr.cep)}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
              {!showNewAddr ? (
                <button type="button" onClick={() => setShowNewAddr(true)} className="text-sm text-brand-red font-medium hover:underline">
                  + Adicionar novo endereço
                </button>
              ) : (
                <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                  <h3 className="font-medium text-gray-900 text-sm">Novo Endereço</h3>
                  <input type="text" value={newAddr.name} onChange={(e) => setNewAddr((a) => ({ ...a, name: e.target.value }))} placeholder="Identificação (ex: Casa, Trabalho) *" className="w-full input-field" />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" value={newAddr.cep} onChange={(e) => { const v = formatCEP(e.target.value.replace(/\D/g, "").slice(0, 8)); setNewAddr((a) => ({ ...a, cep: v })); handleCEP(v); }} placeholder="CEP *" inputMode="numeric" className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red" />
                    <input type="text" value={newAddr.state} onChange={(e) => setNewAddr((a) => ({ ...a, state: e.target.value.toUpperCase().slice(0, 2) }))} placeholder="Estado *" className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red" />
                  </div>
                  <input type="text" value={newAddr.street} onChange={(e) => setNewAddr((a) => ({ ...a, street: e.target.value }))} placeholder="Rua *" className="w-full input-field" />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" value={newAddr.number} onChange={(e) => setNewAddr((a) => ({ ...a, number: e.target.value }))} placeholder="Número *" className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red" />
                    <input type="text" value={newAddr.complement} onChange={(e) => setNewAddr((a) => ({ ...a, complement: e.target.value }))} placeholder="Complemento" className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red" />
                  </div>
                  <input type="text" value={newAddr.neighborhood} onChange={(e) => setNewAddr((a) => ({ ...a, neighborhood: e.target.value }))} placeholder="Bairro *" className="w-full input-field" />
                  <input type="text" value={newAddr.city} onChange={(e) => setNewAddr((a) => ({ ...a, city: e.target.value }))} placeholder="Cidade *" className="w-full input-field" />
                  <div className="flex gap-2">
                    <button type="button" onClick={saveAddress} className="btn-primary flex-1 py-2.5 text-sm">Salvar Endereço</button>
                    <button type="button" onClick={() => { setShowNewAddr(false); setNewAddr(emptyAddr); }} className="flex-1 py-2.5 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">Cancelar</button>
                  </div>
                </div>
              )}
            </div>

            {/* Payment */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="font-semibold text-gray-900 text-lg mb-4">Forma de Pagamento</h2>
              <div className="space-y-2">
                {[{ value: "pix", label: "PIX", desc: "Pagamento instantâneo" }, { value: "boleto", label: "Boleto Bancário", desc: "Vencimento em 3 dias úteis" }, { value: "cartao", label: "Cartão de Crédito", desc: "Parcelamento em até 10x" }].map((opt) => (
                  <label key={opt.value} className={cn("flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-colors", paymentMethod === opt.value ? "border-brand-red bg-brand-red/5" : "border-gray-100 hover:border-gray-200")}>
                    <input type="radio" name="payment" value={opt.value} checked={paymentMethod === opt.value} onChange={() => setPaymentMethod(opt.value)} className="accent-brand-red" />
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{opt.label}</p>
                      <p className="text-gray-500 text-xs">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div>
            <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-24">
              <h2 className="font-semibold text-gray-900 text-lg mb-4">Resumo</h2>
              <div className="space-y-2 mb-4">
                {items.map((i) => (
                  <div key={i.product.id} className="flex justify-between text-sm text-gray-600">
                    <span className="truncate max-w-[180px]">{i.product.name} ×{i.quantity}</span>
                    <span className="flex-shrink-0 ml-2">{formatCurrency((i.product.salePrice ?? i.product.price) * i.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2 text-sm border-t border-gray-100 pt-4">
                <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                {couponDiscount > 0 && <div className="flex justify-between text-green-600"><span>Desconto</span><span>-{formatCurrency(couponDiscount)}</span></div>}
                <div className="flex justify-between text-gray-600"><span>Frete</span><span>{shipping === 0 ? <span className="text-green-600">Grátis</span> : formatCurrency(shipping)}</span></div>
                <div className="flex justify-between font-bold text-gray-900 text-lg border-t border-gray-100 pt-3 mt-2"><span>Total</span><span>{formatCurrency(total)}</span></div>
              </div>
              <button type="button" onClick={placeOrder} disabled={loading || !selectedAddr}
                className={cn("btn-primary w-full mt-6 py-3.5 text-base", (loading || !selectedAddr) && "opacity-60 cursor-not-allowed")}>
                {loading ? "Processando…" : "Confirmar Pedido"}
              </button>
              <p className="text-xs text-gray-400 text-center mt-3">🔒 Pagamento 100% seguro</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
