// ═══════════════════════════════════════════════════════════
//  BARAKAH FINANCE — Unit Investment Portfolio Engine
//
//  Core business rules (from Website.txt):
//  ─────────────────────────────────────────
//  • 1 Unit = ৳2,000 (configurable by Super Admin)
//  • Fractional units allowed (৳5,000 = 2.5 Units)
//  • Profit calculation starts from ACTIVATION date (capital deployed),
//    NOT deposit date
//  • Profit basis: day-weighted proportional share
//  • Net Profit = Business Revenue - COGS - Operational Expense
//  • If Net Profit ≤ 0 → no distribution
//  • Distribution: 60% Members | 5% Charity | 35% Organization
//  • Late fees → 100% Charity Fund (never organization income)
//  • Principal protected: member gets full capital back unless
//    ACTUAL business loss is proven
//  • Exit: Immediate (realized cash only) OR Delayed (full collection)
// ═══════════════════════════════════════════════════════════

import prisma from "@/lib/db/prisma";
import Decimal from "decimal.js";

// ── Configure Decimal for financial precision ──────────────
Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_EVEN });

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface MemberUnitSummary {
  userId:          string;
  memberId:        string;
  memberID:        string;
  name:            string;
  totalDeposit:    Decimal;
  units:           Decimal;
  activationDate:  Date | null;
  activeDays:      number;
  weightedCapital: Decimal;
  principalAmount: Decimal;
  profitEarned:    Decimal;
  estimatedExit:   Date | null;
}

export interface ProfitPreview {
  periodFrom:          string;
  periodTo:            string;
  businessRevenue:     Decimal;
  costOfGoods:         Decimal;
  operationalExpense:  Decimal;
  netProfit:           Decimal;
  memberPoolAmount:    Decimal;
  charityAmount:       Decimal;
  orgAmount:           Decimal;
  memberSharePct:      Decimal;
  charitySharePct:     Decimal;
  orgSharePct:         Decimal;
  memberShares:        MemberSharePreview[];
  totalActiveDays:     number;
  totalWeightedCapital:Decimal;
}

export interface MemberSharePreview {
  userId:          string;
  memberId:        string;
  memberID:        string;
  name:            string;
  activeCapital:   Decimal;
  units:           Decimal;
  weightedCapital: Decimal;
  activeDays:      number;
  profitShare:     Decimal;
  profitSharePct:  Decimal;
}

export interface ExitSettlement {
  userId:          string;
  memberId:        string;
  memberID:        string;
  name:            string;
  principalAmount: Decimal;
  profitEarned:    Decimal;
  charityDeduction:Decimal;
  netPayout:       Decimal;
  exitType:        "IMMEDIATE" | "DELAYED";
  pendingProducts: number;   // count of unrecovered installment orders
  estimatedFullRecoveryDate: Date | null;
  canImmediateExit:boolean;
}

// ─────────────────────────────────────────────────────────────
// 1. Get current unit value from settings
// ─────────────────────────────────────────────────────────────
export async function getUnitValue(): Promise<Decimal> {
  const settings = await prisma.systemSettings.findUnique({
    where:  { id: "global" },
    select: { unitValue: true },
  });
  return new Decimal(settings?.unitValue?.toString() ?? "2000");
}

// ─────────────────────────────────────────────────────────────
// 2. Calculate units for a given amount
//    Fractional units are allowed per spec (৳5,000 = 2.5 units)
// ─────────────────────────────────────────────────────────────
export function calculateUnits(amount: Decimal, unitValue: Decimal): Decimal {
  return amount.div(unitValue);
}

