import Link from "next/link";
import { formatCurrency, calculateDiscount } from "@/lib/utils";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice: number | null;
  imageUrl: string | null;
  brand: string;
  category: string;
}

async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${BASE_URL}/api/products?featured=true&limit=4`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.products ?? data) as Product[];
  } catch {
    return [];
  }
}

export default async function FeaturedProductsSection() {
  const products = await getFeaturedProducts();

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="inline-block px-4 py-1 text-xs font-semibold tracking-widest text-brand-red border border-brand-red/30 rounded-full mb-4 uppercase">
              Destaques
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900">
              Produtos em destaque
            </h2>
          </div>
          <Link
            href="/produtos"
            className="hidden sm:inline-flex items-center gap-2 text-brand-red font-semibold hover:text-brand-red-light transition-colors text-sm"
          >
            Ver todos
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/produtos"
            className="inline-flex items-center gap-2 text-brand-red font-semibold hover:text-brand-red-light transition-colors text-sm"
          >
            Ver todos os produtos
          </Link>
        </div>
      </div>
    </section>
  );
}

function ProductCard({ product }: { product: Product }) {
  const discount =
    product.salePrice ? calculateDiscount(product.price, product.salePrice) : 0;
  const displayPrice = product.salePrice ?? product.price;

  return (
    <Link
      href={`/produto/${product.slug}`}
      className="group flex flex-col rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
    >
      {/* image */}
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
      </div>

      {/* info */}
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
          <p className="text-brand-red font-bold text-lg">
            {formatCurrency(displayPrice)}
          </p>
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
    <div className="rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
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
