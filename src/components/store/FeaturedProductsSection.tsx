import Link from "next/link";
import { FeaturedProductsGrid } from "./FeaturedProductsGrid";

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
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="inline-block px-4 py-1.5 text-[11px] font-semibold tracking-[0.14em] text-[#8B0000] border border-[#8B0000]/25 rounded-full mb-4 uppercase">
              Destaques
            </span>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-[#1a1a1a] leading-[1.12]">
              Produtos em destaque
            </h2>
          </div>
          <Link
            href="/produtos"
            className="hidden sm:inline-flex items-center gap-2 text-[#8B0000] font-semibold hover:text-[#A50000] transition-colors text-[14px] group"
          >
            Ver todos
            <svg
              className="w-4 h-4 group-hover:translate-x-1 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <FeaturedProductsGrid products={products} />

        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/produtos"
            className="inline-flex items-center gap-2 text-[#8B0000] font-semibold text-sm"
          >
            Ver todos os produtos
          </Link>
        </div>
      </div>
    </section>
  );
}
