import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Toaster } from "react-hot-toast";
import WhatsAppButton from "@/components/ui/WhatsAppButton";
import { CartProvider } from "@/context/CartContext";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "INSUFARMA NATURALLI | Suplementos Naturais Premium",
  description:
    "Descubra nossa linha exclusiva de suplementos naturais premium. Qualidade farmacêutica, resultados comprovados. Frete grátis acima de R$ 199.",
  keywords: [
    "suplementos naturais",
    "suplementos premium",
    "vitaminas",
    "minerais",
    "saúde natural",
    "insufarma",
    "naturalli",
    "suplementos Brasil",
  ],
  authors: [{ name: "INSUFARMA NATURALLI" }],
  creator: "INSUFARMA NATURALLI",
  publisher: "INSUFARMA NATURALLI",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "INSUFARMA NATURALLI",
    title: "INSUFARMA NATURALLI | Suplementos Naturais Premium",
    description:
      "Descubra nossa linha exclusiva de suplementos naturais premium. Qualidade farmacêutica, resultados comprovados.",
  },
  twitter: {
    card: "summary_large_image",
    title: "INSUFARMA NATURALLI | Suplementos Naturais Premium",
    description:
      "Descubra nossa linha exclusiva de suplementos naturais premium.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={inter.className}>
        <CartProvider>
          {children}
          <WhatsAppButton />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: { background: "#1a1a1a", color: "#fff", borderRadius: "8px", fontSize: "14px" },
              success: { iconTheme: { primary: "#C9A84C", secondary: "#fff" } },
              error: { iconTheme: { primary: "#8B0000", secondary: "#fff" } },
            }}
          />
        </CartProvider>
      </body>
    </html>
  );
}
