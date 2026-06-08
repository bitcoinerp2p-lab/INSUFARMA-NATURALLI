import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminPayload, periodDates } from "@/lib/admin-helpers";

export async function GET(req: NextRequest) {
  const admin = getAdminPayload(req);
  if (!admin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") ?? "30days";
  const startDate = searchParams.get("startDate") ?? undefined;
  const endDate = searchParams.get("endDate") ?? undefined;
  const format = searchParams.get("format") ?? "json";

  const { from, to } = periodDates(period, startDate, endDate);

  try {
    const sales = await prisma.sale.findMany({
      where: { createdAt: { gte: from, lte: to } },
      orderBy: { createdAt: "desc" },
      include: {
        product: { select: { id: true, name: true, sku: true } },
        affiliate: { select: { id: true, name: true, code: true } },
      },
    });

    if (format === "csv") {
      const header =
        "id,date,product,sku,affiliate,customer,grossAmount,supplierAmount,affiliateAmount,netAmount,couponCode,utmSource,utmCampaign,efiStatus";
      const rows = sales.map((s) =>
        [
          s.id,
          s.createdAt.toISOString(),
          s.product.name,
          s.product.sku,
          s.affiliate?.name ?? "",
          s.customerName ?? "",
          s.grossAmount,
          s.supplierAmount,
          s.affiliateAmount,
          s.netAmount,
          s.couponCode ?? "",
          s.utmSource ?? "",
          s.utmCampaign ?? "",
          s.efiStatus ?? "",
        ].join(",")
      );

      const csv = [header, ...rows].join("\n");
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="sales-${period}.csv"`,
        },
      });
    }

    return NextResponse.json({ sales, total: sales.length, period: { from, to } });
  } catch (err) {
    console.error("[admin/reports/sales GET]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