// ─────────────────────────────────────────────────────────────
// 3. Get full portfolio summary for a single member
// ─────────────────────────────────────────────────────────────
export async function getMemberPortfolio(userId: string): Promise<MemberUnitSummary | null> {
  const member = await prisma.member.findUnique({
    where:  { userId },
    include: { user: { select: { firstName: true, lastName: true } } },
  });
  if (!member) return null;

  const unitValue = await getUnitValue();

  // Sum all paid savings
  const savingsAgg = await prisma.savingsRecord.aggregate({
    where:  { userId, status: "PAID" },
    _sum:   { paidAmount: true },
  });
  const totalDeposit = new Decimal(savingsAgg._sum.paidAmount?.toString() ?? "0");
  const units        = calculateUnits(totalDeposit, unitValue);

  // Activation date: earliest savings record paid
  const firstSaving = await prisma.savingsRecord.findFirst({
    where:   { userId, status: "PAID" },
    orderBy: { paidDate: "asc" },
    select:  { paidDate: true, activatedAt: true },
  });
  const activationDate = firstSaving?.activatedAt ?? firstSaving?.paidDate ?? null;

  const now       = new Date();
  const activeDays = activationDate
    ? Math.max(0, Math.ceil((now.getTime() - activationDate.getTime()) / 86_400_000))
    : 0;

  const weightedCapital = activationDate
    ? totalDeposit
    : new Decimal(0);

  // Sum committed profit distributions
  const profitAgg = await prisma.profitDistributionMember.aggregate({
    where: { userId, isPaid: true },
    _sum:  { profitShare: true },
  });
  const profitEarned = new Decimal(profitAgg._sum.profitShare?.toString() ?? "0");

  // Estimate when all deployed capital returns (last installment end date)
  const lastOrder = await prisma.installment.findFirst({
    where:   { order: { customer: { userId } }, status: { not: "PAID" } },
    orderBy: { dueDate: "desc" },
    select:  { dueDate: true },
  });

  const name = [member.user.firstName, member.user.lastName].filter(Boolean).join(" ");

  return {
    userId,
    memberId:        member.id,
    memberID:        member.memberID,
    name,
    totalDeposit,
    units:           units.toDecimalPlaces(4),
    activationDate,
    activeDays,
    weightedCapital,
    principalAmount: new Decimal(member.principalAmount?.toString() ?? totalDeposit.toString()),
    profitEarned,
    estimatedExit:   lastOrder?.dueDate ?? null,
  };
}

