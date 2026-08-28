// ═══════════════════════════════════════════════════════════
//  BARAKAH FINANCE — Multi-Head Accounts & Ledger Engine
//
//  Financial accounts: Cash, Bank, bKash, Nagad, Rocket
//  Rules (Website.txt):
//  • No hard delete on any financial record
//  • Fund-to-fund transfer ≠ income or expense (it's a Transfer)
//  • Every transaction has a unique Transaction ID
//  • Receipt numbers are immutable and never reused
//  • Cash/Bank/Mobile Banking tracked as separate accounts
//  • Account reconciliation: Opening + System vs Actual balance
// ═══════════════════════════════════════════════════════════

import prisma from "@/lib/db/prisma";
import Decimal from "decimal.js";
import { LedgerType } from "@/types/enums";

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_EVEN });

// ─────────────────────────────────────────────────────────────
// 1. Account balance summary
// ─────────────────────────────────────────────────────────────

export interface AccountBalance {
  id:             string;
  name:           string;
  accountType:    string;
  currentBalance: Decimal;
  isActive:       boolean;
}

export async function getAllAccountBalances(): Promise<AccountBalance[]> {
  const accounts = await prisma.financialAccount.findMany({
    where:   { isActive: true },
    orderBy: { sortOrder: "asc" },
    select:  { id: true, name: true, accountType: true, currentBalance: true, isActive: true },
  });
  return accounts.map((a) => ({
    ...a,
    currentBalance: new Decimal(a.currentBalance.toString()),
  }));
}

// ─────────────────────────────────────────────────────────────
// 2. Add income entry (other income — not member payments)
//    Creates: IncomeEntry + LedgerEntry + updates account balance
// ─────────────────────────────────────────────────────────────

export async function addIncomeEntry(params: {
  categoryId:    string;
  amount:        number;
  date:          Date;
  description?:  string;
  paymentMethod: string;
  accountId?:    string;
  collectedBy:   string;
  receiptNumber: string;
}): Promise<string> {
  const { categoryId, amount, date, description, paymentMethod, accountId, collectedBy, receiptNumber } = params;

  const entryId = await prisma.$transaction(async (tx) => {
    const entry = await tx.incomeEntry.create({
      data: {
        receiptNumber,
        categoryId,
        amount,
        date,
        description:   description ?? null,
        paymentMethod: paymentMethod as never,
        accountId:     accountId   ?? null,
        collectedBy,
      },
    });

    // Ledger entry
    await tx.ledgerEntry.create({
      data: {
        entryType:  LedgerType.INCOME,
        amount,
        date,
        description,
        sourceType: "income",
        sourceId:   entry.id,
        addedBy:    collectedBy,
        isManual:   true,
      },
    });

    // Update account balance
    if (accountId) {
      await tx.financialAccount.update({
        where: { id: accountId },
        data:  { currentBalance: { increment: amount } },
      });
    }

    // Audit log
    await tx.auditLog.create({
      data: {
        userId:   collectedBy,
        action:   "CREATE",
        module:   "accounts",
        recordId: entry.id,
        newValue: { receiptNumber, amount, categoryId, paymentMethod },
      },
    });

    return entry.id;
  });

  return entryId;
}

// ─────────────────────────────────────────────────────────────
// 3. Add expense entry
//    Creates: ExpenseEntry + LedgerEntry + updates account balance
// ─────────────────────────────────────────────────────────────

export async function addExpenseEntry(params: {
  categoryId:    string;
  amount:        number;
  date:          Date;
  description?:  string;
  paymentMethod: string;
  accountId?:    string;
  addedBy:       string;
  receiptNumber: string;
}): Promise<string> {
  const { categoryId, amount, date, description, paymentMethod, accountId, addedBy, receiptNumber } = params;

  const entryId = await prisma.$transaction(async (tx) => {
    const entry = await tx.expenseEntry.create({
      data: {
        receiptNumber,
        categoryId,
        amount,
        date,
        description:   description ?? null,
        paymentMethod: paymentMethod as never,
        accountId:     accountId   ?? null,
        addedBy,
      },
    });

    await tx.ledgerEntry.create({
      data: {
        entryType:  LedgerType.EXPENSE,
        amount,
        date,
        description,
        sourceType: "expense",
        sourceId:   entry.id,
        addedBy,
        isManual:   true,
      },
    });

    if (accountId) {
      await tx.financialAccount.update({
        where: { id: accountId },
        data:  { currentBalance: { decrement: amount } },
      });
    }

    await tx.auditLog.create({
      data: {
        userId:   addedBy,
        action:   "CREATE",
        module:   "accounts",
        recordId: entry.id,
        newValue: { receiptNumber, amount, categoryId, paymentMethod },
      },
    });

    return entry.id;
  });

  return entryId;
}

