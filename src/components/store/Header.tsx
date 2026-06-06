"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  X,
  MessageCircle,
  ChevronDown,
} from "lucide-react";

const NAV_LINKS = [
  { label: "Início", href: "/" },
  { label: "Produtos", href: "/produtos" },
  { label: "Blog", href: "/blog" },
  { label: "Sobre", href: "/sobre" },
  { label: "Contato", href: "/contato" },
];

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP ?? "5511999999999";
const whatsappUrl = `https://wa.me/${WHATSAPP}?text=Ol%C3%A1%2C%20gostaria%20de%20mais%20informa%C3%A7%C3%B5es%20sobre%20os%20produtos.`;

interface HeaderProps {
  cartCount?: number;
}

export default function Header({ cartCount = 0 }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change / resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 w-full bg-white transition-shadow duration-300 ${
        scrolled ? "shadow-md" : "shadow-sm"
      }`}
    >
      {/* Top bar */}
      <div className="bg-brand-red text-white text-xs text-center py-1.5 px-4">
        Frete grátis acima de R$ 199 &bull; Parcelamento em até 12x sem juros
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 flex flex-col leading-none">
            <span className="text-brand-red font-display font-bold text-lg tracking-wide">
              INSUFARMA
            </span>
            <span className="text-brand-gold font-semibold text-xs tracking-[0.2em] uppercase">
              NATURALLI
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-brand-red transition-colors duration-150 rounded-md hover:bg-red-50"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Search */}
            <button
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Buscar produtos"
              className="p-2 rounded-md text-gray-600 hover:text-brand-red hover:bg-red-50 transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* WhatsApp (desktop) */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="hidden sm:flex p-2 rounded-md text-[#25D366] hover:bg-green-50 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
            </a>

            {/* User */}
            <Link
              href="/conta"
              aria-label="Minha conta"
              className="p-2 rounded-md text-gray-600 hover:text-brand-red hover:bg-red-50 transition-colors"
            >
              <User className="w-5 h-5" />
            </Link>

            {/* Cart */}
            <Link
              href="/carrinho"
              aria-label="Carrinho de compras"
              className="relative p-2 rounded-md text-gray-600 hover:text-brand-red hover:bg-red-50 transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 rounded-full bg-brand-red text-white text-[10px] font-bold">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
              className="md:hidden p-2 rounded-md text-gray-600 hover:text-brand-red hover:bg-red-50 transition-colors"
            >
              {mobileOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Search bar */}
        {searchOpen && (
          <div className="pb-3 animate-slide-down">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                autoFocus
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar suplementos, vitaminas..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent"
              />
            </div>
          </div>
        )}
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white animate-slide-down shadow-lg">
          <nav className="px-4 py-3 flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="px-3 py-3 text-sm font-medium text-gray-700 hover:text-brand-red hover:bg-red-50 rounded-md transition-colors border-b border-gray-50 last:border-0"
              >
                {link.label}
              </Link>
            ))}

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center gap-2 px-3 py-3 text-sm font-semibold text-[#25D366] bg-green-50 rounded-md"
            >
              <MessageCircle className="w-4 h-4" />
              Falar pelo WhatsApp
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
