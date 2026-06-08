"use client";

import { useState, useEffect, useCallback } from "react";
import { cn, formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
type Period = "today" | "7days" | "30days" | "custom";
type StatusFilter = "all" | "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELLED";

const PERIOD_LABELS: Record<Period, string> = {
  today: "Hoje", "7days": "7 dias", "30days": "30 dias", custom: "Personalizado",
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pendente", color: "text-yellow-400 bg-yellow-900/20 border-yellow-700/40" },
  PAID: { label: "Pago", color: "text-green-400 bg-green-900/20 border-green-700/40" },
  SHIPPED: { label: "Enviado", color: "text-blue-400 bg-blue-900/20 border-blue-700/40" },
  DELIVERED: { label: "Entregue", color: "text-emerald-400 bg-emerald-900/20 border-emerald-700/40" },
  CANCELLED: { label: "Cancelado", color: "text-red-400 bg-red-900/20 border-red-700/40" },
};

interface Order {
  id: string;
  status: string;
  paymentMethod: string | null;
  totalAmount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  products: { name: string; sku: string; quantity: number }[];
  txid: string | null;
  pixCopiaCola: string | null;
  pixExpiresAt: string | null;
  pixExpired: boolean;
  couponCode: string | null;
  createdAt: string;
}

const PAGE_SIZE = 20;

export default function PedidosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [period, setPeriod] = useState<Period>("30days");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ period, page: String(page), limit: String(PAGE_SIZE) });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (period === "custom" && dateFrom && dateTo) {
        params.set("startDate", dateFrom);
        params.set("endDate", dateTo);
      }
      const res = await fetch(`${BASE}/api/admin/orders?${params}`);
      if (!res.ok) throw new Error("Falha ao carregar pedidos");
      const json = await res.json();
      setOrders(json.orders ?? []);
      setTotal(json.total ?? 0);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao carregar pedidos");
    } finally {
      setLoading(false);
    }
  }, [period, page, statusFilter, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  async function copyPix(code: string) {
    await navigator.clipboard.writeText(code).catch(() => { });
    toast.success("Pix copiado!");
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-2xl font-bold">
          Pedidos
          <span className="text-gray-500 text-base font-normal ml-2">({total})</span>
        </h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(["today", "7days", "30days", "custom"] as Period[]).map((p) => (
          <button key={p} type="button" onClick={() => { setPeriod(p); setPage(1); }}
            className={cn("px-3 py-1.5 text-xs rounded-lg font-medium transition-colors",
              period === p ? "bg-brand-red text-white" : "bg-gray-900 border border-gray-800 text-gray-400 hover:text-white")}>
            {PERIOD_LABELS[p]}
          </button>
        ))}
        {period === "custom" && (
          <div className="flex items-center gap-2">
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="bg-gray-900 border border-gray-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none" />
            <span className="text-gray-500 text-xs">até</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="bg-gray-900 border border-gray-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none" />
          </div>
        )}
        <div className="border-l border-gray-800 mx-1" />
        {(["all", "PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"] as StatusFilter[]).map((s) => (
          <button key={s} type="button" onClick={() => { setStatusFilter(s); setPage(1); }}
            className={cn("px-3 py-1.5 text-xs rounded-lg font-medium transition-colors",
              statusFilter === s ? "bg-gray-700 text-white" : "bg-gray-900 border border-gray-800 text-gray-400 hover:text-white")}>
            {s === "all" ? "Todos" : STATUS_LABELS[s]?.label ?? s}
          </button>
        ))}
      </div>

      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase">
                  <th className="text-left px-5 py-3">ID</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-left px-5 py-3 hidden md:table-cell">Cliente</th>
                  <th className="text-left px-5 py-3 hidden lg:table-cell">Produto</th>
                  <th className="text-left px-5 py-3 hidden xl:table-cell">Pagamento</th>
                  <th className="text-right px-5 py-3">Valor</th>
                  <th className="text-right px-5 py-3">Data</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o, i) => (
                  <tr key={o.id} className={cn("hover:bg-gray-800/50 transition-colors", i !== 0 && "border-t border-gray-800/50")}>
                    <td className="px-5 py-3.5 text-gray-400 font-mono text-xs">#{o.id.slice(-8).toUpperCase()}</td>
                    <td className="px-5 py-3.5">
                      <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full border", STATUS_LABELS[o.status]?.color ?? "text-gray-400 border-gray-700")}>
                        {STATUS_LABELS[o.status]?.label ?? o.status}
                      </span>
                      {o.pixExpired && o.status === "PENDING" && (
                        <span className="ml-1 text-xs text-red-500 font-medium">expirado</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <p className="text-white text-xs font-medium">{o.customerName}</p>
                      <p className="text-gray-500 text-xs">{o.customerPhone ?? o.customerEmail}</p>
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell text-gray-400 text-xs max-w-[180px] truncate">
                      {o.products.map((p) => `${p.name} ×${p.quantity}`).join(", ")}
                    </td>
                    <td className="px-5 py-3.5 hidden xl:table-cell">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-400 uppercase">{o.paymentMethod ?? "—"}</span>
                        {o.pixCopiaCola && o.status === "PENDING" && !o.pixExpired && (
                          <button type="button" onClick={() => copyPix(o.pixCopiaCola!)}
                            className="text-xs text-brand-red hover:underline">copiar</button>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right text-white font-semibold">{formatCurrency(o.totalAmount)}</td>
                    <td className="px-5 py-3.5 text-right text-gray-400 text-xs">{new Date(o.createdAt).toLocaleDateString("pt-BR")}</td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr><td colSpan={7} className="px-5 py-12 text-center text-gray-500">Nenhum pedido no período</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">Página {page} de {totalPages} · {total} pedidos</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 text-xs border border-gray-700 rounded-lg text-gray-400 hover:text-white disabled:opacity-40 transition-colors">
              Anterior
            </button>
            <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1.5 text-xs border border-gray-700 rounded-lg text-gray-400 hover:text-white disabled:opacity-40 transition-colors">
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
