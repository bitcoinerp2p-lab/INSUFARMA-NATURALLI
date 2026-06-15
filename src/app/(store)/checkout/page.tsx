"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatCurrency, formatCEP, cn } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import toast from "react-hot-toast";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

interface Address {
  id: string; name: string; street: string; number: string;
  complement: string | null; neighborhood: string; city: string; state: string; cep: string; isDefault: boolean;
}
interface User { id: string; name: string; email: string }

const emptyAddr = { name: "", cep: "", street: "", number: "", complement: "", neighborhood: "", city: "", state: "" };

const PAYMENT_METHODS = [
  {
    value: "pix",
    label: "PIX",
    desc: "Aprovação imediata",
    detail: "Pague via QR Code ou copia e cola. Confirmação em segundos após o pagamento.",
    badge: "Mais rápido",
    badgeColor: "bg-emerald-100 text-emerald-700",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
      </svg>
    ),
  },
  {
    value: "card",
    label: "Cartão",
    desc: "Até 12x sem juros",
    detail: "Crédito ou débito. Parcelamento em até 12x sem juros. Todas as bandeiras aceitas.",
    badge: "Parcelado",
    badgeColor: "bg-blue-100 text-blue-700",
    color: "text-blue-600",
    bg: "bg-blue-50",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <rect x="2" y="5" width="20" height="14" rx="2"/>
        <path strokeLinecap="round" d="M2 10h20M6 15h4"/>
      </svg>
    ),
  },
  {
    value: "boleto",
    label: "Boleto",
    desc: "3 dias úteis",
    detail: "Boleto bancário gerado no ambiente do Mercado Pago. Vencimento em 3 dias úteis.",
    badge: null,
    badgeColor: "",
    color: "text-amber-600",
    bg: "bg-amber-50",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
      </svg>
    ),
  },
];

