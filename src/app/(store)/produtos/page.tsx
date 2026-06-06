"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { formatCurrency, calculateDiscount, cn } from "@/lib/utils";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice: number | null;
  imageUrl: string | null;
  brand: string;
  category: string;
  sold: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  count: number;
}

interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
}

type SortKey = "sold" | "price_asc" | "price_desc" | "sale" | "new";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "sold", label: "Mais Vendidos" },
  { value: "price_asc", label: "Menor Preço" },
  { value: "price_desc", label: "Maior Preço" },
  { value: "sale", label: "Promoções" },
  { value: "new", label: "Lançamentos" },
];

const PER_PAGE = 12;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProdutosPage() {
  return (
    <Suspense>
      <ProdutosContent />
    </Suspense>
  );
}

function ProdutosContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const query = searchParams.get("q") ?? "";
  const category = searchParams.get("categoria") ?? "";
  const sort = (searchParams.get("ordenar") as SortKey) ?? "sold";
  const page = Number(searchParams.get("pagina") ?? "1");

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      if (key !== "pagina") params.set("pagina", "1");
      router.push(`/produtos?${params.toString()}`);
    },
    [router, searchParams]
  );

  // Fetch categories once
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch(`${BASE_URL}/api/categories`);
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories ?? data);
        }
      } catch {
        // no-op — categories optional
      }
    }
    loadCategories();
  }, []);

  // Fetch products on param change
  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (query) params.set("q", query);
        if (category) params.set("categoria", category);
        params.set("ordenar", sort);
        params.set("pagina", String(page));
        params.set("limite", String(PER_PAGE));

        const res = await fetch(`${BASE_URL}/api/products?${params.toString()}`);
        if (res.ok) {
          const data: ProductsResponse = await res.json();
          setProducts(data.products ?? []);
          setTotal(data.total ?? 0);
          setTotalPages(data.totalPages ?? 1);
        } else {
          setProducts([]);
        }
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, [query, category, sort, page]);

  const activeFilters: { label: string; clearKey: string }[] = [];
  if (query) activeFilters.push({ label: `Busca: "${query}"`, clearKey: "q" });
  if (category) {
    const cat = categories.find((c) => c.slug === category);
    activeFilters.push({ label: cat?.name ?? category, clearKey: "categoria" });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* header strip */}
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-gray-900">
            Produtos
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {loading ? "Carregando…" : `${total} produto${total !== 1 ? "s" : ""} encontrado${total !== 1 ? "s" : ""}`}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* search + sort bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <SearchInput value={query} onChange={(v) => updateParam("q", v)} />

          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="sm:hidden flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white hover:bg-gray-50"
          >
            <FilterIcon />
            Filtros
          </button>

          <SortSelect value={sort} onChange={(v) => updateParam("ordenar", v)} />
        </div>

        {/* active filters */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {activeFilters.map((f) => (
              <button
                key={f.clearKey}
                type="button"
                onClick={() => updateParam(f.clearKey, "")}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-red/10 text-brand-red text-xs font-medium rounded-full hover:bg-brand-red/20 transition-colors"
              >
                {f.label}
                <XIcon />
              </button>
            ))}
            <button
              type="button"
              onClick={() => router.push("/produtos")}
              className="text-xs text-gray-400 hover:text-gray-600 underline px-1"
            >
              Limpar todos
            </button>
          </div>
        )}

        <div className="flex gap-8">
          {/* sidebar — desktop */}
          <aside className="hidden sm:block w-56 flex-shrink-0">
            <CategorySidebar
              categories={categories}
              activeSlug={category}
              onSelect={(slug) => updateParam("categoria", slug)}
            />
          </aside>

          {/* sidebar — mobile drawer */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-40 flex">
              <div
                className="absolute inset-0 bg-black/40"
                onClick={() => setSidebarOpen(false)}
              />
              <div className="relative z-10 bg-white w-72 p-6 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-gray-900">Filtros</h2>
                  <button type="button" onClick={() => setSidebarOpen(false)}>
                    <XIcon className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <CategorySidebar
                  categories={categories}
                  activeSlug={category}
                  onSelect={(slug) => {
                    updateParam("categoria", slug);
                    setSidebarOpen(false);
                  }}
                />
              </div>
            </div>
          )}

          {/* grid */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {Array.from({ length: PER_PAGE }).map((_, i) => (
                  <ProductSkeleton key={i} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <EmptyState />
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} isNew={sort === "new"} />
                  ))}
                </div>
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  onPageChange={(p) => updateParam("pagina", String(p))}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SearchInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [local, setLocal] = useState(value);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onChange(local.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="flex-1 flex">
      <div className="relative flex-1">
        <input
          type="search"
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          placeholder="Buscar produtos…"
          className="w-full pl-4 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red bg-white"
        />
        <button
          type="submit"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-red"
          aria-label="Buscar"
        >
          <SearchIcon />
        </button>
      </div>
    </form>
  );
}

