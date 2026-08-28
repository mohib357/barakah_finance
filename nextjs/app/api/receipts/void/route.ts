export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { cancelReceipt } from "@/lib/services/ReceiptService";
import { UserSystemRole } from "@/types/enums";
import { z } from "zod";

const Schema = z.object({
  receiptId:         z.string(),
  reason:            z.string().min(10, "কারণ অন্তত ১০ অক্ষরের হতে হবে।"),
  issueReplacement:  z.boolean().optional(),
  replacementPrefix: z.enum(["M","C","I","E","QH","CHR"]).optional(),
});

/** POST /api/receipts/void — void/cancel a receipt */
export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const isAdmin = session.user.systemRole === UserSystemRole.ADMIN ||
                    session.user.systemRole === UserSystemRole.SUPER_ADMIN;
    if (!isAdmin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const body   = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });

    const result = await cancelReceipt({
      ...parsed.data,
      cancelledBy: session.user.id,
    });

    return NextResponse.json({
      message:                   "রসিদটি বাতিল করা হয়েছে।",
      cancelledId:               result.cancelledId,
      replacementReceiptNumber:  result.replacementReceiptNumber,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
