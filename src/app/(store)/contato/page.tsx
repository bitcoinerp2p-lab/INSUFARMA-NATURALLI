"use client";

import { motion } from "framer-motion";
import { Mail, Phone, Clock, MapPin, MessageCircle } from "lucide-react";

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP ?? "5581982488234";
const whatsappUrl = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
  "Olá! Gostaria de mais informações sobre os produtos da Naturalli."
)}`;

const item = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", damping: 28, stiffness: 260 },
  },
};

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

export default function ContatoPage() {
  return (
    <div className="min-h-screen bg-[#fafaf8]">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#8B0000] via-[#6B0000] to-[#1a0000] text-white py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 right-[10%] w-px h-40 bg-gradient-to-b from-transparent via-[#C9A84C]/25 to-transparent" />
          <div className="absolute bottom-1/4 left-[8%] w-48 h-48 rounded-full border border-white/5" />
        </div>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 text-[11px] font-semibold tracking-[0.14em] text-[#C9A84C] border border-[#C9A84C]/35 rounded-full mb-6 uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]" />
              Atendimento
            </span>
            <h1 className="font-display text-4xl sm:text-5xl font-bold mb-4 leading-[1.1]">
              Entre em contato
            </h1>
            <p className="text-white/70 text-lg max-w-xl mx-auto">
              Estamos prontos para te ajudar a escolher o suplemento ideal ou
              esclarecer qualquer dúvida sobre seus pedidos.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Cards de contato */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {/* WhatsApp */}
            <motion.a
              variants={item}
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ y: -4 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="flex flex-col items-center text-center p-8 bg-white rounded-2xl border border-[#e8e0d5] hover:border-[#25D366]/40 hover:shadow-[0_8px_32px_rgba(37,211,102,0.12)] transition-[border,box-shadow] duration-300 group"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#25D366]/10 flex items-center justify-center mb-5 group-hover:bg-[#25D366]/20 transition-colors">
                <MessageCircle className="w-7 h-7 text-[#25D366]" />
              </div>
              <h3 className="font-semibold text-[#1a1a1a] text-lg mb-1">WhatsApp</h3>
              <p className="text-[#9a9a9a] text-sm mb-3">Resposta rápida</p>
              <p className="text-[#25D366] font-bold text-lg">(81) 98248-8234</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#25D366] opacity-70 group-hover:opacity-100 transition-opacity">
                Iniciar conversa →
              </span>
            </motion.a>

            {/* Email */}
            <motion.a
              variants={item}
              href="mailto:suportetaskium@gmail.com"
              whileHover={{ y: -4 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="flex flex-col items-center text-center p-8 bg-white rounded-2xl border border-[#e8e0d5] hover:border-[#8B0000]/30 hover:shadow-[0_8px_32px_rgba(139,0,0,0.08)] transition-[border,box-shadow] duration-300 group"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#8B0000]/8 flex items-center justify-center mb-5 group-hover:bg-[#8B0000]/14 transition-colors">
                <Mail className="w-7 h-7 text-[#8B0000]" />
              </div>
              <h3 className="font-semibold text-[#1a1a1a] text-lg mb-1">E-mail</h3>
              <p className="text-[#9a9a9a] text-sm mb-3">Resposta em até 24h</p>
              <p className="text-[#8B0000] font-medium text-[14px] break-all">
                suportetaskium@gmail.com
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#8B0000] opacity-60 group-hover:opacity-100 transition-opacity">
                Enviar e-mail →
              </span>
            </motion.a>

            {/* Horário */}
            <motion.div
              variants={item}
              className="flex flex-col items-center text-center p-8 bg-white rounded-2xl border border-[#e8e0d5]"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#C9A84C]/12 flex items-center justify-center mb-5">
                <Clock className="w-7 h-7 text-[#C9A84C]" />
              </div>
              <h3 className="font-semibold text-[#1a1a1a] text-lg mb-1">Horário</h3>
              <p className="text-[#9a9a9a] text-sm mb-4">Atendimento presencial</p>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between gap-8">
                  <span className="text-[#4a4a4a]">Segunda – Sexta</span>
                  <span className="font-semibold text-[#1a1a1a]">8h – 18h</span>
                </div>
                <div className="flex justify-between gap-8">
                  <span className="text-[#4a4a4a]">Sábado</span>
                  <span className="font-semibold text-[#1a1a1a]">8h – 13h</span>
                </div>
                <div className="flex justify-between gap-8">
                  <span className="text-[#4a4a4a]">Domingo</span>
                  <span className="text-[#9a9a9a]">Fechado</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Fale pelo WhatsApp CTA */}
      <section className="pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-[#1a0a00] rounded-3xl p-10 sm:p-12 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#6B0000]/60 to-transparent pointer-events-none" />
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
              <div>
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-3 leading-[1.12]">
                  Precisa de ajuda agora?
                </h2>
                <p className="text-white/55 text-[15px] max-w-md">
                  Nossa equipe responde em minutos pelo WhatsApp, mesmo fora do horário comercial.
                </p>
              </div>
              <motion.a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                className="flex-shrink-0 inline-flex items-center gap-3 px-7 py-4 bg-[#C9A84C] text-[#1a1a1a] font-bold text-[15px] rounded-xl shadow-[0_8px_32px_rgba(201,168,76,0.3)] hover:bg-[#D4B96A] transition-colors"
              >
                <WhatsAppIcon />
                Falar pelo WhatsApp
              </motion.a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ rápido */}
      <section className="pb-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[#9a9a9a] text-[15px]">
            Com dúvidas sobre prazos, pagamentos ou produtos?{" "}
            <a href="/#faq" className="text-[#8B0000] font-semibold hover:underline">
              Veja nossas perguntas frequentes →
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-[#25D366]">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.558 4.122 1.528 5.855L.057 23.75a.75.75 0 0 0 .944.943l5.925-1.47A11.952 11.952 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.726 9.726 0 0 1-4.953-1.352l-.354-.212-3.664.91.926-3.583-.23-.368A9.724 9.724 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z" />
    </svg>
  );
}
