import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

type Params = { params: { slug: string } };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: params.slug },
      include: { category: true },
    });

    if (!product || !product.active) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (err) {
    console.error("[product GET]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  price: z.number().positive().optional(),
  salePrice: z.number().positive().nullable().optional(),
  stock: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
  featured: z.boolean().optional(),
  bestSeller: z.boolean().optional(),
  isNew: z.boolean().optional(),
  images: z.array(z.string().url()).optional(),
  benefits: z.array(z.string()).optional(),
  howToUse: z.string().nullable().optional(),
  composition: z.string().nullable().optional(),
  warnings: z.string().nullable().optional(),
  brand: z.string().nullable().optional(),
  categoryId: z.string().uuid().optional(),
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

export async function PUT(req: NextRequest, { params }: Params) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const product = await prisma.product.update({
      where: { slug: params.slug },
      data: parsed.data,
      include: { category: true },
    });

    return NextResponse.json({ product });
  } catch (err) {
    console.error("[product PUT]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  try {
    await prisma.product.update({
      where: { slug: params.slug },
      data: { active: false },
    });

    return NextResponse.json({ message: "Produto desativado com sucesso" });
  } catch (err) {
    console.error("[product DELETE]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
