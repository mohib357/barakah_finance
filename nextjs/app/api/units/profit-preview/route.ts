export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { UserSystemRole } from "@/types/enums";
import { previewProfitDistribution } from "@/lib/services/UnitService";
import { z } from "zod";

const Schema = z.object({
  periodFrom:          z.string(),
  periodTo:            z.string(),
  businessRevenue:     z.number().nonnegative(),
  costOfGoods:         z.number().nonnegative().optional(),
  operationalExpense:  z.number().nonnegative().optional(),
});

/** POST /api/units/profit-preview — preview profit distribution (no DB write) */
export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const isAdmin = session.user.systemRole === UserSystemRole.ADMIN ||
                    session.user.systemRole === UserSystemRole.SUPER_ADMIN;
    if (!isAdmin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const body   = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });
    }

    const preview = await previewProfitDistribution(parsed.data);

    // Serialize Decimal → string for JSON transport
    return NextResponse.json({
      ...preview,
      businessRevenue:      preview.businessRevenue.toString(),
      costOfGoods:          preview.costOfGoods.toString(),
      operationalExpense:   preview.operationalExpense.toString(),
      netProfit:            preview.netProfit.toString(),
      memberPoolAmount:     preview.memberPoolAmount.toString(),
      charityAmount:        preview.charityAmount.toString(),
      orgAmount:            preview.orgAmount.toString(),
      memberSharePct:       preview.memberSharePct.toString(),
      charitySharePct:      preview.charitySharePct.toString(),
      orgSharePct:          preview.orgSharePct.toString(),
      totalWeightedCapital: preview.totalWeightedCapital.toString(),
      memberShares: preview.memberShares.map((ms) => ({
        ...ms,
        activeCapital:   ms.activeCapital.toString(),
        units:           ms.units.toString(),
        weightedCapital: ms.weightedCapital.toString(),
        profitShare:     ms.profitShare.toString(),
        profitSharePct:  ms.profitSharePct.toString(),
      })),
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
