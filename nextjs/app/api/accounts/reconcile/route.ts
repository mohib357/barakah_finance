export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { reconcileAccount } from "@/lib/services/AccountsService";
import { UserSystemRole } from "@/types/enums";
import { z } from "zod";

const Schema = z.object({
  accountId:        z.string(),
  actualBalance:    z.number(),
  adjustmentReason: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const isAdmin = session.user.systemRole === UserSystemRole.ADMIN ||
                    session.user.systemRole === UserSystemRole.SUPER_ADMIN;
    if (!isAdmin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const body   = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });

    await reconcileAccount({ ...parsed.data, reconciledBy: session.user.id });
    return NextResponse.json({ message: "ব্যালেন্স মিলানো সম্পন্ন হয়েছে।" });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
