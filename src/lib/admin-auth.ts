import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AuditAction } from "@prisma/client";

export async function requireAdmin(req: NextRequest): Promise<{ userId: string; error?: never } | { error: NextResponse; userId?: never }> {
  const token = req.cookies.get("auth-token")?.value;
  if (!token) {
    return { error: NextResponse.json({ error: "Não autenticado" }, { status: 401 }) };
  }
  try {
    const payload = verifyToken(token);
    if (payload.role !== "ADMIN") {
      return { error: NextResponse.json({ error: "Acesso negado" }, { status: 403 }) };
    }
    return { userId: payload.id };
  } catch {
    return { error: NextResponse.json({ error: "Token inválido" }, { status: 401 }) };
  }
}

export async function writeAuditLog(params: {
  userId?: string;
  action: AuditAction;
  entity?: string;
  entityId?: string;
  details?: object;
  ip?: string;
}) {
  try {
    await prisma.auditLog.create({ data: params });
  } catch {
    // audit failures must not block main operations
  }
}

export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export function buildPeriodFilter(period?: string, startDate?: string, endDate?: string) {
  const now = new Date();
  if (period === "today") {
    const start = new Date(now); start.setHours(0, 0, 0, 0);
    return { gte: start };
  }
  if (period === "yesterday") {
    const start = new Date(now); start.setDate(start.getDate() - 1); start.setHours(0, 0, 0, 0);
    const end = new Date(now); end.setHours(0, 0, 0, 0);
    return { gte: start, lt: end };
  }
  if (period === "7days") {
    const start = new Date(now); start.setDate(start.getDate() - 7); start.setHours(0, 0, 0, 0);
    return { gte: start };
  }
  if (period === "30days") {
    const start = new Date(now); start.setDate(start.getDate() - 30); start.setHours(0, 0, 0, 0);
    return { gte: start };
  }
  if (period === "custom" && startDate && endDate) {
    return { gte: new Date(startDate), lte: new Date(endDate) };
  }
  // default: 30 days
  const start = new Date(now); start.setDate(start.getDate() - 30); start.setHours(0, 0, 0, 0);
  return { gte: start };
}
