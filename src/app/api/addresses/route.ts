import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

function getAuth(req: NextRequest) {
  try {
    const token = req.cookies.get("auth-token")?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const auth = getAuth(req);
  if (!auth) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const addresses = await prisma.address.findMany({ where: { userId: auth.id }, orderBy: { isDefault: "desc" } });
  return NextResponse.json({ addresses });
}

const schema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  cep: z.string().min(8, "CEP inválido"),
  street: z.string().min(1, "Rua obrigatória"),
  number: z.string().min(1, "Número obrigatório"),
  complement: z.string().optional(),
  neighborhood: z.string().min(1, "Bairro obrigatório"),
  city: z.string().min(1, "Cidade obrigatória"),
  state: z.string().length(2, "Estado deve ter 2 letras"),
  isDefault: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const auth = getAuth(req);
  if (!auth) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

  const { isDefault, ...data } = parsed.data;
  if (isDefault) {
    await prisma.address.updateMany({ where: { userId: auth.id }, data: { isDefault: false } });
  }

  const address = await prisma.address.create({ data: { ...data, userId: auth.id, isDefault: isDefault ?? false } });
  return NextResponse.json({ address }, { status: 201 });
}
