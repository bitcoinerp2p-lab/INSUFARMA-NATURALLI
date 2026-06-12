"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

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
      if (data.user.role !== "ADMIN") { toast.error("Acesso restrito a administradores"); return; }
      window.location.href = "/admin";
    } catch {
      toast.error("Erro ao conectar ao servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-2xl font-bold text-white mb-1">
            <span className="text-brand-red">Insufarma</span>
            <span className="text-brand-gold"> Naturalli</span>
          </h1>
          <p className="text-gray-400 text-sm">Painel Administrativo</p>
        </div>

        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">E-mail</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="admin@insufarma.com.br"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-red/40 focus:border-brand-red" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Senha</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" placeholder="••••••••"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-red/40 focus:border-brand-red" />
            </div>
            <button type="submit" disabled={loading}
              className={cn("w-full py-3.5 bg-brand-red hover:bg-brand-red-light text-white font-semibold rounded-lg transition-colors", loading && "opacity-70 cursor-not-allowed")}>
              {loading ? "Entrando…" : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
