export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { queryAuditLog } from "@/lib/services/AuditService";
import { UserSystemRole } from "@/types/enums";

/** GET /api/audit-log — Super Admin only */
export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    // Spec: "Audit Log কোনো সাধারণ Admin delete/edit করতে পারবে না।
    //        শুধুমাত্র Super Admin নির্দিষ্ট permission-এর মাধ্যমে দেখতে পারবে।"
    if (session.user.systemRole !== UserSystemRole.SUPER_ADMIN) {
      return NextResponse.json({ error: "শুধুমাত্র Super Admin অ্যাক্সেস করতে পারবেন।" }, { status: 403 });
    }

    const { searchParams } = req.nextUrl;
    const result = await queryAuditLog({
      userId:   searchParams.get("userId")   ?? undefined,
      module:   searchParams.get("module")   ?? undefined,
      action:   searchParams.get("action")   ?? undefined,
      recordId: searchParams.get("recordId") ?? undefined,
      from:     searchParams.get("from") ? new Date(searchParams.get("from")!) : undefined,
      to:       searchParams.get("to")   ? new Date(searchParams.get("to")!)   : undefined,
      page:     searchParams.get("page")  ? parseInt(searchParams.get("page")!)  : 1,
      limit:    searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 50,
    });

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
