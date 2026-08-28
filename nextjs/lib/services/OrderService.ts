// ═══════════════════════════════════════════════════════════
//  BARAKAH FINANCE — Order & Installment Collection Service
//
//  Website.txt workflows:
//  ─────────────────────────────────────────────────────────
//  Product Request → Stock Check → Reserved → Approval
//  → Down Payment → Order Confirmed → Installment Schedule
//  → Monthly Collection → Completed
//
//  Key rules:
//  • Installment schedule auto-generated on order confirmation
//  • Rounding residual on LAST installment
//  • Partial payment allowed; remaining stays as outstanding
//  • Overpayment → advance on next installment (configurable)
//  • Late fee → 100% Charity Fund
//  • No hard-delete on any financial record
//  • C-XXXX receipt prefix for client payments
// ═══════════════════════════════════════════════════════════

import prisma from "@/lib/db/prisma";
import Decimal from "decimal.js";
import { ApplicationStatus, InstallmentStatus, PaymentStatus, ProfitMethod } from "@/types/enums";
import { calculateInstallmentPlan } from "./InstallmentEngine";
import { issueReceipt } from "./ReceiptService";
import { writeAuditLog, writeActivity } from "./AuditService";
import { sendSMS, interpolateSMSTemplate } from "@/lib/auth/otp";
import { addMonths } from "@/lib/utils/dateUtils";

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_EVEN });

// ─────────────────────────────────────────────────────────────
// 1. Generate unique order number
// ─────────────────────────────────────────────────────────────

async function generateOrderNumber(): Promise<string> {
  const count = await prisma.order.count();
  const year  = new Date().getFullYear();
  return `ORD-${year}-${String(count + 1).padStart(6, "0")}`;
}

// ─────────────────────────────────────────────────────────────
// 2. Create order (pending approval)
// ─────────────────────────────────────────────────────────────

export interface CreateOrderInput {
  customerId:      string;
  productId:       string;
  purchaseCost:    number;
  downPayment?:    number;
  profitMethod?:   ProfitMethod;
  profitRate?:     number;
  customProfit?:   number;
  numInstallments: number;
  orderDate?:      Date;
  notes?:          string;
  createdBy:       string;
  guarantorUserId?: string;
  witnesses?:      Array<{ name: string; fatherName?: string; phone: string; address?: string; nidNumber?: string }>;
}