// ─────────────────────────────────────────────────────────────
// 4. Soft-delete (void) income or expense entry
//    NEVER hard-deletes. Records reason and operator.
// ─────────────────────────────────────────────────────────────

export async function softDeleteEntry(params: {
  entryId:   string;
  entryType: "income" | "expense";
  reason:    string;
  deletedBy: string;
}): Promise<void> {
  const { entryId, entryType, reason, deletedBy } = params;
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    if (entryType === "income") {
      const entry = await tx.incomeEntry.findUniqueOrThrow({ where: { id: entryId } });
      if (entry.isDeleted) throw new Error("এই এন্ট্রি ইতিমধ্যে মুছে ফেলা হয়েছে।");

      await tx.incomeEntry.update({
        where: { id: entryId },
        data:  { isDeleted: true, deletedAt: now, deletedBy, deleteReason: reason },
      });

      // Reversal ledger entry
      await tx.ledgerEntry.create({
        data: {
          entryType:   LedgerType.REVERSAL,
          amount:      entry.amount,
          date:        now,
          description: `Reversed income: ${reason}`,
          sourceType:  "income_reversal",
          sourceId:    entryId,
          addedBy:     deletedBy,
          isReversed:  false,
          reversalOf:  entryId,
        },
      });

      // Reverse account balance
      if (entry.accountId) {
        await tx.financialAccount.update({
          where: { id: entry.accountId },
          data:  { currentBalance: { decrement: entry.amount } },
        });
      }

      await tx.auditLog.create({
        data: {
          userId:   deletedBy,
          action:   "DELETE",
          module:   "accounts",
          recordId: entryId,
          oldValue: { amount: entry.amount.toString(), receiptNumber: entry.receiptNumber },
          reason,
        },
      });
    } else {
      const entry = await tx.expenseEntry.findUniqueOrThrow({ where: { id: entryId } });
      if (entry.isDeleted) throw new Error("এই এন্ট্রি ইতিমধ্যে মুছে ফেলা হয়েছে।");

      await tx.expenseEntry.update({
        where: { id: entryId },
        data:  { isDeleted: true, deletedAt: now, deletedBy, deleteReason: reason },
      });

      await tx.ledgerEntry.create({
        data: {
          entryType:   LedgerType.REVERSAL,
          amount:      entry.amount,
          date:        now,
          description: `Reversed expense: ${reason}`,
          sourceType:  "expense_reversal",
          sourceId:    entryId,
          addedBy:     deletedBy,
          reversalOf:  entryId,
        },
      });

      if (entry.accountId) {
        await tx.financialAccount.update({
          where: { id: entry.accountId },
          data:  { currentBalance: { increment: entry.amount } },
        });
      }

      await tx.auditLog.create({
        data: {
          userId:   deletedBy,
          action:   "DELETE",
          module:   "accounts",
          recordId: entryId,
          oldValue: { amount: entry.amount.toString(), receiptNumber: entry.receiptNumber },
          reason,
        },
      });
    }
  });
}

// ─────────────────────────────────────────────────────────────
// 5. Fund-to-fund transfer (NOT income/expense — spec rule #8)
//    Transfers between Cash/Bank/bKash/Nagad/Rocket accounts
// ─────────────────────────────────────────────────────────────

export async function createFundTransfer(params: {
  fromAccountId: string;
  toAccountId:   string;
  amount:        number;
  reason?:       string;
  date:          Date;
  transferredBy: string;
}): Promise<string> {
  const { fromAccountId, toAccountId, amount, reason, date, transferredBy } = params;

  if (fromAccountId === toAccountId) {
    throw new Error("উৎস এবং গন্তব্য একাউন্ট একই হতে পারে না।");
  }
  if (amount <= 0) {
    throw new Error("পরিমাণ অবশ্যই শূন্যের বেশি হতে হবে।");
  }

  // Check source has enough balance
  const source = await prisma.financialAccount.findUnique({
    where: { id: fromAccountId },
    select: { currentBalance: true, name: true },
  });
  if (!source) throw new Error("উৎস একাউন্ট পাওয়া যায়নি।");
  if (new Decimal(source.currentBalance.toString()).lt(amount)) {
    throw new Error(`${source.name} একাউন্টে পর্যাপ্ত ব্যালেন্স নেই।`);
  }

  const transferId = await prisma.$transaction(async (tx) => {
    const transfer = await tx.fundTransfer.create({
      data: { fromAccountId, toAccountId, amount, reason: reason ?? null, date, transferredBy },
    });

    // Debit source, credit destination
    await tx.financialAccount.update({
      where: { id: fromAccountId },
      data:  { currentBalance: { decrement: amount } },
    });
    await tx.financialAccount.update({
      where: { id: toAccountId },
      data:  { currentBalance: { increment: amount } },
    });

    // Ledger entry as TRANSFER (not INCOME or EXPENSE)
    await tx.ledgerEntry.create({
      data: {
        entryType:      LedgerType.TRANSFER,
        amount,
        date,
        description:    reason ?? "Fund transfer",
        sourceType:     "fund_transfer",
        sourceId:       transfer.id,
        debitAccountId: fromAccountId,
        creditAccountId:toAccountId,
        addedBy:        transferredBy,
      },
    });

    await tx.auditLog.create({
      data: {
        userId:   transferredBy,
        action:   "CREATE",
        module:   "fund_transfers",
        recordId: transfer.id,
        newValue: { fromAccountId, toAccountId, amount, reason },
      },
    });

    return transfer.id;
  });

  return transferId;
}

