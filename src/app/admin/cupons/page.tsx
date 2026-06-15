"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Search } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import toast from "react-hot-toast";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

interface Coupon {
  id: string;
  code: string;
  type: "PERCENTAGE" | "FIXED" | "FREE_SHIPPING";
  value: number;
  minOrderValue: number | null;
  usedCount: number;
  maxUses: number | null;
  affiliateName: string | null;
  productName: string | null;
  expiresAt: string | null;
  active: boolean;
}

const FIELD_CLASS = "w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-red/40 focus:border-brand-red";
const LABEL_CLASS = "block text-xs font-medium text-gray-400 mb-1";

type CouponType = "PERCENTAGE" | "FIXED" | "FREE_SHIPPING";

function CouponModal({ onClose, onCreated }: { onClose: () => void; onCreated: (c: Coupon) => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    code: "", type: "PERCENTAGE" as CouponType,
    value: "", minOrderValue: "", maxUses: "", expiresAt: "",
  });

  function set(k: string, v: string) { setForm((p) => ({ ...p, [k]: v })); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const isFreeShipping = form.type === "FREE_SHIPPING";
      const res = await fetch(`${BASE}/api/admin/coupons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code,
          type: form.type,
          value: isFreeShipping ? 0 : parseFloat(form.value || "0"),
          minOrderValue: form.minOrderValue ? parseFloat(form.minOrderValue) : null,
          maxUses: form.maxUses ? parseInt(form.maxUses, 10) : null,
          expiresAt: form.expiresAt || null,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Falha"); }
      const d = await res.json();
      toast.success("Cupom criado!");
      onCreated(d.coupon ?? d);
      onClose();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao criar cupom");
    } finally {
      setSaving(false);
    }
  }

  const isFreeShipping = form.type === "FREE_SHIPPING";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-md p-6">
        <h2 className="font-semibold text-white mb-5">Novo Cupom</h2>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className={LABEL_CLASS}>Código *</label>
            <input type="text" value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase())} required placeholder="DESCONTO10" className={FIELD_CLASS} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLASS}>Tipo</label>
              <select value={form.type} onChange={(e) => set("type", e.target.value)} className={FIELD_CLASS}>
                <option value="PERCENTAGE">Porcentagem (%)</option>
                <option value="FIXED">Valor Fixo (R$)</option>
                <option value="FREE_SHIPPING">Frete Grátis</option>
              </select>
            </div>
            {!isFreeShipping && (
              <div>
                <label className={LABEL_CLASS}>Valor {form.type === "PERCENTAGE" ? "(%)" : "(R$)"}</label>
                <input type="number" min="0" step="0.01" value={form.value} onChange={(e) => set("value", e.target.value)} required className={FIELD_CLASS} />
              </div>
            )}
            {isFreeShipping && (
              <div className="flex items-end pb-1">
                <span className="text-xs text-green-400 font-medium">Frete zerado automaticamente</span>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLASS}>Pedido mínimo (R$)</label>
              <input type="number" min="0" step="0.01" value={form.minOrderValue} onChange={(e) => set("minOrderValue", e.target.value)} placeholder="Sem mínimo" className={FIELD_CLASS} />
            </div>
            <div>
              <label className={LABEL_CLASS}>Máx. Usos</label>
              <input type="number" min="1" value={form.maxUses} onChange={(e) => set("maxUses", e.target.value)} placeholder="Ilimitado" className={FIELD_CLASS} />
            </div>
          </div>
          <div>
            <label className={LABEL_CLASS}>Validade</label>
            <input type="date" value={form.expiresAt} onChange={(e) => set("expiresAt", e.target.value)} className={FIELD_CLASS} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className={cn("flex-1 bg-brand-red hover:bg-brand-red-light text-white font-semibold py-2.5 rounded-lg text-sm transition-colors", saving && "opacity-70 cursor-not-allowed")}>
              {saving ? "Criando…" : "Criar Cupom"}
            </button>
            <button type="button" onClick={onClose} className="flex-1 border border-gray-700 text-gray-400 hover:text-white font-medium py-2.5 rounded-lg text-sm transition-colors">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CuponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BASE}/api/admin/coupons`);
        if (!res.ok) throw new Error("Falha ao carregar cupons");
        const json = await res.json();
        setCoupons(json.coupons ?? json ?? []);
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Erro");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function toggle(id: string, active: boolean) {
    try {
      const res = await fetch(`${BASE}/api/admin/coupons/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
      if (!res.ok) throw new Error("Falha ao atualizar cupom");
      setCoupons((prev) => prev.map((c) => (c.id === id ? { ...c, active } : c)));
      toast.success(active ? "Cupom ativado" : "Cupom desativado");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  }

  const filtered = useMemo(
    () => coupons.filter((c) => c.code.toLowerCase().includes(search.toLowerCase())),
    [coupons, search]
  );

  return (
    <div className="space-y-6 max-w-6xl">
      {showModal && (
        <CouponModal
          onClose={() => setShowModal(false)}
          onCreated={(c) => setCoupons((prev) => [c, ...prev])}
        />
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-2xl font-bold">
          Cupons
          <span className="text-gray-500 text-base font-normal ml-2">({coupons.length})</span>
        </h1>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-brand-red hover:bg-brand-red-light text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus size={16} />
          Novo Cupom
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          placeholder="Buscar código…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-red/40 focus:border-brand-red"
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
                  <th className="text-left px-5 py-3">Código</th>
                  <th className="text-left px-5 py-3">Tipo / Valor</th>
                  <th className="text-right px-5 py-3 hidden sm:table-cell">Usos</th>
                  <th className="text-left px-5 py-3 hidden md:table-cell">Afiliado</th>
                  <th className="text-left px-5 py-3 hidden lg:table-cell">Produto</th>
                  <th className="text-left px-5 py-3 hidden lg:table-cell">Validade</th>
                  <th className="text-center px-5 py-3">Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.id} className={cn("hover:bg-gray-800/50 transition-colors", i !== 0 && "border-t border-gray-800/50")}>
                    <td className="px-5 py-3.5">
                      <span className="font-mono font-semibold text-white">{c.code}</span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-300">
                      {c.type === "FREE_SHIPPING"
                        ? <span className="text-green-400 font-medium">Frete Grátis</span>
                        : c.type === "PERCENTAGE"
                          ? `${c.value}%`
                          : formatCurrency(c.value)
                      }
                    </td>
                    <td className="px-5 py-3.5 text-right text-gray-400 hidden sm:table-cell">
                      {c.usedCount}{c.maxUses ? `/${c.maxUses}` : ""}
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 hidden md:table-cell">{c.affiliateName ?? "—"}</td>
                    <td className="px-5 py-3.5 text-gray-400 hidden lg:table-cell">{c.productName ?? "—"}</td>
                    <td className="px-5 py-3.5 text-gray-400 hidden lg:table-cell text-xs">
                      {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString("pt-BR") : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full", c.active ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400")}>
                        {c.active ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => toggle(c.id, !c.active)}
                        className="text-xs text-gray-400 hover:text-white border border-gray-700 px-2.5 py-1 rounded-lg transition-colors"
                      >
                        {c.active ? "Desativar" : "Ativar"}
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="px-5 py-12 text-center text-gray-500">Nenhum cupom encontrado</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
