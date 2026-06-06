import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  showHome?: boolean;
  className?: string;
}

export default function Breadcrumb({
  items,
  showHome = true,
  className = "",
}: BreadcrumbProps) {
  const allItems: BreadcrumbItem[] = showHome
    ? [{ label: "Início", href: "/" }, ...items]
    : items;

  // Structured data for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: allItems.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: item.href } : {}),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav
        aria-label="Navegação estrutural"
        className={`flex items-center gap-1 text-sm text-gray-500 flex-wrap ${className}`}
      >
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;
          const isFirst = index === 0;

          return (
            <span key={index} className="flex items-center gap-1">
              {/* Separator */}
              {index > 0 && (
                <ChevronRight
                  className="w-3.5 h-3.5 text-gray-400 flex-shrink-0"
                  aria-hidden="true"
                />
              )}

              {/* Crumb */}
              {isLast || !item.href ? (
                <span
                  className="font-medium text-gray-900 truncate max-w-[200px]"
                  aria-current={isLast ? "page" : undefined}
                  title={item.label}
                >
                  {isFirst && showHome ? (
                    <span className="flex items-center gap-1">
                      <Home className="w-3.5 h-3.5" aria-hidden="true" />
                      <span className="sr-only">{item.label}</span>
                    </span>
                  ) : (
                    item.label
                  )}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="hover:text-brand-red transition-colors truncate max-w-[200px]"
                  title={item.label}
                >
                  {isFirst && showHome ? (
                    <span className="flex items-center gap-1">
                      <Home className="w-3.5 h-3.5" aria-hidden="true" />
                      <span className="sr-only">{item.label}</span>
                    </span>
                  ) : (
                    item.label
                  )}
                </Link>
              )}
            </span>
          );
        })}
      </nav>
    </>
  );
}