export async function createOrder(input: CreateOrderInput): Promise<{ orderId: string; orderNumber: string; plan: ReturnType<typeof calculateInstallmentPlan> }> {
  const settings = await prisma.systemSettings.findUnique({
    where:  { id: "global" },
    select: { defaultProfitMethod: true, profitMarginDefault: true, installmentGraceDays: true },
  });

  const profitMethod  = (input.profitMethod ?? settings?.defaultProfitMethod ?? ProfitMethod.FINANCED_AMOUNT) as ProfitMethod;
  const profitRate    = input.profitRate    ?? Number(settings?.profitMarginDefault ?? 10);
  const graceDays     = settings?.installmentGraceDays ?? 5;
  const orderDate     = input.orderDate ?? new Date();

  // Calculate the plan
  const plan = calculateInstallmentPlan({
    purchaseCost:    input.purchaseCost,
    downPayment:     input.downPayment    ?? 0,
    profitRate,
    customProfit:    input.customProfit,
    profitMethod,
    numInstallments: input.numInstallments,
    orderDate,
    graceDays,
  });

  const orderNumber = await generateOrderNumber();

  // First and last installment dates (from schedule, skipping down payment)
  const regularInstallments = plan.schedule.filter((s) => !s.isDownPayment);
  const firstInstallDate    = regularInstallments[0]?.dueDate   ?? addMonths(orderDate, 1);
  const lastInstallDate     = regularInstallments[regularInstallments.length - 1]?.dueDate ?? addMonths(orderDate, input.numInstallments);

  // Check product stock
  const product = await prisma.product.findUniqueOrThrow({
    where: { id: input.productId },
    select: { stockQty: true, outOfStock: true, name: true },
  });
  if (product.outOfStock || product.stockQty <= 0) {
    throw new Error(`পণ্যটি বর্তমানে স্টকে নেই: ${product.name}`);
  }

  // Check guarantor limit (spec: max clients per guarantor is configurable)
  if (input.guarantorUserId) {
    const maxGuarantors = settings ? 3 : 3;
    const existingGuarantees = await prisma.orderGuarantor.count({
      where: { userId: input.guarantorUserId, order: { status: { notIn: ["CANCELLED", "COMPLETED"] as never[] } } },
    });
    const maxG = await prisma.systemSettings.findUnique({ where: { id: "global" }, select: { maxGuarantorClients: true } });
    const limit = maxG?.maxGuarantorClients ?? maxGuarantors;
    if (existingGuarantees >= limit) {
      throw new Error(`এই সদস্য ইতিমধ্যে সর্বোচ্চ ${limit}জন ক্লাইন্টের জামিনদার।`);
    }
  }

  const order = await prisma.$transaction(async (tx) => {
    // Create order
    const ord = await tx.order.create({
      data: {
        orderNumber,
        customerId:       input.customerId,
        productId:        input.productId,
        purchaseCost:     plan.purchaseCost,
        downPayment:      plan.downPayment,
        financedAmount:   plan.financedAmount,
        profitAmount:     plan.profitAmount,
        totalPayable:     plan.totalPayable,
        profitMethod:     profitMethod as never,
        profitRate:       plan.profitRate,
        totalInstallments: plan.numInstallments,
        installmentAmount: plan.regularAmount,
        lastInstallmentAdjustment: plan.lastAmount - plan.regularAmount,
        orderDate,
        firstInstallmentDate: firstInstallDate,
        lastInstallmentDate:  lastInstallDate,
        totalRemaining:   plan.totalPayable,
        status:           ApplicationStatus.PENDING as never,
        notes:            input.notes ?? null,
        createdBy:        input.createdBy,
        stockReservedAt:  new Date(),
      },
    });

    // Reserve stock immediately
    await tx.product.update({
      where: { id: input.productId },
      data:  { stockQty: { decrement: 1 } },
    });

    // Create installment schedule
    for (const s of plan.schedule) {
      await tx.installment.create({
        data: {
          orderId:           ord.id,
          installmentNumber: s.installmentNumber,
          dueDate:           s.dueDate,
          graceDate:         s.graceDate,
          dueAmount:         s.dueAmount,
          remainingAmount:   s.dueAmount,
          status:            InstallmentStatus.UPCOMING as never,
        },
      });
    }

    // Add guarantor if provided
    if (input.guarantorUserId) {
      const guarantorUser = await tx.user.findUniqueOrThrow({
        where:  { id: input.guarantorUserId },
        select: { firstName: true, lastName: true, phone: true, member: { select: { memberID: true } } },
      });
      await tx.orderGuarantor.create({
        data: {
          orderId:    ord.id,
          customerId: input.customerId,
          userId:     input.guarantorUserId,
          name:       [guarantorUser.firstName, guarantorUser.lastName].filter(Boolean).join(" "),
          phone:      guarantorUser.phone ?? "",
          memberID:   guarantorUser.member?.memberID ?? null,
        },
      });
    }

    // Add witnesses
    if (input.witnesses?.length) {
      for (const w of input.witnesses) {
        await tx.orderWitness.create({ data: { orderId: ord.id, ...w } });
      }
    }

    // Audit log
    await tx.auditLog.create({
      data: {
        userId:   input.createdBy,
        action:   "CREATE",
        module:   "orders",
        recordId: ord.id,
        newValue: { orderNumber, totalPayable: plan.totalPayable, numInstallments: plan.numInstallments },
      },
    });

    return ord;
  });

  await writeActivity({
    userId:   input.createdBy,
    action:   "ORDER_CREATED",
    module:   "orders",
    detail:   `অর্ডার ${orderNumber} তৈরি হয়েছে — মোট: ৳${plan.totalPayable.toLocaleString()}`,
  });

  return { orderId: order.id, orderNumber, plan };
}

// ─────────────────────────────────────────────────────────────
// 3. Approve / reject an order
// ─────────────────────────────────────────────────────────────

