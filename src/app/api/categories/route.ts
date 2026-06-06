import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import slugify from "slugify";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

function requireAdmin(req: NextRequest): boolean {
  try {
    const token = req.cookies.get("auth-token")?.value;
    if (!token) return false;
    const payload = verifyToken(token);
    return payload.role === "ADMIN";
  } catch {
    return false;
  }
}

const createCategorySchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  description: z.string().optional(),
  image: z.string().url().optional(),
});

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ categories });
  } catch (err) {
    console.error("[categories GET]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = createCategorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const slug = slugify(parsed.data.name, { lower: true, strict: true });

    const category = await prisma.category.create({
      data: {
        name: parsed.data.name,
        slug,
        description: parsed.data.description ?? null,
        image: parsed.data.image ?? null,
      },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (err) {
    console.error("[categories POST]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
