export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { z } from "zod";

const Schema = z.object({
  content: z.string().min(1).max(500),
  userId:  z.string().nullable().optional(),
  name:    z.string().min(1).max(60),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body   = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });

    const post = await prisma.post.findUnique({ where: { id: params.id, isPublished: true } });
    if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.postComment.create({
      data: {
        postId:     params.id,
        content:    parsed.data.content,
        userId:     parsed.data.userId ?? null,
        name:       parsed.data.name,
        isApproved: false, // requires admin approval per spec
      },
    });

    // Return approved comments only
    const comments = await prisma.postComment.findMany({
      where:   { postId: params.id, isApproved: true },
      orderBy: { createdAt: "asc" },
      select:  { id: true, content: true, name: true, createdAt: true },
      take:    20,
    });

    return NextResponse.json({ comments, message: "মন্তব্য পাঠানো হয়েছে। অনুমোদনের পর প্রকাশিত হবে।" });
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
