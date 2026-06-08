import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminPayload } from "@/lib/admin-helpers";

export async function GET(req: NextRequest) {
  const admin = getAdminPayload(req);
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "20")));
  const skip = (page - 1) * limit;

  const where = {
    role: "CUSTOMER" as const,
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            { phone: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  try {
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          cpf: true,
          createdAt: true,
          orders: {
            where: { status: "PAID" },
            select: { totalAmount: true, createdAt: true },
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    const mapped = users.map((u) => {
      const totalSpent = u.orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
      const lastOrder = u.orders[0]?.createdAt?.toISOString() ?? null;

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        cpf: u.cpf,
        totalOrders: u.orders.length,
        totalSpent,
        lastOrderAt: lastOrder,
        memberSince: u.createdAt.toISOString(),
      };
    });

    return NextResponse.json({ customers: mapped, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("[admin/customers GET]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
