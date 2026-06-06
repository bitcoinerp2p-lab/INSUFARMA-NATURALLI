import { PrismaClient, CouponType, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando seed do banco de dados...");

  // ─── Admin User ─────────────────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash("admin123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@insufarma.com.br" },
    update: {},
    create: {
      name: "Administrador Insufarma",
      email: "admin@insufarma.com.br",
      password: hashedPassword,
      role: Role.ADMIN,
      phone: "11999999999",
    },
  });

  console.log(`Admin criado: ${admin.email}`);

  // ─── Categories ──────────────────────────────────────────────────────────────
  const categoriesData = [
    {
      name: "Diabetes",
      slug: "diabetes",
      description:
        "Suplementos naturais para controle glicêmico e suporte ao metabolismo da glicose.",
      image: "/images/categories/diabetes.jpg",
      active: true,
    },
    {
      name: "Emagrecimento",
      slug: "emagrecimento",
      description:
        "Fórmulas naturais para auxiliar no emagrecimento saudável e controle do peso.",
      image: "/images/categories/emagrecimento.jpg",
      active: true,
    },
    {
      name: "Energia e Disposição",
      slug: "energia",
      description:
        "Suplementos para aumentar energia, vitalidade e disposição no dia a dia.",
      image: "/images/categories/energia.jpg",
      active: true,
    },
    {
      name: "Imunidade",
      slug: "imunidade",
      description:
        "Vitaminas e minerais para fortalecer o sistema imunológico naturalmente.",
      image: "/images/categories/imunidade.jpg",
      active: true,
    },
    {
      name: "Saúde Cardiovascular",
      slug: "saude-cardiovascular",
      description:
        "Suplementos para manter a saúde do coração e do sistema circulatório.",
      image: "/images/categories/cardiovascular.jpg",
      active: true,
    },
    {
      name: "Bem-Estar Geral",
      slug: "bem-estar",
      description:
        "Produtos naturais para equilíbrio do organismo e qualidade de vida.",
      image: "/images/categories/bem-estar.jpg",
      active: true,
    },
  ];

  const categories: Record<string, string> = {};

  for (const cat of categoriesData) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    categories[cat.slug] = created.id;
    console.log(`Categoria criada: ${created.name}`);
  }

  // ─── Products ────────────────────────────────────────────────────────────────
  const productsData = [
    {
      name: "Insulina Natural Glicêmica Pro",
      slug: "insulina-natural-glicemica-pro",
      shortDescription:
        "Fórmula avançada com Berberina e Canela para controle natural da glicose.",
      description:
        "O Insulina Natural Glicêmica Pro é um suplemento de alta performance desenvolvido para auxiliar no controle glicêmico de forma natural. Sua fórmula exclusiva combina Berberina, extrato de Canela e Cromo Picolinato — compostos reconhecidos cientificamente por sua capacidade de melhorar a sensibilidade à insulina e reduzir os picos de glicose após as refeições. Ideal para pessoas com pré-diabetes, diabetes tipo 2 controlado ou quem busca manter a glicemia em níveis saudáveis.",
      price: 89.9,
      salePrice: 74.9,
      images: [
        "/images/products/glicemica-pro-1.jpg",
        "/images/products/glicemica-pro-2.jpg",
      ],
      stock: 150,
      sku: "INS-GLC-001",
      active: true,
      featured: true,
      bestSeller: true,
      isNew: false,
      brand: "Insufarma Naturalli",
      benefits: [
        "Auxilia no controle da glicemia",
        "Melhora a sensibilidade à insulina",
        "Reduz picos glicêmicos pós-refeição",
        "Contribui para o metabolismo saudável",
        "Fórmula 100% natural",
      ],
      howToUse:
        "Tomar 2 cápsulas ao dia, preferencialmente antes das principais refeições. Não exceder a dose recomendada.",
      composition:
        "Berberina HCl 500mg, Extrato de Canela (Cinnamomum verum) 300mg, Cromo Picolinato 200mcg, Ácido Alfa-Lipóico 150mg. Excipientes: celulose microcristalina, estearato de magnésio.",
      warnings:
        "Não utilize em caso de gravidez ou amamentação. Consulte seu médico antes de usar se tiver diabetes insulino-dependente. Mantenha fora do alcance de crianças.",
      categorySlug: "diabetes",
    },
    {
      name: "Termogênico Extreme Black",
      slug: "termogenico-extreme-black",
      shortDescription:
        "Potente termogênico natural com Chá Verde, Pimenta Negra e Cafeína para emagrecer mais rápido.",
      description:
        "O Termogênico Extreme Black é uma fórmula poderosa desenvolvida para acelerar o metabolismo, aumentar a queima de gordura e proporcionar mais energia durante os treinos. Combinando os melhores ativos termogênicos da natureza — Extrato de Chá Verde, Piperina (Pimenta Negra), Cafeína Natural e L-Carnitina — este suplemento potencializa o gasto calórico e ajuda a alcançar resultados mais rápidos quando aliado a dieta equilibrada e exercícios físicos.",
      price: 79.9,
      salePrice: 64.9,
      images: [
        "/images/products/termogenico-extreme-1.jpg",
        "/images/products/termogenico-extreme-2.jpg",
      ],
      stock: 200,
      sku: "EMA-TRM-001",
      active: true,
      featured: true,
      bestSeller: true,
      isNew: false,
      brand: "Insufarma Naturalli",
      benefits: [
        "Acelera o metabolismo",
        "Aumenta a queima de gordura",
        "Fornece energia para os treinos",
        "Reduz o apetite naturalmente",
        "Melhora o foco e disposição",
      ],
      howToUse:
        "Tomar 1 cápsula com água 30 minutos antes do treino ou café da manhã. Não tomar após as 18h para não prejudicar o sono.",
      composition:
        "Extrato de Chá Verde (Camellia sinensis) 400mg, Cafeína Anidra 200mg, L-Carnitina Tartrato 500mg, Piperina 10mg, Extrato de Gengibre 100mg.",
      warnings:
        "Contraindicado para gestantes, lactantes, hipertensos e portadores de doenças cardíacas. Não use em conjunto com outros estimulantes.",
      categorySlug: "emagrecimento",
    },
    {
      name: "Detox Slim 21 Dias",
      slug: "detox-slim-21-dias",
      shortDescription:
        "Programa detox de 21 dias com Alcachofra, Dente-de-Leão e Spirulina para desintoxicar e emagrecer.",
      description:
        "O Detox Slim 21 Dias é um programa completo de desintoxicação e emagrecimento desenvolvido para limpar o organismo de toxinas acumuladas, melhorar o funcionamento intestinal e reduzir o inchaço. A fórmula exclusiva reúne Extrato de Alcachofra, Dente-de-Leão, Spirulina e Clorela — ingredientes reconhecidos por suas propriedades depurativas e nutricionais. Em apenas 21 dias, sinta seu corpo mais leve, sua pele mais saudável e sua digestão normalizada.",
      price: 69.9,
      salePrice: null,
      images: ["/images/products/detox-slim-1.jpg"],
      stock: 80,
      sku: "EMA-DTX-001",
      active: true,
      featured: false,
      bestSeller: false,
      isNew: true,
      brand: "Insufarma Naturalli",
      benefits: [
        "Elimina toxinas do organismo",
        "Reduz inchaço e retenção de líquidos",
        "Melhora o funcionamento intestinal",
        "Promove bem-estar e energia",
        "Auxilia na perda de peso",
      ],
      howToUse:
        "Tomar 3 cápsulas pela manhã com um copo grande de água. Aumentar o consumo de água para pelo menos 2 litros ao dia durante o programa.",
      composition:
        "Extrato de Alcachofra 300mg, Extrato de Dente-de-Leão 200mg, Spirulina 500mg, Clorela 300mg, Extrato de Semente de Uva 100mg.",
      warnings:
        "Não utilizar se alérgico a plantas da família Asteraceae. Consulte seu médico se usar anticoagulantes.",
      categorySlug: "emagrecimento",
    },
    {
      name: "Complexo B12 Ultra Energy",
      slug: "complexo-b12-ultra-energy",
      shortDescription:
        "Vitaminas do complexo B com Ginseng e Coenzima Q10 para combater o cansaço e aumentar a energia.",
      description:
        "O Complexo B12 Ultra Energy é a solução definitiva para quem sofre com cansaço crônico, falta de energia e baixa disposição. Desenvolvido com as vitaminas do complexo B nas formas ativas biodisponíveis — incluindo metilcobalamina (B12) e metilfolato (B9) — combinadas com Panax Ginseng e Coenzima Q10, este suplemento age diretamente na produção de energia celular, no metabolismo e na saúde neurológica.",
      price: 59.9,
      salePrice: 49.9,
      images: [
        "/images/products/complexo-b12-1.jpg",
        "/images/products/complexo-b12-2.jpg",
      ],
      stock: 300,
      sku: "ENE-B12-001",
      active: true,
      featured: true,
      bestSeller: false,
      isNew: false,
      brand: "Insufarma Naturalli",
      benefits: [
        "Combate o cansaço e fadiga",
        "Aumenta a produção de energia celular",
        "Melhora a concentração e memória",
        "Suporta a saúde do sistema nervoso",
        "Apoia a formação de glóbulos vermelhos",
      ],
      howToUse:
        "Tomar 1 cápsula ao dia pela manhã com o café da manhã.",
      composition:
        "Metilcobalamina (Vitamina B12) 1000mcg, Metilfolato (Vitamina B9) 400mcg, Vitamina B6 (Piridoxal-5-Fosfato) 25mg, Panax Ginseng 200mg, Coenzima Q10 50mg, Vitamina B1 (Tiamina) 25mg.",
      warnings:
        "Mantenha fora do alcance de crianças. Consulte seu médico em caso de gravidez.",
      categorySlug: "energia",
    },
    {
      name: "Imuno Shield Vitamina C + D + Zinco",
      slug: "imuno-shield-vitamina-c-d-zinco",
      shortDescription:
        "Combinação premium de Vitamina C 1000mg, Vitamina D3 e Zinco para imunidade de alto desempenho.",
      description:
        "O Imuno Shield é a fórmula completa para quem busca máxima proteção imunológica durante todo o ano. Cada cápsula concentra Vitamina C Tamponada 1000mg, Vitamina D3 2000UI e Zinco Bisglicinato — três dos nutrientes mais estudados para a função imune — além de Extrato de Equinácea e Sabugueiro, reconhecidos por suas propriedades antivirais e imunomoduladoras. Ideal para períodos de gripes, resfriados e queda de imunidade.",
      price: 74.9,
      salePrice: 62.9,
      images: [
        "/images/products/imuno-shield-1.jpg",
        "/images/products/imuno-shield-2.jpg",
        "/images/products/imuno-shield-3.jpg",
      ],
      stock: 250,
      sku: "IMU-SHL-001",
      active: true,
      featured: true,
      bestSeller: true,
      isNew: false,
      brand: "Insufarma Naturalli",
      benefits: [
        "Fortalece o sistema imunológico",
        "Ação antioxidante potente",
        "Auxilia na prevenção de gripes e resfriados",
        "Reduz a duração de infecções",
        "Suporta a saúde óssea e muscular",
      ],
      howToUse:
        "Tomar 1 cápsula ao dia durante as refeições. Em períodos de imunidade baixa, pode-se tomar 2 cápsulas ao dia.",
      composition:
        "Vitamina C Tamponada (Ascorbato de Cálcio) 1000mg, Vitamina D3 (Colecalciferol) 2000UI, Zinco Bisglicinato 30mg, Extrato de Equinácea 200mg, Extrato de Sabugueiro 150mg.",
      warnings:
        "Não superar a dose diária recomendada. Mantenha em local fresco e seco, longe da luz direta.",
      categorySlug: "imunidade",
    },
    {
      name: "Ômega 3 Ultra Purificado 1000mg",
      slug: "omega-3-ultra-purificado-1000mg",
      shortDescription:
        "Óleo de peixe ultra purificado com alta concentração de EPA e DHA para saúde cardiovascular.",
      description:
        "O Ômega 3 Ultra Purificado é um suplemento de óleo de peixe de grau farmacêutico, produzido através de processo de destilação molecular que elimina metais pesados, dioxinas e PCBs. Com alta concentração de EPA (360mg) e DHA (240mg) por cápsula, este produto suporta a saúde cardiovascular, reduz triglicerídeos, tem ação anti-inflamatória e contribui para a saúde cerebral. Certificado pelo IFOS (International Fish Oil Standards).",
      price: 84.9,
      salePrice: null,
      images: [
        "/images/products/omega3-1.jpg",
        "/images/products/omega3-2.jpg",
      ],
      stock: 180,
      sku: "CAR-OMG-001",
      active: true,
      featured: false,
      bestSeller: true,
      isNew: false,
      brand: "Insufarma Naturalli",
      benefits: [
        "Reduz triglicerídeos no sangue",
        "Protege a saúde cardiovascular",
        "Ação anti-inflamatória natural",
        "Melhora a saúde cerebral e cognitiva",
        "Ultra purificado — livre de contaminantes",
      ],
      howToUse:
        "Tomar 2 cápsulas ao dia durante as refeições. Para fins terapêuticos, consulte seu médico.",
      composition:
        "Óleo de Peixe Concentrado 1000mg (EPA 360mg, DHA 240mg), Vitamina E (Tocoferóis Mistos) 5mg. Cápsula de gelatina.",
      warnings:
        "Consulte seu médico se utilizar anticoagulantes. Pessoas com alergia a peixes devem evitar o produto.",
      categorySlug: "saude-cardiovascular",
    },
    {
      name: "Magnésio Dimalato 400mg",
      slug: "magnesio-dimalato-400mg",
      shortDescription:
        "Magnésio na forma dimalato de alta absorção para reduzir câimbras, estresse e melhorar o sono.",
      description:
        "O Magnésio Dimalato 400mg oferece magnésio na forma quelada de dimalato — uma das formas com melhor biodisponibilidade e tolerância gastrointestinal. O magnésio é um mineral essencial envolvido em mais de 300 reações enzimáticas no organismo, incluindo produção de energia, síntese de proteínas, controle da glicose e função neuromuscular. Essencial para quem pratica atividade física, sofre com câimbras, estresse, insônia ou tensão muscular.",
      price: 54.9,
      salePrice: 44.9,
      images: ["/images/products/magnesio-dimalato-1.jpg"],
      stock: 220,
      sku: "BEM-MGS-001",
      active: true,
      featured: false,
      bestSeller: false,
      isNew: true,
      brand: "Insufarma Naturalli",
      benefits: [
        "Previne e alivia câimbras musculares",
        "Reduz tensão e estresse",
        "Melhora a qualidade do sono",
        "Suporta a produção de energia celular",
        "Alta biodisponibilidade na forma dimalato",
      ],
      howToUse:
        "Tomar 2 cápsulas ao dia, preferencialmente à noite antes de dormir.",
      composition:
        "Magnésio Dimalato (Magnésio Dimagnesio Malato) 400mg (fornecendo 70mg de Magnésio Elementar), Ácido Málico 250mg.",
      warnings:
        "Doses elevadas podem causar efeito laxante. Em caso de doença renal, consulte seu médico antes de usar.",
      categorySlug: "bem-estar",
    },
    {
      name: "Colesterol Block Berberina + Policosanol",
      slug: "colesterol-block-berberina-policosanol",
      shortDescription:
        "Fórmula natural com Berberina, Policosanol e Niacina para controle do colesterol sem estatinas.",
      description:
        "O Colesterol Block é a alternativa natural às estatinas para controle do colesterol LDL e dos triglicerídeos. Sua fórmula exclusiva combina Berberina — que inibe a síntese hepática do colesterol pelo mesmo mecanismo das estatinas — com Policosanol de Cana-de-Açúcar, Niacina (B3) e Extrato de Alho Envelhecido. Esta sinergia atua na redução do colesterol ruim (LDL), aumento do colesterol bom (HDL) e melhora do perfil lipídico geral.",
      price: 94.9,
      salePrice: 79.9,
      images: [
        "/images/products/colesterol-block-1.jpg",
        "/images/products/colesterol-block-2.jpg",
      ],
      stock: 120,
      sku: "CAR-CLB-001",
      active: true,
      featured: true,
      bestSeller: false,
      isNew: true,
      brand: "Insufarma Naturalli",
      benefits: [
        "Reduz o colesterol LDL naturalmente",
        "Aumenta o colesterol HDL (bom)",
        "Melhora o perfil lipídico",
        "Reduz triglicerídeos",
        "Alternativa natural às estatinas",
      ],
      howToUse:
        "Tomar 1 cápsula 2x ao dia com as refeições. Acompanhar com exames laboratoriais regulares.",
      composition:
        "Berberina HCl 500mg, Policosanol de Cana-de-Açúcar 20mg, Niacina (Vitamina B3) 50mg, Extrato de Alho Envelhecido (Kyolic) 300mg, CoQ10 30mg.",
      warnings:
        "Não substitui o tratamento médico. Se estiver em uso de estatinas, consulte seu médico antes de iniciar. Pode interagir com anticoagulantes.",
      categorySlug: "saude-cardiovascular",
    },
  ];

  for (const prod of productsData) {
    const { categorySlug, ...productData } = prod;
    const categoryId = categories[categorySlug];

    await prisma.product.upsert({
      where: { slug: productData.slug },
      update: {},
      create: {
        ...productData,
        price: productData.price,
        salePrice: productData.salePrice ?? null,
        categoryId,
      },
    });

    console.log(`Produto criado: ${productData.name}`);
  }

  // ─── Coupons ──────────────────────────────────────────────────────────────────
  const couponsData = [
    {
      code: "PRIMEIRACOMPRA",
      type: CouponType.PERCENTAGE,
      value: 10,
      minOrderValue: 50,
      maxUses: 1000,
      usedCount: 0,
      active: true,
      expiresAt: new Date("2027-12-31"),
    },
    {
      code: "INSUFARMA10",
      type: CouponType.PERCENTAGE,
      value: 10,
      minOrderValue: 80,
      maxUses: null,
      usedCount: 0,
      active: true,
      expiresAt: null,
    },
    {
      code: "FRETEGRATIS",
      type: CouponType.FREE_SHIPPING,
      value: 0,
      minOrderValue: 150,
      maxUses: null,
      usedCount: 0,
      active: true,
      expiresAt: null,
    },
  ];

  for (const coupon of couponsData) {
    await prisma.coupon.upsert({
      where: { code: coupon.code },
      update: {},
      create: coupon,
    });
    console.log(`Cupom criado: ${coupon.code}`);
  }

  // ─── SEO Defaults ─────────────────────────────────────────────────────────────
  const seoData = [
    {
      page: "home",
      title: "Insufarma Naturalli — Suplementos Naturais para Saúde e Bem-Estar",
      description:
        "Descubra suplementos naturais de alta qualidade para diabetes, emagrecimento, energia, imunidade e saúde cardiovascular. Frete grátis acima de R$150.",
      keywords:
        "suplementos naturais, diabetes, emagrecimento, vitaminas, saúde, bem-estar, insufarma",
      ogImage: "/images/og/home.jpg",
    },
    {
      page: "produtos",
      title: "Produtos — Insufarma Naturalli",
      description:
        "Explore nossa linha completa de suplementos naturais. Qualidade farmacêutica, fórmulas exclusivas e resultados comprovados.",
      keywords:
        "suplementos, vitaminas, minerais, fitoterápicos, comprar suplementos naturais",
      ogImage: "/images/og/produtos.jpg",
    },
  ];

  for (const seo of seoData) {
    await prisma.sEO.upsert({
      where: { page: seo.page },
      update: {},
      create: seo,
    });
    console.log(`SEO configurado: ${seo.page}`);
  }

  console.log("\nSeed concluído com sucesso!");
  console.log(`  Admin: admin@insufarma.com.br / admin123`);
  console.log(`  ${categoriesData.length} categorias`);
  console.log(`  ${productsData.length} produtos`);
  console.log(`  ${couponsData.length} cupons`);
}

main()
  .catch((e) => {
    console.error("Erro durante o seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
