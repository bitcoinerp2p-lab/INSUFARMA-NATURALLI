import { NextRequest, NextResponse } from "next/server";
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

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = getAuth(req);
  if (!auth) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const address = await prisma.address.findFirst({ where: { id: params.id, userId: auth.id } });
  if (!address) return NextResponse.json({ error: "Endereço não encontrado" }, { status: 404 });

  await prisma.address.delete({ where: { id: params.id } });
  return NextResponse.json({ message: "Endereço removido" });
}