// ─────────────────────────────────────────────────────────────
// 4. Preview profit distribution (no DB write — pure calculation)
//
//    Algorithm (Website.txt):
//    Net Profit = Revenue − COGS − Operational Expense
//    memberPool = NetProfit × 60%  (configurable)
//    Each member's share = (member weighted capital / total weighted capital) × memberPool
//    Weighted capital = totalCapital × (activeDays / totalPeriodDays)
// ─────────────────────────────────────────────────────────────
export async function previewProfitDistribution(params: {
  periodFrom:         string;
  periodTo:           string;
  businessRevenue:    number;
  costOfGoods?:       number;
  operationalExpense?: number;
}): Promise<ProfitPreview> {
  const { periodFrom, periodTo, businessRevenue, costOfGoods = 0, operationalExpense = 0 } = params;

  const settings = await prisma.systemSettings.findUnique({
    where: { id: "global" },
    select: {
      unitValue:           true,
      memberProfitSharePct: true,
      charitySharePct:      true,
      orgSharePct:          true,
    },
  });

  const memberPct = new Decimal(settings?.memberProfitSharePct?.toString() ?? "60").div(100);
  const charityPct = new Decimal(settings?.charitySharePct?.toString() ?? "5").div(100);
  const orgPct    = new Decimal(settings?.orgSharePct?.toString() ?? "35").div(100);
  const unitValue = new Decimal(settings?.unitValue?.toString() ?? "2000");

  const revenue    = new Decimal(businessRevenue);
  const cogs       = new Decimal(costOfGoods);
  const opEx       = new Decimal(operationalExpense);
  const netProfit  = revenue.minus(cogs).minus(opEx);

  if (netProfit.lte(0)) {
    return {
      periodFrom, periodTo,
      businessRevenue:     revenue,
      costOfGoods:         cogs,
      operationalExpense:  opEx,
      netProfit,
      memberPoolAmount:    new Decimal(0),
      charityAmount:       new Decimal(0),
      orgAmount:           new Decimal(0),
      memberSharePct:      memberPct.mul(100),
      charitySharePct:     charityPct.mul(100),
      orgSharePct:         orgPct.mul(100),
      memberShares:        [],
      totalActiveDays:     0,
      totalWeightedCapital: new Decimal(0),
    };
  }

  const memberPool = netProfit.mul(memberPct).toDecimalPlaces(2);
  const charityAmt = netProfit.mul(charityPct).toDecimalPlaces(2);
  const orgAmt     = netProfit.mul(orgPct).toDecimalPlaces(2);

  const from = new Date(periodFrom);
  const to   = new Date(periodTo);
  const totalDays = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / 86_400_000));

  // Get all active members with their savings
  const members = await prisma.member.findMany({
    where:   { status: "APPROVED" },
    include: {
      user: { select: { id: true, firstName: true, lastName: true } },
      savingsRecords: {
        where:  { status: "PAID" },
        select: { paidAmount: true, paidDate: true, activatedAt: true },
      },
    },
  });

  // Compute weighted capital for each member
  const calcData = members.map((m) => {
    const totalCapital = m.savingsRecords.reduce(
      (acc, s) => acc.plus(new Decimal(s.paidAmount?.toString() ?? "0")),
      new Decimal(0)
    );

    // Activation date = first savings paid in this period or before
    const activationDate = m.savingsRecords
      .map((s) => s.activatedAt ?? s.paidDate)
      .filter(Boolean)
      .sort((a, b) => (a! < b! ? -1 : 1))[0] ?? null;

    const effectiveFrom = activationDate && activationDate > from ? activationDate : from;
    const activeDays    = Math.max(0, Math.ceil((to.getTime() - effectiveFrom.getTime()) / 86_400_000));
    const weightedCap   = totalCapital.mul(activeDays).div(totalDays).toDecimalPlaces(4);
    const units         = calculateUnits(totalCapital, unitValue);
    const name          = [m.user.firstName, m.user.lastName].filter(Boolean).join(" ");

    return { userId: m.userId, memberId: m.id, memberID: m.memberID, name, totalCapital, units, activeDays, weightedCap };
  }).filter((m) => m.totalCapital.gt(0));

  const totalWeightedCapital = calcData.reduce((acc, m) => acc.plus(m.weightedCap), new Decimal(0));

  const memberShares: MemberSharePreview[] = calcData.map((m) => {
    const share = totalWeightedCapital.gt(0)
      ? memberPool.mul(m.weightedCap).div(totalWeightedCapital).toDecimalPlaces(2)
      : new Decimal(0);
    const sharePct = totalWeightedCapital.gt(0)
      ? m.weightedCap.div(totalWeightedCapital).mul(100).toDecimalPlaces(4)
      : new Decimal(0);
    return {
      userId:          m.userId,
      memberId:        m.memberId,
      memberID:        m.memberID,
      name:            m.name,
      activeCapital:   m.totalCapital,
      units:           m.units.toDecimalPlaces(4),
      weightedCapital: m.weightedCap,
      activeDays:      m.activeDays,
      profitShare:     share,
      profitSharePct:  sharePct,
    };
  });

  return {
    periodFrom, periodTo,
    businessRevenue:     revenue,
    costOfGoods:         cogs,
    operationalExpense:  opEx,
    netProfit,
    memberPoolAmount:    memberPool,
    charityAmount:       charityAmt,
    orgAmount:           orgAmt,
    memberSharePct:      memberPct.mul(100),
    charitySharePct:     charityPct.mul(100),
    orgSharePct:         orgPct.mul(100),
    memberShares,
    totalActiveDays:     totalDays,
    totalWeightedCapital,
  };
}

