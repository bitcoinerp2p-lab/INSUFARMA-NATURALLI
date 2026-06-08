import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { writeAuditLog } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("auth-token")?.value;
  if (token) {
    try {
      const payload = verifyToken(token);
      void writeAuditLog({ userId: payload.id, action: "LOGOUT" });
    } catch { /* token already invalid — no-op */ }
  }
  const res = NextResponse.json({ message: "Logout realizado com sucesso" }, { status: 200 });
  res.cookies.set("auth-token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return res;
}
