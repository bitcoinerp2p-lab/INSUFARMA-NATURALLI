"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatCurrency, formatCEP, cn } from "@/lib/utils";
import toast from "react-hot-toast";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

interface User { id: string; name: string; email: string; phone: string | null; cpf: string | null }
interface Address { id: string; name: string; street: string; number: string; complement: string | null; neighborhood: string; city: string; state: string; cep: string; isDefault: boolean }
interface Order { id: string; status: string; totalAmount: number; createdAt: string; items: { id: string; quantity: number; price: number; product: { name: string } }[] }

type Tab = "pedidos" | "enderecos" | "perfil";
const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pendente", color: "bg-amber-100 text-amber-700" },
  PAID: { label: "Pago", color: "bg-blue-100 text-blue-700" },
  SHIPPED: { label: "Enviado", color: "bg-purple-100 text-purple-700" },
  DELIVERED: { label: "Entregue", color: "bg-green-100 text-green-700" },
  CANCELLED: { label: "Cancelado", color: "bg-red-100 text-red-700" },
};

export default function ContaPage() {
  return (
    <Suspense>
      <ContaContent />
    </Suspense>
  );
}

function ContaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>("pedidos");
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (searchParams.get("pedido")) setTab("pedidos");
  }, [searchParams]);

  useEffect(() => {
    async function load() {
      const r = await fetch(`${BASE}/api/auth/me`);
      if (!r.ok) { router.push("/login"); return; }
      const d = await r.json();
      setUser(d.user);
      const [ordersRes, addrsRes] = await Promise.all([
        fetch(`${BASE}/api/orders`),
        fetch(`${BASE}/api/addresses`),
      ]);
      if (ordersRes.ok) setOrders((await ordersRes.json()).orders ?? []);
      if (addrsRes.ok) setAddresses((await addrsRes.json()).addresses ?? []);
      setLoading(false);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function logout() {
    await fetch(`${BASE}/api/auth/logout`, { method: "POST" });
    router.push("/");
    router.refresh();
  }

  async function deleteAddress(id: string) {
    const r = await fetch(`${BASE}/api/addresses/${id}`, { method: "DELETE" });
    if (r.ok) { setAddresses((a) => a.filter((x) => x.id !== id)); toast.success("Endereço removido"); }
    else toast.error("Erro ao remover endereço");
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-pulse text-gray-400">Carregando…</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900">Minha Conta</h1>
            <p className="text-sm text-gray-500 mt-1">{user?.email}</p>
          </div>
          <button type="button" onClick={logout} className="text-sm text-gray-500 hover:text-red-600 border border-gray-200 px-4 py-2 rounded-lg hover:border-red-200 transition-colors">
            Sair
          </button>
        </div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex gap-1 overflow-x-auto">
          {(["pedidos", "enderecos", "perfil"] as Tab[]).map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)}
              className={cn("px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors capitalize",
                tab === t ? "border-brand-red text-brand-red" : "border-transparent text-gray-500 hover:text-gray-700")}>
              {t === "pedidos" ? "Meus Pedidos" : t === "enderecos" ? "Endereços" : "Perfil"}
            </button>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-3xl">
        {/* Orders */}
        {tab === "pedidos" && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="text-center py-16">
                <span className="text-5xl block mb-4">📦</span>
                <p className="text-gray-500 mb-4">Você ainda não fez nenhum pedido.</p>
                <Link href="/produtos" className="btn-primary">Explorar produtos</Link>
              </div>
            ) : orders.map((order) => {
              const status = STATUS_MAP[order.status] ?? { label: order.status, color: "bg-gray-100 text-gray-600" };
              return (
                <div key={order.id} className="bg-white rounded-2xl border border-gray-100 p-6">
                  <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Pedido #{order.id.slice(-8).toUpperCase()}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{new Date(order.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</p>
                    </div>
                    <span className={cn("text-xs font-semibold px-3 py-1 rounded-full", status.color)}>{status.label}</span>
                  </div>
                  <div className="space-y-1 mb-3">
                    {order.items.map((item) => (
                      <p key={item.id} className="text-sm text-gray-600">{item.product.name} × {item.quantity}</p>
                    ))}
                  </div>
                  <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                    <span className="text-sm text-gray-500">Total</span>
                    <span className="font-bold text-gray-900">{formatCurrency(Number(order.totalAmount))}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Addresses */}
        {tab === "enderecos" && (
          <div className="space-y-4">
            {addresses.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-4xl block mb-3">📍</span>
                <p className="text-gray-500 mb-4">Nenhum endereço cadastrado.</p>
                <Link href="/checkout" className="btn-primary">Adicionar endereço</Link>
              </div>
            ) : addresses.map((addr) => (
              <div key={addr.id} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-start justify-between gap-4">
                <div className="text-sm">
                  <p className="font-semibold text-gray-900">{addr.name} {addr.isDefault && <span className="ml-2 text-xs bg-brand-gold/20 text-brand-gold-dark px-2 py-0.5 rounded-full">Padrão</span>}</p>
                  <p className="text-gray-600 mt-1">{addr.street}, {addr.number}{addr.complement ? `, ${addr.complement}` : ""}</p>
                  <p className="text-gray-600">{addr.neighborhood} — {addr.city}/{addr.state}</p>
                  <p className="text-gray-400">{formatCEP(addr.cep)}</p>
                </div>
                <button type="button" onClick={() => deleteAddress(addr.id)} className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0" aria-label="Remover">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
            <Link href="/checkout" className="inline-flex items-center gap-2 text-sm text-brand-red hover:underline font-medium">
              + Adicionar endereço
            </Link>
          </div>
        )}

        {/* Profile */}
        {tab === "perfil" && user && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wide text-gray-400 font-medium mb-1">Nome</label>
              <p className="text-gray-900 font-medium">{user.name}</p>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wide text-gray-400 font-medium mb-1">E-mail</label>
              <p className="text-gray-900">{user.email}</p>
            </div>
            {user.phone && (
              <div>
                <label className="block text-xs uppercase tracking-wide text-gray-400 font-medium mb-1">Telefone</label>
                <p className="text-gray-900">{user.phone}</p>
              </div>
            )}
            {user.cpf && (
              <div>
                <label className="block text-xs uppercase tracking-wide text-gray-400 font-medium mb-1">CPF</label>
                <p className="text-gray-900">{user.cpf}</p>
              </div>
            )}
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-400">Para alterar seus dados, entre em contato com nosso suporte via WhatsApp.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
