import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidade — Insufarma Naturalli",
  description:
    "Saiba como a Insufarma Naturalli coleta, usa e protege seus dados pessoais conforme a LGPD (Lei 13.709/2018).",
};

const LAST_UPDATE = "16 de junho de 2025";

export default function PoliticaPrivacidadePage() {
  return (
    <div className="min-h-screen bg-[#fafaf8]">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#8B0000] via-[#6B0000] to-[#1a0000] py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-block px-4 py-1.5 text-[11px] font-semibold tracking-[0.14em] text-[#C9A84C] border border-[#C9A84C]/35 rounded-full mb-5 uppercase">
            Legal · LGPD
          </span>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-white mb-3">
            Política de Privacidade
          </h1>
          <p className="text-white/60 text-sm">Última atualização: {LAST_UPDATE}</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-14 px-4">
        <div className="max-w-3xl mx-auto">
          {/* LGPD notice */}
          <div className="mb-8 p-5 bg-[#C9A84C]/8 border border-[#C9A84C]/25 rounded-2xl">
            <p className="text-[#4a4a4a] text-[14px] leading-relaxed">
              <strong className="text-[#1a1a1a]">Resumo:</strong> Coletamos apenas os dados
              necessários para processar suas compras e melhorar sua experiência. Nunca vendemos
              seus dados. Você tem controle total e pode solicitar exclusão a qualquer momento.
              Esta política está em conformidade com a{" "}
              <strong className="text-[#1a1a1a]">Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018)</strong>.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-[#e8e0d5] p-8 sm:p-12 space-y-10 text-[15px] leading-relaxed text-[#4a4a4a]">

            <Article number="1" title="Controlador dos Dados">
              <p>
                O controlador dos dados pessoais é a{" "}
                <strong className="text-[#1a1a1a]">INSUFARMA NATURALLI LTDA</strong>, CNPJ{" "}
                <strong className="text-[#1a1a1a]">55.092.320/0001-00</strong>.
              </p>
              <p className="mt-3">
                Para exercer seus direitos ou tirar dúvidas sobre privacidade, entre em contato
                pelo e-mail{" "}
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

            <Article number="2" title="Dados Coletados">
              <p>Coletamos as seguintes categorias de dados:</p>
              <div className="mt-4 space-y-4">
                <DataCategory
                  title="Dados de cadastro"
                  items={["Nome completo", "E-mail", "CPF", "Telefone", "Data de nascimento", "Senha (armazenada com hash bcrypt)"]}
                />
                <DataCategory
                  title="Dados de entrega"
                  items={["Endereço completo (logradouro, número, complemento, bairro, cidade, estado, CEP)"]}
                />
                <DataCategory
                  title="Dados de pagamento"
                  items={["Método de pagamento escolhido", "Últimos 4 dígitos do cartão (tokenizado)", "Status da transação — não armazenamos número completo do cartão"]}
                />
                <DataCategory
                  title="Dados de navegação"
                  items={["Endereço IP", "Cookies de sessão", "Páginas visitadas", "UTM e origem de afiliado (para comissionamento)"]}
                />
              </div>
            </Article>

            <Article number="3" title="Finalidade do Tratamento">
              <p>Seus dados são utilizados para:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Processar, entregar e rastrear seus pedidos;</li>
                <li>Realizar cobranças e emitir notas fiscais;</li>
                <li>Enviar confirmações de pedido e atualizações de status por e-mail;</li>
                <li>Calcular comissões do programa de afiliados;</li>
                <li>Melhorar nossos produtos, conteúdos e experiência de compra;</li>
                <li>Cumprir obrigações legais e fiscais;</li>
                <li>Prevenir fraudes e garantir a segurança da plataforma.</li>
              </ul>
            </Article>

            <Article number="4" title="Base Legal (LGPD)">
              <p>O tratamento dos dados é realizado com base em:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>
                  <strong className="text-[#1a1a1a]">Execução de contrato</strong> (Art. 7º, V):
                  dados necessários para processar seus pedidos;
                </li>
                <li>
                  <strong className="text-[#1a1a1a]">Obrigação legal</strong> (Art. 7º, II):
                  emissão de notas fiscais e retenções tributárias;
                </li>
                <li>
                  <strong className="text-[#1a1a1a]">Legítimo interesse</strong> (Art. 7º, IX):
                  prevenção de fraudes e melhorias na plataforma;
                </li>
                <li>
                  <strong className="text-[#1a1a1a]">Consentimento</strong> (Art. 7º, I):
                  envio de comunicações de marketing (opt-in).
                </li>
              </ul>
            </Article>

            <Article number="5" title="Compartilhamento de Dados">
              <p>
                Não vendemos seus dados. Compartilhamos somente quando necessário com:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>
                  <strong className="text-[#1a1a1a]">Processadores de pagamento</strong> (Mercado Pago):
                  para autorização de transações;
                </li>
                <li>
                  <strong className="text-[#1a1a1a]">Transportadoras</strong>: nome, endereço e
                  telefone para entrega dos pedidos;
                </li>
                <li>
                  <strong className="text-[#1a1a1a]">Autoridades fiscais/regulatórias</strong>:
                  quando exigido por lei;
                </li>
                <li>
                  <strong className="text-[#1a1a1a]">Afiliados</strong>: apenas métricas
                  agregadas de conversão, sem identificação do comprador.
                </li>
              </ul>
            </Article>

            <Article number="6" title="Retenção dos Dados">
              <p>Mantemos seus dados pelos seguintes prazos:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Dados de conta ativa: enquanto a conta existir;</li>
                <li>Dados de pedidos: 5 anos (obrigação fiscal);</li>
                <li>Logs de acesso: 6 meses (Marco Civil da Internet, Lei 12.965/2014);</li>
                <li>Dados de marketing: até revogação do consentimento.</li>
              </ul>
            </Article>

            <Article number="7" title="Seus Direitos como Titular">
              <p>Conforme a LGPD (Art. 18), você tem direito a:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Confirmar a existência de tratamento de seus dados;</li>
                <li>Acessar os dados que mantemos sobre você;</li>
                <li>Corrigir dados incompletos, inexatos ou desatualizados;</li>
                <li>Solicitar anonimização, bloqueio ou eliminação de dados desnecessários;</li>
                <li>Portabilidade dos dados a outro fornecedor;</li>
                <li>Revogar o consentimento dado a qualquer momento;</li>
                <li>Opor-se a tratamento realizado sem base em consentimento.</li>
              </ul>
              <p className="mt-3">
                Para exercer qualquer desses direitos, envie sua solicitação para{" "}
                <a href="mailto:suportetaskium@gmail.com" className="text-[#8B0000] hover:underline">
                  suportetaskium@gmail.com
                </a>
                . Respondemos em até 15 dias úteis.
              </p>
            </Article>

            <Article number="8" title="Segurança">
              <p>
                Adotamos medidas técnicas e organizacionais para proteger seus dados, incluindo:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Transmissão de dados via HTTPS com certificado SSL;</li>
                <li>Senhas armazenadas com hash bcrypt;</li>
                <li>Tokens JWT com tempo de expiração para autenticação;</li>
                <li>Acesso restrito a dados pessoais por função (princípio do menor privilégio);</li>
                <li>Backups regulares com criptografia.</li>
              </ul>
              <p className="mt-3">
                Em caso de incidente de segurança que possa acarretar risco aos titulares,
                notificaremos a ANPD e os afetados no prazo legal.
              </p>
            </Article>

            <Article number="9" title="Cookies">
              <p>Utilizamos os seguintes tipos de cookies:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>
                  <strong className="text-[#1a1a1a]">Essenciais:</strong> sessão de login e
                  carrinho de compras — não podem ser desativados;
                </li>
                <li>
                  <strong className="text-[#1a1a1a]">Rastreamento de afiliado:</strong> identificam
                  o afiliado que indicou a visita;
                </li>
                <li>
                  <strong className="text-[#1a1a1a]">Analíticos:</strong> dados anonimizados de
                  navegação para melhorar a plataforma.
                </li>
              </ul>
              <p className="mt-3">
                Você pode desativar cookies analíticos nas configurações do seu navegador.
              </p>
            </Article>

            <Article number="10" title="Alterações nesta Política">
              <p>
                Esta Política pode ser atualizada a qualquer momento. A versão vigente sempre
                será publicada nesta página com a data de revisão. Alterações significativas
                serão comunicadas por e-mail ou aviso no site.
              </p>
            </Article>
          </div>

          <div className="mt-8 text-center">
            <p className="text-[#9a9a9a] text-sm">
              Dúvidas sobre privacidade?{" "}
              <Link href="/contato" className="text-[#8B0000] font-semibold hover:underline">
                Fale conosco →
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

function DataCategory({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="bg-[#fafaf8] rounded-xl p-4 border border-[#e8e0d5]">
      <p className="font-semibold text-[#1a1a1a] text-[13px] uppercase tracking-[0.06em] mb-2">
        {title}
      </p>
      <ul className="space-y-0.5">
        {items.map((item) => (
          <li key={item} className="text-[14px] text-[#4a4a4a] flex items-start gap-2">
            <span className="text-[#C9A84C] mt-0.5 flex-shrink-0">·</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
