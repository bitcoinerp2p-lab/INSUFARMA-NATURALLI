import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminPayload, randomCode } from "@/lib/admin-helpers";

const createSchema = z.object({
  productId: z.string().uuid().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = getAdminPayload(req);
  if (!admin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const links = await prisma.affiliateLink.findMany({
      where: { affiliateId: params.id },
      include: { product: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });

    const linksWithStats = links.map((l) => ({
      ...l,
      conversionRate: l.clicks > 0 ? (l.conversions / l.clicks) * 100 : 0,
    }));

    return NextResponse.json({ links: linksWithStats });
  } catch (err) {
    console.error("[admin/affiliates/[id]/links GET]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = getAdminPayload(req);
  if (!admin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const affiliate = await prisma.affiliate.findUnique({ where: { id: params.id } });
    if (!affiliate) {
      return NextResponse.json({ error: "Afiliado não encontrado" }, { status: 404 });
    }

    let code: string;
    let attempts = 0;
    do {
      code = randomCode(8);
      attempts++;
      if (attempts > 20) {
        return NextResponse.json({ error: "Não foi possível gerar código único" }, { status: 500 });
      }
    } while (await prisma.affiliateLink.findUnique({ where: { code } }));

    const link = await prisma.affiliateLink.create({
      data: {
        affiliateId: params.id,
        productId: parsed.data.productId ?? null,
        code,
      },
      include: { product: { select: { id: true, name: true } } },
    });

    return NextResponse.json({ link }, { status: 201 });
  } catch (err) {
    console.error("[admin/affiliates/[id]/links POST]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
