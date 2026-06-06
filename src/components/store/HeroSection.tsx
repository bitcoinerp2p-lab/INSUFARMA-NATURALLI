"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "5511999999999";

export default function HeroSection() {
  const floatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame: number;
    let start: number | null = null;

    function animate(ts: number) {
      if (!start) start = ts;
      const elapsed = ts - start;
      const y = Math.sin(elapsed / 1200) * 14;
      if (floatRef.current) {
        floatRef.current.style.transform = `translateY(${y}px)`;
      }
      frame = requestAnimationFrame(animate);
    }

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    "Olá! Gostaria de falar com um especialista sobre suplementos naturais."
  )}`;

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-brand-red-dark via-brand-red to-black">
      {/* decorative rings */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full border border-brand-gold/10" />
        <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full border border-brand-gold/10" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full bg-black/30 blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* text column */}
          <div className="animate-slide-up">
            <span className="inline-block px-4 py-1 text-xs font-semibold tracking-widest text-brand-gold border border-brand-gold/40 rounded-full mb-6 uppercase">
              Suplementos Premium
            </span>

            <h1 className="font-display text-4xl sm:text-5xl xl:text-6xl font-bold text-white leading-tight mb-6">
              Controle sua saúde com suplementos{" "}
              <span className="text-brand-gold">naturais de alta qualidade</span>
            </h1>

            <p className="text-gray-300 text-lg sm:text-xl leading-relaxed mb-10 max-w-lg">
              Produtos selecionados por especialistas para apoiar sua saúde, disposição
              e bem-estar de forma segura e eficaz.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/produtos"
                className="inline-flex items-center justify-center px-8 py-4 bg-brand-gold text-black font-bold rounded-lg hover:bg-brand-gold-light transition-all duration-200 shadow-lg hover:shadow-brand-gold/30 hover:-translate-y-0.5 text-base"
              >
                Comprar Agora
              </Link>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 backdrop-blur border border-white/20 text-white font-semibold rounded-lg hover:bg-white/20 transition-all duration-200 text-base"
              >
                <WhatsAppIcon />
                Falar com Especialista
              </a>
            </div>

            <div className="mt-12 flex items-center gap-8">
              <Stat value="10k+" label="Clientes satisfeitos" />
              <div className="w-px h-10 bg-white/20" />
              <Stat value="500+" label="Produtos disponíveis" />
              <div className="w-px h-10 bg-white/20" />
              <Stat value="5★" label="Avaliação média" />
            </div>
          </div>

          {/* floating product placeholder */}
          <div className="hidden lg:flex justify-center items-center">
            <div ref={floatRef} className="relative">
              <div className="w-72 h-72 rounded-3xl bg-white/5 backdrop-blur border border-brand-gold/20 flex items-center justify-center shadow-2xl">
                <div className="text-center px-8">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-brand-gold/20 flex items-center justify-center">
                    <span className="text-4xl">🌿</span>
                  </div>
                  <p className="text-brand-gold font-display font-bold text-xl">
                    Naturalli
                  </p>
                  <p className="text-white/60 text-sm mt-1">Premium Supplements</p>
                </div>
              </div>
              {/* glow */}
              <div className="absolute inset-0 rounded-3xl bg-brand-gold/10 blur-2xl -z-10" />
            </div>
          </div>
        </div>
      </div>

      {/* wave divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path
            d="M0 60L48 50C96 40 192 20 288 15C384 10 480 20 576 28.3C672 36.7 768 43.3 864 41.7C960 40 1056 30 1152 23.3C1248 16.7 1344 13.3 1392 11.7L1440 10V60H1392C1344 60 1248 60 1152 60C1056 60 960 60 864 60C768 60 672 60 576 60C480 60 384 60 288 60C192 60 96 60 48 60H0Z"
            fill="white"
          />
        </svg>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-brand-gold font-bold text-2xl">{value}</p>
      <p className="text-white/60 text-xs mt-0.5">{label}</p>
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-5 h-5 text-green-400"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.558 4.122 1.528 5.855L.057 23.75a.75.75 0 0 0 .944.943l5.925-1.47A11.952 11.952 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.726 9.726 0 0 1-4.953-1.352l-.354-.212-3.664.91.926-3.583-.23-.368A9.724 9.724 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z" />
    </svg>
  );
}
