import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "insufarma-secret-key-change-in-prod"
);

export async function GET(req: NextRequest) {
  const token = req.cookies.get("affiliate-token")?.value;
  if (!token) {
    return NextResponse.json({ affiliate: null }, { status: 401 });
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const affiliateId = payload.affiliateId as string;

    const affiliate = await prisma.affiliate.findUnique({
      where: { id: affiliateId },
      include: { wallet: true },
    });

    if (!affiliate || affiliate.status !== "ACTIVE") {
      return NextResponse.json({ affiliate: null }, { status: 401 });
    }

    return NextResponse.json({
      affiliate: {
        id: affiliate.id,
        name: affiliate.name,
        email: affiliate.email,
        code: affiliate.code,
        commissionRate: Number(affiliate.commissionRate),
        commissionType: affiliate.commissionType,
        status: affiliate.status,
        pendingBalance: Number(affiliate.wallet?.pendingBalance ?? 0),
        availableBalance: Number(affiliate.wallet?.availableBalance ?? 0),
        totalEarned: Number(affiliate.wallet?.totalEarned ?? 0),
        totalWithdrawn: Number(affiliate.wallet?.totalWithdrawn ?? 0),
      },
    });
  } catch {
    return NextResponse.json({ affiliate: null }, { status: 401 });
  }
}
