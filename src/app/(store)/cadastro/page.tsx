"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { cn, formatCPF, formatPhone } from "@/lib/utils";
import toast from "react-hot-toast";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export default function CadastroPage() {
  return (
    <Suspense>
      <CadastroForm />
    </Suspense>
  );
}

function CadastroForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/conta";

  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", cpf: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      let value = e.target.value;
      if (field === "cpf") value = formatCPF(value.replace(/\D/g, "").slice(0, 11));
      if (field === "phone") value = formatPhone(value.replace(/\D/g, "").slice(0, 11));
      setForm((f) => ({ ...f, [field]: value }));
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password.length < 6) { toast.error("Senha deve ter pelo menos 6 caracteres"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          phone: form.phone || undefined,
          cpf: form.cpf.replace(/\D/g, "") || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Erro ao criar conta"); return; }
      toast.success("Conta criada com sucesso!");
      router.push(redirect);
      router.refresh();
    } catch {
      toast.error("Erro ao conectar ao servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <span className="font-display font-bold text-2xl text-brand-red">Insufarma</span>
            <span className="font-display font-bold text-2xl text-brand-gold"> Naturalli</span>
          </Link>
          <h1 className="font-display text-2xl font-bold text-gray-900">Criar conta</h1>
          <p className="text-gray-500 text-sm mt-1">Cadastre-se para acompanhar seus pedidos</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome completo *</label>
              <input type="text" value={form.name} onChange={set("name")} required placeholder="Seu nome" autoComplete="name"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">E-mail *</label>
              <input type="email" value={form.email} onChange={set("email")} required placeholder="seu@email.com" autoComplete="email"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Senha * <span className="text-gray-400 font-normal">(mín. 6 caracteres)</span></label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} value={form.password} onChange={set("password")} required placeholder="••••••••" autoComplete="new-password"
                  className="w-full px-4 py-3 pr-11 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red" />
                <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">
                  {showPw ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefone</label>
              <input type="tel" value={form.phone} onChange={set("phone")} placeholder="(11) 99999-9999" autoComplete="tel"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">CPF</label>
              <input type="text" value={form.cpf} onChange={set("cpf")} placeholder="000.000.000-00" inputMode="numeric"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red" />
            </div>

            <button type="submit" disabled={loading}
              className={cn("btn-primary w-full py-3.5 text-base mt-2", loading && "opacity-70 cursor-not-allowed")}>
              {loading ? "Criando conta…" : "Criar Conta"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            Já tem conta?{" "}
            <Link href={`/login${redirect !== "/conta" ? `?redirect=${redirect}` : ""}`} className="text-brand-red font-medium hover:underline">
              Entrar
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          <Link href="/" className="hover:text-brand-red">← Voltar para a loja</Link>
        </p>
      </div>
    </div>
  );
}
