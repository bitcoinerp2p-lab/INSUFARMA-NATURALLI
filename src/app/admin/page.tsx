"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatCurrency, cn } from "@/lib/utils";
import toast from "react-hot-toast";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

interface Stats { totalProducts: number; totalOrders: number; totalRevenue: number; totalCustomers: number }
interface Product { id: string; name: string; slug: string; price: number; salePrice: number | null; stock: number; active: boolean; category: { name: string } }
interface Order { id: string; status: string; totalAmount: number; createdAt: string; user: { name: string; email: string } }

type Tab = "dashboard" | "produtos" | "pedidos";
const STATUS_COLOR: Record<string, string> = {
  PENDING: "bg-amber-900/30 text-amber-400",
  PAID: "bg-blue-900/30 text-blue-400",
  SHIPPED: "bg-purple-900/30 text-purple-400",
  DELIVERED: "bg-green-900/30 text-green-400",
  CANCELLED: "bg-red-900/30 text-red-400",
};
const STATUS_LABEL: Record<string, string> = { PENDING: "Pendente", PAID: "Pago", SHIPPED: "Enviado", DELIVERED: "Entregue", CANCELLED: "Cancelado" };

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [stats, setStats] = useState<Stats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const meRes = await fetch(`${BASE}/api/auth/me`);
      const meData = await meRes.json();
      if (!meRes.ok || meData.user?.role !== "ADMIN") { router.push("/admin/login"); return; }

      const [ordersRes, productsRes, usersRes] = await Promise.all([
        fetch(`${BASE}/api/orders`),
        fetch(`${BASE}/api/products/admin`),
        fetch(`${BASE}/api/auth/me`),
      ]);

      if (productsRes.ok) {
        const pd = await productsRes.json();
        setProducts(pd.products ?? []);
        const allOrders: Order[] = [];
        if (ordersRes.ok) {
          const od = await ordersRes.json();
          allOrders.push(...(od.orders ?? []));
          setOrders(allOrders);
        }
        const revenue = allOrders.filter((o) => o.status !== "CANCELLED").reduce((s, o) => s + Number(o.totalAmount), 0);
        setStats({ totalProducts: pd.total ?? pd.products?.length ?? 0, totalOrders: allOrders.length, totalRevenue: revenue, totalCustomers: 0 });
      }
      setLoading(false);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function logout() {
    await fetch(`${BASE}/api/auth/logout`, { method: "POST" });
    router.push("/admin/login");
  }

  async function toggleProduct(slug: string, active: boolean) {
    const r = await fetch(`${BASE}/api/products/${slug}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active }) });
    if (r.ok) {
      setProducts((prev) => prev.map((p) => p.slug === slug ? { ...p, active } : p));
      toast.success(active ? "Produto ativado" : "Produto desativado");
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="animate-pulse text-gray-500">Carregando…</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Topbar */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-display font-bold text-lg">
            <span className="text-brand-red">Insufarma</span>
            <span className="text-brand-gold"> Naturalli</span>
          </Link>
          <nav className="hidden sm:flex gap-1">
            {(["dashboard", "produtos", "pedidos"] as Tab[]).map((t) => (
              <button key={t} type="button" onClick={() => setTab(t)}
                className={cn("px-4 py-2 text-sm rounded-lg font-medium capitalize transition-colors",
                  tab === t ? "bg-gray-700 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800")}>
                {t === "dashboard" ? "Dashboard" : t === "produtos" ? "Produtos" : "Pedidos"}
              </button>
            ))}
          </nav>
        </div>
        <button type="button" onClick={logout} className="text-sm text-gray-400 hover:text-white border border-gray-700 px-3 py-1.5 rounded-lg transition-colors">Sair</button>
      </header>

      {/* Mobile tabs */}
      <div className="sm:hidden flex border-b border-gray-800 overflow-x-auto">
        {(["dashboard", "produtos", "pedidos"] as Tab[]).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={cn("flex-1 py-3 text-sm font-medium capitalize whitespace-nowrap", tab === t ? "text-white border-b-2 border-brand-red" : "text-gray-500")}>
            {t === "dashboard" ? "Dashboard" : t === "produtos" ? "Produtos" : "Pedidos"}
          </button>
        ))}
      </div>

      <main className="p-6 max-w-6xl mx-auto">
        {/* Dashboard */}
        {tab === "dashboard" && stats && (
          <div>
            <h1 className="font-display text-2xl font-bold mb-6">Dashboard</h1>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Total de Pedidos", value: String(stats.totalOrders), color: "text-blue-400" },
                { label: "Receita Total", value: formatCurrency(stats.totalRevenue), color: "text-green-400" },
                { label: "Produtos", value: String(stats.totalProducts), color: "text-purple-400" },
                { label: "Pedidos Ativos", value: String(orders.filter((o) => !["DELIVERED", "CANCELLED"].includes(o.status)).length), color: "text-amber-400" },
              ].map((stat) => (
                <div key={stat.label} className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
                  <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">{stat.label}</p>
                  <p className={cn("font-bold text-2xl", stat.color)}>{stat.value}</p>
                </div>
              ))}
            </div>

            <h2 className="font-semibold text-gray-300 mb-3">Últimos Pedidos</h2>
            <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
              {orders.slice(0, 8).map((order, i) => (
                <div key={order.id} className={cn("flex items-center justify-between px-5 py-3.5 text-sm", i !== 0 && "border-t border-gray-800")}>
                  <div>
                    <p className="text-white font-medium">#{order.id.slice(-8).toUpperCase()}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{new Date(order.createdAt).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full", STATUS_COLOR[order.status] ?? "bg-gray-800 text-gray-400")}>
                      {STATUS_LABEL[order.status] ?? order.status}
                    </span>
                    <span className="text-white font-semibold">{formatCurrency(Number(order.totalAmount))}</span>
                  </div>
                </div>
              ))}
              {orders.length === 0 && <p className="text-gray-500 text-sm p-5">Nenhum pedido ainda.</p>}
            </div>
          </div>
        )}

        {/* Products */}
        {tab === "produtos" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="font-display text-2xl font-bold">Produtos ({products.length})</h1>
            </div>
            <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase">
                      <th className="text-left px-5 py-3">Produto</th>
                      <th className="text-left px-5 py-3 hidden sm:table-cell">Categoria</th>
                      <th className="text-right px-5 py-3">Preço</th>
                      <th className="text-right px-5 py-3 hidden md:table-cell">Estoque</th>
                      <th className="text-center px-5 py-3">Status</th>
                      <th className="px-5 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p, i) => (
                      <tr key={p.id} className={cn("transition-colors hover:bg-gray-800/50", i !== 0 && "border-t border-gray-800/50")}>
                        <td className="px-5 py-3.5">
                          <p className="font-medium text-white line-clamp-1">{p.name}</p>
                        </td>
                        <td className="px-5 py-3.5 text-gray-400 hidden sm:table-cell">{p.category.name}</td>
                        <td className="px-5 py-3.5 text-right text-white">{formatCurrency(p.salePrice ?? p.price)}</td>
                        <td className="px-5 py-3.5 text-right hidden md:table-cell">
                          <span className={cn("font-medium", p.stock <= 5 ? "text-red-400" : "text-gray-300")}>{p.stock}</span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", p.active ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400")}>
                            {p.active ? "Ativo" : "Inativo"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <button type="button" onClick={() => toggleProduct(p.slug, !p.active)}
                            className="text-xs text-gray-400 hover:text-white border border-gray-700 px-2.5 py-1 rounded-lg transition-colors">
                            {p.active ? "Desativar" : "Ativar"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {products.length === 0 && <p className="text-gray-500 text-sm p-5">Nenhum produto cadastrado.</p>}
              </div>
            </div>
          </div>
        )}

        {/* Orders */}
        {tab === "pedidos" && (
          <div>
            <h1 className="font-display text-2xl font-bold mb-6">Pedidos ({orders.length})</h1>
            <div className="space-y-3">
              {orders.length === 0 ? (
                <div className="text-center py-16 text-gray-500">Nenhum pedido ainda.</div>
              ) : orders.map((order) => (
                <div key={order.id} className="bg-gray-900 rounded-2xl border border-gray-800 p-5 flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="font-semibold text-white">#{order.id.slice(-8).toUpperCase()}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(order.createdAt).toLocaleDateString("pt-BR")} · {new Date(order.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full", STATUS_COLOR[order.status] ?? "bg-gray-800 text-gray-400")}>
                      {STATUS_LABEL[order.status] ?? order.status}
                    </span>
                    <span className="text-white font-bold">{formatCurrency(Number(order.totalAmount))}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
