export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { UserSystemRole } from "@/types/enums";
import { commitProfitDistribution } from "@/lib/services/UnitService";
import { z } from "zod";

const Schema = z.object({
  periodFrom:          z.string(),
  periodTo:            z.string(),
  businessRevenue:     z.number().positive(),
  costOfGoods:         z.number().nonnegative().optional(),
  operationalExpense:  z.number().nonnegative().optional(),
  description:         z.string().optional(),
  projectId:           z.string().optional(),
  confirmText:         z.literal("CONFIRM"), // require explicit confirmation
});

/** POST /api/units/commit-profit — write profit distribution to DB */
export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const isSuperAdmin = session.user.systemRole === UserSystemRole.SUPER_ADMIN;
    const isAdmin      = session.user.systemRole === UserSystemRole.ADMIN;
    if (!isSuperAdmin && !isAdmin) {
      return NextResponse.json({ error: "শুধুমাত্র অ্যাডমিন এই কাজ করতে পারবেন।" }, { status: 403 });
    }

    const body   = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });
    }

    const { confirmText: _, ...params } = parsed.data;
    const result = await commitProfitDistribution(params, session.user.id);

    return NextResponse.json({
      message:        "মুনাফা বিতরণ সফলভাবে সম্পন্ন হয়েছে।",
      distributionId: result.distributionId,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
