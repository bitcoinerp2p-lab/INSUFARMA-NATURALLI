"use client";

import { useState, useEffect, useCallback } from "react";
import { Download } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import toast from "react-hot-toast";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
type ReportTab = "vendas" | "financeiro" | "afiliados";
type Period = "7days" | "30days" | "90days" | "custom";

const PERIOD_LABELS: Record<Period, string> = {
  "7days": "7 dias", "30days": "30 dias", "90days": "90 dias", custom: "Personalizado",
};

interface SalesRow { date: string; count: number; revenue: number; avg: number }
interface FinancialRow { month: string; gross: number; cost: number; net: number; commissions: number; margin: number }
interface AffiliateRow { name: string; code: string; sales: number; revenue: number; commission: number }

export default function RelatoriosPage() {
  const [tab, setTab] = useState<ReportTab>("vendas");
  const [period, setPeriod] = useState<Period>("30days");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [salesData, setSalesData] = useState<SalesRow[]>([]);
  const [financialData, setFinancialData] = useState<FinancialRow[]>([]);
  const [affiliatesData, setAffiliatesData] = useState<AffiliateRow[]>([]);
  const [loading, setLoading] = useState(false);

  const buildParams = useCallback(() => {
    const p = new URLSearchParams({ period });
    if (period === "custom" && dateFrom && dateTo) {
      p.set("from", dateFrom);
      p.set("to", dateTo);
    }
    return p;
  }, [period, dateFrom, dateTo]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = buildParams();
      if (tab === "vendas") {
        const res = await fetch(`${BASE}/api/admin/reports/sales?${params}`);
        if (res.ok) { const d = await res.json(); setSalesData(d.rows ?? []); }
      } else if (tab === "financeiro") {
        const res = await fetch(`${BASE}/api/admin/reports/financial?${params}`);
        if (res.ok) { const d = await res.json(); setFinancialData(d.rows ?? []); }
      } else {
        const res = await fetch(`${BASE}/api/admin/reports/affiliates?${params}`);
        if (res.ok) { const d = await res.json(); setAffiliatesData(d.rows ?? []); }
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao carregar relatório");
    } finally {
      setLoading(false);
    }
  }, [tab, buildParams]);

  useEffect(() => { load(); }, [load]);

  function exportCSV() {
    const params = buildParams();
    params.set("format", "csv");
    const endpoint = tab === "vendas" ? "sales" : tab === "financeiro" ? "financial" : "affiliates";
    window.open(`${BASE}/api/admin/reports/${endpoint}?${params}`, "_blank");
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-2xl font-bold">Relatórios</h1>
        <button
          type="button"
          onClick={exportCSV}
          className="flex items-center gap-2 border border-gray-700 text-gray-400 hover:text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <Download size={15} />
          Exportar CSV
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800 gap-1">
        {(["vendas", "financeiro", "afiliados"] as ReportTab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "px-5 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px",
              tab === t ? "text-white border-brand-red" : "text-gray-500 border-transparent hover:text-white"
            )}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Period filter */}
      <div className="flex flex-wrap gap-2">
        {(["7days", "30days", "90days", "custom"] as Period[]).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
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
            {/* Sales table */}
            {tab === "vendas" && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase">
                    <th className="text-left px-5 py-3">Data</th>
                    <th className="text-right px-5 py-3">Vendas</th>
                    <th className="text-right px-5 py-3">Receita</th>
                    <th className="text-right px-5 py-3">Ticket Médio</th>
                  </tr>
                </thead>
                <tbody>
                  {salesData.map((r, i) => (
                    <tr key={i} className={cn("hover:bg-gray-800/50", i !== 0 && "border-t border-gray-800/50")}>
                      <td className="px-5 py-3.5 text-white">{r.date}</td>
                      <td className="px-5 py-3.5 text-right text-gray-300">{r.count}</td>
                      <td className="px-5 py-3.5 text-right text-green-400">{formatCurrency(r.revenue)}</td>
                      <td className="px-5 py-3.5 text-right text-gray-300">{formatCurrency(r.avg)}</td>
                    </tr>
                  ))}
                  {salesData.length === 0 && (
                    <tr><td colSpan={4} className="px-5 py-10 text-center text-gray-500">Sem dados no período</td></tr>
                  )}
                </tbody>
              </table>
            )}

            {/* Financial table */}
            {tab === "financeiro" && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase">
                    <th className="text-left px-5 py-3">Mês</th>
                    <th className="text-right px-5 py-3">Bruto</th>
                    <th className="text-right px-5 py-3">Custo</th>
                    <th className="text-right px-5 py-3">Líquido</th>
                    <th className="text-right px-5 py-3">Comissões</th>
                    <th className="text-right px-5 py-3">Margem</th>
                  </tr>
                </thead>
                <tbody>
                  {financialData.map((r, i) => (
                    <tr key={i} className={cn("hover:bg-gray-800/50", i !== 0 && "border-t border-gray-800/50")}>
                      <td className="px-5 py-3.5 text-white">{r.month}</td>
                      <td className="px-5 py-3.5 text-right text-blue-400">{formatCurrency(r.gross)}</td>
                      <td className="px-5 py-3.5 text-right text-red-400">{formatCurrency(r.cost)}</td>
                      <td className="px-5 py-3.5 text-right text-green-400">{formatCurrency(r.net)}</td>
                      <td className="px-5 py-3.5 text-right text-amber-400">{formatCurrency(r.commissions)}</td>
                      <td className="px-5 py-3.5 text-right text-gray-300">{r.margin.toFixed(1)}%</td>
                    </tr>
                  ))}
                  {financialData.length === 0 && (
                    <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-500">Sem dados no período</td></tr>
                  )}
                </tbody>
              </table>
            )}

            {/* Affiliates table */}
            {tab === "afiliados" && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase">
                    <th className="text-left px-5 py-3">Afiliado</th>
                    <th className="text-left px-5 py-3">Código</th>
                    <th className="text-right px-5 py-3">Vendas</th>
                    <th className="text-right px-5 py-3">Receita</th>
                    <th className="text-right px-5 py-3">Comissão</th>
                  </tr>
                </thead>
                <tbody>
                  {affiliatesData.map((r, i) => (
                    <tr key={i} className={cn("hover:bg-gray-800/50", i !== 0 && "border-t border-gray-800/50")}>
                      <td className="px-5 py-3.5 text-white font-medium">{r.name}</td>
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs bg-gray-800 px-2 py-0.5 rounded text-gray-300">{r.code}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right text-gray-300">{r.sales}</td>
                      <td className="px-5 py-3.5 text-right text-green-400">{formatCurrency(r.revenue)}</td>
                      <td className="px-5 py-3.5 text-right text-brand-gold">{formatCurrency(r.commission)}</td>
                    </tr>
                  ))}
                  {affiliatesData.length === 0 && (
                    <tr><td colSpan={5} className="px-5 py-10 text-center text-gray-500">Sem dados no período</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
