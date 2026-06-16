import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { processPayment } from "@/lib/processPayment";
import { verifyToken } from "@/lib/auth";

const schema = z.object({ paymentId: z.string().min(1) });

function getAuth(req: NextRequest) {
  try {
    const token = req.cookies.get("auth-token")?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const auth = getAuth(req);
  if (!auth) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "paymentId inválido" }, { status: 400 });
  }

  try {
    const result = await processPayment(parsed.data.paymentId);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[payments/confirm]", err);
    return NextResponse.json({ error: "Erro ao confirmar pagamento" }, { status: 500 });
  }
}
