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
  const fromParam = searchParams.get("from") ?? searchParams.get("startDate") ?? undefined;
  const toParam = searchParams.get("to") ?? searchParams.get("endDate") ?? undefined;
  const format = searchParams.get("format") ?? "json";

  const { from, to } = periodDates(period, fromParam, toParam);

  try {
    const sales = await prisma.sale.findMany({
      where: { createdAt: { gte: from, lte: to } },
      orderBy: { createdAt: "asc" },
      include: {
        product: { select: { id: true, name: true, sku: true } },
        affiliate: { select: { id: true, name: true, code: true } },
      },
    });

    if (format === "csv") {
      const header =
        "id,date,product,sku,affiliate,customer,grossAmount,supplierAmount,affiliateAmount,netAmount,couponCode,utmSource,utmCampaign,mpStatus";
      const csvRows = sales.map((s) =>
        [
          s.id,
          s.createdAt.toISOString(),
          `"${s.product.name}"`,
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
          s.mpStatus ?? "",
        ].join(",")
      );
      const csv = [header, ...csvRows].join("\n");
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="sales-${period}.csv"`,
        },
      });
    }

    // Aggregate by date for the table view
    const byDate = new Map<string, { count: number; revenue: number }>();
    for (const s of sales) {
      const key = s.createdAt.toISOString().slice(0, 10);
      const existing = byDate.get(key) ?? { count: 0, revenue: 0 };
      existing.count += 1;
      existing.revenue += Number(s.grossAmount);
      byDate.set(key, existing);
    }

    const rows = Array.from(byDate.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, data]) => ({
        date,
        count: data.count,
        revenue: data.revenue,
        avg: data.count > 0 ? data.revenue / data.count : 0,
      }));

    return NextResponse.json({ rows, total: sales.length, period: { from, to } });
  } catch (err) {
    console.error("[admin/reports/sales GET]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
