export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { UserSystemRole } from "@/types/enums";
import prisma from "@/lib/db/prisma";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();
    const isAdmin = [UserSystemRole.ADMIN, UserSystemRole.SUPER_ADMIN].includes(session.user.systemRole as never);

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        customer:     { select: { id: true, name: true, phone: true, clientID: true, userId: true } },
        product:      { select: { id: true, name: true, category: true, purchasePrice: true } },
        installments: { orderBy: { installmentNumber: "asc" } },
        guarantors:   { select: { userId: true, name: true, phone: true, memberID: true } },
        witnesses:    { select: { name: true, phone: true, address: true } },
      },
    });

    if (!order) return NextResponse.json({ error: "অর্ডার পাওয়া যায়নি।" }, { status: 404 });

    // Non-admin can only see their own orders
    if (!isAdmin && order.customer.userId !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({ order });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();
    const isAdmin = [UserSystemRole.ADMIN, UserSystemRole.SUPER_ADMIN].includes(session.user.systemRole as never);
    if (!isAdmin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const body = await req.json();
    await prisma.order.update({
      where: { id: params.id },
      data:  body as never,
    });
    return NextResponse.json({ message: "অর্ডার আপডেট হয়েছে।" });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
