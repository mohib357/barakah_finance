import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

export async function GET() {
  try {
    const [members, products, orders, qard] = await Promise.all([
      prisma.member.count({ where: { status: "APPROVED" } }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.order.count({ where: { status: "COMPLETED" } }),
      prisma.qardApplication.count({ where: { status: { in: ["ACTIVE", "COMPLETED"] } } }),
    ]);
    return NextResponse.json({ members, products, orders, qard }, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    });
  } catch {
    return NextResponse.json({ members: 0, products: 0, orders: 0, qard: 0 }, { status: 200 });
  }
}
