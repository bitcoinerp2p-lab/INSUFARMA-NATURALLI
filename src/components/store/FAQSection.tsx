"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "Os suplementos Naturalli são seguros?",
    answer:
      "Sim. Todos os produtos passam por rigoroso controle de qualidade e possuem registro na ANVISA. Trabalhamos apenas com fabricantes certificados e realizamos auditorias periódicas para garantir a segurança e eficácia de cada item.",
  },
  {
    question: "Qual o prazo de entrega?",
    answer:
      "O prazo varia conforme a região: capitais e regiões metropolitanas geralmente recebem em 2 a 4 dias úteis; demais localidades de 5 a 10 dias úteis. Após o envio você receberá o código de rastreamento por e-mail.",
  },
  {
    question: "Posso trocar ou devolver um produto?",
    answer:
      "Aceitamos trocas e devoluções em até 7 dias corridos após o recebimento, conforme o Código de Defesa do Consumidor. O produto deve estar lacrado e sem sinais de uso. Entre em contato conosco pelo WhatsApp para iniciar o processo.",
  },
  {
    question: "Como escolher o suplemento certo para mim?",
    answer:
      "Recomendamos consultar nossos especialistas via WhatsApp ou agendar uma orientação gratuita. Nossa equipe avalia seu objetivo, histórico de saúde e rotina para indicar o protocolo mais adequado.",
  },
  {
    question: "Quais formas de pagamento são aceitas?",
    answer:
      "Aceitamos Pix (com 5% de desconto), cartão de crédito em até 10x sem juros, cartão de débito e boleto bancário. Todas as transações são processadas em ambiente seguro com criptografia SSL.",
  },
  {
    question: "Os preços do site são os mesmos do WhatsApp?",
    answer:
      "Sim. Nossos preços são os mesmos em todos os canais. No WhatsApp você tem a vantagem de receber atendimento personalizado e pode negociar kits ou compras em maior volume com condições especiais.",
  },
];

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP ?? "5511999999999";

export default function FAQSection() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Left: heading */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="lg:col-span-4"
          >
            <span className="inline-block px-4 py-1.5 text-[11px] font-semibold tracking-[0.14em] text-[#8B0000] border border-[#8B0000]/25 rounded-full mb-6 uppercase">
              Dúvidas Frequentes
            </span>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-[#1a1a1a] leading-[1.12] mb-4">
              Perguntas<br />frequentes
            </h2>
            <p className="text-[#4a4a4a] text-[15px] leading-relaxed mb-8">
              Não encontrou o que procura? Fale conosco no WhatsApp.
            </p>
            <a
              href={`https://wa.me/${WHATSAPP}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[#25D366] font-semibold text-[14px] hover:opacity-80 transition-opacity"
            >
              <WhatsAppIcon />
              Chamar no WhatsApp
            </a>
          </motion.div>

          {/* Right: accordion */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            className="lg:col-span-8"
          >
            <div className="divide-y divide-[#e8e0d5]">
              {FAQ_ITEMS.map((item, index) => (
                <AccordionItem key={index} item={item} index={index} />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function AccordionItem({ item, index }: { item: FAQItem; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-start justify-between gap-6 py-5 text-left group"
        aria-expanded={open}
      >
        <div className="flex items-start gap-4">
          <span className="font-display text-[13px] font-bold text-[#C9A84C]/60 mt-0.5 tabular-nums flex-shrink-0 w-6">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span
            className={`font-semibold text-[15px] leading-snug transition-colors ${
              open ? "text-[#8B0000]" : "text-[#1a1a1a] group-hover:text-[#8B0000]"
            }`}
          >
            {item.question}
          </span>
        </div>
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full border border-[#C9A84C]/50 flex items-center justify-center text-[#C9A84C]"
        >
          <svg
            className="w-2.5 h-2.5"
            fill="none"
            viewBox="0 0 10 10"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" d="M5 1v8M1 5h8" />
          </svg>
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="pl-10 pb-5 text-[#4a4a4a] leading-relaxed text-[14px]">
              {item.answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.558 4.122 1.528 5.855L.057 23.75a.75.75 0 0 0 .944.943l5.925-1.47A11.952 11.952 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.726 9.726 0 0 1-4.953-1.352l-.354-.212-3.664.91.926-3.583-.23-.368A9.724 9.724 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z" />
    </svg>
  );
}
