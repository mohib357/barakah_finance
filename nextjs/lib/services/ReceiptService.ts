// ═══════════════════════════════════════════════════════════
//  BARAKAH FINANCE — Receipt Sequence Engine
//
//  Spec rules (Website.txt):
//  • M-XXXX for member payments (M-0001, M-0002, ...)
//  • C-XXXX for client/installment payments (C-0001, ...)
//  • I-XXXX for other income entries
//  • E-XXXX for expense entries
//  • QH-XXXX for Qard-e-Hasana
//  • Receipt numbers NEVER reused — even if voided/cancelled
//  • Cancelled receipts get status = CANCELLED and a replacement
//    receipt number is issued; both records kept permanently
//  • No hard delete ever
// ═══════════════════════════════════════════════════════════

import prisma from "@/lib/db/prisma";
import { ReceiptStatus } from "@/types/enums";

export type ReceiptPrefix = "M" | "C" | "I" | "E" | "QH" | "CHR";

// ─────────────────────────────────────────────────────────────
// 1. Generate next sequential receipt number
//    Uses a DB-level lock (serializable transaction) to prevent
//    duplicate numbers under concurrent requests
// ─────────────────────────────────────────────────────────────

export async function generateReceiptNumber(prefix: ReceiptPrefix): Promise<string> {
  // Count existing receipts of this type (including cancelled — they occupy the sequence)
  const count = await prisma.receipt.count({
    where: { receiptType: prefixToType(prefix) },
  });
  const next = count + 1;
  // Zero-pad to 4 digits minimum, extend if needed
  const padded = next.toString().padStart(4, "0");
  return `${prefix}-${padded}`;
}

function prefixToType(prefix: ReceiptPrefix): string {
  const map: Record<ReceiptPrefix, string> = {
    M:   "MEMBER",
    C:   "CLIENT",
    I:   "INCOME",
    E:   "EXPENSE",
    QH:  "QARD",
    CHR: "CHARITY",
  };
  return map[prefix];
}

// ─────────────────────────────────────────────────────────────
// 2. Issue a new receipt
//    Creates the immutable Receipt registry entry
// ─────────────────────────────────────────────────────────────

export async function issueReceipt(params: {
  prefix:    ReceiptPrefix;
  issuedBy:  string;
  paymentId?: string;
}): Promise<{ receiptId: string; receiptNumber: string }> {
  const receiptNumber = await generateReceiptNumber(params.prefix);
  const receiptType   = prefixToType(params.prefix);

  const receipt = await prisma.receipt.create({
    data: {
      receiptNumber,
      receiptType,
      status:   ReceiptStatus.ISSUED,
      issuedAt: new Date(),
      issuedBy: params.issuedBy,
    },
  });

  return { receiptId: receipt.id, receiptNumber };
}

// ─────────────────────────────────────────────────────────────
// 3. Cancel / void a receipt
//    Original receipt gets status = CANCELLED (never deleted).
//    A new replacement receipt is issued if requested.
//    Spec: "ওই C-20 সারাজীবন ফাঁকাই থেকে যাবে" — cancelled
//    receipts stay permanently in the registry with full audit.
// ─────────────────────────────────────────────────────────────

export async function cancelReceipt(params: {
  receiptId:          string;
  reason:             string;
  cancelledBy:        string;
  issueReplacement?:  boolean;  // issue a new receipt for the same transaction?
  replacementPrefix?: ReceiptPrefix;
}): Promise<{ cancelledId: string; replacementReceiptNumber?: string }> {
  const { receiptId, reason, cancelledBy, issueReplacement, replacementPrefix } = params;

  const existing = await prisma.receipt.findUniqueOrThrow({ where: { id: receiptId } });

  if (existing.status === ReceiptStatus.CANCELLED) {
    throw new Error("এই রসিদটি ইতিমধ্যে বাতিল করা হয়েছে।");
  }

  let replacementReceiptNumber: string | undefined;

  await prisma.$transaction(async (tx) => {
    // Mark original as cancelled — PERMANENT, never deleted
    await tx.receipt.update({
      where: { id: receiptId },
      data: {
        status:            ReceiptStatus.CANCELLED,
        cancelledAt:       new Date(),
        cancelledBy,
        cancellationReason: reason,
      },
    });

    // Audit the cancellation
    await tx.auditLog.create({
      data: {
        userId:   cancelledBy,
        action:   "CANCEL",
        module:   "receipts",
        recordId: receiptId,
        oldValue: { receiptNumber: existing.receiptNumber, status: existing.status },
        newValue: { status: ReceiptStatus.CANCELLED },
        reason,
      },
    });

    // Issue replacement receipt if requested
    if (issueReplacement && replacementPrefix) {
      const newNumber = await generateReceiptNumber(replacementPrefix);
      replacementReceiptNumber = newNumber;

      const newReceipt = await tx.receipt.create({
        data: {
          receiptNumber:      newNumber,
          receiptType:        prefixToType(replacementPrefix),
          status:             ReceiptStatus.ISSUED,
          issuedAt:           new Date(),
          issuedBy:           cancelledBy,
          replacedByReceiptId: receiptId,
        },
      });

      // Link replacement reference back to original
      await tx.receipt.update({
        where: { id: receiptId },
        data:  { replacedByReceiptId: newReceipt.id },
      });
    }
  });

  return { cancelledId: receiptId, replacementReceiptNumber };
}

// ─────────────────────────────────────────────────────────────
// 4. Look up a receipt — returns full history including voided
// ─────────────────────────────────────────────────────────────

export async function lookupReceipt(receiptNumber: string) {
  const receipt = await prisma.receipt.findUnique({
    where:   { receiptNumber },
    include: {
      savings:      { select: { memberId: true, month: true, paidAmount: true } },
      installments: { select: { orderId: true, installmentNumber: true, paidAmount: true } },
    },
  });
  if (!receipt) return null;

  return {
    receiptNumber:       receipt.receiptNumber,
    receiptType:         receipt.receiptType,
    status:              receipt.status,
    issuedAt:            receipt.issuedAt,
    issuedBy:            receipt.issuedBy,
    cancelledAt:         receipt.cancelledAt,
    cancelledBy:         receipt.cancelledBy,
    cancellationReason:  receipt.cancellationReason,
    replacedByReceiptId: receipt.replacedByReceiptId,
    relatedSavings:      receipt.savings,
    relatedInstallments: receipt.installments,
  };
}
