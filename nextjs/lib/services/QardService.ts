// ═══════════════════════════════════════════════════════════
//  BARAKAH FINANCE — Qard-e-Hasana Service
//
//  Website.txt workflow:
//  ─────────────────────────────────────────────────────────
//  1. Member/Non-member applies → status: APPLIED
//  2. Secretary reviews → UNDER_REVIEW
//  3. Committee approves (min 2 approvers) → APPROVED
//  4. Treasurer disburses → DISBURSED → ACTIVE
//  5. Monthly repayments collected → auto-track remaining
//  6. Fully paid → COMPLETED
//
//  Key rules:
//  • Qard-e-Hasana = interest-free loan (no profit/interest)
//  • Max amount configurable (default ৳15,000)
//  • Repayment starts 1 month after disbursement
//  • Guarantor must be an active Member
//  • QH-XXXX receipt prefix
//  • Late fees (if any) → 100% Charity Fund
//  • SMS notifications at each status change
// ═══════════════════════════════════════════════════════════

import prisma from "@/lib/db/prisma";
import Decimal from "decimal.js";
import { QardStatus, InstallmentStatus, PaymentStatus } from "@/types/enums";
import { issueReceipt } from "./ReceiptService";
import { writeAuditLog, writeActivity } from "./AuditService";
import { sendSMS, interpolateSMSTemplate } from "@/lib/auth/otp";
import { addMonths } from "@/lib/utils/dateUtils";
import { Prisma } from "@prisma/client";

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_EVEN });

// ─────────────────────────────────────────────────────────────
// Generate sequential QH code: QH-001, QH-002, ...
// ─────────────────────────────────────────────────────────────

async function generateQardCode(): Promise<string> {
  const count = await prisma.qardApplication.count();
  return `QH-${String(count + 1).padStart(3, "0")}`;
}

// ─────────────────────────────────────────────────────────────
// 1. Apply for Qard-e-Hasana
// ─────────────────────────────────────────────────────────────

export interface QardApplicationInput {
  borrowerUserId:   string;
  requestedAmount:  number;
  repaymentMonths:  number;
  reason:           string;
  guarantorUserId?: string;
  witnesses?:       Array<{ name: string; fatherName?: string; phone: string; address?: string; nidNumber?: string }>;
  createdBy:        string;
}

