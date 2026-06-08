import { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AuditAction } from "@prisma/client";

export function getAdminPayload(
  req: NextRequest
): { id: string; role: string; email: string } | null {
  try {
    const token = req.cookies.get("auth-token")?.value;
    if (!token) return null;
    const payload = verifyToken(token);
    if (payload.role !== "ADMIN") return null;
    return payload;
  } catch {
    return null;
  }
}

export function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  );
}

export async function writeAudit(opts: {
  userId?: string;
  action: AuditAction;
  entity?: string;
  entityId?: string;
  details?: Record<string, unknown>;
  ip?: string;
}) {
  await prisma.auditLog.create({
    data: {
      userId: opts.userId ?? null,
      action: opts.action,
      entity: opts.entity ?? null,
      entityId: opts.entityId ?? null,
      details: opts.details ? (opts.details as import("@prisma/client").Prisma.InputJsonValue) : undefined,
      ip: opts.ip ?? null,
    },
  });
}

export function periodDates(
  period: string,
  startDate?: string,
  endDate?: string
): { from: Date; to: Date } {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (period === "custom" && startDate && endDate) {
    return { from: new Date(startDate), to: new Date(endDate) };
  }
  if (period === "yesterday") {
    const yesterday = new Date(startOfToday);
    yesterday.setDate(yesterday.getDate() - 1);
    return { from: yesterday, to: startOfToday };
  }
  if (period === "7days") {
    const from = new Date(startOfToday);
    from.setDate(from.getDate() - 7);
    return { from, to: now };
  }
  if (period === "30days") {
    const from = new Date(startOfToday);
    from.setDate(from.getDate() - 30);
    return { from, to: now };
  }
  if (period === "90days") {
    const from = new Date(startOfToday);
    from.setDate(from.getDate() - 90);
    return { from, to: now };
  }
  if (period === "year") {
    const from = new Date(now.getFullYear(), 0, 1);
    return { from, to: now };
  }
  return { from: startOfToday, to: now };
}

export function randomCode(length: number, chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
