"use client";

import { motion } from "framer-motion";

interface Testimonial {
  name: string;
  role: string;
  stars: number;
  comment: string;
  initials: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Ana Carolina S.",
    role: "Cliente há 2 anos",
    stars: 5,
    comment:
      "Os suplementos da Naturalli transformaram minha rotina. Sinto muito mais disposição e os produtos chegam sempre dentro do prazo. Recomendo de olhos fechados!",
    initials: "AC",
  },
  {
    name: "Ricardo M.",
    role: "Atleta amador",
    stars: 5,
    comment:
      "Excelente qualidade nos produtos e atendimento impecável. O especialista me ajudou a montar o protocolo ideal para meu treino. Resultados visíveis em poucas semanas.",
    initials: "RM",
  },
  {
    name: "Fernanda O.",
    role: "Nutricionista",
    stars: 5,
    comment:
      "Indico para meus pacientes com confiança. Produtos com rastreabilidade comprovada e laudo de qualidade. A Naturalli se destaca no mercado pela seriedade.",
    initials: "FO",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const card = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", damping: 28, stiffness: 240 },
  },
};

export default function TestimonialsSection() {
  return (
    <section className="py-24 bg-[#f5f0eb]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className="inline-block px-4 py-1.5 text-[11px] font-semibold tracking-[0.14em] text-[#8B0000] border border-[#8B0000]/25 rounded-full mb-6 uppercase">
            Depoimentos
          </span>
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-[#1a1a1a] mb-4 leading-[1.12]">
            O que nossos clientes dizem
          </h2>
          <p className="text-[#4a4a4a] text-lg">
            Mais de 10.000 clientes confiam na Naturalli para cuidar da saúde.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {TESTIMONIALS.map((t) => (
            <TestimonialCard key={t.name} testimonial={t} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <motion.div
      variants={card}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
      className="bg-white rounded-2xl p-8 border border-[#e8e0d5] hover:border-[#C9A84C]/30 hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] transition-[border-color,box-shadow] duration-300 flex flex-col"
    >
      {/* Large decorative quote */}
      <div className="font-display text-6xl text-[#C9A84C]/22 leading-none mb-2 -mt-2 select-none">
        &ldquo;
      </div>

      <Stars count={testimonial.stars} />

      <blockquote className="mt-4 text-[#4a4a4a] leading-relaxed text-[15px] flex-1">
        {testimonial.comment}
      </blockquote>

      <div className="mt-8 pt-6 border-t border-[#f5f0eb] flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#8B0000] flex items-center justify-center flex-shrink-0 ring-2 ring-[#C9A84C]/25 ring-offset-1">
          <span className="text-white font-bold text-sm">{testimonial.initials}</span>
        </div>
        <div>
          <p className="font-semibold text-[#1a1a1a] text-sm">{testimonial.name}</p>
          <p className="text-[#9a9a9a] text-xs mt-0.5">{testimonial.role}</p>
        </div>
      </div>
    </motion.div>
  );
}

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${count} estrelas`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`w-4 h-4 ${i < count ? "text-[#C9A84C]" : "text-[#e8e0d5]"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}
