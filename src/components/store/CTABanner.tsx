"use client";

import { motion } from "framer-motion";

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "5581982488234";

export default function CTABanner() {
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    "Olá! Quero começar minha jornada de saúde com a Naturalli. Pode me ajudar?"
  )}`;

  return (
    <section className="relative py-24 overflow-hidden bg-[#1a0a00]">
      {/* Background layers */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#6B0000]/70 via-[#1a0a00] to-[#1a0a00]" />
        <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-[#8B0000]/15 to-transparent" />
        <div className="absolute bottom-0 left-0 right-1/2 h-px bg-gradient-to-r from-transparent to-[#C9A84C]/25" />
        <div className="absolute top-0 left-0 right-1/2 h-px bg-gradient-to-r from-transparent to-[#C9A84C]/15" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="lg:col-span-7"
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 text-[11px] font-semibold tracking-[0.14em] text-[#C9A84C] border border-[#C9A84C]/30 rounded-full mb-8 uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] animate-pulse" />
              Comece hoje
            </span>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-[56px] font-bold text-white leading-[1.08] mb-6">
              Comece sua jornada<br />
              <span className="text-[#C9A84C]">de saúde hoje.</span>
            </h2>
            <p className="text-white/55 text-lg max-w-lg leading-relaxed">
              Fale com nosso especialista pelo WhatsApp e receba uma consultoria gratuita
              para montar o protocolo ideal para você.
            </p>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.12, ease: "easeOut" }}
            className="lg:col-span-5 flex flex-col items-start lg:items-end gap-4"
          >
            <motion.a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="inline-flex items-center gap-3 px-8 py-5 bg-[#C9A84C] text-[#1a1a1a] font-bold text-[16px] rounded-2xl shadow-[0_8px_32px_rgba(201,168,76,0.35)] hover:bg-[#D4B96A] transition-colors"
            >
              <WhatsAppIcon />
              Falar com Especialista
            </motion.a>
            <p className="text-white/30 text-[13px]">
              Segunda a sábado&nbsp;·&nbsp;8h às 20h&nbsp;·&nbsp;Resposta em minutos
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function WhatsAppIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-6 h-6 text-[#25D366]"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.558 4.122 1.528 5.855L.057 23.75a.75.75 0 0 0 .944.943l5.925-1.47A11.952 11.952 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.726 9.726 0 0 1-4.953-1.352l-.354-.212-3.664.91.926-3.583-.23-.368A9.724 9.724 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z" />
    </svg>
  );
}
