export const dynamic = "force-dynamic";
// Public API: calculate installment plan without authentication
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { calculateInstallmentPlan } from "@/lib/services/InstallmentEngine";
import { ProfitMethod } from "@/types/enums";
import { z } from "zod";

const Schema = z.object({
  purchaseCost:    z.number().positive(),
  downPayment:     z.number().nonnegative().optional(),
  profitRate:      z.number().min(0).max(200).optional(),
  profitMethod:    z.enum(["FULL_COST_BASED","FINANCED_AMOUNT","CUSTOM"]).optional(),
  numInstallments: z.number().int().min(1).max(60),
});

export async function POST(req: NextRequest) {
  try {
    const body   = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });

    const plan = calculateInstallmentPlan({
      ...parsed.data,
      profitMethod: (parsed.data.profitMethod ?? ProfitMethod.FINANCED_AMOUNT) as ProfitMethod,
      orderDate:    new Date(),
      graceDays:    5,
    });

    return NextResponse.json({
      purchaseCost:    plan.purchaseCost,
      downPayment:     plan.downPayment,
      financedAmount:  plan.financedAmount,
      profitAmount:    plan.profitAmount,
      totalPayable:    plan.totalPayable,
      profitRate:      plan.profitRate,
      numInstallments: plan.numInstallments,
      regularAmount:   plan.regularAmount,
      lastAmount:      plan.lastAmount,
      schedule:        plan.schedule.map((s) => ({
        num:           s.installmentNumber,
        amount:        s.dueAmount,
        label:         s.label,
        isDownPayment: s.isDownPayment,
      })),
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
