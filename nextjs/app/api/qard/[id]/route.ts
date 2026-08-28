export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session";
import prisma from "@/lib/db/prisma";
import { UserSystemRole } from "@/types/enums";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();
    const isAdmin = session.user.systemRole === UserSystemRole.ADMIN || session.user.systemRole === UserSystemRole.SUPER_ADMIN;

    const qard = await prisma.qardApplication.findUnique({
      where:   { id: params.id },
      include: { installments: { orderBy: { installmentNumber: "asc" } } },
    });

    if (!qard) return NextResponse.json({ error: "করজ পাওয়া যায়নি।" }, { status: 404 });

    // Non-admin can only see their own
    if (!isAdmin && qard.borrowerUserId !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({ qard });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
