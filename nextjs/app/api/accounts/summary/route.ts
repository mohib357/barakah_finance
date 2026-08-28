export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { getAccountSummary } from "@/lib/services/AccountsService";
import { UserSystemRole } from "@/types/enums";

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const isAdmin = session.user.systemRole === UserSystemRole.ADMIN ||
                    session.user.systemRole === UserSystemRole.SUPER_ADMIN;
    if (!isAdmin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const { searchParams } = req.nextUrl;
    const from = searchParams.get("from") ? new Date(searchParams.get("from")!) : undefined;
    const to   = searchParams.get("to")   ? new Date(searchParams.get("to")!)   : undefined;

    const summary = await getAccountSummary(from, to);

    return NextResponse.json({
      totalIncome:  summary.totalIncome.toString(),
      totalExpense: summary.totalExpense.toString(),
      netBalance:   summary.netBalance.toString(),
      accounts:     summary.accounts.map((a) => ({ ...a, currentBalance: a.currentBalance.toString() })),
      byCategory:   summary.byCategory.map((c) => ({ ...c, amount: c.amount.toString() })),
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
