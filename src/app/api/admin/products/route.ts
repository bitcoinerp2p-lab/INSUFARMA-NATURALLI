import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import slugify from "slugify";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getAdminPayload, writeAudit, getIp } from "@/lib/admin-helpers";

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  shortDescription: z.string().min(1),
  price: z.number().positive(),
  salePrice: z.number().positive().nullable().optional(),
  stock: z.number().int().min(0).default(0),
  sku: z.string().min(1),
  categoryId: z.string().uuid(),
  images: z.array(z.string()).default([]),
  benefits: z.array(z.string()).default([]),
  howToUse: z.string().nullable().optional(),
  composition: z.string().nullable().optional(),
  warnings: z.string().nullable().optional(),
  brand: z.string().nullable().optional(),
  featured: z.boolean().default(false),
  bestSeller: z.boolean().default(false),
  isNew: z.boolean().default(false),
  supplierCost: z.number().nonnegative().default(0),
  defaultAffiliateCommission: z.number().nonnegative().default(10),
  affiliateCommissionType: z.enum(["PERCENTAGE", "FIXED"]).default("PERCENTAGE"),
});

async function generateUniqueSlug(name: string): Promise<string> {
  const base = slugify(name, { lower: true, strict: true });
  let slug = base;
  let i = 1;
  while (await prisma.product.findUnique({ where: { slug } })) {
    slug = `${base}-${i}`;
    i++;
  }
  return slug;
}

export async function GET(req: NextRequest) {
  const admin = getAdminPayload(req);
  if (!admin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "20")));
  const search = searchParams.get("search") ?? undefined;
  const categoryId = searchParams.get("categoryId") ?? undefined;
  const active = searchParams.get("active");

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
    ];
  }
  if (categoryId) where.categoryId = categoryId;
  if (active !== null) where.active = active === "true";

  try {
    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { category: { select: { id: true, name: true } } },
      }),
    ]);

    return NextResponse.json({ products, total, page, limit });
  } catch (err) {
    console.error("[admin/products GET]", err);
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

    const slug = await generateUniqueSlug(parsed.data.name);

    const product = await prisma.product.create({
      data: {
        ...parsed.data,
        slug,
        price: new Prisma.Decimal(parsed.data.price),
        salePrice: parsed.data.salePrice != null ? new Prisma.Decimal(parsed.data.salePrice) : null,
        supplierCost: new Prisma.Decimal(parsed.data.supplierCost),
        defaultAffiliateCommission: new Prisma.Decimal(parsed.data.defaultAffiliateCommission),
      },
      include: { category: true },
    });

    await writeAudit({
      userId: admin.id,
      action: "PRODUCT_CHANGE",
      entity: "Product",
      entityId: product.id,
      details: { name: product.name, action: "create" },
      ip: getIp(req),
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (err) {
    console.error("[admin/products POST]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
