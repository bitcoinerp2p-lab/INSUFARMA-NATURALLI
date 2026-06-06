import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import slugify from "slugify";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { Prisma } from "@prisma/client";

const createProductSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  description: z.string().min(1, "Descrição obrigatória"),
  shortDescription: z.string().min(1, "Descrição curta obrigatória"),
  price: z.number().positive("Preço deve ser positivo"),
  salePrice: z.number().positive().nullable().optional(),
  stock: z.number().int().min(0, "Estoque não pode ser negativo").default(0),
  sku: z.string().min(1, "SKU obrigatório"),
  categoryId: z.string().uuid("Categoria inválida"),
  images: z.array(z.string()).default([]),
  benefits: z.array(z.string()).default([]),
  howToUse: z.string().nullable().optional(),
  composition: z.string().nullable().optional(),
  warnings: z.string().nullable().optional(),
  brand: z.string().nullable().optional(),
  featured: z.boolean().default(false),
  bestSeller: z.boolean().default(false),
  isNew: z.boolean().default(false),
});

function requireAdmin(req: NextRequest): { id: string; role: string; email: string } | null {
  try {
    const token = req.cookies.get("auth-token")?.value;
    if (!token) return null;
    const payload = verifyToken(token);
    if (payload.role !== "ADMIN") return null;
    return payload;
  } catch {
    return null;
  }
}

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

export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = createProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const slug = await generateUniqueSlug(parsed.data.name);

    const product = await prisma.product.create({
      data: {
        ...parsed.data,
        slug,
        price: new Prisma.Decimal(parsed.data.price),
        salePrice: parsed.data.salePrice != null
          ? new Prisma.Decimal(parsed.data.salePrice)
          : null,
      },
      include: { category: true },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (err) {
    console.error("[products/admin POST]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  try {
    const { searchParams } = req.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        include: { category: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count(),
    ]);

    return NextResponse.json({
      products,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("[products/admin GET]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