export async function applyQard(input: QardApplicationInput): Promise<{ qardId: string; qardCode: string }> {
  // Validate max amount
  const settings = await prisma.systemSettings.findUnique({
    where:  { id: "global" },
    select: { maxQardAmount: true, maxGuarantorClients: true },
  });
  const maxAmt = Number(settings?.maxQardAmount ?? 15000);
  if (input.requestedAmount > maxAmt) {
    throw new Error(`সর্বোচ্চ ৳${maxAmt.toLocaleString()} পর্যন্ত করজ নেওয়া যাবে।`);
  }
  if (input.repaymentMonths < 1 || input.repaymentMonths > 12) {
    throw new Error("পরিশোধের মেয়াদ ১ থেকে ১২ মাসের মধ্যে হতে হবে।");
  }

  // Check if borrower already has active Qard
  const existing = await prisma.qardApplication.findFirst({
    where: { borrowerUserId: input.borrowerUserId, status: { in: [QardStatus.ACTIVE, QardStatus.APPROVED, QardStatus.DISBURSED, QardStatus.UNDER_REVIEW] as never[] } },
  });
  if (existing) {
    throw new Error("আপনার একটি সক্রিয় করজ আবেদন আছে। নতুন আবেদন করা যাবে না।");
  }

  // Get borrower info
  const borrower = await prisma.user.findUniqueOrThrow({
    where:  { id: input.borrowerUserId },
    select: { firstName: true, lastName: true, phone: true, profile: { select: { village: true, district: true } }, kyc: { select: { nidNumber: true } } },
  });

  const qardCode = await generateQardCode();

  const qard = await prisma.qardApplication.create({
    data: {
      qardCode,
      borrowerUserId:  input.borrowerUserId,
      borrowerName:    [borrower.firstName, borrower.lastName].filter(Boolean).join(" "),
      borrowerPhone:   borrower.phone ?? "",
      borrowerAddress: [borrower.profile?.village, borrower.profile?.district].filter(Boolean).join(", ") || null,
      borrowerNID:     borrower.kyc?.nidNumber ?? null,
      guarantorUserId: input.guarantorUserId ?? null,
      witnesses:       input.witnesses ? (JSON.stringify(input.witnesses) as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
      requestedAmount: input.requestedAmount,
      repaymentMonths: input.repaymentMonths,
      reason:          input.reason,
      status:          QardStatus.APPLIED as never,
      totalRemaining:  input.requestedAmount,
      createdBy:       input.createdBy,
    },
  });

  // Add guarantor info if provided
  if (input.guarantorUserId) {
    const guarantor = await prisma.user.findUnique({
      where:  { id: input.guarantorUserId },
      select: { firstName: true, lastName: true, phone: true },
    });
    if (guarantor) {
      await prisma.qardApplication.update({
        where: { id: qard.id },
        data: {
          guarantorName:  [guarantor.firstName, guarantor.lastName].filter(Boolean).join(" "),
          guarantorPhone: guarantor.phone ?? null,
        },
      });
    }
  }

  await writeAuditLog({
    userId:   input.createdBy,
    action:   "CREATE",
    module:   "qard",
    recordId: qard.id,
    newValue: { qardCode, requestedAmount: input.requestedAmount, repaymentMonths: input.repaymentMonths },
  });

  await writeActivity({
    userId:   input.createdBy,
    action:   "QARD_APPLIED",
    module:   "qard",
    detail:   `${borrower.firstName} — ৳${input.requestedAmount.toLocaleString()} করজ আবেদন (${qardCode})`,
  });

  return { qardId: qard.id, qardCode };
}

// ─────────────────────────────────────────────────────────────
// 2. Update Qard status (3-step approval pipeline)
//    APPLIED → UNDER_REVIEW → APPROVED → DISBURSED
//    or REJECTED at any step
// ─────────────────────────────────────────────────────────────

export async function updateQardStatus(params: {
  qardId:          string;
  newStatus:       QardStatus;
  actionBy:        string;
  approvedAmount?: number;   // set when APPROVED
  rejectionReason?: string;
  disbursedAmount?: number;  // set when DISBURSED
  disbursedAt?:    Date;
}): Promise<void> {
  const { qardId, newStatus, actionBy, approvedAmount, rejectionReason, disbursedAmount, disbursedAt } = params;

  const qard = await prisma.qardApplication.findUniqueOrThrow({ where: { id: qardId } });

  // Validate state transitions
  const validTransitions: Record<string, QardStatus[]> = {
    [QardStatus.APPLIED]:      [QardStatus.UNDER_REVIEW, QardStatus.REJECTED],
    [QardStatus.UNDER_REVIEW]: [QardStatus.APPROVED, QardStatus.REJECTED],
    [QardStatus.APPROVED]:     [QardStatus.DISBURSED, QardStatus.CANCELLED],
    [QardStatus.DISBURSED]:    [QardStatus.ACTIVE],
    [QardStatus.ACTIVE]:       [QardStatus.COMPLETED, QardStatus.OVERDUE],
    [QardStatus.OVERDUE]:      [QardStatus.ACTIVE, QardStatus.COMPLETED],
  };

  const allowed = validTransitions[qard.status as string] ?? [];
  if (!allowed.includes(newStatus)) {
    throw new Error(`${qard.status} → ${newStatus} রূপান্তর অনুমোদিত নয়।`);
  }

  const updateData: Record<string, unknown> = { status: newStatus };

  if (newStatus === QardStatus.APPROVED) {
    updateData.approvedAmount = approvedAmount ?? qard.requestedAmount;
    updateData.approvedBy     = actionBy;
    updateData.approvedAt     = new Date();
  }

  if (newStatus === QardStatus.REJECTED) {
    updateData.rejectionReason = rejectionReason ?? "কমিটি কর্তৃক প্রত্যাখ্যাত।";
  }

  if (newStatus === QardStatus.DISBURSED || newStatus === QardStatus.ACTIVE) {
    const amount = disbursedAmount ?? Number(qard.approvedAmount ?? qard.requestedAmount);
    const at     = disbursedAt ?? new Date();
    updateData.disbursedAmount     = amount;
    updateData.disbursedAt         = at;
    updateData.totalRemaining      = amount;
    updateData.repaymentStartDate  = addMonths(at, 1);
    updateData.repaymentEndDate    = addMonths(at, qard.repaymentMonths + 1);
    updateData.status              = QardStatus.ACTIVE as never;

    // Create repayment schedule when disbursed
    await createQardSchedule(qardId, amount, qard.repaymentMonths, at);
  }

  await prisma.qardApplication.update({ where: { id: qardId }, data: updateData as never });

  await writeAuditLog({
    userId:   actionBy,
    action:   newStatus === QardStatus.APPROVED ? "APPROVE" : newStatus === QardStatus.REJECTED ? "REJECT" : "UPDATE",
    module:   "qard",
    recordId: qardId,
    oldValue: { status: qard.status },
    newValue: { status: newStatus },
    reason:   rejectionReason,
  });

  // SMS notification
  try {
    if (qard.borrowerPhone && (newStatus === QardStatus.APPROVED || newStatus === QardStatus.REJECTED || newStatus === QardStatus.ACTIVE)) {
      const cat  = newStatus === QardStatus.APPROVED || newStatus === QardStatus.ACTIVE ? "qard_approved" : "overdue";
      const tmpl = await prisma.sMSTemplate.findFirst({ where: { category: cat, isActive: true } });
      const msg  = tmpl
        ? interpolateSMSTemplate(tmpl.template, {
            name:    qard.borrowerName,
            amount:  `৳${Number(qard.approvedAmount ?? qard.requestedAmount).toLocaleString()}`,
            qard_id: qard.qardCode,
          })
        : newStatus === QardStatus.ACTIVE
          ? `প্রিয় ${qard.borrowerName}, আপনার করজে হাসানা ${qard.qardCode} বিতরণ হয়েছে। — বারাকাহ ফাইন্যান্স`
          : `প্রিয় ${qard.borrowerName}, আপনার করজ আবেদন ${qard.qardCode} ${newStatus === QardStatus.APPROVED ? "অনুমোদিত" : "প্রত্যাখ্যাত"} হয়েছে। — বারাকাহ ফাইন্যান্স`;
      await sendSMS(qard.borrowerPhone, msg);
    }
  } catch { /* non-fatal */ }
}

// ─────────────────────────────────────────────────────────────
// 3. Create repayment schedule (called internally on disbursement)
// ─────────────────────────────────────────────────────────────

async function createQardSchedule(
  qardId: string,
  amount: number,
  months: number,
  disbursedAt: Date
): Promise<void> {
  // Delete any existing schedule (in case of re-disbursement)
  await prisma.qardInstallment.deleteMany({ where: { qardId } });

  const total   = new Decimal(amount);
  const N       = months;
  const regular = total.div(N).toDecimalPlaces(0, Decimal.ROUND_FLOOR);
  const last    = total.minus(regular.mul(N - 1));

  for (let i = 1; i <= N; i++) {
    const dueDate  = addMonths(disbursedAt, i);
    // Grace: 4 days before due (like Website.txt example "৪ দিন আগে")
    const warnDate = new Date(dueDate.getTime() - 4 * 86_400_000);
    const dueAmt   = i === N ? last.toNumber() : regular.toNumber();

    await prisma.qardInstallment.create({
      data: {
        qardId,
        installmentNumber: i,
        dueDate,
        warnDate,
        dueAmount:      dueAmt,
        remainingAmount: dueAmt,
        status:         InstallmentStatus.UPCOMING as never,
      },
    });
  }
}

// ─────────────────────────────────────────────────────────────
// 4. Collect Qard repayment
// ─────────────────────────────────────────────────────────────

export interface CollectQardInput {
  qardId:           string;
  installmentId:    string;
  amount:           number;
  paymentMethod:    string;
  collectedBy:      string;
  sendSMSAlert?:    boolean;
  backdateOverride?: Date;
}

export async function collectQardPayment(input: CollectQardInput): Promise<{
  receiptNumber: string;
  paidAmount:    number;
  remaining:     number;
  isFullyPaid:   boolean;
}> {
  const installment = await prisma.qardInstallment.findUniqueOrThrow({ where: { id: input.installmentId } });

  if (installment.qardId !== input.qardId) throw new Error("কিস্তি ও করজ মিলছে না।");
  if (installment.status === InstallmentStatus.PAID) throw new Error("এই কিস্তি ইতিমধ্যে পরিশোধ হয়েছে।");

  const dueAmt    = Number(installment.dueAmount);
  const paidSoFar = Number(installment.paidAmount);
  const applying  = Math.min(input.amount, dueAmt - paidSoFar);
  const newPaid   = paidSoFar + applying;
  const newRem    = dueAmt - newPaid;
  const isFullyPaid = newRem <= 0;

  const collectedAt = input.backdateOverride ?? new Date();
  const { receiptNumber } = await issueReceipt({ prefix: "QH", issuedBy: input.collectedBy });

  await prisma.$transaction(async (tx) => {
    await tx.qardInstallment.update({
      where: { id: input.installmentId },
      data: {
        paidAmount:     newPaid,
        remainingAmount: Math.max(0, newRem),
        status:          isFullyPaid ? (InstallmentStatus.PAID as never) : (InstallmentStatus.PARTIALLY_PAID as never),
        paidDate:        isFullyPaid ? collectedAt : null,
      },
    });

    // Update Qard total remaining
    const qard = await tx.qardApplication.findUniqueOrThrow({ where: { id: input.qardId }, select: { totalPaid: true, totalRemaining: true, borrowerPhone: true, borrowerName: true, qardCode: true } });
    const newTotalPaid = Number(qard.totalPaid) + applying;
    const newTotalRem  = Number(qard.totalRemaining) - applying;

    await tx.qardApplication.update({
      where: { id: input.qardId },
      data: {
        totalPaid:      newTotalPaid,
        totalRemaining: Math.max(0, newTotalRem),
        status:         newTotalRem <= 0 ? (QardStatus.COMPLETED as never) : undefined,
      },
    });

    await tx.payment.create({
      data: {
        paymentNumber:    `QARD-PAY-${Date.now()}`,
        purpose:          "qard_repayment",
        relatedEntityType:"qard",
        relatedEntityId:  input.qardId,
        amount:           applying,
        paymentMethod:    input.paymentMethod as never,
        status:           PaymentStatus.PAID as never,
        collectedById:    input.collectedBy,
        collectedAt,
        transactionDate:  collectedAt,
      },
    });

    await tx.auditLog.create({
      data: {
        userId:   input.collectedBy,
        action:   "CREATE",
        module:   "qard",
        recordId: input.installmentId,
        newValue: { applying, receiptNumber, isFullyPaid },
      },
    });
  });

  // SMS
  if (input.sendSMSAlert !== false) {
    try {
      const q = await prisma.qardApplication.findUnique({ where: { id: input.qardId }, select: { borrowerPhone: true, borrowerName: true, qardCode: true } });
      if (q?.borrowerPhone) {
        const tmpl = await prisma.sMSTemplate.findFirst({ where: { category: "payment_received", isActive: true } });
        const msg  = tmpl
          ? interpolateSMSTemplate(tmpl.template, { name: q.borrowerName, amount: `৳${applying.toLocaleString()}`, receipt_id: receiptNumber })
          : `প্রিয় ${q.borrowerName}, করজ পরিশোধ ৳${applying.toLocaleString()} গ্রহণ হয়েছে। রসিদ: ${receiptNumber}। — বারাকাহ ফাইন্যান্স`;
        await sendSMS(q.borrowerPhone, msg);
      }
    } catch { /* non-fatal */ }
  }

  return { receiptNumber, paidAmount: applying, remaining: newRem, isFullyPaid };
}

// ─────────────────────────────────────────────────────────────
// 5. Get active / due Qard list
// ─────────────────────────────────────────────────────────────

export async function getQardDueList() {
  const now = new Date();
  return prisma.qardInstallment.findMany({
    where: {
      status:  { notIn: [InstallmentStatus.PAID, InstallmentStatus.CANCELLED] as never[] },
      dueDate: { lte: now },
    },
    include: {
      qard: {
        select: { qardCode: true, borrowerName: true, borrowerPhone: true, totalRemaining: true },
      },
    },
    orderBy: { dueDate: "asc" },
    take:    200,
  });
}
