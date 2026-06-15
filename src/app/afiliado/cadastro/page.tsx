"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export default function AfiliadorCadastroPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", cpf: "" });
  const [loading, setLoading] = useState(false);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error("Preencha nome, e-mail e senha");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/affiliate/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Erro ao cadastrar");
        return;
      }
      toast.success("Cadastro realizado! Aguarde a aprovação do administrador.");
      router.push("/afiliado/login");
    } catch {
      toast.error("Erro ao conectar ao servidor");
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-colors";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Torne-se um Afiliado</h1>
          <p className="text-gray-500 text-sm mt-2">Preencha os dados abaixo. Após análise, você receberá acesso.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Nome completo *</label>
            <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Seu nome" className={inputCls} required />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">E-mail *</label>
            <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="seu@email.com" className={inputCls} required />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Senha *</label>
            <input type="password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="Mínimo 6 caracteres" className={inputCls} required />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Telefone</label>
            <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="(11) 99999-9999" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">CPF</label>
            <input type="text" value={form.cpf} onChange={(e) => set("cpf", e.target.value)} placeholder="000.000.000-00" className={inputCls} />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors mt-2"
          >
            {loading ? "Enviando..." : "Solicitar Cadastro"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Já tem conta?{" "}
          <Link href="/afiliado/login" className="text-green-600 font-medium hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
