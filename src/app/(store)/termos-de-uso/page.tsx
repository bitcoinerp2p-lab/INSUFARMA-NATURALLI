import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Termos de Uso — Insufarma Naturalli",
  description:
    "Leia os Termos de Uso da Insufarma Naturalli. Condições para uso do site, compras, pagamentos, entregas e devoluções.",
};

const LAST_UPDATE = "16 de junho de 2025";

export default function TermosDeUsoPage() {
  return (
    <div className="min-h-screen bg-[#fafaf8]">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#8B0000] via-[#6B0000] to-[#1a0000] py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-block px-4 py-1.5 text-[11px] font-semibold tracking-[0.14em] text-[#C9A84C] border border-[#C9A84C]/35 rounded-full mb-5 uppercase">
            Legal
          </span>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-white mb-3">
            Termos de Uso
          </h1>
          <p className="text-white/60 text-sm">Última atualização: {LAST_UPDATE}</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-14 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl border border-[#e8e0d5] p-8 sm:p-12 space-y-10 text-[15px] leading-relaxed text-[#4a4a4a]">

            <Article number="1" title="Identificação">
              <p>
                O site <strong className="text-[#1a1a1a]">insufarmanaturalli.com.br</strong> é
                operado por <strong className="text-[#1a1a1a]">INSUFARMA NATURALLI LTDA</strong>,
                pessoa jurídica de direito privado inscrita no CNPJ sob o nº{" "}
                <strong className="text-[#1a1a1a]">55.092.320/0001-00</strong>, com sede na Av.
                Paulista, 1000 — Bela Vista, São Paulo/SP, CEP 01310-100.
              </p>
              <p className="mt-3">
                Para entrar em contato: e-mail{" "}
                <a href="mailto:suportetaskium@gmail.com" className="text-[#8B0000] hover:underline">
                  suportetaskium@gmail.com
                </a>{" "}
                ou WhatsApp{" "}
                <a href="https://wa.me/5581982488234" target="_blank" rel="noopener noreferrer" className="text-[#8B0000] hover:underline">
                  (81) 98248-8234
                </a>
                .
              </p>
            </Article>

            <Article number="2" title="Aceitação dos Termos">
              <p>
                Ao acessar ou usar nosso site, realizar um cadastro ou efetuar uma compra, o
                usuário declara ter lido, compreendido e aceitado estes Termos de Uso na sua
                totalidade. Caso não concorde com qualquer condição, recomendamos que não utilize
                nossos serviços.
              </p>
            </Article>

            <Article number="3" title="Serviços Oferecidos">
              <p>A Insufarma Naturalli oferece:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Venda online de suplementos naturais e produtos correlatos;</li>
                <li>Consultoria gratuita via WhatsApp para indicação de produtos;</li>
                <li>Programa de afiliados para divulgação e comissionamento;</li>
                <li>Conteúdo informativo em blog sobre saúde e nutrição.</li>
              </ul>
              <p className="mt-3">
                Os produtos comercializados são destinados a pessoas maiores de 18 anos. Consulte
                sempre um profissional de saúde antes de iniciar qualquer suplementação.
              </p>
            </Article>

            <Article number="4" title="Cadastro e Conta">
              <p>
                Para realizar compras é necessário criar uma conta, fornecendo informações
                verdadeiras, precisas e atualizadas. O usuário é responsável pela guarda de sua
                senha e por todas as atividades realizadas em sua conta.
              </p>
              <p className="mt-3">
                A Insufarma Naturalli reserva-se o direito de suspender ou encerrar contas que
                violem estes termos, apresentem informações falsas ou realizem qualquer atividade
                fraudulenta.
              </p>
            </Article>

            <Article number="5" title="Pedidos e Pagamentos">
              <p>
                Após a confirmação do pedido, o usuário receberá um e-mail de confirmação. O
                contrato de compra e venda considera-se celebrado somente após a confirmação do
                pagamento.
              </p>
              <p className="mt-3">Formas de pagamento aceitas:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Pix (desconto de 5% sobre o valor total);</li>
                <li>Cartão de crédito em até 10× sem juros;</li>
                <li>Cartão de débito;</li>
                <li>Boleto bancário (prazo de compensação de até 3 dias úteis).</li>
              </ul>
              <p className="mt-3">
                Os preços exibidos incluem todos os tributos devidos, exceto o frete, que é
                calculado no momento do checkout. O frete é gratuito para pedidos acima de R$&nbsp;199.
              </p>
            </Article>

            <Article number="6" title="Entrega">
              <p>
                Os prazos de entrega são estimados e contados em dias úteis a partir da
                confirmação do pagamento:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Capitais e regiões metropolitanas: 2 a 4 dias úteis;</li>
                <li>Demais localidades: 5 a 10 dias úteis.</li>
              </ul>
              <p className="mt-3">
                Após o despacho, o código de rastreamento será enviado por e-mail. A Insufarma
                Naturalli não se responsabiliza por atrasos causados por transportadoras, eventos
                de força maior ou erros de endereço fornecidos pelo usuário.
              </p>
            </Article>

            <Article number="7" title="Trocas e Devoluções">
              <p>
                Em conformidade com o Art. 49 do Código de Defesa do Consumidor (Lei
                8.078/1990), o usuário pode exercer o direito de arrependimento em até{" "}
                <strong className="text-[#1a1a1a]">7 dias corridos</strong> após o recebimento
                do produto, sem qualquer custo adicional.
              </p>
              <p className="mt-3">
                Para trocas por defeito ou produto divergente do anunciado, o prazo é de 30
                dias. O produto deve estar lacrado, sem sinais de uso e em embalagem original.
                Entre em contato via WhatsApp ou e-mail para iniciar o processo.
              </p>
            </Article>

            <Article number="8" title="Programa de Afiliados">
              <p>
                O Programa de Afiliados permite que terceiros divulguem os produtos da Insufarma
                Naturalli e recebam comissão sobre as vendas realizadas por meio de seus links
                exclusivos. As regras específicas de comissionamento, pagamento e rescisão são
                detalhadas no painel do afiliado após aprovação do cadastro.
              </p>
              <p className="mt-3">
                O afiliado não pode veicular publicidade enganosa, associar a marca a conteúdos
                inadequados ou violar diretrizes de plataformas de anúncios. O descumprimento
                implica desligamento imediato e retenção de eventuais comissões pendentes.
              </p>
            </Article>

            <Article number="9" title="Propriedade Intelectual">
              <p>
                Todo o conteúdo disponível no site — incluindo textos, imagens, logotipos,
                layouts, banco de dados e código-fonte — é de propriedade exclusiva da Insufarma
                Naturalli ou de seus licenciantes, protegido pela Lei de Direitos Autorais (Lei
                9.610/1998) e demais normas aplicáveis.
              </p>
              <p className="mt-3">
                É proibida a reprodução, redistribuição ou uso comercial de qualquer conteúdo sem
                autorização prévia e por escrito.
              </p>
            </Article>

            <Article number="10" title="Limitação de Responsabilidade">
              <p>
                A Insufarma Naturalli não se responsabiliza por danos indiretos, incidentais ou
                consequenciais decorrentes do uso do site ou dos produtos, incluindo resultados
                individuais de saúde que possam variar de acordo com cada organismo.
              </p>
              <p className="mt-3">
                As informações fornecidas no site têm caráter educativo e não substituem o
                aconselhamento de profissionais de saúde habilitados.
              </p>
            </Article>

            <Article number="11" title="Alterações nos Termos">
              <p>
                Estes Termos podem ser atualizados a qualquer momento. A versão vigente sempre
                será publicada nesta página com a data da última atualização. O uso continuado do
                site após as alterações implica aceitação das novas condições.
              </p>
            </Article>

            <Article number="12" title="Foro">
              <p>
                Fica eleito o foro da comarca de São Paulo/SP para dirimir quaisquer
                controvérsias oriundas destes Termos, com renúncia de qualquer outro, por mais
                privilegiado que seja.
              </p>
            </Article>
          </div>

          <div className="mt-8 text-center">
            <p className="text-[#9a9a9a] text-sm">
              Dúvidas sobre estes termos?{" "}
              <Link href="/contato" className="text-[#8B0000] font-semibold hover:underline">
                Entre em contato →
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function Article({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline gap-3 mb-4">
        <span className="font-display text-[13px] font-bold text-[#C9A84C]/60 tabular-nums flex-shrink-0">
          {String(number).padStart(2, "0")}
        </span>
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#1a1a1a]">
          {title}
        </h2>
      </div>
      <div className="pl-9">{children}</div>
    </div>
  );
}
