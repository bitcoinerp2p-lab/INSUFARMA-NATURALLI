"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  Users,
  Tag,
  ShoppingCart,
  DollarSign,
  BarChart3,
  ScrollText,
  Menu,
  X,
  LogOut,
  ClipboardList,
  Contact,
} from "lucide-react";
import { cn } from "@/lib/utils";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/produtos", label: "Produtos", icon: Package },
  { href: "/admin/pedidos", label: "Pedidos", icon: ClipboardList },
  { href: "/admin/clientes", label: "Clientes", icon: Contact },
  { href: "/admin/afiliados", label: "Afiliados", icon: Users },
  { href: "/admin/cupons", label: "Cupons", icon: Tag },
  { href: "/admin/vendas", label: "Vendas", icon: ShoppingCart },
  { href: "/admin/financeiro", label: "Financeiro", icon: DollarSign },
  { href: "/admin/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/admin/logs", label: "Logs", icon: ScrollText },
];

function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch(`${BASE}/api/auth/logout`, { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 border-r border-gray-800 w-60">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-gray-800">
        <Link href="/" className="font-display font-bold text-base leading-tight">
          <span className="text-brand-red">Insufarma</span>
          <span className="text-brand-gold"> Naturalli</span>
        </Link>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-white ml-2"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-brand-red/20 text-brand-red border border-brand-red/30"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-gray-800">
        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Don't show sidebar on login page
  if (pathname === "/admin/login") {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-col fixed inset-y-0 left-0 z-30 w-60">
        <Sidebar />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-60 md:hidden transition-transform duration-200",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Sidebar onClose={() => setMobileOpen(false)} />
      </div>

      {/* Main content */}
      <div className="flex-1 md:ml-60 flex flex-col min-h-screen">
        {/* Mobile topbar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="text-gray-400 hover:text-white"
          >
            <Menu size={22} />
          </button>
          <span className="font-display font-bold text-sm">
            <span className="text-brand-red">Insufarma</span>
            <span className="text-brand-gold"> Naturalli</span>
          </span>
          <div className="w-6" />
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
