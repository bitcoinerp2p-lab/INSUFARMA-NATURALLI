import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getPayment } from "@/lib/mercadopago";

function getAuth(req: NextRequest) {
  try {
    const token = req.cookies.get("auth-token")?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch { return null; }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { paymentId: string } }
) {
  const auth = getAuth(req);
  if (!auth) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  try {
    const payment = await getPayment(params.paymentId);
    return NextResponse.json({
      status: payment.status as string,
      statusDetail: payment.status_detail as string,
      orderId: payment.external_reference as string,
    });
  } catch (err) {
    console.error("[payments/status]", err);
    return NextResponse.json({ error: "Erro ao verificar status" }, { status: 500 });
  }
}
