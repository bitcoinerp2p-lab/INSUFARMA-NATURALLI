import type { ReactNode } from "react";

export const metadata = {
  title: "Área do Afiliado — Insufarma Naturalli",
};

export default function AfiliadoLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}
