export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { UserSystemRole } from "@/types/enums";
import prisma from "@/lib/db/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();
    if (![UserSystemRole.ADMIN, UserSystemRole.SUPER_ADMIN].includes(session.user.systemRole as never)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    await prisma.committeeMember.update({ where: { id: params.id }, data: await req.json() as never });
    return NextResponse.json({ message: "আপডেট হয়েছে।" });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();
    if (session.user.systemRole !== UserSystemRole.SUPER_ADMIN) {
      return NextResponse.json({ error: "শুধুমাত্র Super Admin পারবেন।" }, { status: 403 });
    }
    await prisma.committeeMember.update({
      where: { id: params.id },
      data:  { status: "EXPIRED" as never, leftAt: new Date() },
    });
    return NextResponse.json({ message: "কমিটি সদস্য মেয়াদোত্তীর্ণ।" });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
