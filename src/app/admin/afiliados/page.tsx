"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Plus, Search, Pencil } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import toast from "react-hot-toast";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

type AffiliateStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "BLOCKED";

interface Affiliate {
  id: string;
  name: string;
  email: string;
  cpf: string | null;
  code: string;
  status: AffiliateStatus;
  commissionRate: number;
  balance: number;
  createdAt: string;
}

const STATUS_BADGE: Record<AffiliateStatus, string> = {
  PENDING: "bg-yellow-900/30 text-yellow-400 border-yellow-700/30",
  ACTIVE: "bg-green-900/30 text-green-400 border-green-700/30",
  SUSPENDED: "bg-orange-900/30 text-orange-400 border-orange-700/30",
  BLOCKED: "bg-red-900/30 text-red-400 border-red-700/30",
};
const STATUS_LABEL: Record<AffiliateStatus, string> = {
  PENDING: "Pendente",
  ACTIVE: "Ativo",
  SUSPENDED: "Suspenso",
  BLOCKED: "Bloqueado",
};

const ALL_STATUSES: AffiliateStatus[] = ["PENDING", "ACTIVE", "SUSPENDED", "BLOCKED"];

export default function AfiliadosPage() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AffiliateStatus | "ALL">("ALL");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BASE}/api/admin/affiliates`);
        if (!res.ok) throw new Error("Falha ao carregar afiliados");
        const json = await res.json();
        setAffiliates(json.affiliates ?? json ?? []);
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Erro");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function approve(id: string) {
    try {
      const res = await fetch(`${BASE}/api/admin/affiliates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACTIVE" }),
      });
      if (!res.ok) throw new Error("Falha ao aprovar afiliado");
      setAffiliates((prev) => prev.map((a) => (a.id === id ? { ...a, status: "ACTIVE" } : a)));
      toast.success("Afiliado aprovado!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  }

  const filtered = useMemo(
    () =>
      affiliates.filter((a) => {
        const matchSearch =
          a.name.toLowerCase().includes(search.toLowerCase()) ||
          a.email.toLowerCase().includes(search.toLowerCase()) ||
          a.code.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === "ALL" || a.status === statusFilter;
        return matchSearch && matchStatus;
      }),
    [affiliates, search, statusFilter]
  );

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-2xl font-bold">
          Afiliados
          <span className="text-gray-500 text-base font-normal ml-2">({affiliates.length})</span>
        </h1>
        <Link
          href="/admin/afiliados/novo"
          className="flex items-center gap-2 bg-brand-red hover:bg-brand-red-light text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus size={16} />
          Novo Afiliado
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar nome, email ou código…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-red/40 focus:border-brand-red min-w-[240px]"
          />
        </div>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setStatusFilter("ALL")}
            className={cn("px-3 py-2 text-xs rounded-lg font-medium transition-colors", statusFilter === "ALL" ? "bg-gray-700 text-white" : "bg-gray-900 border border-gray-800 text-gray-400 hover:text-white")}
          >
            Todos
          </button>
          {ALL_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={cn("px-3 py-2 text-xs rounded-lg font-medium transition-colors", statusFilter === s ? "bg-gray-700 text-white" : "bg-gray-900 border border-gray-800 text-gray-400 hover:text-white")}
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
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
                  <th className="text-left px-5 py-3">Nome</th>
                  <th className="text-left px-5 py-3 hidden sm:table-cell">Email</th>
                  <th className="text-left px-5 py-3 hidden md:table-cell">Código</th>
                  <th className="text-center px-5 py-3">Status</th>
                  <th className="text-right px-5 py-3 hidden lg:table-cell">Comissão</th>
                  <th className="text-right px-5 py-3 hidden lg:table-cell">Saldo</th>
                  <th className="text-right px-5 py-3 hidden xl:table-cell">Cadastro</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a, i) => (
                  <tr key={a.id} className={cn("hover:bg-gray-800/50 transition-colors", i !== 0 && "border-t border-gray-800/50")}>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-white">{a.name}</p>
                      {a.cpf && <p className="text-xs text-gray-500 mt-0.5">{a.cpf}</p>}
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 hidden sm:table-cell">{a.email}</td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className="font-mono text-xs bg-gray-800 px-2 py-1 rounded text-gray-300">{a.code}</span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full border", STATUS_BADGE[a.status])}>
                        {STATUS_LABEL[a.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right text-gray-300 hidden lg:table-cell">{a.commissionRate}%</td>
                    <td className="px-5 py-3.5 text-right text-green-400 hidden lg:table-cell">{formatCurrency(a.balance ?? 0)}</td>
                    <td className="px-5 py-3.5 text-right text-gray-500 text-xs hidden xl:table-cell">
                      {new Date(a.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        {a.status === "PENDING" && (
                          <button
                            type="button"
                            onClick={() => approve(a.id)}
                            className="text-xs text-green-400 hover:text-white border border-green-700/50 px-2.5 py-1 rounded-lg transition-colors"
                          >
                            Aprovar
                          </button>
                        )}
                        <Link href={`/admin/afiliados/${a.id}`} className="text-gray-500 hover:text-white transition-colors">
                          <Pencil size={14} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-gray-500">
                      Nenhum afiliado encontrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
