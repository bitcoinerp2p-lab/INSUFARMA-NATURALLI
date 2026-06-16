"use client";

import { motion } from "framer-motion";

interface Benefit {
  number: string;
  title: string;
  description: string;
}

const BENEFITS: Benefit[] = [
  {
    number: "01",
    title: "Produtos Selecionados",
    description:
      "Cada produto é rigorosamente selecionado por especialistas em nutrição e saúde.",
  },
  {
    number: "02",
    title: "Atendimento Especializado",
    description:
      "Nossa equipe está pronta para orientar você na escolha do melhor suplemento.",
  },
  {
    number: "03",
    title: "Entrega para Todo Brasil",
    description:
      "Enviamos para todos os estados com frete rápido e rastreamento em tempo real.",
  },
  {
    number: "04",
    title: "Compra Segura",
    description:
      "Ambiente 100% seguro com criptografia SSL e pagamento protegido.",
  },
  {
    number: "05",
    title: "Suporte Pós-venda",
    description:
      "Continuamos ao seu lado após a compra para garantir os melhores resultados.",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", damping: 28, stiffness: 260 },
  },
};

export default function BenefitsSection() {
  return (
    <section className="py-24 bg-[#fafaf8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header — left-aligned for visual variety */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-16 max-w-xl"
        >
          <span className="inline-block px-4 py-1.5 text-[11px] font-semibold tracking-[0.14em] text-[#8B0000] border border-[#8B0000]/25 rounded-full mb-6 uppercase">
            Por que nos escolher
          </span>
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-[#1a1a1a] leading-[1.12] mb-4">
            Benefícios que fazem<br />a diferença
          </h2>
          <p className="text-[#4a4a4a] text-lg">
            Comprometidos com a sua saúde e bem-estar em cada etapa da sua jornada.
          </p>
        </motion.div>

        {/* Benefits — unified bordered grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 border border-[#e8e0d5] rounded-2xl overflow-hidden divide-y sm:divide-y-0 divide-[#e8e0d5] lg:divide-x lg:divide-y-0"
        >
          {BENEFITS.map((benefit) => (
            <motion.div
              key={benefit.number}
              variants={item}
              whileHover={{ backgroundColor: "#FFFFFF" }}
              className="flex flex-col p-8 bg-white cursor-default group transition-colors duration-300"
            >
              <span className="font-display text-4xl font-bold text-[#8B0000]/10 group-hover:text-[#C9A84C]/30 transition-colors mb-4 leading-none select-none">
                {benefit.number}
              </span>
              <h3 className="font-semibold text-[#1a1a1a] text-[15px] mb-2 leading-snug">
                {benefit.title}
              </h3>
              <p className="text-[#9a9a9a] text-sm leading-relaxed">
                {benefit.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
