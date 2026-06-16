import type { Metadata } from "next";
import { ShieldCheck, Truck, RotateCcw, Star, Award } from "lucide-react";
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

const TRUST_ITEMS = [
  { icon: ShieldCheck, label: "Pagamento 100% Seguro" },
  { icon: Award, label: "Registro ANVISA" },
  { icon: Truck, label: "Frete grátis acima R$ 199" },
  { icon: RotateCcw, label: "7 dias para troca" },
  { icon: Star, label: "10.000+ clientes satisfeitos" },
];

function TrustBar() {
  return (
    <div className="bg-white border-y border-[#e8e0d5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-3">
          {TRUST_ITEMS.map(({ icon: Icon, label }, i) => (
            <div key={i} className="flex items-center gap-2 text-[#4a4a4a]">
              <Icon className="w-4 h-4 text-[#C9A84C] flex-shrink-0" />
              <span className="text-[12px] font-medium whitespace-nowrap">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <TrustBar />
      <BenefitsSection />
      {/* FeaturedProductsSection is async — wraps its own Suspense boundary */}
      <FeaturedProductsSection />
      <TestimonialsSection />
      <FAQSection />
      <CTABanner />
    </main>
  );
}
