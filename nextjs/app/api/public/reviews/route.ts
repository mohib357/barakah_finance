import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { z } from "zod";

export async function GET() {
  try {
    const reviews = await prisma.review.findMany({
      where: { status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, name: true, content: true, rating: true, createdAt: true },
    });
    return NextResponse.json(reviews, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    });
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}

const ReviewSchema = z.object({
  name:    z.string().min(2).max(80),
  phone:   z.string().optional(),
  content: z.string().min(5).max(500),
  rating:  z.number().int().min(1).max(5).default(5),
  userId:  z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ReviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "অবৈধ তথ্য।" }, { status: 400 });
    }
    const { name, phone, content, rating, userId } = parsed.data;
    const review = await prisma.review.create({
      data: {
        name,
        phone:   phone ?? null,
        content,
        rating,
        userId:  userId ?? null,
        status:  "PENDING",
      },
    });
    return NextResponse.json({ message: "মতামত জমা হয়েছে। অ্যাডমিন অনুমোদনের পর প্রকাশিত হবে।", id: review.id });
  } catch {
    return NextResponse.json({ error: "সার্ভার সমস্যা।" }, { status: 500 });
  }
}
