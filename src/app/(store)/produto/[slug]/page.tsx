"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formatCurrency, calculateDiscount, cn } from "@/lib/utils";
import { useCart } from "@/context/CartContext";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  salePrice: number | null;
  images: string[];
  stock: number;
  sku: string;
  brand: string | null;
  benefits: string[];
  howToUse: string | null;
  composition: string | null;
  warnings: string | null;
  category: { name: string; slug: string };
}

type Tab = "descricao" | "beneficios" | "como-usar" | "composicao";
const TABS: { key: Tab; label: string }[] = [
  { key: "descricao", label: "Descrição" },
  { key: "beneficios", label: "Benefícios" },
  { key: "como-usar", label: "Como Usar" },
  { key: "composicao", label: "Composição / Avisos" },
];

export default function ProdutoPage() {
  const { slug } = useParams() as { slug: string };
  const router = useRouter();
  const { addItem } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState<Tab>("descricao");

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`${BASE}/api/products/${slug}`)
      .then((r) => r.json())
      .then((d) => setProduct(d.product ?? null))
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <Skeleton />;
  if (!product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-4">
        <span className="text-5xl">😕</span>
        <h1 className="text-xl font-bold text-gray-900">Produto não encontrado</h1>
        <Link href="/produtos" className="btn-primary">Ver todos os produtos</Link>
      </div>
    );
  }

  const displayPrice = product.salePrice ?? product.price;
  const discount = product.salePrice ? calculateDiscount(product.price, product.salePrice) : 0;
  const images = product.images.length > 0 ? product.images : [""];

  function handleAddToCart() {
    addItem({ id: product!.id, name: product!.name, slug: product!.slug, price: product!.price, salePrice: product!.salePrice, imageUrl: images[0] || null, brand: product!.brand, stock: product!.stock }, qty);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6 flex-wrap">
          <Link href="/" className="hover:text-brand-red">Home</Link>
          <span>/</span>
          <Link href="/produtos" className="hover:text-brand-red">Produtos</Link>
          <span>/</span>
          <Link href={`/produtos?categoria=${product.category.slug}`} className="hover:text-brand-red">{product.category.name}</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium truncate max-w-[200px]">{product.name}</span>
        </nav>

        <div className="bg-white rounded-2xl shadow-sm p-6 lg:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Gallery */}
            <div>
              <div className="relative aspect-square bg-gray-50 rounded-xl overflow-hidden mb-3">
                {images[activeImage] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={images[activeImage]} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-7xl">🌿</div>
                )}
                {discount > 0 && (
                  <span className="absolute top-3 left-3 bg-brand-red text-white text-sm font-bold px-3 py-1 rounded-lg">-{discount}%</span>
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {images.map((img, i) => (
                    <button key={i} type="button" onClick={() => setActiveImage(i)}
                      className={cn("w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors", activeImage === i ? "border-brand-red" : "border-gray-100 hover:border-gray-300")}>
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gray-50 flex items-center justify-center text-xl">🌿</div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex flex-col gap-4">
              {product.brand && <p className="text-xs uppercase tracking-widest text-gray-400 font-medium">{product.brand}</p>}
              <h1 className="font-display text-2xl lg:text-3xl font-bold text-gray-900 leading-snug">{product.name}</h1>
              <p className="text-gray-600 text-sm leading-relaxed">{product.shortDescription}</p>

              <div className="flex items-baseline gap-3">
                {product.salePrice && product.salePrice < product.price && (
                  <p className="text-gray-400 line-through text-lg">{formatCurrency(product.price)}</p>
                )}
                <p className="text-brand-red font-bold text-3xl">{formatCurrency(displayPrice)}</p>
              </div>
              <p className="text-gray-400 text-sm">ou 10x de {formatCurrency(displayPrice / 10)} sem juros</p>

              {product.stock <= 5 && product.stock > 0 && (
                <p className="text-amber-600 text-sm font-medium">⚠️ Apenas {product.stock} unidades restantes</p>
              )}
              {product.stock === 0 && (
                <p className="text-red-600 text-sm font-medium">❌ Produto indisponível no momento</p>
              )}

              {product.stock > 0 && (
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                    <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-2 text-gray-600 hover:bg-gray-50 text-lg font-bold">−</button>
                    <span className="px-4 py-2 text-gray-900 font-semibold min-w-[3rem] text-center">{qty}</span>
                    <button type="button" onClick={() => setQty((q) => Math.min(product.stock, q + 1))} className="px-3 py-2 text-gray-600 hover:bg-gray-50 text-lg font-bold">+</button>
                  </div>
                  <button type="button" onClick={handleAddToCart} className="btn-primary flex-1">
                    Adicionar ao Carrinho
                  </button>
                </div>
              )}

              <button type="button" onClick={() => router.push("/carrinho")} className="btn-outline w-full">
                Ver Carrinho
              </button>

              <div className="border-t border-gray-100 pt-4 space-y-1.5 text-sm text-gray-500">
                <p><span className="font-medium text-gray-700">SKU:</span> {product.sku}</p>
                <p><span className="font-medium text-gray-700">Categoria:</span> {product.category.name}</p>
                <p><span className="font-medium text-gray-700">Estoque:</span> {product.stock} unidades</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-10">
            <div className="flex gap-1 border-b border-gray-100 overflow-x-auto">
              {TABS.map((tab) => (
                <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)}
                  className={cn("px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors",
                    activeTab === tab.key ? "border-brand-red text-brand-red" : "border-transparent text-gray-500 hover:text-gray-700")}>
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="py-6 text-sm text-gray-700 leading-relaxed">
              {activeTab === "descricao" && <p className="whitespace-pre-line">{product.description}</p>}
              {activeTab === "beneficios" && (
                product.benefits.length > 0 ? (
                  <ul className="space-y-2">
                    {product.benefits.map((b, i) => (
                      <li key={i} className="flex items-start gap-2"><span className="text-brand-gold mt-0.5">✓</span>{b}</li>
                    ))}
                  </ul>
                ) : <p className="text-gray-400">Nenhum benefício cadastrado.</p>
              )}
              {activeTab === "como-usar" && (
                product.howToUse ? <p className="whitespace-pre-line">{product.howToUse}</p>
                  : <p className="text-gray-400">Informações de uso não disponíveis.</p>
              )}
              {activeTab === "composicao" && (
                <div className="space-y-4">
                  {product.composition && (<div><h4 className="font-semibold text-gray-900 mb-2">Composição</h4><p className="whitespace-pre-line">{product.composition}</p></div>)}
                  {product.warnings && (<div><h4 className="font-semibold text-gray-900 mb-2">Avisos Importantes</h4><p className="whitespace-pre-line text-amber-700">{product.warnings}</p></div>)}
                  {!product.composition && !product.warnings && <p className="text-gray-400">Informações não disponíveis.</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="container mx-auto px-4 py-8 animate-pulse">
      <div className="h-4 bg-gray-100 rounded w-1/3 mb-6" />
      <div className="bg-white rounded-2xl p-10 grid lg:grid-cols-2 gap-10">
        <div className="aspect-square bg-gray-100 rounded-xl" />
        <div className="space-y-4">
          <div className="h-3 bg-gray-100 rounded w-1/4" />
          <div className="h-7 bg-gray-100 rounded w-3/4" />
          <div className="h-4 bg-gray-100 rounded w-full" />
          <div className="h-9 bg-gray-100 rounded w-1/3 mt-6" />
          <div className="h-11 bg-gray-100 rounded w-full mt-4" />
        </div>
      </div>
    </div>
  );
}
