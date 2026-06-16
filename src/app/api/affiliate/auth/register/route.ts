import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { randomCode } from "@/lib/admin-helpers";

const schema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  phone: z.string().optional(),
  cpf: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { name, email, password, phone, cpf } = parsed.data;
    const cleanPhone = phone || null;
    const cleanCpf = cpf || null;

    // Check existing records before transaction to return meaningful errors
    const [existingUser, existingAffiliate] = await Promise.all([
      prisma.user.findUnique({ where: { email } }),
      prisma.affiliate.findUnique({ where: { email } }),
    ]);

    if (existingUser) {
      return NextResponse.json({ error: "Este e-mail já está cadastrado" }, { status: 409 });
    }
    if (existingAffiliate) {
      return NextResponse.json({ error: "Este e-mail já está cadastrado como afiliado" }, { status: 409 });
    }

    // Check CPF uniqueness separately to give a clear error message
    if (cleanCpf) {
      const [userWithCpf, affiliateWithCpf] = await Promise.all([
        prisma.user.findUnique({ where: { cpf: cleanCpf } }),
        prisma.affiliate.findUnique({ where: { cpf: cleanCpf } }),
      ]);
      if (userWithCpf || affiliateWithCpf) {
        return NextResponse.json({ error: "Este CPF já está cadastrado" }, { status: 409 });
      }
    }

    let code: string;
    let attempts = 0;
    do {
      code = randomCode(6);
      attempts++;
      if (attempts > 20) {
        return NextResponse.json({ error: "Erro ao gerar código único" }, { status: 500 });
      }
    } while (await prisma.affiliate.findUnique({ where: { code } }));

    const hashedPassword = await hashPassword(password);

    const { user, affiliate } = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: "CUSTOMER",
          phone: cleanPhone,
          cpf: cleanCpf,
        },
      });

      const a = await tx.affiliate.create({
        data: {
          userId: u.id,
          name,
          email,
          phone: cleanPhone,
          cpf: cleanCpf,
          code,
          status: "PENDING",
          commissionRate: 10,
          commissionType: "PERCENTAGE",
        },
      });

      await tx.affiliateWallet.create({ data: { affiliateId: a.id } });

      return { user: u, affiliate: a };
    });

    return NextResponse.json({
      message: "Cadastro realizado! Aguarde a aprovação do administrador.",
      affiliateCode: affiliate.code,
      userId: user.id,
    }, { status: 201 });
  } catch (err) {
    // Handle Prisma unique constraint violations that slip past pre-checks (race conditions)
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "E-mail ou CPF já cadastrado" }, { status: 409 });
    }
    console.error("[affiliate/auth/register]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
