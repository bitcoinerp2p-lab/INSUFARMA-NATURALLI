"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
const PAGE_SIZE = 50;

interface AuditLog {
  id: string;
  createdAt: string;
  user: string;
  action: string;
  entity: string;
  entityId: string | null;
  details: string | null;
  ip: string | null;
}

const ACTION_TYPES = [
  "ALL", "CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT",
  "APPROVE", "REJECT", "SUSPEND", "BLOCK",
];

function actionBadgeClass(action: string): string {
  if (action.includes("CREATE")) return "bg-blue-900/30 text-blue-400";
  if (action.includes("UPDATE")) return "bg-amber-900/30 text-amber-400";
  if (action.includes("DELETE")) return "bg-red-900/30 text-red-400";
  if (action.includes("LOGIN")) return "bg-green-900/30 text-green-400";
  if (action.includes("LOGOUT")) return "bg-gray-800 text-gray-400";
  if (action.includes("APPROVE")) return "bg-green-900/30 text-green-400";
  if (action.includes("REJECT")) return "bg-red-900/30 text-red-400";
  if (action.includes("SUSPEND") || action.includes("BLOCK")) return "bg-orange-900/30 text-orange-400";
  return "bg-gray-800 text-gray-400";
}

export default function LogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (actionFilter !== "ALL") params.set("action", actionFilter);
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);
      const res = await fetch(`${BASE}/api/admin/audit?${params}`);
      if (!res.ok) throw new Error("Falha ao carregar logs");
      const json = await res.json();
      setLogs(json.logs ?? json ?? []);
      setTotal(json.total ?? 0);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao carregar logs");
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">
          Logs de Auditoria
          <span className="text-gray-500 text-base font-normal ml-2">({total})</span>
        </h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-wrap gap-1.5">
          {ACTION_TYPES.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => { setActionFilter(a); setPage(1); }}
              className={cn("px-3 py-1.5 text-xs rounded-lg font-medium transition-colors",
                actionFilter === a ? "bg-brand-red text-white" : "bg-gray-900 border border-gray-800 text-gray-400 hover:text-white")}
            >
              {a === "ALL" ? "Todos" : a}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="bg-gray-900 border border-gray-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
          />
          <span className="text-gray-500 text-xs">até</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="bg-gray-900 border border-gray-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
          />
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
                  <th className="text-left px-5 py-3">Data/Hora</th>
                  <th className="text-left px-5 py-3">Usuário</th>
                  <th className="text-left px-5 py-3">Ação</th>
                  <th className="text-left px-5 py-3 hidden md:table-cell">Entidade</th>
                  <th className="text-left px-5 py-3 hidden lg:table-cell">Detalhes</th>
                  <th className="text-left px-5 py-3 hidden xl:table-cell">IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr key={log.id} className={cn("hover:bg-gray-800/50 transition-colors", i !== 0 && "border-t border-gray-800/50")}>
                    <td className="px-5 py-3 text-gray-400 text-xs whitespace-nowrap">
                      <div>{new Date(log.createdAt).toLocaleDateString("pt-BR")}</div>
                      <div className="text-gray-600">{new Date(log.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</div>
                    </td>
                    <td className="px-5 py-3 text-white text-xs">{log.user}</td>
                    <td className="px-5 py-3">
                      <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", actionBadgeClass(log.action))}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-xs hidden md:table-cell">
                      <div>{log.entity}</div>
                      {log.entityId && <div className="text-gray-600 font-mono">{log.entityId.slice(0, 8)}</div>}
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs hidden lg:table-cell max-w-[200px] truncate">
                      {log.details ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs hidden xl:table-cell font-mono">
                      {log.ip ?? "—"}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-500">Nenhum log encontrado</td></tr>
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
            Página {page} de {totalPages} · {total} registros
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
