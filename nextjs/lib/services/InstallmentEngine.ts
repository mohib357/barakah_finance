// ═══════════════════════════════════════════════════════════
//  BARAKAH FINANCE — Installment Calculation Engine
//
//  Three methods (Website.txt):
//  ─────────────────────────────────────────────────────────
//  Method A — Full Cost Based (FULL_COST_BASED)
//    Selling Price = Purchase Cost + (Purchase Cost × Profit%)
//    Used when: no down payment, full cost financed.
//
//  Method B — Financed Amount Based (FINANCED_AMOUNT) ← DEFAULT
//    Financed Amount = Purchase Cost − Down Payment
//    Profit = Financed Amount × Profit%
//    Total Payable = Purchase Cost + Profit
//    *** This is the Shariah-preferred method ***
//    Example: Cost=30000, Down=10000, Rate=10%
//      Financed=20000, Profit=2000, Total=32000
//
//  Method C — Custom (CUSTOM)
//    Admin sets a fixed profit amount or custom percentage.
//
//  Rounding rule (Website.txt):
//    Regular installments = floor(Total / N)
//    LAST installment     = Total − floor(Total/N) × (N−1)
//    ⟹ All installments sum exactly to Total Payable (no drift)
//
//  Installment schedule:
//    First installment due = orderDate + 1 month (next month)
//    OR if down payment exists: down payment on order date,
//    then first regular installment = orderDate + 1 month.
//    Each subsequent installment = previous + 1 month.
//    Grace date = dueDate − graceDays (from settings)
//
//  Late fee rule (Website.txt):
//    Late fees → 100% Charity Fund, never org income.
// ═══════════════════════════════════════════════════════════

import Decimal from "decimal.js";
import { ProfitMethod } from "@/types/enums";
import { addMonths } from "@/lib/utils/dateUtils";

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_EVEN });

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface InstallmentInput {
  purchaseCost:   number;
  downPayment?:   number;
  profitRate?:    number;   // percentage, e.g. 10 = 10%
  customProfit?:  number;   // for Method C: fixed profit amount
  profitMethod:   ProfitMethod;
  numInstallments: number;
  orderDate:      Date;
  graceDays?:     number;   // default 5
}

export interface InstallmentScheduleItem {
  installmentNumber: number;
  dueDate:           Date;
  graceDate:         Date;
  dueAmount:         number;   // whole number (floored, last adjusted)
  isDownPayment:     boolean;
  label:             string;   // "ডাউনপেমেন্ট" or "১ম কিস্তি" etc.
}

export interface InstallmentPlan {
  purchaseCost:    number;
  downPayment:     number;
  financedAmount:  number;
  profitAmount:    number;
  totalPayable:    number;
  profitRate:      number;
  profitMethod:    ProfitMethod;
  numInstallments: number;
  regularAmount:   number;   // per-installment (floored)
  lastAmount:      number;   // final installment (adjusted for residual)
  schedule:        InstallmentScheduleItem[];
  // Validation: sum of all schedule items == totalPayable
  scheduleSum:     number;
}

// ─────────────────────────────────────────────────────────────
// Core calculation — pure function, no DB access
// ─────────────────────────────────────────────────────────────

