"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { formatCurrency, calculateDiscount } from "@/lib/utils";

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

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const cardVariant = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", damping: 30, stiffness: 260 },
  },
};

export function FeaturedProductsGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <ProductSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </motion.div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const discount =
    product.salePrice ? calculateDiscount(product.price, product.salePrice) : 0;
  const displayPrice = product.salePrice ?? product.price;

  return (
    <motion.div variants={cardVariant}>
      <Link
        href={`/produto/${product.slug}`}
        className="group flex flex-col rounded-2xl bg-white border border-[#e8e0d5] overflow-hidden hover:shadow-[0_8px_32px_rgba(0,0,0,0.10)] hover:border-[#C9A84C]/30 transition-all duration-300 hover:-translate-y-1"
      >
        {/* Image */}
        <div className="relative aspect-square bg-[#f5f0eb] overflow-hidden">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-5xl opacity-40">🌿</span>
            </div>
          )}
          {discount > 0 && (
            <span className="absolute top-3 left-3 bg-[#8B0000] text-white text-[11px] font-bold px-2.5 py-1 rounded-lg tracking-wide">
              -{discount}%
            </span>
          )}
          {/* Hover overlay */}
          <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-3">
            <ShoppingBag className="w-5 h-5 text-white drop-shadow" />
          </div>
        </div>

        {/* Info */}
        <div className="p-5 flex flex-col flex-1">
          <p className="text-[10px] text-[#9a9a9a] uppercase tracking-[0.14em] mb-1.5 font-medium">
            {product.brand}
          </p>
          <h3 className="font-semibold text-[#1a1a1a] text-[14px] leading-snug mb-4 line-clamp-2 flex-1">
            {product.name}
          </h3>
          <div className="mt-auto">
            {product.salePrice && product.salePrice < product.price && (
              <p className="text-[12px] text-[#9a9a9a] line-through">
                {formatCurrency(product.price)}
              </p>
            )}
            <p className="text-[#8B0000] font-bold text-lg leading-none">
              {formatCurrency(displayPrice)}
            </p>
            <p className="text-[#9a9a9a] text-[11px] mt-1">
              ou 10× de {formatCurrency(displayPrice / 10)} sem juros
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function ProductSkeleton() {
  return (
    <div className="rounded-2xl border border-[#e8e0d5] overflow-hidden animate-pulse">
      <div className="aspect-square bg-[#f5f0eb]" />
      <div className="p-5 space-y-2.5">
        <div className="h-2.5 bg-[#f5f0eb] rounded w-1/3" />
        <div className="h-4 bg-[#f5f0eb] rounded w-4/5" />
        <div className="h-4 bg-[#f5f0eb] rounded w-3/5" />
        <div className="h-5 bg-[#f5f0eb] rounded w-2/5 mt-4" />
      </div>
    </div>
  );
}
