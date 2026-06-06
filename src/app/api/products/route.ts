import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const q = searchParams.get("q") ?? "";
    const category = searchParams.get("category") ?? "";
    const sort = searchParams.get("sort") ?? "createdAt";
    const featured = searchParams.get("featured");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") ?? "12", 10))
    );

    const where: Prisma.ProductWhereInput = {
      active: true,
      ...(q && {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { shortDescription: { contains: q, mode: "insensitive" } },
        ],
      }),
      ...(category && { category: { slug: category } }),
      ...(featured === "true" && { featured: true }),
    };

    const validSortFields: Record<string, Prisma.ProductOrderByWithRelationInput> = {
      price_asc: { price: "asc" },
      price_desc: { price: "desc" },
      name: { name: "asc" },
      createdAt: { createdAt: "desc" },
    };
    const orderBy = validSortFields[sort] ?? { createdAt: "desc" };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("[products GET]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
