"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Copy, CheckCircle, XCircle, PauseCircle } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import toast from "react-hot-toast";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "";

type Tab = "perfil" | "links" | "carteira" | "historico";
type AffiliateStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "BLOCKED";

interface AffiliateDetail {
  id: string; name: string; email: string; phone: string | null;
  cpf: string | null; code: string; status: AffiliateStatus;
  commissionRate: number; commissionType: string;
  balance: number; pendingBalance: number; createdAt: string;
}
interface AffiliateLink {
  id: string; productName: string; productSlug: string; productSku: string;
  clicks: number; conversions: number; createdAt: string;
}
interface Withdrawal {
  id: string; amount: number; status: string; createdAt: string;
}
interface Sale {
  id: string; product: string; gross: number; commission: number; createdAt: string;
}

const STATUS_BADGE: Record<AffiliateStatus, string> = {
  PENDING: "bg-yellow-900/30 text-yellow-400",
  ACTIVE: "bg-green-900/30 text-green-400",
  SUSPENDED: "bg-orange-900/30 text-orange-400",
  BLOCKED: "bg-red-900/30 text-red-400",
};
const STATUS_LABEL: Record<AffiliateStatus, string> = {
  PENDING: "Pendente", ACTIVE: "Ativo", SUSPENDED: "Suspenso", BLOCKED: "Bloqueado",
};

const FIELD_CLASS = "w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-red/40 focus:border-brand-red";
const LABEL_CLASS = "block text-xs font-medium text-gray-400 mb-1.5";

