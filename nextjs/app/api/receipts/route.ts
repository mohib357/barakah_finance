export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { lookupReceipt } from "@/lib/services/ReceiptService";
import { UserSystemRole } from "@/types/enums";

/** GET /api/receipts?number=M-0001 */
export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const isAdmin = session.user.systemRole === UserSystemRole.ADMIN ||
                    session.user.systemRole === UserSystemRole.SUPER_ADMIN;
    if (!isAdmin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const number = req.nextUrl.searchParams.get("number");
    if (!number) return NextResponse.json({ error: "রসিদ নম্বর প্রয়োজন।" }, { status: 400 });

    const receipt = await lookupReceipt(number);
    if (!receipt) return NextResponse.json({ error: "রসিদ পাওয়া যায়নি।" }, { status: 404 });

    return NextResponse.json({ receipt });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
