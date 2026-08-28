export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { UserSystemRole } from "@/types/enums";
import prisma from "@/lib/db/prisma";
import { z } from "zod";

export async function GET() {
  try {
    const session = await requireSession();
    if (![UserSystemRole.ADMIN, UserSystemRole.SUPER_ADMIN].includes(session.user.systemRole)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const [sessions, rules] = await Promise.all([
      prisma.committeeSession.findMany({
        orderBy: { sessionStart: "desc" },
        include: { members: { orderBy: { sortOrder: "asc" } } },
        take: 5,
      }),
      prisma.committeeRule.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    ]);

    return NextResponse.json({ sessions, rules });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}

const MemberSchema = z.object({
  sessionId:   z.string(),
  name:        z.string().min(2),
  designation: z.string().min(2),
  phone:       z.string().optional(),
  sortOrder:   z.number().int().optional(),
  userId:      z.string().optional(),
  memberID:    z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    if (session.user.systemRole !== UserSystemRole.SUPER_ADMIN) {
      return NextResponse.json({ error: "শুধুমাত্র Super Admin পারবেন।" }, { status: 403 });
    }

    const body = await req.json();

    // Create new committee session
    if (body.type === "session") {
      const s = await prisma.committeeSession.create({
        data: {
          sessionName:  body.sessionName,
          sessionStart: new Date(body.sessionStart),
          sessionEnd:   new Date(body.sessionEnd),
          isActive:     true,
        },
      });
      return NextResponse.json({ id: s.id, message: "কমিটি সেশন তৈরি হয়েছে।" }, { status: 201 });
    }

    // Add member
    const parsed = MemberSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });

    const member = await prisma.committeeMember.create({ data: parsed.data as never });
    return NextResponse.json({ id: member.id, message: "কমিটি সদস্য যোগ হয়েছে।" }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
