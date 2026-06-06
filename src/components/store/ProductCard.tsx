"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";

export interface Product {
  id: string;
  name: string;
  slug: string;
  images: string[];
  price: number;
  salePrice?: number | null;
  shortDescription?: string | null;
  stock: number;
}

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function discountPercent(original: number, sale: number): number {
  return Math.round(((original - sale) / original) * 100);
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const {
    name,
    slug,
    images,
    price,
    salePrice,
    shortDescription,
    stock,
  } = product;

  const hasSale = salePrice != null && salePrice < price;
  const displayPrice = hasSale ? salePrice! : price;
  const savings = hasSale ? price - salePrice! : 0;
  const discount = hasSale ? discountPercent(price, salePrice!) : 0;
  const imageSrc = images?.[0] ?? "/images/placeholder-product.jpg";
  const isOutOfStock = stock <= 0;

  return (
    <article className="relative bg-white rounded-xl border border-gray-100 overflow-hidden card-hover flex flex-col">
      {/* Image container */}
      <Link href={`/produtos/${slug}`} className="block relative aspect-[4/3] overflow-hidden bg-gray-50">
        <Image
          src={imageSrc}
          alt={name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Discount badge */}
        {hasSale && !isOutOfStock && (
          <span className="absolute top-2 left-2 bg-brand-red text-white text-xs font-bold px-2 py-1 rounded-md shadow">
            -{discount}%
          </span>
        )}

        {/* Out-of-stock overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-white text-gray-800 font-semibold text-sm px-4 py-2 rounded-full shadow">
              Esgotado
            </span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        <Link href={`/produtos/${slug}`}>
          <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 hover:text-brand-red transition-colors">
            {name}
          </h3>
        </Link>

        {shortDescription && (
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
            {shortDescription}
          </p>
        )}

        {/* Pricing */}
        <div className="mt-auto pt-2">
          {hasSale ? (
            <>
              <p className="text-xs text-gray-400 line-through">
                {formatBRL(price)}
              </p>
              <p className="text-lg font-bold text-brand-red leading-tight">
                {formatBRL(salePrice!)}
              </p>
              {savings > 0 && (
                <p className="text-xs text-green-600 font-medium mt-0.5">
                  Economia de {formatBRL(savings)}
                </p>
              )}
            </>
          ) : (
            <p className="text-lg font-bold text-gray-900">
              {formatBRL(price)}
            </p>
          )}
        </div>

        {/* CTA */}
        <button
          onClick={() => !isOutOfStock && onAddToCart?.(product)}
          disabled={isOutOfStock}
          className={`
            mt-2 w-full flex items-center justify-center gap-2 text-sm font-semibold
            px-4 py-2.5 rounded-lg transition-all duration-200
            ${
              isOutOfStock
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-brand-red hover:bg-brand-red-light text-white hover:shadow-md active:scale-95"
            }
          `}
        >
          <ShoppingCart className="w-4 h-4" />
          {isOutOfStock ? "Indisponível" : "Comprar"}
        </button>
      </div>
    </article>
  );
}
