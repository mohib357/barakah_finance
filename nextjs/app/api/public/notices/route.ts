import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

export async function GET() {
  try {
    const now = new Date();
    const notices = await prisma.notice.findMany({
      where: {
        isActive: true,
        OR: [
          { validFrom: null },
          { validFrom: { lte: now } },
        ],
        AND: [
          {
            OR: [
              { validUntil: null },
              { validUntil: { gte: now } },
            ],
          },
        ],
      },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true, text: true, color: true, bgColor: true,
        fontBold: true, fontItalic: true, fontSize: true, style: true,
      },
    });
    return NextResponse.json(notices, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
    });
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
