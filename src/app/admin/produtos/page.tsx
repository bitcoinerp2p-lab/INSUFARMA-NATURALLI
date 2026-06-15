"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Plus, Search, Pencil } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import toast from "react-hot-toast";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  salePrice: number | null;
  supplierCost: number | null;
  defaultAffiliateCommission: number | null;
  affiliateCommissionType: "PERCENTAGE" | "FIXED";
  active: boolean;
  stock: number;
}

export default function ProdutosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BASE}/api/admin/products`);
        if (!res.ok) throw new Error("Falha ao carregar produtos");
        const json = await res.json();
        setProducts(json.products ?? json ?? []);
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Erro ao carregar produtos");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function toggle(id: string, active: boolean) {
    try {
      const res = await fetch(`${BASE}/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
      if (!res.ok) throw new Error("Falha ao atualizar produto");
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, active } : p)));
      toast.success(active ? "Produto ativado" : "Produto desativado");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  }

  const filtered = useMemo(
    () =>
      products.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.sku?.toLowerCase().includes(search.toLowerCase())
      ),
    [products, search]
  );

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-2xl font-bold">
          Produtos
          <span className="text-gray-500 text-base font-normal ml-2">({products.length})</span>
        </h1>
        <Link
          href="/admin/produtos/novo"
          className="flex items-center gap-2 bg-brand-red hover:bg-brand-red-light text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus size={16} />
          Novo Produto
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          placeholder="Buscar por nome ou SKU…"
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
                  <th className="text-left px-5 py-3">Nome</th>
                  <th className="text-left px-5 py-3 hidden sm:table-cell">SKU</th>
                  <th className="text-right px-5 py-3">Preço</th>
                  <th className="text-right px-5 py-3 hidden md:table-cell">Custo</th>
                  <th className="text-right px-5 py-3 hidden lg:table-cell">Comissão</th>
                  <th className="text-center px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr
                    key={p.id}
                    className={cn("hover:bg-gray-800/50 transition-colors", i !== 0 && "border-t border-gray-800/50")}
                  >
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-white line-clamp-1">{p.name}</p>
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 hidden sm:table-cell font-mono text-xs">{p.sku}</td>
                    <td className="px-5 py-3.5 text-right text-white">
                      {formatCurrency(p.salePrice ?? p.price)}
                    </td>
                    <td className="px-5 py-3.5 text-right text-gray-400 hidden md:table-cell">
                      {p.supplierCost ? formatCurrency(p.supplierCost) : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-right text-gray-400 hidden lg:table-cell">
                      {p.defaultAffiliateCommission != null
                        ? p.affiliateCommissionType === "PERCENTAGE"
                          ? `${p.defaultAffiliateCommission}%`
                          : formatCurrency(p.defaultAffiliateCommission)
                        : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span
                        className={cn(
                          "text-xs font-medium px-2.5 py-1 rounded-full",
                          p.active ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"
                        )}
                      >
                        {p.active ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/produtos/${p.id}`}
                          className="text-gray-500 hover:text-white transition-colors"
                        >
                          <Pencil size={14} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => toggle(p.id, !p.active)}
                          className="text-xs text-gray-400 hover:text-white border border-gray-700 px-2.5 py-1 rounded-lg transition-colors"
                        >
                          {p.active ? "Desativar" : "Ativar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-gray-500">
                      {search ? "Nenhum produto encontrado" : "Nenhum produto cadastrado"}
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
