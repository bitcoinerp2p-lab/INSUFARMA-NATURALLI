"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Copy } from "lucide-react";
import { cn, slugify } from "@/lib/utils";
import toast from "react-hot-toast";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? (typeof window !== "undefined" ? window.location.origin : "");

interface Category { id: string; name: string }

const FIELD_CLASS =
  "w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-red/40 focus:border-brand-red";
const LABEL_CLASS = "block text-xs font-medium text-gray-400 mb-1.5";

export default function EditProdutoPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    sku: "",
    description: "",
    shortDescription: "",
    price: "",
    salePrice: "",
    stock: "0",
    brand: "",
    categoryId: "",
    supplierCost: "",
    defaultAffiliateCommission: "",
    affiliateCommissionType: "PERCENTAGE" as "PERCENTAGE" | "FIXED",
  });

  const load = useCallback(async () => {
    try {
      const [pRes, cRes] = await Promise.all([
        fetch(`${BASE}/api/admin/products/${id}`),
        fetch(`${BASE}/api/categories`),
      ]);
      if (!pRes.ok) throw new Error("Produto não encontrado");
      const p = await pRes.json();
      const cData = cRes.ok ? await cRes.json() : { categories: [] };
      setCategories(cData.categories ?? cData ?? []);
      setForm({
        name: p.name ?? "",
        slug: p.slug ?? "",
        sku: p.sku ?? "",
        description: p.description ?? "",
        shortDescription: p.shortDescription ?? "",
        price: String(p.price ?? ""),
        salePrice: p.salePrice != null ? String(p.salePrice) : "",
        stock: String(p.stock ?? 0),
        brand: p.brand ?? "",
        categoryId: p.categoryId ?? p.category?.id ?? "",
        supplierCost: p.supplierCost != null ? String(p.supplierCost) : "",
        defaultAffiliateCommission:
          p.defaultAffiliateCommission != null ? String(p.defaultAffiliateCommission) : "",
        affiliateCommissionType: p.affiliateCommissionType ?? "PERCENTAGE",
      });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao carregar produto");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  function set(field: string, value: string) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "name") next.slug = slugify(value);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        ...form,
        price: parseFloat(form.price),
        salePrice: form.salePrice ? parseFloat(form.salePrice) : null,
        stock: parseInt(form.stock, 10),
        supplierCost: form.supplierCost ? parseFloat(form.supplierCost) : null,
        defaultAffiliateCommission: form.defaultAffiliateCommission
          ? parseFloat(form.defaultAffiliateCommission)
          : null,
      };
      const res = await fetch(`${BASE}/api/admin/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Falha ao salvar produto");
      }
      toast.success("Produto atualizado!");
      router.push("/admin/produtos");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar produto");
    } finally {
      setSaving(false);
    }
  }

  const productLink = `${SITE}/produto/${form.slug}`;

  function copyLink(link: string) {
    navigator.clipboard.writeText(link).then(() => toast.success("Link copiado!"));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-6 h-6 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/produtos" className="text-gray-500 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-display text-2xl font-bold">Editar Produto</h1>
      </div>

      {/* Links */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
        <h2 className="text-sm font-semibold text-gray-300 mb-3">Links</h2>
        <p className="text-xs text-gray-500 mb-1">Link do Produto</p>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={productLink}
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs text-gray-300 font-mono focus:outline-none"
          />
          <button
            type="button"
            onClick={() => copyLink(productLink)}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-brand-gold border border-gray-700 px-3 py-2 rounded-lg transition-colors"
          >
            <Copy size={13} />
            Copiar
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-300">Informações Básicas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={LABEL_CLASS}>Nome *</label>
              <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)} required className={FIELD_CLASS} />
            </div>
            <div>
              <label className={LABEL_CLASS}>Slug</label>
              <input type="text" value={form.slug} onChange={(e) => set("slug", e.target.value)} required className={FIELD_CLASS} />
            </div>
            <div>
              <label className={LABEL_CLASS}>SKU *</label>
              <input type="text" value={form.sku} onChange={(e) => set("sku", e.target.value)} required className={FIELD_CLASS} />
            </div>
            <div>
              <label className={LABEL_CLASS}>Marca</label>
              <input type="text" value={form.brand} onChange={(e) => set("brand", e.target.value)} className={FIELD_CLASS} />
            </div>
            <div>
              <label className={LABEL_CLASS}>Categoria</label>
              <select value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)} className={FIELD_CLASS}>
                <option value="">Selecionar…</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL_CLASS}>Descrição Curta</label>
              <input type="text" value={form.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} className={FIELD_CLASS} />
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL_CLASS}>Descrição Completa</label>
              <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={4} className={cn(FIELD_CLASS, "resize-none")} />
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-300">Preços e Estoque</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className={LABEL_CLASS}>Preço (R$) *</label>
              <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => set("price", e.target.value)} required className={FIELD_CLASS} />
            </div>
            <div>
              <label className={LABEL_CLASS}>Preço Promo</label>
              <input type="number" min="0" step="0.01" value={form.salePrice} onChange={(e) => set("salePrice", e.target.value)} className={FIELD_CLASS} />
            </div>
            <div>
              <label className={LABEL_CLASS}>Custo Fornecedor</label>
              <input type="number" min="0" step="0.01" value={form.supplierCost} onChange={(e) => set("supplierCost", e.target.value)} className={FIELD_CLASS} />
            </div>
            <div>
              <label className={LABEL_CLASS}>Estoque</label>
              <input type="number" min="0" value={form.stock} onChange={(e) => set("stock", e.target.value)} className={FIELD_CLASS} />
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-300">Comissão de Afiliado</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLASS}>Tipo</label>
              <select value={form.affiliateCommissionType} onChange={(e) => set("affiliateCommissionType", e.target.value)} className={FIELD_CLASS}>
                <option value="PERCENTAGE">Porcentagem (%)</option>
                <option value="FIXED">Valor Fixo (R$)</option>
              </select>
            </div>
            <div>
              <label className={LABEL_CLASS}>Comissão {form.affiliateCommissionType === "PERCENTAGE" ? "(%)" : "(R$)"}</label>
              <input type="number" min="0" step="0.01" value={form.defaultAffiliateCommission} onChange={(e) => set("defaultAffiliateCommission", e.target.value)} className={FIELD_CLASS} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving}
            className={cn("bg-brand-red hover:bg-brand-red-light text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm", saving && "opacity-70 cursor-not-allowed")}>
            {saving ? "Salvando…" : "Salvar Alterações"}
          </button>
          <Link href="/admin/produtos" className="text-sm text-gray-400 hover:text-white border border-gray-700 px-6 py-2.5 rounded-lg transition-colors">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
