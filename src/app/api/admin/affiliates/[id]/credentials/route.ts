import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminPayload, writeAudit, getIp } from "@/lib/admin-helpers";
import { hashPassword } from "@/lib/auth";

const schema = z.object({
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = getAdminPayload(req);
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

  const { password } = parsed.data;

  const affiliate = await prisma.affiliate.findUnique({ where: { id: params.id } });
  if (!affiliate) return NextResponse.json({ error: "Afiliado não encontrado" }, { status: 404 });

  const hashedPassword = await hashPassword(password);

  try {
    if (affiliate.userId) {
      await prisma.user.update({ where: { id: affiliate.userId }, data: { password: hashedPassword } });
    } else {
      const existingUser = await prisma.user.findUnique({ where: { email: affiliate.email } });
      const user = existingUser
        ? await prisma.user.update({ where: { id: existingUser.id }, data: { password: hashedPassword } })
        : await prisma.user.create({
            data: {
              name: affiliate.name,
              email: affiliate.email,
              password: hashedPassword,
              role: "CUSTOMER",
              phone: affiliate.phone ?? null,
              cpf: affiliate.cpf ?? null,
            },
          });
      await prisma.affiliate.update({ where: { id: params.id }, data: { userId: user.id } });
    }

    await writeAudit({
      userId: admin.id,
      action: "COMMISSION_CHANGE",
      entity: "Affiliate",
      entityId: affiliate.id,
      details: { action: "credentials_set" },
      ip: getIp(req),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/affiliates/[id]/credentials]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
