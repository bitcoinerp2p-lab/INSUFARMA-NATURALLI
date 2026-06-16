"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ShoppingCart, User, Menu, X, MessageCircle } from "lucide-react";

const NAV_LINKS = [
  { label: "Início", href: "/" },
  { label: "Produtos", href: "/produtos" },
  { label: "Blog", href: "/blog" },
  { label: "Sobre", href: "/sobre" },
  { label: "Contato", href: "/contato" },
];

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP ?? "5581982488234";
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
    const handleScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-sm shadow-[0_1px_24px_rgba(0,0,0,0.08)]"
          : "bg-white shadow-[0_1px_0_#e8e0d5]"
      }`}
    >
      {/* Announcement bar */}
      <div className="bg-[#8B0000] text-white text-[11px] font-medium text-center py-2 px-4 tracking-[0.08em]">
        FRETE GRÁTIS ACIMA DE R$&thinsp;199&nbsp;&nbsp;·&nbsp;&nbsp;PARCELAMENTO EM ATÉ 12× SEM JUROS
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 group flex flex-col leading-none">
            <span className="font-display font-bold text-lg tracking-wide text-[#8B0000] group-hover:text-[#A50000] transition-colors">
              INSUFARMA
            </span>
            <span className="text-[#C9A84C] font-semibold text-[10px] tracking-[0.22em] uppercase">
              NATURALLI
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3.5 py-2 text-sm font-medium text-[#4a4a4a] hover:text-[#8B0000] hover:bg-[#8B0000]/5 transition-colors duration-150 rounded-md"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-0.5 sm:gap-1">
            <button
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Buscar produtos"
              className="p-2.5 rounded-lg text-[#4a4a4a] hover:text-[#8B0000] hover:bg-[#8B0000]/5 transition-colors"
            >
              <Search style={{ width: 18, height: 18 }} />
            </button>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="hidden sm:flex p-2.5 rounded-lg text-[#25D366] hover:bg-green-50 transition-colors"
            >
              <MessageCircle style={{ width: 18, height: 18 }} />
            </a>

            <Link
              href="/conta"
              aria-label="Minha conta"
              className="p-2.5 rounded-lg text-[#4a4a4a] hover:text-[#8B0000] hover:bg-[#8B0000]/5 transition-colors"
            >
              <User style={{ width: 18, height: 18 }} />
            </Link>

            <Link
              href="/carrinho"
              aria-label="Carrinho de compras"
              className="relative p-2.5 rounded-lg text-[#4a4a4a] hover:text-[#8B0000] hover:bg-[#8B0000]/5 transition-colors"
            >
              <ShoppingCart style={{ width: 18, height: 18 }} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-[18px] h-[18px] rounded-full bg-[#8B0000] text-white text-[9px] font-bold">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>

            <button
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
              className="md:hidden p-2.5 rounded-lg text-[#4a4a4a] hover:text-[#8B0000] hover:bg-[#8B0000]/5 transition-colors"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={mobileOpen ? "close" : "open"}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="block"
                >
                  {mobileOpen ? (
                    <X style={{ width: 18, height: 18 }} />
                  ) : (
                    <Menu style={{ width: 18, height: 18 }} />
                  )}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </div>

        {/* Search bar */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="pb-3">
                <div className="relative">
                  <Search
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9a9a9a]"
                    style={{ width: 15, height: 15 }}
                  />
                  <input
                    autoFocus
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar suplementos, vitaminas..."
                    className="w-full pl-10 pr-4 py-2.5 border border-[#e8e0d5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8B0000]/20 focus:border-[#8B0000]/40 bg-[#fafaf8] placeholder:text-[#9a9a9a]"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="md:hidden overflow-hidden border-t border-[#e8e0d5] bg-white shadow-lg"
          >
            <nav className="px-4 py-3 flex flex-col gap-0.5">
              {NAV_LINKS.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ x: -16, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.05, duration: 0.2 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block px-3 py-3.5 text-sm font-medium text-[#4a4a4a] hover:text-[#8B0000] hover:bg-[#8B0000]/5 rounded-lg transition-colors border-b border-[#f5f0eb] last:border-0"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}

              <motion.a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ x: -16, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: NAV_LINKS.length * 0.05, duration: 0.2 }}
                className="mt-2 flex items-center gap-2.5 px-3 py-3.5 text-sm font-semibold text-[#25D366] bg-green-50 rounded-xl"
              >
                <MessageCircle style={{ width: 16, height: 16 }} />
                Falar pelo WhatsApp
              </motion.a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
