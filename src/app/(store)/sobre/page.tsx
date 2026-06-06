import Link from "next/link";

export const metadata = {
  title: "Sobre Nós — Insufarma Naturalli",
  description:
    "Conheça a Insufarma Naturalli: nossa missão, valores e o compromisso com suplementos naturais de alta qualidade para sua saúde e bem-estar.",
};

export default function SobrePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-red to-brand-red-light text-white py-20 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <h1 className="font-display text-4xl sm:text-5xl font-bold mb-4">
            Sobre a Insufarma Naturalli
          </h1>
          <p className="text-white/85 text-lg leading-relaxed">
            Acreditamos que a natureza tem o poder de transformar a saúde. Nossa missão é levar suplementos naturais de qualidade farmacêutica até você.
          </p>
        </div>
      </section>

      {/* Missão / Visão / Valores */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="text-4xl mb-4">🎯</div>
              <h2 className="font-display font-bold text-xl text-gray-900 mb-3">Missão</h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                Oferecer suplementos naturais com eficácia comprovada, acessíveis a todos que buscam uma vida mais saudável e equilibrada.
              </p>
            </div>
            <div className="text-center p-8 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="text-4xl mb-4">🔭</div>
              <h2 className="font-display font-bold text-xl text-gray-900 mb-3">Visão</h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                Ser referência nacional em suplementos naturais, reconhecida pela qualidade, transparência e compromisso com o bem-estar dos nossos clientes.
              </p>
            </div>
            <div className="text-center p-8 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="text-4xl mb-4">💚</div>
              <h2 className="font-display font-bold text-xl text-gray-900 mb-3">Valores</h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                Qualidade, transparência, responsabilidade com a saúde humana e respeito pela natureza guiam cada produto que desenvolvemos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Nossa história */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto max-w-3xl">
          <h2 className="font-display text-3xl font-bold text-gray-900 mb-8 text-center">Nossa História</h2>
          <div className="prose prose-gray max-w-none space-y-5 text-gray-600 leading-relaxed">
            <p>
              A <strong className="text-gray-900">Insufarma Naturalli</strong> nasceu da convicção de que a medicina natural, aliada ao rigor científico, pode transformar a qualidade de vida das pessoas. Fundada por profissionais da área da saúde apaixonados pela fitoterapia e pela nutrologia, a empresa surgiu com o propósito de democratizar o acesso a suplementos naturais de alto padrão.
            </p>
            <p>
              Cada fórmula é desenvolvida com base em evidências científicas, utilizando ativos vegetais selecionados, vitaminas e minerais nas formas mais biodisponíveis e eficazes. Nossa equipe acompanha as mais recentes pesquisas da área para garantir que nossos produtos estejam sempre na vanguarda da nutrição funcional.
            </p>
            <p>
              Trabalhamos apenas com fornecedores certificados, e todos os nossos produtos passam por rigoroso controle de qualidade antes de chegarem às suas mãos. Transparência é um valor inegociável: você encontra em cada embalagem a composição completa, as formas químicas utilizadas e as dosagens exatas.
            </p>
          </div>
        </div>
      </section>

      {/* Diferenciais */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <h2 className="font-display text-3xl font-bold text-gray-900 mb-10 text-center">Por que escolher a Naturalli?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { icon: "🔬", title: "Fórmulas Baseadas em Ciência", desc: "Cada ativo é escolhido com base em estudos clínicos. Sem ingredientes sem comprovação." },
              { icon: "🌿", title: "100% Natural", desc: "Não utilizamos corantes artificiais, conservantes desnecessários ou substâncias proibidas." },
              { icon: "✅", title: "Controle de Qualidade Rigoroso", desc: "Todos os lotes passam por análises laboratoriais antes do envio ao cliente." },
              { icon: "🚚", title: "Entrega Rápida e Segura", desc: "Embalagem reforçada, frete grátis acima de R$199 e rastreamento em tempo real." },
              { icon: "💬", title: "Suporte Especializado", desc: "Nossa equipe está pronta para tirar dúvidas sobre saúde, produtos e dosagens." },
              { icon: "🔁", title: "Satisfação Garantida", desc: "Não ficou satisfeito? Entre em contato em até 7 dias e resolvemos para você." },
            ].map((item) => (
              <div key={item.title} className="flex gap-4 p-6 rounded-2xl border border-gray-100 hover:border-brand-red/30 hover:bg-brand-red/5 transition-colors">
                <span className="text-3xl flex-shrink-0">{item.icon}</span>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-brand-red text-white text-center">
        <div className="container mx-auto max-w-2xl">
          <h2 className="font-display text-3xl font-bold mb-4">Pronto para cuidar da sua saúde?</h2>
          <p className="text-white/85 mb-8">
            Explore nossa linha completa de suplementos naturais e encontre o produto ideal para você.
          </p>
          <Link
            href="/produtos"
            className="inline-block bg-white text-brand-red font-bold px-8 py-4 rounded-xl hover:bg-brand-gold hover:text-white transition-colors text-base"
          >
            Ver Produtos
          </Link>
        </div>
      </section>
    </div>
  );
}
