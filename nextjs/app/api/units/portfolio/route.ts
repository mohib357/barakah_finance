export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { UserSystemRole } from "@/types/enums";
import { getMemberPortfolio } from "@/lib/services/UnitService";

/** GET /api/units/portfolio?userId=xxx  (admin) or own portfolio */
export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const queryUserId = req.nextUrl.searchParams.get("userId");
    const isAdmin = session.user.systemRole === UserSystemRole.ADMIN ||
                    session.user.systemRole === UserSystemRole.SUPER_ADMIN;

    const targetUserId = isAdmin && queryUserId ? queryUserId : session.user.id;
    const portfolio = await getMemberPortfolio(targetUserId);

    if (!portfolio) {
      return NextResponse.json({ error: "সদস্য পোর্টফোলিও পাওয়া যায়নি।" }, { status: 404 });
    }

    // Serialize Decimal values for JSON
    return NextResponse.json({
      ...portfolio,
      totalDeposit:    portfolio.totalDeposit.toString(),
      units:           portfolio.units.toString(),
      weightedCapital: portfolio.weightedCapital.toString(),
      principalAmount: portfolio.principalAmount.toString(),
      profitEarned:    portfolio.profitEarned.toString(),
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
