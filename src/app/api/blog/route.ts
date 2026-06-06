import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import slugify from "slugify";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

function getAuthPayload(
  req: NextRequest
): { id: string; role: string; email: string } | null {
  try {
    const token = req.cookies.get("auth-token")?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10)));
    const auth = getAuthPayload(req);
    const isAdmin = auth?.role === "ADMIN";

    const where = isAdmin ? {} : { published: true };

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        include: {
          author: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.blogPost.count({ where }),
    ]);

    return NextResponse.json({ posts, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("[blog GET]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

const createPostSchema = z.object({
  title: z.string().min(1, "Título obrigatório"),
  content: z.string().min(1, "Conteúdo obrigatório"),
  excerpt: z.string().min(1, "Resumo obrigatório"),
  coverImage: z.string().url().nullable().optional(),
  categoryName: z.string().optional(),
  published: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  const auth = getAuthPayload(req);
  if (!auth || auth.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = createPostSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const baseSlug = slugify(parsed.data.title, { lower: true, strict: true });
    let slug = baseSlug;
    let i = 1;
    while (await prisma.blogPost.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${i}`;
      i++;
    }

    const post = await prisma.blogPost.create({
      data: {
        title: parsed.data.title,
        slug,
        content: parsed.data.content,
        excerpt: parsed.data.excerpt,
        coverImage: parsed.data.coverImage ?? null,
        categoryName: parsed.data.categoryName ?? null,
        published: parsed.data.published,
        authorId: auth.id,
      },
      include: { author: { select: { id: true, name: true } } },
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (err) {
    console.error("[blog POST]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
