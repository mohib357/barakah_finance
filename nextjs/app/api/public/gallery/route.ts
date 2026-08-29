export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

export async function GET() {
  try {
    const items = await prisma.galleryItem.findMany({
      where:   { isPublished: true },
      orderBy: [{ type: "asc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
      select: {
        id: true, type: true, title: true, url: true,
        thumbnailUrl: true, description: true, eventDate: true,
      },
    });
    return NextResponse.json(items, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    });
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