// ─────────────────────────────────────────────────────────────
// 5. Commit profit distribution (writes to DB in a transaction)
//    Immutable: once committed, cannot be edited, only reversed
// ─────────────────────────────────────────────────────────────
export async function commitProfitDistribution(
  params: {
    periodFrom:          string;
    periodTo:            string;
    businessRevenue:     number;
    costOfGoods?:        number;
    operationalExpense?: number;
    description?:        string;
    projectId?:          string;
  },
  committedByUserId: string
): Promise<{ distributionId: string }> {
  const preview = await previewProfitDistribution(params);

  if (preview.netProfit.lte(0)) {
    throw new Error("নিট মুনাফা শূন্য বা ঋণাত্মক। কোনো বিতরণ করা সম্ভব নয়।");
  }

  const distribution = await prisma.$transaction(async (tx) => {
    // Create distribution record
    const dist = await tx.profitDistribution.create({
      data: {
        periodFrom:         new Date(params.periodFrom),
        periodTo:           new Date(params.periodTo),
        description:        params.description ?? null,
        projectId:          params.projectId   ?? null,
        businessRevenue:    preview.businessRevenue.toNumber(),
        costOfGoods:        preview.costOfGoods.toNumber(),
        operationalExpense: preview.operationalExpense.toNumber(),
        netProfit:          preview.netProfit.toNumber(),
        memberSharePct:     preview.memberSharePct.toNumber(),
        charitySharePct:    preview.charitySharePct.toNumber(),
        orgSharePct:        preview.orgSharePct.toNumber(),
        memberPoolAmount:   preview.memberPoolAmount.toNumber(),
        charityAmount:      preview.charityAmount.toNumber(),
        orgAmount:          preview.orgAmount.toNumber(),
        status:             "committed",
        committedAt:        new Date(),
        committedBy:        committedByUserId,
      },
    });

    // Create individual member share records
    for (const ms of preview.memberShares) {
      await tx.profitDistributionMember.create({
        data: {
          distributionId: dist.id,
          userId:         ms.userId,
          activeCapital:  ms.activeCapital.toNumber(),
          units:          ms.units.toNumber(),
          weightedCapital:ms.weightedCapital.toNumber(),
          activeDays:     ms.activeDays,
          profitShare:    ms.profitShare.toNumber(),
          isPaid:         false,
        },
      });

      // Update member's cumulative profit
      await tx.member.updateMany({
        where: { userId: ms.userId },
        data:  { profitEarned: { increment: ms.profitShare.toNumber() } },
      });
    }

    // Credit charity fund
    await tx.qardFundMovement.create({
      data: {
        movementType: "CREDIT",
        amount:       preview.charityAmount.toNumber(),
        toFundType:   "CHARITY",
        reason:       `Profit distribution ${params.periodFrom} – ${params.periodTo}`,
        recordedBy:   committedByUserId,
      },
    });

    // Audit log
    await tx.auditLog.create({
      data: {
        userId:   committedByUserId,
        action:   "CREATE",
        module:   "profit",
        recordId: dist.id,
        newValue: {
          netProfit:  preview.netProfit.toNumber(),
          members:    preview.memberShares.length,
          charityAmt: preview.charityAmount.toNumber(),
        },
      },
    });

    return dist;
  });

  return { distributionId: distribution.id };
}

// ─────────────────────────────────────────────────────────────
// 6. Exit settlement calculation
//    Two modes: IMMEDIATE (only realized cash) or DELAYED (wait
//    for all deployed capital to return from installment products)
// ─────────────────────────────────────────────────────────────
export async function calculateExitSettlement(userId: string): Promise<ExitSettlement> {
  const portfolio = await getMemberPortfolio(userId);
  if (!portfolio) throw new Error("সদস্য পাওয়া যায়নি।");

  const member = await prisma.member.findUnique({
    where: { userId },
    select: { id: true, memberID: true },
  });
  if (!member) throw new Error("সদস্য রেকর্ড পাওয়া যায়নি।");

  const settings = await prisma.systemSettings.findUnique({
    where:  { id: "global" },
    select: { charitySharePct: true },
  });
  const charityPct = new Decimal(settings?.charitySharePct?.toString() ?? "5").div(100);

  // Count pending orders where this member is the customer
  const pendingOrders = await prisma.order.count({
    where: {
      customer: { userId },
      status:   { in: ["APPROVED", "COMPLETED"] },
      totalRemaining: { gt: 0 },
    },
  });

  // IMMEDIATE exit: principal + realized profit - charity deduction
  const charityDeduction = portfolio.profitEarned.mul(charityPct).toDecimalPlaces(2);
  const netPayoutImmediate = portfolio.principalAmount
    .plus(portfolio.profitEarned)
    .minus(charityDeduction)
    .toDecimalPlaces(2);

  // DELAYED exit: wait for all installments to complete
  const canImmediateExit = pendingOrders === 0;

  return {
    userId,
    memberId:        portfolio.memberId,
    memberID:        portfolio.memberID,
    name:            portfolio.name,
    principalAmount: portfolio.principalAmount,
    profitEarned:    portfolio.profitEarned,
    charityDeduction,
    netPayout:       netPayoutImmediate,
    exitType:        canImmediateExit ? "IMMEDIATE" : "DELAYED",
    pendingProducts: pendingOrders,
    estimatedFullRecoveryDate: portfolio.estimatedExit,
    canImmediateExit,
  };
}
