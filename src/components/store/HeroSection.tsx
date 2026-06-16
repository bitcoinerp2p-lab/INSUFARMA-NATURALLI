"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "5511999999999";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 32 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", damping: 28, stiffness: 260 },
  },
};

export default function HeroSection() {
  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    "Olá! Gostaria de falar com um especialista sobre suplementos naturais."
  )}`;

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#8B0000] via-[#6B0000] to-[#1a0000]" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-black/40 to-transparent" />
        <div className="absolute top-1/4 right-[15%] w-px h-48 bg-gradient-to-b from-transparent via-[#C9A84C]/30 to-transparent" />
        <div className="absolute top-1/3 right-[22%] w-px h-32 bg-gradient-to-b from-transparent via-[#C9A84C]/18 to-transparent" />
        <div className="absolute bottom-1/4 left-[5%] w-64 h-64 rounded-full border border-white/5" />
        <div className="absolute top-1/4 left-[8%] w-32 h-32 rounded-full border border-[#C9A84C]/10" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Text column */}
          <motion.div
            className="lg:col-span-7"
            variants={container}
            initial="hidden"
            animate="show"
          >
            <motion.span
              variants={item}
              className="inline-flex items-center gap-2 px-4 py-1.5 text-[11px] font-semibold tracking-[0.14em] text-[#C9A84C] border border-[#C9A84C]/35 rounded-full mb-8 uppercase"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] inline-block" />
              Suplementos Premium
            </motion.span>

            <motion.h1
              variants={item}
              className="font-display font-bold text-white leading-[1.08] mb-6"
            >
              <span className="block text-4xl sm:text-5xl xl:text-[64px]">
                Controle sua saúde
              </span>
              <span className="block text-4xl sm:text-5xl xl:text-[64px]">
                com suplementos
              </span>
              <span className="block text-4xl sm:text-5xl xl:text-[64px] text-[#C9A84C]">
                naturais.
              </span>
            </motion.h1>

            <motion.p
              variants={item}
              className="text-white/65 text-lg sm:text-xl leading-relaxed mb-10 max-w-[520px]"
            >
              Produtos selecionados por especialistas para apoiar sua saúde,
              disposição e bem-estar de forma segura e eficaz.
            </motion.p>

            <motion.div variants={item} className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/produtos"
                className="inline-flex items-center justify-center px-8 py-4 bg-[#C9A84C] text-[#1a1a1a] font-bold rounded-xl hover:bg-[#D4B96A] transition-all duration-200 shadow-[0_4px_20px_rgba(201,168,76,0.4)] hover:shadow-[0_8px_32px_rgba(201,168,76,0.5)] hover:-translate-y-0.5 text-[15px]"
              >
                Comprar Agora
              </Link>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-white/8 backdrop-blur border border-white/18 text-white font-semibold rounded-xl hover:bg-white/16 hover:border-white/28 transition-all duration-200 text-[15px]"
              >
                <WhatsAppIcon />
                Falar com Especialista
              </a>
            </motion.div>

            {/* Stats */}
            <motion.div variants={item} className="mt-12 flex items-center gap-8">
              <Stat value="10k+" label="Clientes satisfeitos" />
              <div className="w-px h-10 bg-white/15" />
              <Stat value="500+" label="Produtos disponíveis" />
              <div className="w-px h-10 bg-white/15" />
              <Stat value="5★" label="Avaliação média" />
            </motion.div>
          </motion.div>

          {/* Visual column */}
          <div className="hidden lg:flex lg:col-span-5 justify-center items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
              className="relative"
            >
              {/* Rotating outer ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-8 rounded-full border border-[#C9A84C]/12"
              />
              {/* Glow */}
              <div className="absolute inset-0 rounded-3xl bg-[#C9A84C]/8 blur-3xl scale-125" />

              {/* Main card */}
              <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="relative w-72 h-72 rounded-3xl bg-white/6 backdrop-blur-md border border-[#C9A84C]/20 flex items-center justify-center shadow-[0_32px_64px_rgba(0,0,0,0.3)]"
              >
                <div className="text-center px-8">
                  <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-[#C9A84C]/15 border border-[#C9A84C]/25 flex items-center justify-center">
                    <BotanicalIcon />
                  </div>
                  <p className="font-display font-bold text-white text-xl tracking-wide">
                    Naturalli
                  </p>
                  <p className="text-[#C9A84C]/70 text-[13px] mt-1 tracking-[0.06em]">
                    Premium Supplements
                  </p>
                </div>
              </motion.div>

              {/* Badge rating */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9, duration: 0.5 }}
                className="absolute -right-6 top-8 bg-white rounded-2xl px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
              >
                <p className="text-[#8B0000] font-bold text-lg leading-none">5★</p>
                <p className="text-[#9a9a9a] text-[11px] mt-0.5">Avaliação</p>
              </motion.div>

              {/* Badge clientes */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.1, duration: 0.5 }}
                className="absolute -left-6 bottom-12 bg-white rounded-2xl px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
              >
                <p className="text-[#8B0000] font-bold text-lg leading-none">10k+</p>
                <p className="text-[#9a9a9a] text-[11px] mt-0.5">Clientes</p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Wave divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1440 60"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full"
        >
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
      <p className="text-[#C9A84C] font-bold text-2xl leading-none">{value}</p>
      <p className="text-white/50 text-xs mt-1 tracking-wide">{label}</p>
    </div>
  );
}

function BotanicalIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
      <path
        d="M24 40C24 40 10 30 10 18C10 11.373 16.373 6 24 6C31.627 6 38 11.373 38 18C38 30 24 40 24 40Z"
        stroke="#C9A84C"
        strokeWidth="1.5"
        fill="#C9A84C"
        fillOpacity="0.15"
      />
      <path d="M24 40V20" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M24 28C24 28 18 24 16 18" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M24 32C24 32 30 28 32 22" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-5 h-5 text-[#25D366]"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.558 4.122 1.528 5.855L.057 23.75a.75.75 0 0 0 .944.943l5.925-1.47A11.952 11.952 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.726 9.726 0 0 1-4.953-1.352l-.354-.212-3.664.91.926-3.583-.23-.368A9.724 9.724 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z" />
    </svg>
  );
}
