import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getAdminPayload, writeAudit, getIp } from "@/lib/admin-helpers";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  shortDescription: z.string().min(1).optional(),
  price: z.number().positive().optional(),
  salePrice: z.number().positive().nullable().optional(),
  stock: z.number().int().min(0).optional(),
  categoryId: z.string().uuid().optional(),
  images: z.array(z.string()).optional(),
  benefits: z.array(z.string()).optional(),
  howToUse: z.string().nullable().optional(),
  composition: z.string().nullable().optional(),
  warnings: z.string().nullable().optional(),
  brand: z.string().nullable().optional(),
  featured: z.boolean().optional(),
  bestSeller: z.boolean().optional(),
  isNew: z.boolean().optional(),
  active: z.boolean().optional(),
  supplierCost: z.number().nonnegative().optional(),
  defaultAffiliateCommission: z.number().nonnegative().optional(),
  affiliateCommissionType: z.enum(["PERCENTAGE", "FIXED"]).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = getAdminPayload(req);
  if (!admin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        sales: {
          select: { grossAmount: true, netAmount: true, affiliateAmount: true, supplierAmount: true },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    }

    const financialSummary = product.sales.reduce(
      (acc, s) => {
        acc.totalRevenue += Number(s.grossAmount);
        acc.totalNet += Number(s.netAmount);
        acc.totalCommissions += Number(s.affiliateAmount);
        acc.totalSupplierCost += Number(s.supplierAmount);
        return acc;
      },
      { totalRevenue: 0, totalNet: 0, totalCommissions: 0, totalSupplierCost: 0 }
    );

    return NextResponse.json({ product, financialSummary });
  } catch (err) {
    console.error("[admin/products/[id] GET]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = getAdminPayload(req);
  if (!admin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { price, salePrice, supplierCost, defaultAffiliateCommission, ...rest } = parsed.data;

    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        ...rest,
        ...(price !== undefined ? { price: new Prisma.Decimal(price) } : {}),
        ...(salePrice !== undefined
          ? { salePrice: salePrice != null ? new Prisma.Decimal(salePrice) : null }
          : {}),
        ...(supplierCost !== undefined ? { supplierCost: new Prisma.Decimal(supplierCost) } : {}),
        ...(defaultAffiliateCommission !== undefined
          ? { defaultAffiliateCommission: new Prisma.Decimal(defaultAffiliateCommission) }
          : {}),
      },
      include: { category: true },
    });

    await writeAudit({
      userId: admin.id,
      action: "PRODUCT_CHANGE",
      entity: "Product",
      entityId: product.id,
      details: { action: "update", ...parsed.data },
      ip: getIp(req),
    });

    return NextResponse.json({ product });
  } catch (err) {
    console.error("[admin/products/[id] PUT]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = getAdminPayload(req);
  if (!admin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const product = await prisma.product.update({
      where: { id: params.id },
      data: { active: false },
    });

    await writeAudit({
      userId: admin.id,
      action: "PRODUCT_CHANGE",
      entity: "Product",
      entityId: product.id,
      details: { action: "deactivate" },
      ip: getIp(req),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/products/[id] DELETE]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
