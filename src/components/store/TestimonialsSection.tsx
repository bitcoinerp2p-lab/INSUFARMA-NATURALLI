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

export default function TestimonialsSection() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-block px-4 py-1 text-xs font-semibold tracking-widest text-brand-red border border-brand-red/30 rounded-full mb-4 uppercase">
            Depoimentos
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            O que nossos clientes dizem
          </h2>
          <p className="text-gray-500 text-lg">
            Mais de 10.000 clientes confiam na Naturalli para cuidar da saúde.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((t) => (
            <TestimonialCard key={t.name} testimonial={t} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col">
      <Stars count={testimonial.stars} />

      <blockquote className="mt-4 text-gray-600 leading-relaxed flex-1">
        &ldquo;{testimonial.comment}&rdquo;
      </blockquote>

      <div className="mt-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-brand-red flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-sm">{testimonial.initials}</span>
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-sm">{testimonial.name}</p>
          <p className="text-gray-400 text-xs">{testimonial.role}</p>
        </div>
      </div>
    </div>
  );
}

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${count} estrelas`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`w-4 h-4 ${i < count ? "text-brand-gold" : "text-gray-200"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}
