import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "insufarma-secret-key-change-in-prod"
);

async function getAffiliateId(req: NextRequest): Promise<string | null> {
  const token = req.cookies.get("affiliate-token")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.affiliateId as string;
  } catch {
    return null;
  }
}

function generateLinkCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export async function GET(req: NextRequest) {
  const affiliateId = await getAffiliateId(req);
  if (!affiliateId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const affiliate = await prisma.affiliate.findUnique({
      where: { id: affiliateId },
      select: { code: true },
    });
    if (!affiliate) {
      return NextResponse.json({ error: "Afiliado não encontrado" }, { status: 404 });
    }

    const links = await prisma.affiliateLink.findMany({
      where: { affiliateId, productId: { not: null } },
      include: {
        product: {
          select: { id: true, name: true, slug: true, images: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";

    const result = await Promise.all(
      links.map(async (link) => {
        const salesData = await prisma.sale.aggregate({
          where: { affiliateId, productId: link.productId! },
          _count: { id: true },
          _sum: { affiliateAmount: true },
        });

        const sales = salesData._count.id;
        const commission = Number(salesData._sum.affiliateAmount ?? 0);
        const conversion = link.clicks > 0 ? (sales / link.clicks) * 100 : 0;

        return {
          id: link.id,
          productId: link.productId,
          productName: link.product?.name ?? null,
          productSlug: link.product?.slug ?? null,
          productImageUrl: link.product?.images[0] ?? null,
          url: `${siteUrl}/produto/${link.product?.slug}?ref=${affiliate.code}`,
          clicks: link.clicks,
          sales,
          commission: Number(commission.toFixed(2)),
          conversion: Number(conversion.toFixed(1)),
          createdAt: link.createdAt.toISOString(),
        };
      })
    );

    return NextResponse.json({ links: result });
  } catch (err) {
    console.error("[affiliate/links GET]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const affiliateId = await getAffiliateId(req);
  if (!affiliateId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { productId } = body as { productId?: string };

    if (!productId || typeof productId !== "string") {
      return NextResponse.json({ error: "productId é obrigatório" }, { status: 400 });
    }

    const [affiliate, product] = await Promise.all([
      prisma.affiliate.findUnique({ where: { id: affiliateId }, select: { code: true } }),
      prisma.product.findUnique({ where: { id: productId, active: true }, select: { id: true, slug: true } }),
    ]);

    if (!affiliate) return NextResponse.json({ error: "Afiliado não encontrado" }, { status: 404 });
    if (!product) return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });

    let link = await prisma.affiliateLink.findFirst({
      where: { affiliateId, productId },
    });

    if (!link) {
      let code = generateLinkCode();
      let attempts = 0;
      while (await prisma.affiliateLink.findUnique({ where: { code } })) {
        code = generateLinkCode();
        if (++attempts > 20) {
          return NextResponse.json({ error: "Não foi possível gerar código único" }, { status: 500 });
        }
      }
      link = await prisma.affiliateLink.create({
        data: { affiliateId, productId, code },
      });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
    const url = `${siteUrl}/produto/${product.slug}?ref=${affiliate.code}`;

    return NextResponse.json({ url, linkId: link.id });
  } catch (err) {
    console.error("[affiliate/links POST]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
