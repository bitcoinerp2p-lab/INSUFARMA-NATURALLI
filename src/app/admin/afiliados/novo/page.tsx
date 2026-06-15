"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

const FIELD_CLASS =
  "w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-red/40 focus:border-brand-red";
const LABEL_CLASS = "block text-xs font-medium text-gray-400 mb-1.5";

export default function NovoAfiliadoPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    cpf: "",
    commissionRate: "10",
    commissionType: "PERCENTAGE",
  });

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        ...form,
        commissionRate: parseFloat(form.commissionRate),
      };
      const res = await fetch(`${BASE}/api/admin/affiliates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Falha ao criar afiliado");
      }
      toast.success("Afiliado criado com sucesso!");
      router.push("/admin/afiliados");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao criar afiliado");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/afiliados" className="text-gray-500 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-display text-2xl font-bold">Novo Afiliado</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-300">Dados Pessoais</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={LABEL_CLASS}>Nome Completo *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                required
                placeholder="João da Silva"
                className={FIELD_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>E-mail *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                required
                placeholder="joao@email.com"
                className={FIELD_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Senha de Acesso *</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                className={FIELD_CLASS}
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Telefone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="(11) 99999-0000"
                className={FIELD_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>CPF</label>
              <input
                type="text"
                value={form.cpf}
                onChange={(e) => set("cpf", e.target.value)}
                placeholder="000.000.000-00"
                maxLength={14}
                className={FIELD_CLASS}
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-300">Comissão</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLASS}>Tipo de Comissão</label>
              <select
                value={form.commissionType}
                onChange={(e) => set("commissionType", e.target.value)}
                className={FIELD_CLASS}
              >
                <option value="PERCENTAGE">Porcentagem (%)</option>
                <option value="FIXED">Valor Fixo (R$)</option>
              </select>
            </div>
            <div>
              <label className={LABEL_CLASS}>
                Taxa de Comissão {form.commissionType === "PERCENTAGE" ? "(%)" : "(R$)"}
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.commissionRate}
                onChange={(e) => set("commissionRate", e.target.value)}
                placeholder={form.commissionType === "PERCENTAGE" ? "Ex: 10" : "Ex: 25,00"}
                className={FIELD_CLASS}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className={cn(
              "bg-brand-red hover:bg-brand-red-light text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm",
              saving && "opacity-70 cursor-not-allowed"
            )}
          >
            {saving ? "Criando…" : "Criar Afiliado"}
          </button>
          <Link
            href="/admin/afiliados"
            className="text-sm text-gray-400 hover:text-white border border-gray-700 px-6 py-2.5 rounded-lg transition-colors"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
