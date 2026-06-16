"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "";
const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

type Tab = "visao-geral" | "produtos" | "meus-links";
const TABS: { id: Tab; label: string }[] = [
  { id: "visao-geral", label: "Visão Geral" },
  { id: "produtos", label: "Produtos Disponíveis" },
  { id: "meus-links", label: "Meus Links" },
];

interface Stats { clicks: number; referredClients: number; totalSales: number; conversion: number; avgTicket: number; commissionPending: number; commissionAvailable: number; commissionPaid: number; walletPending: number; walletAvailable: number; totalEarned: number }
interface AffiliateInfo { id: string; name: string; code: string; commissionRate: number; commissionType: string }
interface RecentSale { grossAmount: number; commission: number; date: string }
interface DashboardData { stats: Stats; recentSales: RecentSale[]; affiliate: AffiliateInfo }
interface AffiliateProduct { id: string; name: string; slug: string; price: number; salePrice: number | null; imageUrl: string | null; commissionRate: number; commissionType: string; estimatedCommission: number }
interface AffiliateLink { id: string; productId: string | null; productName: string | null; productSlug: string | null; productImageUrl: string | null; url: string; clicks: number; sales: number; commission: number; conversion: number; createdAt: string }

function StatCard({ label, value, sub, color = "text-gray-900" }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function CopyBtn({ text, label = "Copiar" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button type="button" onClick={() => { navigator.clipboard.writeText(text).then(() => { setCopied(true); toast.success("Link copiado!"); setTimeout(() => setCopied(false), 2500); }); }}
      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex-shrink-0 ${copied ? "bg-green-600 text-white" : "bg-green-600 hover:bg-green-700 text-white"}`}>
      {copied ? "Copiado!" : label}
    </button>
  );
}

function ShareBtn({ url, title }: { url: string; title: string }) {
  return (
    <button type="button" onClick={() => { if (typeof navigator !== "undefined" && navigator.share) { navigator.share({ title, url }).catch(() => null); } else { navigator.clipboard.writeText(url).then(() => toast.success("Link copiado!")); } }}
      className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-colors flex-shrink-0">
      Compartilhar
    </button>
  );
}

export default function AfiliadorDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [products, setProducts] = useState<AffiliateProduct[]>([]);
  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [linksLoading, setLinksLoading] = useState(false);
  const [generatingLink, setGeneratingLink] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("visao-geral");
  const [productSearch, setProductSearch] = useState("");
  const [linksVersion, setLinksVersion] = useState(0);
  const productsLoadedRef = useRef(false);

  // Initial dashboard data load
  const load = useCallback(async () => {
    try {
      const [meRes, dashRes] = await Promise.all([
        fetch(`${BASE}/api/affiliate/auth/me`),
        fetch(`${BASE}/api/affiliate/dashboard`),
      ]);
      if (!meRes.ok) { router.push("/afiliado/login"); return; }
      if (!dashRes.ok) { toast.error("Erro ao carregar dados"); return; }
      setData(await dashRes.json());
    } catch { toast.error("Erro ao carregar dashboard"); }
    finally { setLoading(false); }
  }, [router]);

  useEffect(() => { load(); }, [load]);

  // Products: load once when tab is first opened
  useEffect(() => {
    if (activeTab !== "produtos" || productsLoadedRef.current) return;
    productsLoadedRef.current = true;
    setProductsLoading(true);
    let cancelled = false;
    fetch(`${BASE}/api/affiliate/products`)
      .then((r) => r.json())
      .then((json) => { if (!cancelled) setProducts(json.products ?? []); })
      .catch(() => { if (!cancelled) toast.error("Erro ao carregar produtos"); })
      .finally(() => { if (!cancelled) setProductsLoading(false); });
    return () => { cancelled = true; };
  }, [activeTab]);

  // Links: reload whenever linksVersion changes or tab is opened
  useEffect(() => {
    if (activeTab !== "meus-links") return;
    setLinksLoading(true);
    let cancelled = false;
    fetch(`${BASE}/api/affiliate/links`)
      .then((r) => r.json())
      .then((json) => { if (!cancelled) setLinks(json.links ?? []); })
      .catch(() => { if (!cancelled) toast.error("Erro ao carregar links"); })
      .finally(() => { if (!cancelled) setLinksLoading(false); });
    return () => { cancelled = true; };
  }, [activeTab, linksVersion]);

  async function logout() {
    await fetch(`${BASE}/api/affiliate/auth/logout`, { method: "POST" });
    router.push("/afiliado/login");
  }

  async function generateLink(productId: string, productName: string) {
    setGeneratingLink(productId);
    try {
      const res = await fetch(`${BASE}/api/affiliate/links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (!res.ok) throw new Error();
      const { url } = await res.json();
      await navigator.clipboard.writeText(url);
      toast.success(`Link de "${productName}" copiado!`);
      // Increment version to trigger a refresh of Meus Links tab
      setLinksVersion((v) => v + 1);
    } catch { toast.error("Erro ao gerar link"); }
    finally { setGeneratingLink(null); }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!data) return null;

  const { stats, recentSales, affiliate } = data;
  const affiliateLink = `${SITE}/?ref=${affiliate.code}`;
  const filteredProducts = productSearch.trim()
    ? products.filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase()))
    : products;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-gray-900 text-lg">Painel do Afiliado</h1>
            <p className="text-xs text-gray-500">Olá, {affiliate.name.split(" ")[0]} · Código: <span className="font-mono font-semibold text-green-700">{affiliate.code}</span></p>
          </div>
          <button type="button" onClick={logout} className="text-sm text-gray-500 hover:text-gray-900 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors">Sair</button>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex border-t border-gray-100">
          {TABS.map((tab) => (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? "border-green-600 text-green-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Visão Geral ── */}
        {activeTab === "visao-geral" && (
          <div className="space-y-8">
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Seu Link de Afiliado</h2>
              <div className="flex gap-3 items-center">
                <input readOnly value={affiliateLink} className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 bg-gray-50 font-mono truncate focus:outline-none" />
                <CopyBtn text={affiliateLink} />
              </div>
              <p className="text-xs text-gray-400 mt-2">Comissão: {affiliate.commissionRate}% {affiliate.commissionType === "FIXED" ? "fixo" : "por venda"}</p>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Resultados</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Cliques" value={stats.clicks.toLocaleString("pt-BR")} />
                <StatCard label="Clientes Cadastrados" value={stats.referredClients.toLocaleString("pt-BR")} />
                <StatCard label="Vendas Realizadas" value={stats.totalSales.toLocaleString("pt-BR")} />
                <StatCard label="Conversão" value={`${stats.conversion.toFixed(1)}%`} />
                <StatCard label="Ticket Médio" value={fmt(stats.avgTicket)} />
                <StatCard label="Comissão Pendente" value={fmt(stats.commissionPending)} sub="Liberação em 7 dias" color="text-amber-600" />
                <StatCard label="Comissão Aprovada" value={fmt(stats.commissionAvailable)} color="text-green-600" />
                <StatCard label="Comissão Paga" value={fmt(stats.commissionPaid)} color="text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Carteira</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-amber-50 rounded-xl"><p className="text-xs text-amber-700 mb-1">Saldo Pendente</p><p className="text-xl font-bold text-amber-700">{fmt(stats.walletPending)}</p></div>
                <div className="text-center p-4 bg-green-50 rounded-xl"><p className="text-xs text-green-700 mb-1">Saldo Disponível</p><p className="text-xl font-bold text-green-700">{fmt(stats.walletAvailable)}</p></div>
                <div className="text-center p-4 bg-gray-50 rounded-xl"><p className="text-xs text-gray-600 mb-1">Total Ganho</p><p className="text-xl font-bold text-gray-800">{fmt(stats.totalEarned)}</p></div>
              </div>
            </div>

            {recentSales.length > 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100"><h2 className="text-sm font-semibold text-gray-700">Últimas Vendas</h2></div>
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-100 text-gray-400 text-xs uppercase"><th className="text-left px-6 py-3">Data</th><th className="text-right px-6 py-3">Valor</th><th className="text-right px-6 py-3">Comissão</th></tr></thead>
                  <tbody>
                    {recentSales.map((s, i) => (
                      <tr key={i} className={`hover:bg-gray-50 ${i !== 0 ? "border-t border-gray-100" : ""}`}>
                        <td className="px-6 py-3 text-gray-600">{new Date(s.date).toLocaleDateString("pt-BR")}</td>
                        <td className="px-6 py-3 text-right text-gray-800 font-medium">{fmt(s.grossAmount)}</td>
                        <td className="px-6 py-3 text-right text-green-600 font-semibold">{fmt(s.commission)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center"><p className="text-gray-400 text-sm">Nenhuma venda ainda. Compartilhe seu link para começar!</p></div>
            )}
          </div>
        )}

        {/* ── Produtos Disponíveis ── */}
        {activeTab === "produtos" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="font-semibold text-gray-800">Produtos para Divulgar</h2>
              <input type="text" placeholder="Buscar produto…" value={productSearch} onChange={(e) => setProductSearch(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 w-64" />
            </div>
            {productsLoading ? (
              <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" /></div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center"><p className="text-gray-400 text-sm">Nenhum produto encontrado.</p></div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredProducts.map((p) => (
                  <div key={p.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col">
                    <div className="w-full aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
                      {p.imageUrl
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                        : <span className="text-4xl">🌿</span>}
                    </div>
                    <div className="p-4 flex flex-col flex-1 gap-3">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">{p.name}</p>
                        <p className="text-gray-500 text-sm mt-1">{fmt(p.salePrice ?? p.price)}</p>
                      </div>
                      <div className="bg-green-50 rounded-lg px-3 py-2 text-xs text-green-700 flex justify-between">
                        <span>Comissão: {p.commissionType === "PERCENTAGE" ? `${p.commissionRate}%` : fmt(p.commissionRate)}</span>
                        <span className="font-semibold">≈ {fmt(p.estimatedCommission)}</span>
                      </div>
                      <button type="button" disabled={generatingLink === p.id} onClick={() => generateLink(p.id, p.name)}
                        className="mt-auto w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
                        {generatingLink === p.id ? "Gerando…" : "Gerar Link"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Meus Links ── */}
        {activeTab === "meus-links" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">Meus Links de Produto</h2>
              <button type="button" onClick={() => setLinksVersion((v) => v + 1)} className="text-xs text-green-600 hover:underline">Atualizar</button>
            </div>
            {linksLoading ? (
              <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" /></div>
            ) : links.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <p className="text-gray-400 text-sm mb-2">Nenhum link gerado ainda.</p>
                <p className="text-gray-400 text-xs">Vá para <button type="button" onClick={() => setActiveTab("produtos")} className="text-green-600 hover:underline">Produtos Disponíveis</button> e clique em "Gerar Link".</p>
              </div>
            ) : (
              <div className="space-y-4">
                {links.map((link) => (
                  <div key={link.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {link.productImageUrl
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={link.productImageUrl} alt={link.productName ?? ""} className="w-full h-full object-cover" />
                          : <span className="text-2xl">🌿</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">{link.productName ?? "Produto"}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <input readOnly value={link.url} className="flex-1 min-w-0 px-2 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-500 bg-gray-50 font-mono focus:outline-none truncate" />
                          <CopyBtn text={link.url} />
                          <ShareBtn url={link.url} title={link.productName ?? "Produto"} />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-100">
                      <div className="text-center"><p className="text-lg font-bold text-gray-900">{link.clicks}</p><p className="text-xs text-gray-400">Cliques</p></div>
                      <div className="text-center"><p className="text-lg font-bold text-gray-900">{link.sales}</p><p className="text-xs text-gray-400">Vendas</p></div>
                      <div className="text-center"><p className="text-lg font-bold text-green-600">{link.conversion.toFixed(1)}%</p><p className="text-xs text-gray-400">Conversão</p></div>
                      <div className="text-center"><p className="text-lg font-bold text-green-700">{fmt(link.commission)}</p><p className="text-xs text-gray-400">Comissão</p></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link href="/" className="text-sm text-green-600 hover:underline">← Voltar à loja</Link>
        </div>
      </main>
    </div>
  );
}
