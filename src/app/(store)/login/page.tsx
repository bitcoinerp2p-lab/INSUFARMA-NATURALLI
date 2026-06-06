"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/conta";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Erro ao fazer login"); return; }
      toast.success(`Bem-vindo, ${data.user.name.split(" ")[0]}!`);
      router.push(redirect);
      router.refresh();
    } catch {
      toast.error("Erro ao conectar ao servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <span className="font-display font-bold text-2xl text-brand-red">Insufarma</span>
            <span className="font-display font-bold text-2xl text-brand-gold"> Naturalli</span>
          </Link>
          <h1 className="font-display text-2xl font-bold text-gray-900">Entrar na sua conta</h1>
          <p className="text-gray-500 text-sm mt-1">Acesse seus pedidos e dados pessoais</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="seu@email.com"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-700">Senha</label>
              </div>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-11 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red"
                />
                <button type="button" onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">
                  {showPw ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className={cn("btn-primary w-full py-3.5 text-base", loading && "opacity-70 cursor-not-allowed")}>
              {loading ? "Entrando…" : "Entrar"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            Não tem conta?{" "}
            <Link href={`/cadastro${redirect !== "/conta" ? `?redirect=${redirect}` : ""}`} className="text-brand-red font-medium hover:underline">
              Cadastre-se
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