// ─────────────────────────────────────────────────────────────
// 6. Account Summary — total income, expense, balance per account
// ─────────────────────────────────────────────────────────────

export interface AccountSummary {
  totalIncome:   Decimal;
  totalExpense:  Decimal;
  netBalance:    Decimal;
  accounts:      AccountBalance[];
  byCategory:    { category: string; amount: Decimal; type: "income" | "expense" }[];
}

export async function getAccountSummary(from?: Date, to?: Date): Promise<AccountSummary> {
  const dateFilter = from && to ? { date: { gte: from, lte: to } } : {};

  const [incomeAgg, expenseAgg, accounts, incomeByCategory, expenseByCategory] = await Promise.all([
    prisma.incomeEntry.aggregate({
      where: { isDeleted: false, ...dateFilter },
      _sum:  { amount: true },
    }),
    prisma.expenseEntry.aggregate({
      where: { isDeleted: false, ...dateFilter },
      _sum:  { amount: true },
    }),
    getAllAccountBalances(),
    prisma.incomeEntry.groupBy({
      by:    ["categoryId"],
      where: { isDeleted: false, ...dateFilter },
      _sum:  { amount: true },
    }),
    prisma.expenseEntry.groupBy({
      by:    ["categoryId"],
      where: { isDeleted: false, ...dateFilter },
      _sum:  { amount: true },
    }),
  ]);

  const totalIncome  = new Decimal(incomeAgg._sum.amount?.toString()  ?? "0");
  const totalExpense = new Decimal(expenseAgg._sum.amount?.toString() ?? "0");
  const netBalance   = totalIncome.minus(totalExpense);

  // Enrich category names
  const incomeCats  = await prisma.incomeCategory.findMany({ select: { id: true, name: true } });
  const expenseCats = await prisma.expenseCategory.findMany({ select: { id: true, name: true } });
  const catMap = new Map([...incomeCats, ...expenseCats].map((c) => [c.id, c.name]));

  const byCategory = [
    ...incomeByCategory.map((r) => ({
      category: catMap.get(r.categoryId) ?? r.categoryId,
      amount:   new Decimal(r._sum.amount?.toString() ?? "0"),
      type:     "income" as const,
    })),
    ...expenseByCategory.map((r) => ({
      category: catMap.get(r.categoryId) ?? r.categoryId,
      amount:   new Decimal(r._sum.amount?.toString() ?? "0"),
      type:     "expense" as const,
    })),
  ];

  return { totalIncome, totalExpense, netBalance, accounts, byCategory };
}

// ─────────────────────────────────────────────────────────────
// 7. Bank Reconciliation record
// ─────────────────────────────────────────────────────────────

export async function reconcileAccount(params: {
  accountId:      string;
  actualBalance:  number;
  reconciledBy:   string;
  adjustmentReason?: string;
}): Promise<void> {
  const { accountId, actualBalance, reconciledBy, adjustmentReason } = params;

  const account = await prisma.financialAccount.findUniqueOrThrow({
    where:  { id: accountId },
    select: { currentBalance: true, name: true },
  });

  const diff = new Decimal(actualBalance).minus(new Decimal(account.currentBalance.toString()));

  await prisma.$transaction(async (tx) => {
    await tx.financialAccount.update({
      where: { id: accountId },
      data: {
        reconciledBalance: actualBalance,
        lastReconciledAt:  new Date(),
        lastReconciledBy:  reconciledBy,
      },
    });

    // If there's a discrepancy, create an adjustment ledger entry
    if (!diff.isZero()) {
      await tx.ledgerEntry.create({
        data: {
          entryType:   LedgerType.ADJUSTMENT,
          amount:      diff.abs().toNumber(),
          date:        new Date(),
          description: adjustmentReason ?? `Reconciliation adjustment for ${account.name}`,
          sourceType:  "reconciliation",
          sourceId:    accountId,
          addedBy:     reconciledBy,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        userId:   reconciledBy,
        action:   "UPDATE",
        module:   "accounts",
        recordId: accountId,
        oldValue: { balance: account.currentBalance.toString() },
        newValue: { actualBalance, diff: diff.toString(), reason: adjustmentReason },
      },
    });
  });
}
