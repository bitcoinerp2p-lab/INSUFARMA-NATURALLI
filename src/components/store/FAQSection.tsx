"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

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

export default function FAQSection() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1 text-xs font-semibold tracking-widest text-brand-red border border-brand-red/30 rounded-full mb-4 uppercase">
            Dúvidas Frequentes
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Perguntas frequentes
          </h2>
          <p className="text-gray-500 text-lg">
            Não encontrou o que procura? Fale conosco no WhatsApp.
          </p>
        </div>

        <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
          {FAQ_ITEMS.map((item, index) => (
            <AccordionItem key={index} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}

function AccordionItem({ item }: { item: FAQItem }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-start justify-between gap-4 px-6 py-5 text-left hover:bg-gray-50 transition-colors"
        aria-expanded={open}
      >
        <span className="font-semibold text-gray-900 text-base">{item.question}</span>
        <ChevronIcon open={open} />
      </button>

      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <p className="px-6 pb-5 text-gray-600 leading-relaxed text-sm">{item.answer}</p>
      </div>
    </div>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={cn(
        "w-5 h-5 text-brand-red flex-shrink-0 mt-0.5 transition-transform duration-300",
        open ? "rotate-180" : "rotate-0"
      )}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}
