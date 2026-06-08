import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminPayload, writeAudit, getIp } from "@/lib/admin-helpers";
import { AffiliateStatus } from "@prisma/client";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = getAdminPayload(req);
  if (!admin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  let newStatus: AffiliateStatus = "ACTIVE";
  let auditAction: "AFFILIATE_APPROVE" | "AFFILIATE_SUSPEND" = "AFFILIATE_APPROVE";

  if (action === "suspend") {
    newStatus = "SUSPENDED";
    auditAction = "AFFILIATE_SUSPEND";
  } else if (action === "block") {
    newStatus = "BLOCKED";
    auditAction = "AFFILIATE_SUSPEND";
  }

  try {
    const affiliate = await prisma.$transaction(async (tx) => {
      const a = await tx.affiliate.update({
        where: { id: params.id },
        data: { status: newStatus },
      });

      if (newStatus === "ACTIVE") {
        const existing = await tx.affiliateWallet.findUnique({
          where: { affiliateId: a.id },
        });
        if (!existing) {
          await tx.affiliateWallet.create({ data: { affiliateId: a.id } });
        }
      }

      return a;
    });

    await writeAudit({
      userId: admin.id,
      action: auditAction,
      entity: "Affiliate",
      entityId: affiliate.id,
      details: { newStatus },
      ip: getIp(req),
    });

    return NextResponse.json({ affiliate });
  } catch (err) {
    console.error("[admin/affiliates/[id]/approve]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
