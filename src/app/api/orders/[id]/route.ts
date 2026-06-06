import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

type Params = { params: { id: string } };

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

export async function GET(req: NextRequest, { params }: Params) {
  const auth = getAuthPayload(req);
  if (!auth) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        items: { include: { product: true } },
        address: true,
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
    }

    // Customer can only see their own orders
    if (auth.role !== "ADMIN" && order.userId !== auth.id) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    return NextResponse.json({ order });
  } catch (err) {
    console.error("[order GET]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

const updateStatusSchema = z.object({
  status: z.enum(["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"]),
  paymentLink: z.string().url().optional(),
});

export async function PUT(req: NextRequest, { params }: Params) {
  const auth = getAuthPayload(req);
  if (!auth || auth.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = updateStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const order = await prisma.order.update({
      where: { id: params.id },
      data: {
        status: parsed.data.status,
        ...(parsed.data.paymentLink && { paymentLink: parsed.data.paymentLink }),
      },
      include: {
        items: { include: { product: true } },
        address: true,
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    });

    return NextResponse.json({ order });
  } catch (err) {
    console.error("[order PUT]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