export default function AfiliadoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<Tab>("perfil");
  const [affiliate, setAffiliate] = useState<AffiliateDetail | null>(null);
  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ name: "", email: "", phone: "", cpf: "", commissionRate: "" });

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${BASE}/api/admin/affiliates/${id}`);
      if (!res.ok) throw new Error("Afiliado não encontrado");
      const d = await res.json();
      setAffiliate(d);
      setForm({ name: d.name, email: d.email, phone: d.phone ?? "", cpf: d.cpf ?? "", commissionRate: String(d.commissionRate) });
      // load sub-data
      const [lRes, wRes, sRes] = await Promise.all([
        fetch(`${BASE}/api/admin/affiliates/${id}/links`),
        fetch(`${BASE}/api/admin/affiliates/${id}/withdrawals`),
        fetch(`${BASE}/api/admin/affiliates/${id}/sales`),
      ]);
      if (lRes.ok) { const ld = await lRes.json(); setLinks(ld.links ?? ld ?? []); }
      if (wRes.ok) { const wd = await wRes.json(); setWithdrawals(wd.withdrawals ?? wd ?? []); }
      if (sRes.ok) { const sd = await sRes.json(); setSales(sd.sales ?? sd ?? []); }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao carregar afiliado");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(status: AffiliateStatus) {
    try {
      const res = await fetch(`${BASE}/api/admin/affiliates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Falha ao atualizar status");
      setAffiliate((prev) => prev ? { ...prev, status } : prev);
      toast.success(`Status alterado para ${STATUS_LABEL[status]}`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${BASE}/api/admin/affiliates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, commissionRate: parseFloat(form.commissionRate) }),
      });
      if (!res.ok) throw new Error("Falha ao salvar");
      toast.success("Perfil atualizado!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setSaving(false);
    }
  }

  async function approveWithdrawal(wid: string) {
    try {
      const res = await fetch(`${BASE}/api/admin/withdrawals/${wid}/approve`, { method: "POST" });
      if (!res.ok) throw new Error("Falha ao aprovar saque");
      setWithdrawals((prev) => prev.map((w) => w.id === wid ? { ...w, status: "APPROVED" } : w));
      toast.success("Saque aprovado!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-6 h-6 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!affiliate) return <div className="text-gray-500 py-12 text-center">Afiliado não encontrado.</div>;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/admin/afiliados" className="text-gray-500 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-bold">{affiliate.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={cn("text-xs font-medium px-2.5 py-0.5 rounded-full", STATUS_BADGE[affiliate.status])}>
              {STATUS_LABEL[affiliate.status]}
            </span>
            <span className="text-gray-500 text-xs font-mono">{affiliate.code}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800 gap-1">
        {(["perfil", "links", "carteira", "historico"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px",
              tab === t ? "text-white border-brand-red" : "text-gray-500 border-transparent hover:text-white"
            )}
          >
            {t === "historico" ? "Histórico" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Perfil */}
      {tab === "perfil" && (
        <div className="space-y-6">
          <form onSubmit={saveProfile} className="bg-gray-900 rounded-2xl border border-gray-800 p-6 space-y-4">
            <h2 className="text-sm font-semibold text-gray-300">Informações</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={LABEL_CLASS}>Nome</label>
                <input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className={FIELD_CLASS} />
              </div>
              <div>
                <label className={LABEL_CLASS}>E-mail</label>
                <input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} className={FIELD_CLASS} />
              </div>
              <div>
                <label className={LABEL_CLASS}>Telefone</label>
                <input type="tel" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} className={FIELD_CLASS} />
              </div>
              <div>
                <label className={LABEL_CLASS}>CPF</label>
                <input type="text" value={form.cpf} onChange={(e) => setForm((p) => ({ ...p, cpf: e.target.value }))} className={FIELD_CLASS} />
              </div>
              <div>
                <label className={LABEL_CLASS}>Comissão (%)</label>
                <input type="number" min="0" step="0.01" value={form.commissionRate} onChange={(e) => setForm((p) => ({ ...p, commissionRate: e.target.value }))} className={FIELD_CLASS} />
              </div>
            </div>
            <button type="submit" disabled={saving} className={cn("bg-brand-red hover:bg-brand-red-light text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors", saving && "opacity-70 cursor-not-allowed")}>
              {saving ? "Salvando…" : "Salvar"}
            </button>
          </form>

          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
            <h2 className="text-sm font-semibold text-gray-300 mb-4">Ações de Status</h2>
            <div className="flex flex-wrap gap-3">
              {affiliate.status !== "ACTIVE" && (
                <button type="button" onClick={() => updateStatus("ACTIVE")} className="flex items-center gap-2 text-sm text-green-400 border border-green-700/50 px-4 py-2 rounded-lg hover:bg-green-900/20 transition-colors">
                  <CheckCircle size={15} /> Aprovar / Ativar
                </button>
              )}
              {affiliate.status !== "SUSPENDED" && (
                <button type="button" onClick={() => updateStatus("SUSPENDED")} className="flex items-center gap-2 text-sm text-orange-400 border border-orange-700/50 px-4 py-2 rounded-lg hover:bg-orange-900/20 transition-colors">
                  <PauseCircle size={15} /> Suspender
                </button>
              )}
              {affiliate.status !== "BLOCKED" && (
                <button type="button" onClick={() => updateStatus("BLOCKED")} className="flex items-center gap-2 text-sm text-red-400 border border-red-700/50 px-4 py-2 rounded-lg hover:bg-red-900/20 transition-colors">
                  <XCircle size={15} /> Bloquear
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Links */}
      {tab === "links" && (
        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase">
                  <th className="text-left px-5 py-3">Produto</th>
                  <th className="text-right px-5 py-3">Cliques</th>
                  <th className="text-right px-5 py-3">Conversões</th>
                  <th className="px-5 py-3 text-right">Link</th>
                </tr>
              </thead>
              <tbody>
                {links.map((l, i) => (
                  <tr key={l.id} className={cn("hover:bg-gray-800/50", i !== 0 && "border-t border-gray-800/50")}>
                    <td className="px-5 py-3.5 font-medium text-white">{l.productName}</td>
                    <td className="px-5 py-3.5 text-right text-gray-300">{l.clicks}</td>
                    <td className="px-5 py-3.5 text-right text-green-400">{l.conversions}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          const link = `${SITE}/produto/${l.productSlug}?ref=${affiliate.code}`;
                          navigator.clipboard.writeText(link).then(() => toast.success("Link copiado!"));
                        }}
                        className="text-gray-500 hover:text-brand-gold transition-colors"
                      >
                        <Copy size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {links.length === 0 && (
                  <tr><td colSpan={4} className="px-5 py-10 text-center text-gray-500">Nenhum link gerado</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Carteira */}
      {tab === "carteira" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Saldo Pendente</p>
              <p className="text-2xl font-bold text-amber-400">{formatCurrency(affiliate.pendingBalance ?? 0)}</p>
            </div>
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Saldo Disponível</p>
              <p className="text-2xl font-bold text-green-400">{formatCurrency(affiliate.balance ?? 0)}</p>
            </div>
          </div>

          <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-800">
              <h2 className="text-sm font-semibold text-gray-300">Saques</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase">
                    <th className="text-left px-5 py-3">Data</th>
                    <th className="text-right px-5 py-3">Valor</th>
                    <th className="text-center px-5 py-3">Status</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map((w, i) => (
                    <tr key={w.id} className={cn("hover:bg-gray-800/50", i !== 0 && "border-t border-gray-800/50")}>
                      <td className="px-5 py-3.5 text-gray-400">{new Date(w.createdAt).toLocaleDateString("pt-BR")}</td>
                      <td className="px-5 py-3.5 text-right text-white font-medium">{formatCurrency(w.amount)}</td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={cn("text-xs px-2 py-0.5 rounded-full", w.status === "PENDING" ? "bg-yellow-900/30 text-yellow-400" : w.status === "APPROVED" ? "bg-green-900/30 text-green-400" : "bg-gray-800 text-gray-400")}>
                          {w.status === "PENDING" ? "Pendente" : w.status === "APPROVED" ? "Aprovado" : w.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {w.status === "PENDING" && (
                          <button type="button" onClick={() => approveWithdrawal(w.id)} className="text-xs text-green-400 border border-green-700/40 px-2.5 py-1 rounded-lg hover:bg-green-900/20 transition-colors">
                            Aprovar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {withdrawals.length === 0 && (
                    <tr><td colSpan={4} className="px-5 py-10 text-center text-gray-500">Nenhum saque solicitado</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Histórico */}
      {tab === "historico" && (
        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase">
                  <th className="text-left px-5 py-3">ID</th>
                  <th className="text-left px-5 py-3">Produto</th>
                  <th className="text-right px-5 py-3">Bruto</th>
                  <th className="text-right px-5 py-3">Comissão</th>
                  <th className="text-right px-5 py-3">Data</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((s, i) => (
                  <tr key={s.id} className={cn("hover:bg-gray-800/50", i !== 0 && "border-t border-gray-800/50")}>
                    <td className="px-5 py-3.5 text-gray-400 font-mono text-xs">#{s.id.slice(-8).toUpperCase()}</td>
                    <td className="px-5 py-3.5 text-white">{s.product}</td>
                    <td className="px-5 py-3.5 text-right text-gray-300">{formatCurrency(s.gross)}</td>
                    <td className="px-5 py-3.5 text-right text-brand-gold">{formatCurrency(s.commission)}</td>
                    <td className="px-5 py-3.5 text-right text-gray-400 text-xs">{new Date(s.createdAt).toLocaleDateString("pt-BR")}</td>
                  </tr>
                ))}
                {sales.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-10 text-center text-gray-500">Nenhuma venda atribuída</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
