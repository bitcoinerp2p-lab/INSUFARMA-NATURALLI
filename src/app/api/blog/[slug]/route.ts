import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

function isAdmin(req: NextRequest) {
  try {
    const token = req.cookies.get("auth-token")?.value;
    if (!token) return false;
    return verifyToken(token).role === "ADMIN";
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const admin = isAdmin(req);
  const post = await prisma.blogPost.findUnique({
    where: { slug: params.slug },
    include: { author: { select: { id: true, name: true } } },
  });

  if (!post || (!post.published && !admin)) {
    return NextResponse.json({ error: "Artigo não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ post });
}
