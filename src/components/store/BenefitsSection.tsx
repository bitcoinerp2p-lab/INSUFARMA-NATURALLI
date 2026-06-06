import { cn } from "@/lib/utils";

interface Benefit {
  icon: string;
  title: string;
  description: string;
}

const BENEFITS: Benefit[] = [
  {
    icon: "✓",
    title: "Produtos Selecionados",
    description:
      "Cada produto é rigorosamente selecionado por especialistas em nutrição e saúde.",
  },
  {
    icon: "✓",
    title: "Atendimento Especializado",
    description:
      "Nossa equipe está pronta para orientar você na escolha do melhor suplemento.",
  },
  {
    icon: "✓",
    title: "Entrega para Todo Brasil",
    description:
      "Enviamos para todos os estados com frete rápido e rastreamento em tempo real.",
  },
  {
    icon: "✓",
    title: "Compra Segura",
    description:
      "Ambiente 100% seguro com criptografia SSL e pagamento protegido.",
  },
  {
    icon: "✓",
    title: "Suporte Pós-venda",
    description:
      "Continuamos ao seu lado após a compra para garantir os melhores resultados.",
  },
];

export default function BenefitsSection() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          tag="Por que nos escolher"
          title="Benefícios que fazem a diferença"
          subtitle="Comprometidos com a sua saúde e bem-estar em cada etapa da sua jornada."
        />

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {BENEFITS.map((benefit, index) => (
            <BenefitCard key={benefit.title} benefit={benefit} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function BenefitCard({
  benefit,
  index,
}: {
  benefit: Benefit;
  index: number;
}) {
  const delay = `${index * 100}ms`;
  return (
    <div
      className={cn(
        "group flex flex-col items-center text-center p-6 rounded-2xl border border-gray-100",
        "hover:border-brand-gold/30 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
      )}
      style={{ animationDelay: delay }}
    >
      <div className="w-12 h-12 rounded-full bg-brand-red/10 flex items-center justify-center mb-4 group-hover:bg-brand-red/20 transition-colors">
        <span className="text-brand-red font-bold text-xl">{benefit.icon}</span>
      </div>
      <h3 className="font-display font-bold text-gray-900 mb-2 text-base">
        {benefit.title}
      </h3>
      <p className="text-gray-500 text-sm leading-relaxed">{benefit.description}</p>
    </div>
  );
}

function SectionHeader({
  tag,
  title,
  subtitle,
}: {
  tag: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="text-center max-w-2xl mx-auto">
      <span className="inline-block px-4 py-1 text-xs font-semibold tracking-widest text-brand-red border border-brand-red/30 rounded-full mb-4 uppercase">
        {tag}
      </span>
      <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
        {title}
      </h2>
      <p className="text-gray-500 text-lg">{subtitle}</p>
    </div>
  );
}
