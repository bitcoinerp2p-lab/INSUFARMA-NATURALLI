import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  affiliateCode: z.string().min(1),
  productId: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  utmContent: z.string().optional(),
  referer: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const { affiliateCode, productId, utmSource, utmMedium, utmCampaign, utmContent, referer } = parsed.data;

    const affiliate = await prisma.affiliate.findUnique({
      where: { code: affiliateCode, status: "ACTIVE" },
    });
    if (!affiliate) {
      return NextResponse.json({ error: "Afiliado não encontrado" }, { status: 404 });
    }

    let link = await prisma.affiliateLink.findFirst({
      where: { affiliateId: affiliate.id, productId: productId ?? null },
    });

    if (!link) {
      const code = generateLinkCode();
      link = await prisma.affiliateLink.create({
        data: { affiliateId: affiliate.id, productId: productId ?? null, code },
      });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    const userAgent = req.headers.get("user-agent") ?? null;

    const [click] = await prisma.$transaction([
      prisma.affiliateClick.create({
        data: {
          affiliateId: affiliate.id,
          linkId: link.id,
          productId: productId ?? null,
          ip: ip ?? null,
          userAgent: userAgent ?? null,
          utmSource: utmSource ?? null,
          utmMedium: utmMedium ?? null,
          utmCampaign: utmCampaign ?? null,
          utmContent: utmContent ?? null,
          referer: referer ?? null,
        },
      }),
      prisma.affiliateLink.update({
        where: { id: link.id },
        data: { clicks: { increment: 1 } },
      }),
    ]);

    return NextResponse.json({ ok: true, affiliateId: affiliate.id, linkId: link.id, clickId: click.id });
  } catch (err) {
    console.error("[track/click]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

function generateLinkCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}
