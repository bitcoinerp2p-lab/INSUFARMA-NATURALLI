import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminPayload } from "@/lib/admin-helpers";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = getAdminPayload(req);
  if (!admin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const sales = await prisma.sale.findMany({
      where: { affiliateId: params.id },
      include: { product: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      sales: sales.map((s) => ({
        id: s.id,
        product: s.product.name,
        gross: Number(s.grossAmount),
        commission: Number(s.affiliateAmount),
        couponCode: s.couponCode,
        utmSource: s.utmSource,
        createdAt: s.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error("[admin/affiliates/[id]/sales GET]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
