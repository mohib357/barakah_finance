export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { z } from "zod";

const Schema = z.object({
  type:   z.string().min(1),
  userId: z.string().nullable().optional(),
  name:   z.string().nullable().optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body   = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

    const post = await prisma.post.findUnique({ where: { id: params.id, isPublished: true } });
    if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Toggle: if same user/name already reacted with same type, remove it
    const existing = parsed.data.userId
      ? await prisma.postReaction.findFirst({ where: { postId: params.id, userId: parsed.data.userId, type: parsed.data.type } })
      : null;

    if (existing) {
      await prisma.postReaction.delete({ where: { id: existing.id } });
    } else {
      await prisma.postReaction.create({
        data: { postId: params.id, type: parsed.data.type, userId: parsed.data.userId ?? null, name: parsed.data.name ?? null },
      });
    }

    const reactions = await prisma.postReaction.findMany({
      where: { postId: params.id },
      select: { id: true, type: true, name: true },
      take: 100,
    });
    const _count = { reactions: reactions.length, comments: post.id ? 0 : 0 };

    return NextResponse.json({ reactions, _count });
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
