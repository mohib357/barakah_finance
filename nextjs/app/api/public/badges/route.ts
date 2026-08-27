import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

export async function GET() {
  try {
    const [badges, memberCount, savingsAgg, qardAgg, productCount] = await Promise.all([
      prisma.badge.findMany({
        where: { isVisible: true, publicVisible: true },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.member.count({ where: { status: "APPROVED" } }),
      prisma.savingsRecord.aggregate({ _sum: { paidAmount: true } }),
      prisma.qardApplication.aggregate({
        where: { status: { in: ["ACTIVE", "DISBURSED"] } },
        _sum: { disbursedAmount: true },
        _count: true,
      }),
      prisma.product.count({ where: { isActive: true } }),
    ]);

    // Attach live computed values
    type BadgeRow = (typeof badges)[number];
    const enriched = badges.map((b: BadgeRow) => {
      let value = b.value ?? "";
      let sub   = "";
      if (b.dataSource === "computed") {
        switch (b.key) {
          case "members":
            value = String(memberCount);
            sub   = "সক্রিয় সদস্য";
            break;
          case "savings":
            value = "৳" + ((savingsAgg._sum.paidAmount ?? 0) as number).toLocaleString("en-IN");
            sub   = "মোট সঞ্চয়";
            break;
          case "loans":
            value = "৳" + ((qardAgg._sum.disbursedAmount ?? 0) as number).toLocaleString("en-IN");
            sub   = String(qardAgg._count) + " টি চলমান করজ";
            break;
          case "products":
            value = String(productCount);
            sub   = "ধরনের পণ্য";
            break;
        }
      }
      return { ...b, computedValue: value, computedSub: sub };
    });

    return NextResponse.json(enriched, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    });
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
