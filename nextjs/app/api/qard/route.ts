export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { applyQard } from "@/lib/services/QardService";
import prisma from "@/lib/db/prisma";
import { UserSystemRole } from "@/types/enums";
import { z } from "zod";

const ApplySchema = z.object({
  requestedAmount:  z.number().positive(),
  repaymentMonths:  z.number().int().min(1).max(12),
  reason:           z.string().min(10, "কারণ অন্তত ১০ অক্ষরের হতে হবে।"),
  guarantorUserId:  z.string().optional(),
  witnesses:        z.array(z.object({
    name:      z.string(),
    fatherName:z.string().optional(),
    phone:     z.string(),
    address:   z.string().optional(),
    nidNumber: z.string().optional(),
  })).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const isAdmin = session.user.systemRole === UserSystemRole.ADMIN || session.user.systemRole === UserSystemRole.SUPER_ADMIN;
    const { searchParams } = req.nextUrl;

    const where: Record<string, unknown> = {};
    if (!isAdmin) where.borrowerUserId = session.user.id;
    if (searchParams.get("status")) where.status = searchParams.get("status");

    const applications = await prisma.qardApplication.findMany({
      where:   where as never,
      orderBy: { createdAt: "desc" },
      include: {
        installments: { orderBy: { installmentNumber: "asc" } },
      },
      take: 100,
    });

    return NextResponse.json({ applications });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const body    = await req.json();
    const parsed  = ApplySchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });

    const result = await applyQard({
      ...parsed.data,
      borrowerUserId: session.user.id,
      createdBy:      session.user.id,
    });

    return NextResponse.json({ ...result, message: "করজে হাসানা আবেদন জমা হয়েছে।" }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
