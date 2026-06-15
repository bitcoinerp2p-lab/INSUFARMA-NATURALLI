import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { comparePassword } from "@/lib/auth";
import { SignJWT } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "insufarma-secret-key-change-in-prod"
);

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "E-mail ou senha incorretos" }, { status: 401 });
    }

    const passwordMatch = await comparePassword(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json({ error: "E-mail ou senha incorretos" }, { status: 401 });
    }

    const affiliate = await prisma.affiliate.findUnique({
      where: { userId: user.id },
      include: { wallet: true },
    });

    if (!affiliate) {
      return NextResponse.json({ error: "Conta de afiliado não encontrada para este e-mail" }, { status: 403 });
    }

    if (affiliate.status === "PENDING") {
      return NextResponse.json({ error: "Sua conta de afiliado ainda está aguardando aprovação" }, { status: 403 });
    }

    if (affiliate.status === "SUSPENDED" || affiliate.status === "BLOCKED") {
      return NextResponse.json({ error: "Sua conta de afiliado está suspensa ou bloqueada" }, { status: 403 });
    }

    const token = await new SignJWT({
      affiliateId: affiliate.id,
      userId: user.id,
      email: user.email,
      name: affiliate.name,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(JWT_SECRET);

    const res = NextResponse.json({
      affiliate: {
        id: affiliate.id,
        name: affiliate.name,
        email: affiliate.email,
        code: affiliate.code,
        commissionRate: Number(affiliate.commissionRate),
        commissionType: affiliate.commissionType,
      },
    });

    res.cookies.set("affiliate-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return res;
  } catch (err) {
    console.error("[affiliate/auth/login]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
