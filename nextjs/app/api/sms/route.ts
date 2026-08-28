export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { UserSystemRole } from "@/types/enums";
import prisma from "@/lib/db/prisma";

// GET /api/sms — list templates + recent records
export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    if (![UserSystemRole.ADMIN, UserSystemRole.SUPER_ADMIN].includes(session.user.systemRole)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { searchParams } = req.nextUrl;
    const type = searchParams.get("type") ?? "templates";

    if (type === "records") {
      const from  = searchParams.get("from");
      const to    = searchParams.get("to");
      const where: Record<string, unknown> = {};
      if (from && to) where.sentAt = { gte: new Date(from), lte: new Date(to) };

      const [records, total] = await Promise.all([
        prisma.sMSRecord.findMany({
          where:   where as never,
          orderBy: { createdAt: "desc" },
          take:    200,
          include: { sentBy: { select: { firstName: true, username: true } } },
        }),
        prisma.sMSRecord.count({ where: where as never }),
      ]);
      return NextResponse.json({ records, total });
    }

    const templates = await prisma.sMSTemplate.findMany({ orderBy: { category: "asc" } });
    return NextResponse.json({ templates });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}

// POST /api/sms — create/update template
export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    if (![UserSystemRole.ADMIN, UserSystemRole.SUPER_ADMIN].includes(session.user.systemRole)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { id, name, category, template, isActive } = await req.json();
    if (!name || !category || !template) {
      return NextResponse.json({ error: "নাম, ক্যাটাগরি ও টেমপ্লেট দিন।" }, { status: 400 });
    }

    if (id) {
      await prisma.sMSTemplate.update({ where: { id }, data: { name, category, template, isActive: isActive ?? true } });
      return NextResponse.json({ message: "টেমপ্লেট আপডেট হয়েছে।" });
    } else {
      const tmpl = await prisma.sMSTemplate.create({ data: { name, category, template, isActive: true } });
      return NextResponse.json({ id: tmpl.id, message: "টেমপ্লেট তৈরি হয়েছে।" }, { status: 201 });
    }
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
