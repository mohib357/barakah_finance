export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { UserSystemRole } from "@/types/enums";
import { getDueInstallments } from "@/lib/services/OrderService";

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const isAdmin = session.user.systemRole === UserSystemRole.ADMIN || session.user.systemRole === UserSystemRole.SUPER_ADMIN;
    if (!isAdmin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const { searchParams } = req.nextUrl;
    const result = await getDueInstallments({
      orderId: searchParams.get("orderId") ?? undefined,
      before:  searchParams.get("before")  ? new Date(searchParams.get("before")!) : undefined,
      overdue: searchParams.get("overdue") === "true",
    });

    return NextResponse.json({ installments: result });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