export async function approveOrder(orderId: string, approvedBy: string): Promise<void> {
  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
  if (order.status !== ApplicationStatus.PENDING && order.status !== "UNDER_REVIEW" as never) {
    throw new Error("শুধুমাত্র পেন্ডিং অর্ডার অনুমোদন করা যায়।");
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data:  { status: ApplicationStatus.APPROVED as never, approvedBy, approvedAt: new Date(), stockConfirmedAt: new Date() },
    });

    await tx.auditLog.create({
      data: {
        userId:   approvedBy,
        action:   "APPROVE",
        module:   "orders",
        recordId: orderId,
        oldValue: { status: order.status },
        newValue: { status: ApplicationStatus.APPROVED },
      },
    });
  });

  // SMS notification to customer
  try {
    const customer = await prisma.customer.findUnique({ where: { id: order.customerId }, select: { phone: true, name: true } });
    if (customer?.phone) {
      const template = await prisma.sMSTemplate.findFirst({ where: { category: "membership_approved", isActive: true } });
      const msg = template
        ? interpolateSMSTemplate(template.template, { name: customer.name, order_id: order.orderNumber })
        : `প্রিয় ${customer.name}, আপনার অর্ডার ${order.orderNumber} অনুমোদিত হয়েছে। — বারাকাহ ফাইন্যান্স`;
      await sendSMS(customer.phone, msg);
    }
  } catch { /* non-fatal */ }
}

export async function rejectOrder(orderId: string, rejectedBy: string, reason: string): Promise<void> {
  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data:  { status: ApplicationStatus.REJECTED as never, rejectionReason: reason },
    });

    // Return reserved stock
    await tx.product.update({
      where: { id: order.productId },
      data:  { stockQty: { increment: 1 } },
    });

    await tx.auditLog.create({
      data: {
        userId:   rejectedBy,
        action:   "REJECT",
        module:   "orders",
        recordId: orderId,
        reason,
      },
    });
  });
}

// ─────────────────────────────────────────────────────────────
// 4. Collect installment payment
//    Handles partial, exact, and over-payments per spec
// ─────────────────────────────────────────────────────────────

export interface CollectInstallmentInput {
  orderId:          string;
  installmentId:    string;
  amount:           number;
  paymentMethod:    string;
  collectedBy:      string;
  sendSMSAlert?:    boolean;
  backdateOverride?: Date;
}

