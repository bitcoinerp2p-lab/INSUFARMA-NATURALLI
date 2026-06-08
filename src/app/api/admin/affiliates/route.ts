import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminPayload, writeAudit, getIp, randomCode } from "@/lib/admin-helpers";

const createSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  cpf: z.string().optional(),
  commissionRate: z.number().positive().default(10),
  commissionType: z.enum(["PERCENTAGE", "FIXED"]).default("PERCENTAGE"),
});

export async function GET(req: NextRequest) {
  const admin = getAdminPayload(req);
  if (!admin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "20")));
  const status = searchParams.get("status") ?? undefined;
  const search = searchParams.get("search") ?? undefined;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { code: { contains: search, mode: "insensitive" } },
    ];
  }

  try {
    const [total, affiliates] = await Promise.all([
      prisma.affiliate.count({ where }),
      prisma.affiliate.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { wallet: true },
      }),
    ]);

    return NextResponse.json({ affiliates, total, page, limit });
  } catch (err) {
    console.error("[admin/affiliates GET]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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

    const { name, email, phone, cpf, commissionRate, commissionType } = parsed.data;

    let code: string;
    let attempts = 0;
    do {
      code = randomCode(6);
      attempts++;
      if (attempts > 20) {
        return NextResponse.json({ error: "Não foi possível gerar código único" }, { status: 500 });
      }
    } while (await prisma.affiliate.findUnique({ where: { code } }));

    const affiliate = await prisma.$transaction(async (tx) => {
      const a = await tx.affiliate.create({
        data: { name, email, phone, cpf, code, commissionRate, commissionType },
      });
      await tx.affiliateWallet.create({ data: { affiliateId: a.id } });
      return a;
    });

    await writeAudit({
      userId: admin.id,
      action: "AFFILIATE_APPROVE",
      entity: "Affiliate",
      entityId: affiliate.id,
      details: { name, email },
      ip: getIp(req),
    });

    return NextResponse.json({ affiliate }, { status: 201 });
  } catch (err) {
    console.error("[admin/affiliates POST]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