export function calculateInstallmentPlan(input: InstallmentInput): InstallmentPlan {
  const {
    purchaseCost,
    downPayment     = 0,
    profitRate      = 10,
    customProfit,
    profitMethod,
    numInstallments,
    orderDate,
    graceDays       = 5,
  } = input;

  if (numInstallments < 1)   throw new Error("কিস্তির সংখ্যা কমপক্ষে ১ হতে হবে।");
  if (purchaseCost   <= 0)   throw new Error("ক্রয়মূল্য শূন্যের বেশি হতে হবে।");

  const cost   = new Decimal(purchaseCost);
  const down   = new Decimal(Math.max(0, downPayment));
  const rate   = new Decimal(profitRate).div(100);
  const N      = numInstallments;

  // ── Profit calculation by method ────────────────────────
  let profit: Decimal;

  switch (profitMethod) {
    case ProfitMethod.FULL_COST_BASED:
      // Method A: profit on full cost regardless of down payment
      profit = cost.mul(rate).toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
      break;

    case ProfitMethod.FINANCED_AMOUNT:
      // Method B (default — Shariah-preferred):
      // profit only on the financed (not-yet-paid) portion
      {
        const financed = cost.minus(down);
        if (financed.lte(0)) throw new Error("ডাউনপেমেন্ট ক্রয়মূল্যের বেশি হতে পারে না।");
        profit = financed.mul(rate).toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
      }
      break;

    case ProfitMethod.CUSTOM:
      // Method C: admin-supplied fixed profit amount
      if (customProfit === undefined || customProfit < 0) {
        throw new Error("কাস্টম মুনাফার পরিমাণ দিন।");
      }
      profit = new Decimal(customProfit).toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
      break;

    default:
      throw new Error(`অজানা মুনাফা পদ্ধতি: ${profitMethod}`);
  }

  // ── Total payable = cost + profit ───────────────────────
  const totalPayable = cost.plus(profit);

  // ── Amount remaining after down payment ─────────────────
  const remaining = totalPayable.minus(down);
  if (remaining.lte(0)) {
    throw new Error("ডাউনপেমেন্ট মোট মূল্যের সমান বা বেশি — কোনো কিস্তি প্রয়োজন নেই।");
  }

  // ── Regular installment = floor(remaining / N) ──────────
  const regular = remaining.div(N).toDecimalPlaces(0, Decimal.ROUND_FLOOR);
  // Last installment absorbs the residual so sum = remaining exactly
  const last    = remaining.minus(regular.mul(N - 1));

  // ── Build schedule ────────────────────────────────────────
  const schedule: InstallmentScheduleItem[] = [];

  // Down payment entry (installment 0 if down > 0)
  if (down.gt(0)) {
    schedule.push({
      installmentNumber: 0,
      dueDate:           orderDate,
      graceDate:         new Date(orderDate.getTime() - graceDays * 86_400_000),
      dueAmount:         down.toNumber(),
      isDownPayment:     true,
      label:             "ডাউনপেমেন্ট",
    });
  }

  // Regular installments — start 1 month after order date
  for (let i = 1; i <= N; i++) {
    const dueDate   = addMonths(orderDate, i);
    const graceDate = new Date(dueDate.getTime() - graceDays * 86_400_000);
    const amount    = (i === N ? last : regular).toNumber();
    const labels    = ["১ম","২য়","৩য়","৪র্থ","৫ম","৬ষ্ঠ","৭ম","৮ম","৯ম","১০ম","১১শ","১২শ"];
    const label     = (labels[i - 1] ?? `${i}তম`) + " কিস্তি";

    schedule.push({
      installmentNumber: i,
      dueDate,
      graceDate,
      dueAmount:     amount,
      isDownPayment: false,
      label,
    });
  }

  // ── Validation: sum must exactly equal totalPayable ──────
  const scheduleSum = schedule.reduce((acc, s) => acc + s.dueAmount, 0);
  // Allow ±1 rounding tolerance
  if (Math.abs(scheduleSum - totalPayable.toNumber()) > 1) {
    throw new Error(`কিস্তির যোগফল (${scheduleSum}) মোট মূল্যের (${totalPayable}) সাথে মিলছে না।`);
  }

  return {
    purchaseCost: cost.toNumber(),
    downPayment:  down.toNumber(),
    financedAmount: cost.minus(down).toNumber(),
    profitAmount:   profit.toNumber(),
    totalPayable:   totalPayable.toNumber(),
    profitRate,
    profitMethod,
    numInstallments: N,
    regularAmount: regular.toNumber(),
    lastAmount:    last.toNumber(),
    schedule,
    scheduleSum,
  };
}

// ─────────────────────────────────────────────────────────────
// Partial payment allocation
//   When a payment is received for an installment, it may be
//   less than, equal to, or more than the due amount.
//   Per spec: partial → outstanding balance on same installment
//             overpayment → advance on next (if configured)
// ─────────────────────────────────────────────────────────────

export interface PaymentAllocation {
  installmentId:   string;
  appliedAmount:   number;
  previousPaid:    number;
  newPaid:         number;
  newRemaining:    number;
  isFullyPaid:     boolean;
  overpayment:     number;   // 0 if none
}

export function allocatePayment(params: {
  installmentDueAmount:  number;
  installmentPaidAmount: number;  // already paid before this payment
  paymentAmount:         number;
}): { applied: number; remaining: number; overpayment: number } {
  const { installmentDueAmount, installmentPaidAmount, paymentAmount } = params;
  const stillOwed = installmentDueAmount - installmentPaidAmount;

  if (stillOwed <= 0) {
    // Already fully paid — entire payment is overpayment
    return { applied: 0, remaining: 0, overpayment: paymentAmount };
  }

  if (paymentAmount <= stillOwed) {
    // Partial or exact payment
    return {
      applied:     paymentAmount,
      remaining:   stillOwed - paymentAmount,
      overpayment: 0,
    };
  }

  // Overpayment
  return {
    applied:     stillOwed,
    remaining:   0,
    overpayment: paymentAmount - stillOwed,
  };
}
