import type { Metadata } from "next";
import HeroSection from "@/components/store/HeroSection";
import BenefitsSection from "@/components/store/BenefitsSection";
import FeaturedProductsSection from "@/components/store/FeaturedProductsSection";
import TestimonialsSection from "@/components/store/TestimonialsSection";
import FAQSection from "@/components/store/FAQSection";
import CTABanner from "@/components/store/CTABanner";

export const metadata: Metadata = {
  title: "Insufarma Naturalli — Suplementos Naturais de Alta Qualidade",
  description:
    "Suplementos naturais selecionados por especialistas. Entrega para todo o Brasil, atendimento especializado e compra 100% segura.",
  openGraph: {
    title: "Insufarma Naturalli — Suplementos Naturais de Alta Qualidade",
    description:
      "Suplementos naturais selecionados por especialistas. Entrega para todo o Brasil, atendimento especializado e compra 100% segura.",
    type: "website",
  },
};

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <BenefitsSection />
      {/* FeaturedProductsSection is async — wraps its own Suspense boundary */}
      <FeaturedProductsSection />
      <TestimonialsSection />
      <FAQSection />
      <CTABanner />
    </main>
  );
}
