"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { TrendingUp, TrendingDown, Clock, AlertCircle, Percent, Ticket } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import toast from "react-hot-toast";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
type Period = "30days" | "90days" | "year" | "custom";

interface FinancialData {
  grossRevenue: number;
  supplierCost: number;
  netRevenue: number;
  paidCommissions: number;
  pendingCommissions: number;
  margin: number;
  avgTicket: number;
  revenueToday: number;
  revenueWeek: number;
  revenueMonth: number;
  pixPendingCount: number;
  pixExpiredCount: number;
  pixConversionRate: number;
  monthlyData: { month: string; revenue: number; cost: number }[];
}

interface Withdrawal {
  id: string;
  affiliateName: string;
  amount: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestedAt: string;
}

const PERIOD_LABELS: Record<Period, string> = {
  "30days": "30 dias", "90days": "90 dias", year: "Este ano", custom: "Personalizado",
};

export default function FinanceiroPage() {
  const [period, setPeriod] = useState<Period>("30days");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [financial, setFinancial] = useState<FinancialData | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ period });
      if (period === "custom" && dateFrom && dateTo) {
        params.set("startDate", dateFrom);
        params.set("endDate", dateTo);
      }
      const [fRes, wRes] = await Promise.all([
        fetch(`${BASE}/api/admin/financial?${params}`),
        fetch(`${BASE}/api/admin/withdrawals?status=PENDING`),
      ]);
      if (fRes.ok) setFinancial(await fRes.json());
      if (wRes.ok) {
        const wd = await wRes.json();
        setWithdrawals(wd.withdrawals ?? wd ?? []);
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao carregar dados financeiros");
    } finally {
      setLoading(false);
    }
  }, [period, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  async function handleWithdrawal(id: string, action: "approve" | "reject") {
    try {
      const res = await fetch(`${BASE}/api/admin/withdrawals/${id}/${action}`, { method: "POST" });
      if (!res.ok) throw new Error(`Falha ao ${action === "approve" ? "aprovar" : "rejeitar"} saque`);
      setWithdrawals((prev) => prev.filter((w) => w.id !== id));
      toast.success(action === "approve" ? "Saque aprovado!" : "Saque rejeitado");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  }

  const kpiCards = financial ? [
    { label: "Receita Bruta", value: formatCurrency(financial.grossRevenue), color: "text-blue-400", icon: TrendingUp },
    { label: "Custo Fornecedor", value: formatCurrency(financial.supplierCost), color: "text-red-400", icon: TrendingDown },
    { label: "Receita Líquida", value: formatCurrency(financial.netRevenue), color: "text-green-400", icon: TrendingUp },
    { label: "Comissões Pagas", value: formatCurrency(financial.paidCommissions), color: "text-amber-400", icon: TrendingDown },
    { label: "Comissões Pendentes", value: formatCurrency(financial.pendingCommissions), color: "text-orange-400", icon: TrendingDown },
    { label: "Margem", value: `${financial.margin.toFixed(1)}%`, color: "text-emerald-400", icon: TrendingUp },
  ] : [];

  const windowCards = financial ? [
    { label: "Hoje", value: formatCurrency(financial.revenueToday), color: "text-blue-300" },
    { label: "Últimos 7 dias", value: formatCurrency(financial.revenueWeek), color: "text-indigo-300" },
    { label: "Mês atual", value: formatCurrency(financial.revenueMonth), color: "text-violet-300" },
    { label: "Ticket médio", value: formatCurrency(financial.avgTicket), color: "text-pink-300" },
  ] : [];

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-2xl font-bold">Financeiro</h1>
        <div className="flex flex-wrap gap-2">
          {(["30days", "90days", "year", "custom"] as Period[]).map((p) => (
            <button key={p} type="button" onClick={() => setPeriod(p)}
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
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="bg-gray-900 rounded-2xl border border-gray-800 p-5 animate-pulse h-24" />
          ))}
        </div>
      ) : (
        <>
          {/* Revenue windows */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {windowCards.map(({ label, value, color }) => (
              <div key={label} className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
                <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">{label}</p>
                <p className={cn("font-bold text-xl", color)}>{value}</p>
              </div>
            ))}
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {kpiCards.map(({ label, value, color, icon: Icon }) => (
              <div key={label} className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-gray-400 text-xs uppercase tracking-wide">{label}</p>
                  <Icon size={16} className={color} />
                </div>
                <p className={cn("font-bold text-2xl", color)}>{value}</p>
              </div>
            ))}
          </div>

          {/* Pix Dashboard */}
          <div>
            <h2 className="text-sm font-semibold text-gray-300 mb-3">Dashboard Pix (EFI Bank)</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-gray-400 text-xs uppercase tracking-wide">Cobranças Pendentes</p>
                  <Clock size={16} className="text-yellow-400" />
                </div>
                <p className="font-bold text-2xl text-yellow-400">{financial?.pixPendingCount ?? 0}</p>
                <p className="text-gray-500 text-xs mt-1">aguardando pagamento</p>
              </div>
              <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-gray-400 text-xs uppercase tracking-wide">Cobranças Expiradas</p>
                  <AlertCircle size={16} className="text-red-400" />
                </div>
                <p className="font-bold text-2xl text-red-400">{financial?.pixExpiredCount ?? 0}</p>
                <p className="text-gray-500 text-xs mt-1">não pagas no prazo</p>
              </div>
              <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-gray-400 text-xs uppercase tracking-wide">Conversão Pix</p>
                  <Percent size={16} className="text-emerald-400" />
                </div>
                <p className="font-bold text-2xl text-emerald-400">{(financial?.pixConversionRate ?? 0).toFixed(1)}%</p>
                <p className="text-gray-500 text-xs mt-1">cobranças pagas</p>
              </div>
            </div>
          </div>

          {/* Monthly chart */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
            <h2 className="text-sm font-semibold text-gray-300 mb-4">Receita vs Custos Mensais</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={financial?.monthlyData ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 11 }} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} tickFormatter={(v) => `R$${v}`} />
                <Tooltip
                  contentStyle={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 8 }}
                  formatter={(v: number) => [formatCurrency(v)]}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: "#9ca3af" }} />
                <Bar dataKey="revenue" name="Receita" fill="#8B0000" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cost" name="Custo" fill="#C9A84C" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pending withdrawals */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-800 flex items-center gap-2">
              <Ticket size={15} className="text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-300">Saques Pendentes</h2>
            </div>
            {withdrawals.length === 0 ? (
              <p className="px-5 py-10 text-center text-gray-500">Nenhum saque pendente</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase">
                      <th className="text-left px-5 py-3">Afiliado</th>
                      <th className="text-right px-5 py-3">Valor</th>
                      <th className="text-right px-5 py-3">Solicitado em</th>
                      <th className="px-5 py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawals.map((w, i) => (
                      <tr key={w.id} className={cn("hover:bg-gray-800/50", i !== 0 && "border-t border-gray-800/50")}>
                        <td className="px-5 py-3.5 text-white font-medium">{w.affiliateName}</td>
                        <td className="px-5 py-3.5 text-right text-white font-semibold">{formatCurrency(w.amount)}</td>
                        <td className="px-5 py-3.5 text-right text-gray-400 text-xs">{new Date(w.requestedAt).toLocaleDateString("pt-BR")}</td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button type="button" onClick={() => handleWithdrawal(w.id, "approve")}
                              className="text-xs text-green-400 border border-green-700/50 px-2.5 py-1 rounded-lg hover:bg-green-900/20 transition-colors">
                              Aprovar
                            </button>
                            <button type="button" onClick={() => handleWithdrawal(w.id, "reject")}
                              className="text-xs text-red-400 border border-red-700/50 px-2.5 py-1 rounded-lg hover:bg-red-900/20 transition-colors">
                              Rejeitar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