export async function collectInstallment(input: CollectInstallmentInput): Promise<{
  receiptNumber: string;
  paidAmount:    number;
  remaining:     number;
  overpayment:   number;
  isFullyPaid:   boolean;
}> {
  const installment = await prisma.installment.findUniqueOrThrow({
    where: { id: input.installmentId },
    include: { order: { include: { customer: { select: { phone: true, name: true } } } } },
  });

  if (installment.orderId !== input.orderId) {
    throw new Error("কিস্তি এবং অর্ডার মিলছে না।");
  }
  if (installment.status === InstallmentStatus.PAID) {
    throw new Error("এই কিস্তি ইতিমধ্যে পরিশোধ হয়েছে।");
  }
  if (installment.status === InstallmentStatus.CANCELLED) {
    throw new Error("এই কিস্তি বাতিল করা হয়েছে।");
  }

  const dueAmt   = Number(installment.dueAmount);
  const paidSoFar = Number(installment.paidAmount);
  const stillOwed = dueAmt - paidSoFar;
  const applying  = Math.min(input.amount, stillOwed);
  const overpay   = input.amount - applying;
  const newPaid   = paidSoFar + applying;
  const newRem    = dueAmt - newPaid;
  const isFullyPaid = newRem <= 0;

  const collectedAt = input.backdateOverride ?? new Date();

  // Issue receipt
  const { receiptNumber } = await issueReceipt({ prefix: "C", issuedBy: input.collectedBy });

  await prisma.$transaction(async (tx) => {
    // Update installment
    await tx.installment.update({
      where: { id: input.installmentId },
      data: {
        paidAmount:     newPaid,
        remainingAmount: newRem,
        status:          isFullyPaid ? (InstallmentStatus.PAID as never) : (InstallmentStatus.PARTIALLY_PAID as never),
        paidDate:        isFullyPaid ? collectedAt : null,
        receiptId:       (await tx.receipt.findUnique({ where: { receiptNumber }, select: { id: true } }))?.id ?? null,
      },
    });

    // Create payment record
    await tx.payment.create({
      data: {
        paymentNumber:    `PAY-${Date.now()}`,
        payerUserId:      installment.order.customer?.userId ?? null,
        payerName:        installment.order.customer?.name   ?? null,
        payerPhone:       installment.order.customer?.phone  ?? null,
        purpose:          "installment",
        relatedEntityType:"installment",
        relatedEntityId:  input.installmentId,
        orderId:          input.orderId,
        amount:           applying,
        paymentMethod:    input.paymentMethod as never,
        status:           PaymentStatus.PAID as never,
        collectedById:    input.collectedBy,
        collectedAt,
        transactionDate:  collectedAt,
      },
    });

    // Update order totals
    const order = await tx.order.findUniqueOrThrow({ where: { id: input.orderId }, select: { totalPaid: true, totalRemaining: true } });
    const newTotalPaid = Number(order.totalPaid) + applying;
    const newTotalRem  = Number(order.totalRemaining) - applying;

    await tx.order.update({
      where: { id: input.orderId },
      data: {
        totalPaid:      newTotalPaid,
        totalRemaining: Math.max(0, newTotalRem),
        status:         newTotalRem <= 0 ? (ApplicationStatus.COMPLETED as never) : undefined,
      },
    });

    // If overpayment: advance to next installment
    if (overpay > 0) {
      const nextInstall = await tx.installment.findFirst({
        where:   { orderId: input.orderId, status: { notIn: [InstallmentStatus.PAID, InstallmentStatus.CANCELLED] as never[] }, installmentNumber: { gt: installment.installmentNumber } },
        orderBy: { installmentNumber: "asc" },
      });
      if (nextInstall) {
        const nextApplied  = Math.min(overpay, Number(nextInstall.dueAmount));
        const nextNewPaid  = Number(nextInstall.paidAmount) + nextApplied;
        const nextNewRem   = Number(nextInstall.dueAmount) - nextNewPaid;
        await tx.installment.update({
          where: { id: nextInstall.id },
          data: {
            paidAmount:     nextNewPaid,
            remainingAmount: Math.max(0, nextNewRem),
            status:          nextNewRem <= 0 ? (InstallmentStatus.PAID as never) : (InstallmentStatus.PARTIALLY_PAID as never),
          },
        });
      }
    }

    // Audit
    await tx.auditLog.create({
      data: {
        userId:   input.collectedBy,
        action:   "CREATE",
        module:   "installments",
        recordId: input.installmentId,
        newValue: { applying, receiptNumber, isFullyPaid, overpay },
      },
    });
  });

  // SMS notification
  if (input.sendSMSAlert !== false) {
    try {
      const customer = await prisma.customer.findUnique({
        where:  { id: installment.order.customerId },
        select: { phone: true, name: true },
      });
      if (customer?.phone) {
        const tmpl = await prisma.sMSTemplate.findFirst({ where: { category: "payment_received", isActive: true } });
        const msg  = tmpl
          ? interpolateSMSTemplate(tmpl.template, { name: customer.name, amount: `৳${applying.toLocaleString()}`, receipt_id: receiptNumber })
          : `প্রিয় ${customer.name}, ৳${applying.toLocaleString()} কিস্তি গ্রহণ হয়েছে। রসিদ: ${receiptNumber}। — বারাকাহ ফাইন্যান্স`;
        await sendSMS(customer.phone, msg);
      }
    } catch { /* non-fatal */ }
  }

  return { receiptNumber, paidAmount: applying, remaining: newRem, overpayment: overpay, isFullyPaid };
}

// ─────────────────────────────────────────────────────────────
// 5. Get due installments (for admin "due list" page)
// ─────────────────────────────────────────────────────────────

export async function getDueInstallments(filters?: {
  orderId?:   string;
  before?:    Date;
  overdue?:   boolean;
}): Promise<Array<{ orderId: string; orderNumber: string; customerName: string; customerPhone: string; installmentNumber: number; dueDate: Date; dueAmount: number; paidAmount: number; remaining: number; status: string }>> {
  const where: Record<string, unknown> = {
    status: { notIn: [InstallmentStatus.PAID, InstallmentStatus.CANCELLED] as never[] },
  };
  if (filters?.orderId) where.orderId = filters.orderId;
  if (filters?.before) where.dueDate = { lte: filters.before };
  if (filters?.overdue) where.dueDate = { lt: new Date() };

  const installments = await prisma.installment.findMany({
    where:   where as never,
    include: { order: { include: { customer: { select: { name: true, phone: true } } } } },
    orderBy: { dueDate: "asc" },
    take:    500,
  });

  return installments.map((i) => ({
    orderId:           i.orderId,
    orderNumber:       i.order.orderNumber,
    customerName:      i.order.customer.name,
    customerPhone:     i.order.customer.phone,
    installmentNumber: i.installmentNumber,
    dueDate:           i.dueDate,
    dueAmount:         Number(i.dueAmount),
    paidAmount:        Number(i.paidAmount),
    remaining:         Number(i.remainingAmount),
    status:            i.status as string,
  }));
}
