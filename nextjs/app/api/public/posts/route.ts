export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

export async function GET() {
  try {
    const posts = await prisma.post.findMany({
      where:   { isPublished: true },
      orderBy: { publishedAt: "desc" },
      take:    50,
      include: {
        author:    { select: { firstName: true, username: true } },
        reactions: { select: { id: true, type: true, name: true }, take: 100 },
        comments:  {
          where:   { isApproved: true },
          orderBy: { createdAt: "asc" },
          select:  { id: true, content: true, name: true, createdAt: true },
          take:    20,
        },
        _count: { select: { reactions: true, comments: { where: { isApproved: true } } } },
      },
    });
    return NextResponse.json(posts, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
    });
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
