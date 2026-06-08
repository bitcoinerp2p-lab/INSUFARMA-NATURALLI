"use client";

import { useState, useEffect, useCallback } from "react";
import { Search } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  cpf: string | null;
  totalOrders: number;
  totalSpent: number;
  lastOrderAt: string | null;
  memberSince: string;
}

const PAGE_SIZE = 20;

export default function ClientesPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (debouncedSearch) params.set("search", debouncedSearch);
      const res = await fetch(`${BASE}/api/admin/customers?${params}`);
      if (!res.ok) throw new Error("Falha ao carregar clientes");
      const json = await res.json();
      setCustomers(json.customers ?? []);
      setTotal(json.total ?? 0);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao carregar clientes");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-2xl font-bold">
          Clientes
          <span className="text-gray-500 text-base font-normal ml-2">({total})</span>
        </h1>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Buscar por nome, e-mail ou WhatsApp…"
          className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gray-600"
        />
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
                  <th className="text-left px-5 py-3">Cliente</th>
                  <th className="text-left px-5 py-3 hidden md:table-cell">WhatsApp</th>
                  <th className="text-left px-5 py-3 hidden lg:table-cell">CPF</th>
                  <th className="text-right px-5 py-3">Pedidos</th>
                  <th className="text-right px-5 py-3">Total gasto</th>
                  <th className="text-right px-5 py-3 hidden xl:table-cell">Último pedido</th>
                  <th className="text-right px-5 py-3 hidden xl:table-cell">Membro desde</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c, i) => (
                  <tr key={c.id} className={cn("hover:bg-gray-800/50 transition-colors", i !== 0 && "border-t border-gray-800/50")}>
                    <td className="px-5 py-3.5">
                      <p className="text-white font-medium text-xs">{c.name}</p>
                      <p className="text-gray-500 text-xs">{c.email}</p>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      {c.phone ? (
                        <a
                          href={`https://wa.me/55${c.phone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-400 hover:underline text-xs"
                        >
                          {c.phone}
                        </a>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell text-gray-500 text-xs font-mono">
                      {c.cpf ?? "—"}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={cn(
                        "text-xs font-bold",
                        c.totalOrders > 0 ? "text-white" : "text-gray-500"
                      )}>
                        {c.totalOrders}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={cn(
                        "font-semibold text-xs",
                        c.totalSpent > 0 ? "text-green-400" : "text-gray-600"
                      )}>
                        {c.totalSpent > 0 ? formatCurrency(c.totalSpent) : "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right hidden xl:table-cell text-gray-400 text-xs">
                      {c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleDateString("pt-BR") : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-right hidden xl:table-cell text-gray-500 text-xs">
                      {new Date(c.memberSince).toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                ))}
                {customers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-gray-500">
                      {debouncedSearch ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">Página {page} de {totalPages} · {total} clientes</p>
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
