import Link from "next/link";
import { MapPin, Mail, Phone } from "lucide-react";

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP ?? "5511999999999";
const WHATSAPP_FORMATTED = "(11) 99999-9999";

const quickLinks = [
  { label: "Início", href: "/" },
  { label: "Produtos", href: "/produtos" },
  { label: "Blog", href: "/blog" },
  { label: "Sobre nós", href: "/sobre" },
  { label: "Contato", href: "/contato" },
  { label: "Minha conta", href: "/conta" },
];

const categories = [
  { label: "Vitaminas e Minerais", href: "/produtos?categoria=vitaminas" },
  { label: "Proteínas", href: "/produtos?categoria=proteinas" },
  { label: "Emagrecedores", href: "/produtos?categoria=emagrecedores" },
  { label: "Imunidade", href: "/produtos?categoria=imunidade" },
  { label: "Performance", href: "/produtos?categoria=performance" },
  { label: "Saúde Intestinal", href: "/produtos?categoria=intestinal" },
];

// Inline SVGs for social icons to avoid external dependency issues
function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
      <path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" />
    </svg>
  );
}

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#1a1a1a] text-gray-300">
      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <div className="mb-4">
              <span className="block text-white font-display font-bold text-xl tracking-wide">
                INSUFARMA
              </span>
              <span className="block text-brand-gold font-semibold text-xs tracking-[0.25em] uppercase">
                NATURALLI
              </span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-6">
              Suplementos naturais premium com qualidade farmacêutica.
              Resultados comprovados para sua saúde e bem-estar.
            </p>

            {/* Social icons */}
            <div className="flex items-center gap-3">
              <a
                href="https://instagram.com/insufarmanaturalli"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex items-center justify-center w-9 h-9 rounded-full bg-white/10 text-gray-300 hover:bg-brand-gold hover:text-black transition-colors duration-200"
              >
                <InstagramIcon />
              </a>
              <a
                href="https://facebook.com/insufarmanaturalli"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="flex items-center justify-center w-9 h-9 rounded-full bg-white/10 text-gray-300 hover:bg-brand-gold hover:text-black transition-colors duration-200"
              >
                <FacebookIcon />
              </a>
              <a
                href="https://youtube.com/@insufarmanaturalli"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="flex items-center justify-center w-9 h-9 rounded-full bg-white/10 text-gray-300 hover:bg-brand-gold hover:text-black transition-colors duration-200"
              >
                <YouTubeIcon />
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4 pb-2 border-b border-brand-gold/30">
              Links Rápidos
            </h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-brand-gold transition-colors duration-150"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4 pb-2 border-b border-brand-gold/30">
              Categorias
            </h3>
            <ul className="space-y-2">
              {categories.map((cat) => (
                <li key={cat.href}>
                  <Link
                    href={cat.href}
                    className="text-sm text-gray-400 hover:text-brand-gold transition-colors duration-150"
                  >
                    {cat.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4 pb-2 border-b border-brand-gold/30">
              Contato
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href={`https://wa.me/${WHATSAPP}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 text-sm text-gray-400 hover:text-brand-gold transition-colors"
                >
                  <Phone className="w-4 h-4 mt-0.5 flex-shrink-0 text-brand-gold" />
                  <span>{WHATSAPP_FORMATTED}</span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:contato@insufarmanaturalli.com.br"
                  className="flex items-start gap-2 text-sm text-gray-400 hover:text-brand-gold transition-colors"
                >
                  <Mail className="w-4 h-4 mt-0.5 flex-shrink-0 text-brand-gold" />
                  <span>contato@insufarmanaturalli.com.br</span>
                </a>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-400">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-brand-gold" />
                <span>
                  Av. Paulista, 1000 — Bela Vista
                  <br />
                  São Paulo — SP, 01310-100
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-white/10" />

      {/* Bottom bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <p>
            &copy; {currentYear} INSUFARMA NATURALLI. Todos os direitos
            reservados. CNPJ 43.423.730/0001-08
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/politica-de-privacidade"
              className="hover:text-brand-gold transition-colors"
            >
              Política de Privacidade
            </Link>
            <span className="text-gray-700">|</span>
            <Link
              href="/termos-de-uso"
              className="hover:text-brand-gold transition-colors"
            >
              Termos de Uso
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
