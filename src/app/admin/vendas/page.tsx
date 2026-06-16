"use client";

import { useState, useEffect, useCallback } from "react";
import { Download } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import toast from "react-hot-toast";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
type Period = "today" | "7days" | "30days" | "custom";

interface Sale {
  id: string;
  product: string;
  customer: string;
  affiliate: string | null;
  coupon: string | null;
  grossAmount: number;
  netAmount: number;
  commission: number;
  utmSource: string | null;
  createdAt: string;
}

const PERIOD_LABELS: Record<Period, string> = {
  today: "Hoje", "7days": "7 dias", "30days": "30 dias", custom: "Personalizado",
};

const PAGE_SIZE = 20;

export default function VendasPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [period, setPeriod] = useState<Period>("30days");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ period, page: String(page), limit: String(PAGE_SIZE) });
      if (period === "custom" && dateFrom && dateTo) {
        params.set("startDate", dateFrom);
        params.set("endDate", dateTo);
      }
      const res = await fetch(`${BASE}/api/admin/sales?${params}`);
      if (!res.ok) throw new Error("Falha ao carregar vendas");
      const json = await res.json();
      setSales(json.sales ?? json ?? []);
      setTotal(json.total ?? 0);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao carregar vendas");
    } finally {
      setLoading(false);
    }
  }, [period, page, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  function exportCSV() {
    const params = new URLSearchParams({ period, format: "csv" });
    if (period === "custom" && dateFrom && dateTo) {
      params.set("from", dateFrom);
      params.set("to", dateTo);
    }
    window.open(`${BASE}/api/admin/reports/sales?${params}`, "_blank");
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-2xl font-bold">
          Vendas
          <span className="text-gray-500 text-base font-normal ml-2">({total})</span>
        </h1>
        <button
          type="button"
          onClick={exportCSV}
          className="flex items-center gap-2 border border-gray-700 text-gray-400 hover:text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <Download size={15} />
          Exportar CSV
        </button>
      </div>

      {/* Period filter */}
      <div className="flex flex-wrap gap-2">
        {(["today", "7days", "30days", "custom"] as Period[]).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => { setPeriod(p); setPage(1); }}
            className={cn("px-3 py-1.5 text-xs rounded-lg font-medium transition-colors",
              period === p ? "bg-brand-red text-white" : "bg-gray-900 border border-gray-800 text-gray-400 hover:text-white")}
          >
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
                  <th className="text-left px-5 py-3">Produto</th>
                  <th className="text-left px-5 py-3 hidden md:table-cell">Cliente</th>
                  <th className="text-left px-5 py-3 hidden lg:table-cell">Afiliado</th>
                  <th className="text-left px-5 py-3 hidden xl:table-cell">Cupom</th>
                  <th className="text-right px-5 py-3">Bruto</th>
                  <th className="text-right px-5 py-3 hidden sm:table-cell">Líquido</th>
                  <th className="text-right px-5 py-3 hidden lg:table-cell">Comissão</th>
                  <th className="text-left px-5 py-3 hidden xl:table-cell">UTM</th>
                  <th className="text-right px-5 py-3">Data</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((s, i) => (
                  <tr key={s.id} className={cn("hover:bg-gray-800/50 transition-colors", i !== 0 && "border-t border-gray-800/50")}>
                    <td className="px-5 py-3.5 text-gray-400 font-mono text-xs">#{s.id.slice(-8).toUpperCase()}</td>
                    <td className="px-5 py-3.5 text-white font-medium max-w-[140px] truncate">{s.product}</td>
                    <td className="px-5 py-3.5 text-gray-400 hidden md:table-cell">{s.customer}</td>
                    <td className="px-5 py-3.5 text-gray-400 hidden lg:table-cell">{s.affiliate ?? "—"}</td>
                    <td className="px-5 py-3.5 hidden xl:table-cell">
                      {s.coupon ? <span className="font-mono text-xs bg-gray-800 px-1.5 py-0.5 rounded text-gray-300">{s.coupon}</span> : <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-right text-white">{formatCurrency(s.grossAmount)}</td>
                    <td className="px-5 py-3.5 text-right text-green-400 hidden sm:table-cell">{formatCurrency(s.netAmount)}</td>
                    <td className="px-5 py-3.5 text-right text-brand-gold hidden lg:table-cell">{formatCurrency(s.commission)}</td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs hidden xl:table-cell">{s.utmSource ?? "—"}</td>
                    <td className="px-5 py-3.5 text-right text-gray-400 text-xs">{new Date(s.createdAt).toLocaleDateString("pt-BR")}</td>
                  </tr>
                ))}
                {sales.length === 0 && (
                  <tr><td colSpan={10} className="px-5 py-12 text-center text-gray-500">Nenhuma venda no período</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Página {page} de {totalPages} · {total} vendas
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-xs border border-gray-700 rounded-lg text-gray-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-xs border border-gray-700 rounded-lg text-gray-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
