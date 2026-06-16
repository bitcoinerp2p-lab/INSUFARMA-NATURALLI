import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "insufarma-secret-key-change-in-prod"
);

async function getAffiliate(req: NextRequest) {
  const token = req.cookies.get("affiliate-token")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return await prisma.affiliate.findUnique({
      where: { id: payload.affiliateId as string },
      select: { id: true, commissionRate: true, commissionType: true },
    });
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const affiliate = await getAffiliate(req);
  if (!affiliate) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const products = await prisma.product.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        salePrice: true,
        images: true,
        defaultAffiliateCommission: true,
        affiliateCommissionType: true,
      },
      orderBy: { name: "asc" },
    });

    // Use the affiliate's commission rate (not the product's default) — the webhook applies affiliate rate
    const affiliateRate = Number(affiliate.commissionRate);
    const affiliateType = affiliate.commissionType;

    const result = products.map((p) => {
      const price = Number(p.salePrice ?? p.price);
      const estimatedCommission =
        affiliateType === "PERCENTAGE" ? (price * affiliateRate) / 100 : affiliateRate;

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: Number(p.price),
        salePrice: p.salePrice ? Number(p.salePrice) : null,
        imageUrl: p.images[0] ?? null,
        commissionRate: affiliateRate,
        commissionType: affiliateType,
        estimatedCommission: Number(estimatedCommission.toFixed(2)),
      };
    });

    return NextResponse.json({ products: result });
  } catch (err) {
    console.error("[affiliate/products GET]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