const inputCls =
  "w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-colors placeholder:text-gray-400";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, coupon, subtotal, couponDiscount, shipping, total, clearCart } = useCart();

  const [user, setUser] = useState<User | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddr, setSelectedAddr] = useState<string>("");
  const [showNewAddr, setShowNewAddr] = useState(false);
  const [newAddr, setNewAddr] = useState(emptyAddr);
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState("pix");

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

  const loadAddresses = useCallback(async () => {
    const r = await fetch(`${BASE}/api/addresses`);
    if (r.ok) {
      const d = await r.json();
      setAddresses(d.addresses ?? []);
      const def = (d.addresses ?? []).find((a: Address) => a.isDefault);
      if (def) setSelectedAddr(def.id);
    }
  }, []);

  async function handleCEP(cep: string) {
    const clean = cep.replace(/\D/g, "");
    if (clean.length === 8) {
      try {
        const r = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
        const d = await r.json();
        if (!d.erro) setNewAddr((a) => ({ ...a, street: d.logradouro, neighborhood: d.bairro, city: d.localidade, state: d.uf }));
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
    const affiliateCode = typeof window !== "undefined" ? (localStorage.getItem("affiliate_ref") ?? undefined) : undefined;
    try {
      const r = await fetch(`${BASE}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addressId: selectedAddr,
          couponCode: coupon?.code,
          affiliateCode,
          items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        }),
      });
      const d = await r.json();
      if (!r.ok) { toast.error(d.error ?? "Erro ao criar pedido"); return; }
      clearCart();
      if (typeof window !== "undefined") localStorage.removeItem("affiliate_ref");
      window.location.href = d.checkoutUrl;
    } catch {
      toast.error("Erro ao finalizar pedido");
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400">Carregando…</p>
      </div>
    </div>
  );

  if (items.length === 0) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 text-center px-4">
      <div className="w-20 h-20 bg-brand-red/10 rounded-full flex items-center justify-center">
        <svg className="w-9 h-9 text-brand-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
        </svg>
      </div>
      <div>
        <h1 className="text-xl font-bold text-gray-900 mb-1">Carrinho vazio</h1>
        <p className="text-sm text-gray-500">Adicione produtos para continuar</p>
      </div>
      <Link href="/produtos" className="btn-primary">Explorar produtos</Link>
    </div>
  );

  const activeMethod = PAYMENT_METHODS.find((m) => m.value === selectedPayment)!;

  return (
    <div className="min-h-screen bg-gray-50/80">

      {/* ── Checkout Header ── */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="flex flex-col leading-none">
              <span className="text-brand-red font-display font-bold text-base tracking-wide">INSUFARMA</span>
              <span className="text-brand-gold font-semibold text-[9px] tracking-[0.2em] uppercase">NATURALLI</span>
            </Link>

            {/* Step indicator */}
            <div className="flex items-center gap-2 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-brand-red text-white flex items-center justify-center text-[10px] font-bold">1</span>
                <span className="text-brand-red hidden sm:block">Entrega</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-4 h-px bg-gray-300" />
                <span className="w-4 h-px bg-gray-300" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-[10px] font-bold border border-gray-200">2</span>
                <span className="text-gray-400 hidden sm:block">Pagamento</span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs text-gray-400">
              <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
              <span className="hidden sm:block">Compra segura</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 lg:pb-8">
        {user && (
          <p className="text-sm text-gray-500 mb-5">
            Olá, <span className="font-semibold text-gray-700">{user.name.split(" ")[0]}</span>! Confirme os dados e finalize seu pedido.
          </p>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── Left column ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Address */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-red/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-brand-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                </div>
                <h2 className="font-semibold text-gray-900">Endereço de Entrega</h2>
              </div>

              <div className="p-5 space-y-3">
                {addresses.map((addr) => (
                  <label key={addr.id} className={cn(
                    "flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200",
                    selectedAddr === addr.id
                      ? "border-brand-red bg-brand-red/[0.025] shadow-sm"
                      : "border-gray-100 hover:border-gray-200 hover:bg-gray-50/60"
                  )}>
                    <input type="radio" name="address" value={addr.id} checked={selectedAddr === addr.id} onChange={() => setSelectedAddr(addr.id)} className="sr-only" />
                    <div className={cn(
                      "mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
                      selectedAddr === addr.id ? "border-brand-red bg-brand-red" : "border-gray-300 bg-white"
                    )}>
                      {selectedAddr === addr.id && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <div className="text-sm flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">{addr.name}</p>
                      <p className="text-gray-500 mt-0.5">{addr.street}, {addr.number}{addr.complement ? `, ${addr.complement}` : ""}</p>
                      <p className="text-gray-500">{addr.neighborhood} — {addr.city}/{addr.state}</p>
                      <p className="text-gray-400 text-xs mt-0.5">{formatCEP(addr.cep)}</p>
                    </div>
                    {selectedAddr === addr.id && (
                      <span className="text-[11px] font-semibold text-brand-red bg-brand-red/10 px-2 py-0.5 rounded-full flex-shrink-0 self-start">
                        Selecionado
                      </span>
                    )}
                  </label>
                ))}

                {!showNewAddr ? (
                  <button type="button" onClick={() => setShowNewAddr(true)}
                    className="flex items-center gap-1.5 text-sm text-brand-red font-medium hover:underline py-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                    </svg>
                    Adicionar novo endereço
                  </button>
                ) : (
                  <div className="border border-gray-100 rounded-xl p-5 space-y-3 bg-gray-50/60">
                    <h3 className="font-semibold text-gray-800 text-sm">Novo Endereço</h3>
                    <input type="text" value={newAddr.name} onChange={(e) => setNewAddr((a) => ({ ...a, name: e.target.value }))} placeholder="Identificação (ex: Casa, Trabalho) *" className={inputCls} />
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" value={newAddr.cep} onChange={(e) => { const v = formatCEP(e.target.value.replace(/\D/g, "").slice(0, 8)); setNewAddr((a) => ({ ...a, cep: v })); handleCEP(v); }} placeholder="CEP *" inputMode="numeric" className={inputCls} />
                      <input type="text" value={newAddr.state} onChange={(e) => setNewAddr((a) => ({ ...a, state: e.target.value.toUpperCase().slice(0, 2) }))} placeholder="UF *" maxLength={2} className={inputCls} />
                    </div>
                    <input type="text" value={newAddr.street} onChange={(e) => setNewAddr((a) => ({ ...a, street: e.target.value }))} placeholder="Rua / Avenida *" className={inputCls} />
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" value={newAddr.number} onChange={(e) => setNewAddr((a) => ({ ...a, number: e.target.value }))} placeholder="Número *" className={inputCls} />
                      <input type="text" value={newAddr.complement} onChange={(e) => setNewAddr((a) => ({ ...a, complement: e.target.value }))} placeholder="Complemento" className={inputCls} />
                    </div>
                    <input type="text" value={newAddr.neighborhood} onChange={(e) => setNewAddr((a) => ({ ...a, neighborhood: e.target.value }))} placeholder="Bairro *" className={inputCls} />
                    <input type="text" value={newAddr.city} onChange={(e) => setNewAddr((a) => ({ ...a, city: e.target.value }))} placeholder="Cidade *" className={inputCls} />
                    <div className="flex gap-2 pt-1">
                      <button type="button" onClick={saveAddress} className="btn-primary flex-1 py-3 text-sm">Salvar Endereço</button>
                      <button type="button" onClick={() => { setShowNewAddr(false); setNewAddr(emptyAddr); }} className="flex-1 py-3 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-white transition-colors">Cancelar</button>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Payment */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-red/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-brand-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                  </svg>
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">Forma de Pagamento</h2>
                  <p className="text-xs text-gray-400">Escolha sua preferência — processado pelo Mercado Pago</p>
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* 3-way selector */}
                <div className="grid grid-cols-3 gap-2.5">
                  {PAYMENT_METHODS.map((m) => {
                    const active = selectedPayment === m.value;
                    return (
                      <button key={m.value} type="button" onClick={() => setSelectedPayment(m.value)}
                        className={cn(
                          "relative flex flex-col items-center gap-2 p-3.5 rounded-xl border-2 transition-all duration-200 text-center focus:outline-none",
                          active ? "border-brand-red bg-brand-red/[0.025] shadow-sm" : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                        )}>
                        {active && (
                          <span className="absolute top-2 right-2 w-3.5 h-3.5 bg-brand-red rounded-full flex items-center justify-center">
                            <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                            </svg>
                          </span>
                        )}
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-colors", active ? "bg-brand-red/10" : m.bg)}>
                          <span className={active ? "text-brand-red" : m.color}>{m.icon}</span>
                        </div>
                        <div>
                          <p className={cn("text-xs font-bold", active ? "text-brand-red" : "text-gray-800")}>{m.label}</p>
                          <p className="text-[11px] text-gray-400 leading-tight mt-0.5">{m.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Detail card */}
                <div className="rounded-xl border border-brand-red/15 bg-brand-red/[0.015] p-4 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-red/10 flex items-center justify-center flex-shrink-0 text-brand-red">
                    {activeMethod.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 flex items-center gap-2 flex-wrap">
                      {activeMethod.label}
                      {activeMethod.badge && (
                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", activeMethod.badgeColor)}>
                          {activeMethod.badge}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{activeMethod.detail}</p>
                    <p className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1">
                      <svg className="w-3 h-3 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                      </svg>
                      A forma final é confirmada no ambiente seguro do Mercado Pago
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: (
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                  </svg>
                ), label: "Compra Segura", desc: "Dados criptografados" },
                { icon: (
                  <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                  </svg>
                ), label: "SSL Ativo", desc: "Ambiente protegido" },
                { icon: (
                  <svg className="w-5 h-5 text-brand-gold-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                  </svg>
                ), label: "MP Certificado", desc: "Pagamento oficial" },
              ].map((b) => (
                <div key={b.label} className="bg-white rounded-xl border border-gray-100 p-3 text-center shadow-sm">
                  <div className="flex justify-center mb-1.5">{b.icon}</div>
                  <p className="text-[11px] font-semibold text-gray-700">{b.label}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Order Summary ── */}
          <div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm sticky top-24">
              <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-gold/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-brand-gold-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                  </svg>
                </div>
                <h2 className="font-semibold text-gray-900">Resumo do Pedido</h2>
              </div>

              <div className="p-5">
                {/* Items list */}
                <div className="space-y-2.5 mb-4">
                  {items.map((i) => (
                    <div key={i.product.id} className="flex justify-between items-start gap-2 text-sm">
                      <span className="text-gray-600 leading-snug flex-1 min-w-0 line-clamp-2">
                        {i.product.name}
                        <span className="text-gray-400 ml-1 font-normal">×{i.quantity}</span>
                      </span>
                      <span className="text-gray-800 font-medium flex-shrink-0">
                        {formatCurrency((i.product.salePrice ?? i.product.price) * i.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Price breakdown */}
                <div className="border-t border-gray-100 pt-4 space-y-2.5 text-sm">
                  <div className="flex justify-between text-gray-500">
                    <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
                  </div>
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                        </svg>
                        Cupom aplicado
                      </span>
                      <span>-{formatCurrency(couponDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-500">
                    <span>Frete</span>
                    <span>{shipping === 0 ? <span className="text-emerald-600 font-medium">Grátis</span> : formatCurrency(shipping)}</span>
                  </div>

                  {/* Total */}
                  <div className="border-t border-gray-100 pt-3 mt-1">
                    <div className="flex justify-between items-end">
                      <span className="font-bold text-gray-900">Total</span>
                      <div className="text-right">
                        <p className="font-display font-bold text-2xl text-brand-red leading-none">{formatCurrency(total)}</p>
                        <p className="text-[11px] text-gray-400 mt-1">ou até 12x no cartão</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <button type="button" onClick={placeOrder} disabled={loading || !selectedAddr}
                  className={cn(
                    "w-full mt-5 py-4 rounded-xl font-semibold text-base transition-all duration-200 flex items-center justify-center gap-2.5",
                    loading || !selectedAddr
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-brand-red hover:bg-brand-red-light text-white shadow-md hover:shadow-lg active:scale-[0.98]"
                  )}>
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Processando…
                    </>
                  ) : (
                    <>
                      Ir para Pagamento
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                      </svg>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-1.5 mt-3">
                  <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                  </svg>
                  <p className="text-xs text-gray-400">Pagamento 100% seguro via Mercado Pago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile sticky CTA ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-2xl px-4 py-3 z-30 safe-area-inset-bottom">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400">Total do pedido</p>
            <p className="font-display font-bold text-xl text-brand-red leading-tight">{formatCurrency(total)}</p>
          </div>
          <button type="button" onClick={placeOrder} disabled={loading || !selectedAddr}
            className={cn(
              "px-6 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center gap-2 flex-shrink-0",
              loading || !selectedAddr
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-brand-red hover:bg-brand-red-light text-white shadow-lg active:scale-95"
            )}>
            {loading
              ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <>
                  Pagar agora
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                  </svg>
                </>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
