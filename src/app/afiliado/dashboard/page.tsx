"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "";

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

interface Stats {
  clicks: number;
  referredClients: number;
  totalSales: number;
  conversion: number;
  avgTicket: number;
  commissionPending: number;
  commissionAvailable: number;
  commissionPaid: number;
  walletPending: number;
  walletAvailable: number;
  totalEarned: number;
}

interface AffiliateInfo {
  id: string;
  name: string;
  code: string;
  commissionRate: number;
  commissionType: string;
}

interface RecentSale {
  grossAmount: number;
  commission: number;
  date: string;
}

interface DashboardData {
  stats: Stats;
  recentSales: RecentSale[];
  affiliate: AffiliateInfo;
}

function StatCard({ label, value, sub, color = "text-gray-900" }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function AfiliadorDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      const [meRes, dashRes] = await Promise.all([
        fetch(`${BASE}/api/affiliate/auth/me`),
        fetch(`${BASE}/api/affiliate/dashboard`),
      ]);

      if (!meRes.ok) {
        router.push("/afiliado/login");
        return;
      }

      if (!dashRes.ok) {
        toast.error("Erro ao carregar dados");
        return;
      }

      const dashData = await dashRes.json();
      setData(dashData);
    } catch {
      toast.error("Erro ao carregar dashboard");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { load(); }, [load]);

  async function logout() {
    await fetch(`${BASE}/api/affiliate/auth/logout`, { method: "POST" });
    router.push("/afiliado/login");
  }

  function copyLink() {
    if (!data) return;
    const link = `${SITE}/?ref=${data.affiliate.code}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopied(false), 3000);
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const { stats, recentSales, affiliate } = data;
  const affiliateLink = `${SITE}/?ref=${affiliate.code}`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-gray-900 text-lg">Painel do Afiliado</h1>
            <p className="text-xs text-gray-500">Olá, {affiliate.name.split(" ")[0]} · Código: <span className="font-mono font-semibold text-green-700">{affiliate.code}</span></p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="text-sm text-gray-500 hover:text-gray-900 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Affiliate link */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Seu Link de Afiliado</h2>
          <div className="flex gap-3 items-center">
            <input
              readOnly
              value={affiliateLink}
              className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 bg-gray-50 font-mono truncate focus:outline-none"
            />
            <button
              type="button"
              onClick={copyLink}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors flex-shrink-0 ${copied ? "bg-green-600 text-white" : "bg-green-600 hover:bg-green-700 text-white"}`}
            >
              {copied ? "Copiado!" : "Copiar"}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Comissão: {affiliate.commissionRate}% {affiliate.commissionType === "FIXED" ? "fixo" : "por venda"}
          </p>
        </div>

        {/* Stats grid */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Resultados</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Cliques" value={stats.clicks.toLocaleString("pt-BR")} />
            <StatCard label="Clientes Cadastrados" value={stats.referredClients.toLocaleString("pt-BR")} />
            <StatCard label="Vendas Realizadas" value={stats.totalSales.toLocaleString("pt-BR")} />
            <StatCard label="Conversão" value={`${stats.conversion.toFixed(1)}%`} />
            <StatCard label="Ticket Médio" value={formatCurrency(stats.avgTicket)} />
            <StatCard label="Comissão Pendente" value={formatCurrency(stats.commissionPending)} sub="Liberação em 7 dias" color="text-amber-600" />
            <StatCard label="Comissão Aprovada" value={formatCurrency(stats.commissionAvailable)} color="text-green-600" />
            <StatCard label="Comissão Paga" value={formatCurrency(stats.commissionPaid)} color="text-blue-600" />
          </div>
        </div>

        {/* Wallet summary */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Carteira</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-amber-50 rounded-xl">
              <p className="text-xs text-amber-700 mb-1">Saldo Pendente</p>
              <p className="text-xl font-bold text-amber-700">{formatCurrency(stats.walletPending)}</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <p className="text-xs text-green-700 mb-1">Saldo Disponível</p>
              <p className="text-xl font-bold text-green-700">{formatCurrency(stats.walletAvailable)}</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-600 mb-1">Total Ganho</p>
              <p className="text-xl font-bold text-gray-800">{formatCurrency(stats.totalEarned)}</p>
            </div>
          </div>
        </div>

        {/* Recent sales */}
        {recentSales.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-700">Últimas Vendas</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 text-xs uppercase">
                    <th className="text-left px-6 py-3">Data</th>
                    <th className="text-right px-6 py-3">Valor</th>
                    <th className="text-right px-6 py-3">Comissão</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSales.map((s, i) => (
                    <tr key={i} className={`hover:bg-gray-50 ${i !== 0 ? "border-t border-gray-100" : ""}`}>
                      <td className="px-6 py-3 text-gray-600">
                        {new Date(s.date).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-6 py-3 text-right text-gray-800 font-medium">{formatCurrency(s.grossAmount)}</td>
                      <td className="px-6 py-3 text-right text-green-600 font-semibold">{formatCurrency(s.commission)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {recentSales.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <p className="text-gray-400 text-sm">Nenhuma venda registrada ainda. Compartilhe seu link para começar!</p>
          </div>
        )}

        <div className="text-center">
          <Link href="/" className="text-sm text-green-600 hover:underline">← Voltar à loja</Link>
        </div>
      </main>
    </div>
  );
}
