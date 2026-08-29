// ═══════════════════════════════════════════════════════════
//  BARAKAH FINANCE — Member / Customer Dashboard
//  Route: /dashboard
//
//  Server Component: fetches all data before render.
//  Passes serialised data to the Client Component for
//  interactive tabs (savings, installments, qard, profile).
//
//  Role routing is handled in lib/auth/config.ts:
//    SUPER_ADMIN / ADMIN / STAFF → /admin (see login/page.tsx)
//    MEMBER / CUSTOMER / USER   → here
// ═══════════════════════════════════════════════════════════

import { redirect }          from "next/navigation";
import { getServerSession }  from "@/lib/auth/session";
import { UserSystemRole }    from "@/types/enums";
import prisma                from "@/lib/db/prisma";
import { getMemberPortfolio } from "@/lib/services/UnitService";
import MemberDashboardClient from "@/components/dashboard/MemberDashboardClient";

// ─────────────────────────────────────────────────────────────
// Serialisable data shapes (Decimal → string, Date → string)
// ─────────────────────────────────────────────────────────────

export interface PortfolioData {
  memberId:        string | null;
  memberID:        string | null;
  totalDeposit:    string;
  units:           string;
  principalAmount: string;
  profitEarned:    string;
  activeDays:      number;
  activationDate:  string | null;
  estimatedExit:   string | null;
  unitValue:       string;
}

export interface SavingRow {
  id:             string;
  month:          string;
  dueAmount:      number;
  paidAmount:     number;
  remainingAmount:number;
  lateFee:        number;
  status:         string;
  dueDate:        string;
  paidDate:       string | null;
  receiptNumber:  string | null;
}

export interface InstallmentRow {
  orderId:        string;
  orderNumber:    string;
  productName:    string;
  installmentNum: number;
  dueDate:        string;
  dueAmount:      number;
  paidAmount:     number;
  remaining:      number;
  status:         string;
  totalPayable:   number;
  totalPaid:      number;
  totalRemaining: number;
}

export interface QardRow {
  id:              string;
  qardCode:        string;
  requestedAmount: number;
  approvedAmount:  number | null;
  totalPaid:       number;
  totalRemaining:  number;
  status:          string;
  repaymentMonths: number;
  createdAt:       string;
}

// ─────────────────────────────────────────────────────────────
// Server Component
// ─────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const session = await getServerSession();

  // Not logged in → login
  if (!session?.user) redirect("/login?callbackUrl=/dashboard");

  // Admin/Staff should not land here — redirect to admin panel
  const adminRoles: UserSystemRole[] = [
    UserSystemRole.SUPER_ADMIN,
    UserSystemRole.ADMIN,
    UserSystemRole.STAFF,
  ];
  if (adminRoles.includes(session.user.systemRole)) {
    redirect("/admin");
  }

  const userId = session.user.id;

  // ── Fetch all data in parallel ──────────────────────────
  const [rawPortfolio, savingsRaw, ordersRaw, qardsRaw, settings] =
    await Promise.all([
      getMemberPortfolio(userId).catch(() => null),

      prisma.savingsRecord.findMany({
        where:   { userId },
        orderBy: { dueDate: "desc" },
        take:    24,
        select: {
          id: true, month: true, dueAmount: true, paidAmount: true,
          remainingAmount: true, lateFee: true, status: true,
          dueDate: true, paidDate: true,
          receipt: { select: { receiptNumber: true } },
        },
      }),

      prisma.order.findMany({
        where:   { customer: { userId } },
        orderBy: { orderDate: "desc" },
        take:    10,
        include: {
          product:      { select: { name: true } },
          installments: { orderBy: { installmentNumber: "asc" } },
        },
      }),

      prisma.qardApplication.findMany({
        where:   { borrowerUserId: userId },
        orderBy: { createdAt: "desc" },
        take:    5,
        select: {
          id: true, qardCode: true, requestedAmount: true,
          approvedAmount: true, totalPaid: true, totalRemaining: true,
          status: true, repaymentMonths: true, createdAt: true,
        },
      }),

      prisma.systemSettings.findUnique({
        where:  { id: "global" },
        select: { unitValue: true },
      }),
    ]);

  // ── Serialise portfolio ──────────────────────────────────
  const portfolio: PortfolioData = rawPortfolio
    ? {
        memberId:        rawPortfolio.memberId,
        memberID:        rawPortfolio.memberID,
        totalDeposit:    rawPortfolio.totalDeposit.toString(),
        units:           rawPortfolio.units.toString(),
        principalAmount: rawPortfolio.principalAmount.toString(),
        profitEarned:    rawPortfolio.profitEarned.toString(),
        activeDays:      rawPortfolio.activeDays,
        activationDate:  rawPortfolio.activationDate?.toISOString() ?? null,
        estimatedExit:   rawPortfolio.estimatedExit?.toISOString() ?? null,
        unitValue:       settings?.unitValue?.toString() ?? "2000",
      }
    : {
        memberId: null, memberID: null,
        totalDeposit: "0", units: "0", principalAmount: "0",
        profitEarned: "0", activeDays: 0, activationDate: null,
        estimatedExit: null, unitValue: settings?.unitValue?.toString() ?? "2000",
      };

  // ── Serialise savings ────────────────────────────────────
  const savings: SavingRow[] = savingsRaw.map((s) => ({
    id:             s.id,
    month:          s.month,
    dueAmount:      Number(s.dueAmount),
    paidAmount:     Number(s.paidAmount),
    remainingAmount:Number(s.remainingAmount),
    lateFee:        Number(s.lateFee),
    status:         s.status as string,
    dueDate:        s.dueDate.toISOString(),
    paidDate:       s.paidDate?.toISOString() ?? null,
    receiptNumber:  s.receipt?.receiptNumber ?? null,
  }));

  // ── Serialise installments (flatten order + installments) ─
  const installments: InstallmentRow[] = ordersRaw.flatMap((o) =>
    o.installments.map((inst) => ({
      orderId:        o.id,
      orderNumber:    o.orderNumber,
      productName:    o.product.name,
      installmentNum: inst.installmentNumber,
      dueDate:        inst.dueDate.toISOString(),
      dueAmount:      Number(inst.dueAmount),
      paidAmount:     Number(inst.paidAmount),
      remaining:      Number(inst.remainingAmount),
      status:         inst.status as string,
      totalPayable:   Number(o.totalPayable),
      totalPaid:      Number(o.totalPaid),
      totalRemaining: Number(o.totalRemaining),
    }))
  );

  // ── Serialise qard ───────────────────────────────────────
  const qards: QardRow[] = qardsRaw.map((q) => ({
    id:              q.id,
    qardCode:        q.qardCode,
    requestedAmount: Number(q.requestedAmount),
    approvedAmount:  q.approvedAmount ? Number(q.approvedAmount) : null,
    totalPaid:       Number(q.totalPaid),
    totalRemaining:  Number(q.totalRemaining),
    status:          q.status as string,
    repaymentMonths: q.repaymentMonths,
    createdAt:       q.createdAt.toISOString(),
  }));

  return (
    <MemberDashboardClient
      user={{
        id:              session.user.id,
        firstName:       session.user.firstName,
        lastName:        session.user.lastName ?? null,
        username:        session.user.username,
        systemRole:      session.user.systemRole,
        profileComplete: session.user.profileComplete,
        phone:           session.user.phone ?? null,
      }}
      portfolio={portfolio}
      savings={savings}
      installments={installments}
      qards={qards}
    />
  );
}
