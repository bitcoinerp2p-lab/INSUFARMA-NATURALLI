"use client";

import { useState, useEffect, useCallback } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { TrendingUp, Users, ShoppingCart, PercentIcon } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import toast from "react-hot-toast";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
type Period = "today" | "yesterday" | "7days" | "30days" | "custom";

interface DashData {
  revenueToday: number;
  revenueWeek: number;
  revenueMonth: number;
  revenueTotal: number;
  avgTicket: number;
  totalAffiliates: number;
  totalSales: number;
  conversionRate: number;
  topProducts: { productId: string; name: string; quantity: number; revenue: number }[];
  salesByDay: { date: string; count: number; revenue: number }[];
  salesByAffiliate: { affiliateId: string; name: string; revenue: number }[];
  revenueByMonth: { month: string; revenue: number }[];
  trafficByOrigin: { origin: string; count: number }[];
}

const PIE_COLORS = ["#8B0000", "#C9A84C", "#3b82f6", "#10b981", "#f59e0b"];
const PERIOD_LABELS: Record<Period, string> = {
  today: "Hoje",
  yesterday: "Ontem",
  "7days": "7 dias",
  "30days": "30 dias",
  custom: "Personalizado",
};

function KpiCard({ label, value, color, icon: Icon }: { label: string; value: string; color: string; icon: React.ElementType }) {
  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-gray-400 text-xs uppercase tracking-wide">{label}</p>
        <Icon size={16} className={color} />
      </div>
      <p className={cn("font-bold text-2xl", color)}>{value}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const [period, setPeriod] = useState<Period>("7days");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ period });
      if (period === "custom" && dateFrom && dateTo) {
        params.set("startDate", dateFrom);
        params.set("endDate", dateTo);
      }
      const res = await fetch(`${BASE}/api/admin/dashboard?${params}`);
      if (!res.ok) throw new Error("Falha ao carregar dashboard");
      setData(await res.json());
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao carregar dashboard");
    } finally {
      setLoading(false);
    }
  }, [period, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-2 flex-wrap">
          {(["today", "yesterday", "7days", "30days", "custom"] as Period[]).map((p) => (
            <button key={p} type="button" onClick={() => setPeriod(p)}
              className={cn("px-3 py-1.5 text-xs rounded-lg font-medium transition-colors",
                period === p ? "bg-brand-red text-white" : "bg-gray-800 text-gray-400 hover:text-white")}>
              {PERIOD_LABELS[p]}
            </button>
          ))}
          {period === "custom" && (
            <div className="flex items-center gap-2">
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-xs text-white" />
              <span className="text-gray-500 text-xs">até</span>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-xs text-white" />
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-gray-900 rounded-2xl border border-gray-800 p-5 animate-pulse h-24" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Faturamento Hoje" value={formatCurrency(data?.revenueToday ?? 0)} color="text-green-400" icon={TrendingUp} />
            <KpiCard label="Faturamento Semanal" value={formatCurrency(data?.revenueWeek ?? 0)} color="text-blue-400" icon={TrendingUp} />
            <KpiCard label="Faturamento Mensal" value={formatCurrency(data?.revenueMonth ?? 0)} color="text-purple-400" icon={TrendingUp} />
            <KpiCard label="Faturamento Total" value={formatCurrency(data?.revenueTotal ?? 0)} color="text-brand-gold" icon={TrendingUp} />
            <KpiCard label="Ticket Médio" value={formatCurrency(data?.avgTicket ?? 0)} color="text-amber-400" icon={ShoppingCart} />
            <KpiCard label="Afiliados Ativos" value={String(data?.totalAffiliates ?? 0)} color="text-cyan-400" icon={Users} />
            <KpiCard label="Total Vendas" value={String(data?.totalSales ?? 0)} color="text-indigo-400" icon={ShoppingCart} />
            <KpiCard label="Conversão" value={`${(data?.conversionRate ?? 0).toFixed(1)}%`} color="text-pink-400" icon={PercentIcon} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
              <h2 className="text-sm font-semibold text-gray-300 mb-4">Vendas por Dia</h2>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data?.salesByDay ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} tickFormatter={(v) => `R$${v}`} />
                  <Tooltip contentStyle={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 8 }}
                    formatter={(v: number) => [formatCurrency(v), "Receita"]} />
                  <Line type="monotone" dataKey="revenue" stroke="#8B0000" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
              <h2 className="text-sm font-semibold text-gray-300 mb-4">Top Produtos</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data?.topProducts ?? []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis type="number" tick={{ fill: "#6b7280", fontSize: 11 }} tickFormatter={(v) => `R$${v}`} />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fill: "#6b7280", fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 8 }}
                    formatter={(v: number) => [formatCurrency(v), "Receita"]} />
                  <Bar dataKey="revenue" fill="#8B0000" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
              <h2 className="text-sm font-semibold text-gray-300 mb-4">Top Afiliados</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data?.salesByAffiliate ?? []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis type="number" tick={{ fill: "#6b7280", fontSize: 11 }} tickFormatter={(v) => `R$${v}`} />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fill: "#6b7280", fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 8 }}
                    formatter={(v: number) => [formatCurrency(v), "Receita"]} />
                  <Bar dataKey="revenue" fill="#C9A84C" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
              <h2 className="text-sm font-semibold text-gray-300 mb-4">Origem do Tráfego</h2>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={(data?.trafficByOrigin ?? []).map((t) => ({ name: t.origin, value: t.count }))}
                    dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {(data?.trafficByOrigin ?? []).map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 12, color: "#9ca3af" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
            <h2 className="text-sm font-semibold text-gray-300 mb-4">Receita Mensal</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data?.revenueByMonth ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 11 }} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} tickFormatter={(v) => `R$${v}`} />
                <Tooltip contentStyle={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 8 }}
                  formatter={(v: number) => [formatCurrency(v), "Receita"]} />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
