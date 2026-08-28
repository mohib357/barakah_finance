export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { UserSystemRole } from "@/types/enums";
import { getSMSBalance } from "@/lib/auth/otp";

export async function GET() {
  try {
    const session = await requireSession();
    if (![UserSystemRole.ADMIN, UserSystemRole.SUPER_ADMIN].includes(session.user.systemRole as never)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    const balance = await getSMSBalance();
    return NextResponse.json({ balance: balance ?? 0 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