function SortSelect({
  value,
  onChange,
}: {
  value: SortKey;
  onChange: (v: SortKey) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as SortKey)}
      className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red bg-white text-gray-700 cursor-pointer"
    >
      {SORT_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function CategorySidebar({
  categories,
  activeSlug,
  onSelect,
}: {
  categories: Category[];
  activeSlug: string;
  onSelect: (slug: string) => void;
}) {
  return (
    <div>
      <h3 className="font-semibold text-gray-900 text-sm mb-3">Categorias</h3>
      <ul className="space-y-1">
        <li>
          <button
            type="button"
            onClick={() => onSelect("")}
            className={cn(
              "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
              activeSlug === ""
                ? "bg-brand-red text-white font-semibold"
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            Todos os produtos
          </button>
        </li>
        {categories.map((cat) => (
          <li key={cat.id}>
            <button
              type="button"
              onClick={() => onSelect(cat.slug)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between",
                activeSlug === cat.slug
                  ? "bg-brand-red text-white font-semibold"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <span>{cat.name}</span>
              <span
                className={cn(
                  "text-xs",
                  activeSlug === cat.slug ? "text-white/70" : "text-gray-400"
                )}
              >
                {cat.count}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProductCard({ product, isNew }: { product: Product; isNew?: boolean }) {
  const discount =
    product.salePrice ? calculateDiscount(product.price, product.salePrice) : 0;
  const displayPrice = product.salePrice ?? product.price;

  return (
    <Link
      href={`/produto/${product.slug}`}
      className="group flex flex-col bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
    >
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-5xl">🌿</span>
          </div>
        )}
        {discount > 0 && (
          <span className="absolute top-3 left-3 bg-brand-red text-white text-xs font-bold px-2 py-1 rounded-lg">
            -{discount}%
          </span>
        )}
        {isNew && (
          <span className="absolute top-3 right-3 bg-brand-gold text-black text-xs font-bold px-2 py-1 rounded-lg">
            Novo
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{product.brand}</p>
        <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-3 line-clamp-2 flex-1">
          {product.name}
        </h3>
        <div>
          {product.salePrice && product.salePrice < product.price && (
            <p className="text-xs text-gray-400 line-through">
              {formatCurrency(product.price)}
            </p>
          )}
          <p className="text-brand-red font-bold text-lg">{formatCurrency(displayPrice)}</p>
          <p className="text-gray-400 text-xs mt-0.5">
            ou 10x de {formatCurrency(displayPrice / 10)} sem juros
          </p>
        </div>
      </div>
    </Link>
  );
}

function ProductSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-100 overflow-hidden bg-white animate-pulse">
      <div className="aspect-square bg-gray-100" />
      <div className="p-4 space-y-2">
        <div className="h-3 bg-gray-100 rounded w-1/3" />
        <div className="h-4 bg-gray-100 rounded w-3/4" />
        <div className="h-4 bg-gray-100 rounded w-1/2" />
        <div className="h-5 bg-gray-100 rounded w-2/5 mt-3" />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <span className="text-5xl mb-4">🔍</span>
      <h3 className="font-display font-bold text-gray-900 text-xl mb-2">
        Nenhum produto encontrado
      </h3>
      <p className="text-gray-500 text-sm max-w-xs">
        Tente outros termos de busca ou remova os filtros aplicados.
      </p>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2
  );

  const withEllipsis: (number | "…")[] = [];
  let prev: number | null = null;
  for (const p of pages) {
    if (prev && p - prev > 1) withEllipsis.push("…");
    withEllipsis.push(p);
    prev = p;
  }

  return (
    <div className="mt-10 flex items-center justify-center gap-1">
      <PageBtn
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        aria-label="Página anterior"
      >
        <ChevronLeftIcon />
      </PageBtn>

      {withEllipsis.map((p, i) =>
        p === "…" ? (
          <span key={`e-${i}`} className="px-2 text-gray-400 text-sm">
            …
          </span>
        ) : (
          <PageBtn
            key={p}
            onClick={() => onPageChange(p)}
            active={p === page}
          >
            {p}
          </PageBtn>
        )
      )}

      <PageBtn
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        aria-label="Próxima página"
      >
        <ChevronRightIcon />
      </PageBtn>
    </div>
  );
}

function PageBtn({
  children,
  onClick,
  active,
  disabled,
  "aria-label": ariaLabel,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  "aria-label"?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        "w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors",
        active
          ? "bg-brand-red text-white"
          : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50",
        disabled && "opacity-40 cursor-not-allowed"
      )}
    >
      {children}
    </button>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function SearchIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M7 12h10M11 20h2" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn("w-3 h-3", className)}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}
