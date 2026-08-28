export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { requireSession, checkPermission } from "@/lib/auth/session";
import { UserSystemRole } from "@/types/enums";
import { addIncomeEntry, softDeleteEntry } from "@/lib/services/AccountsService";
import { issueReceipt } from "@/lib/services/ReceiptService";
import prisma from "@/lib/db/prisma";
import { z } from "zod";

// Re-export MODULES/ACTIONS from enums if needed (they're strings in types/enums.ts)
// Use direct string literals here since MODULES/ACTIONS aren't exported from types/enums.ts
const INCOME_MODULE = "accounts";
const INCOME_VIEW   = "view";
const INCOME_CREATE = "create";
const INCOME_DELETE = "delete";

const AddSchema = z.object({
  categoryId:    z.string(),
  amount:        z.number().positive(),
  date:          z.string(),
  description:   z.string().optional(),
  paymentMethod: z.string().default("CASH"),
  accountId:     z.string().optional(),
});

const DeleteSchema = z.object({
  reason: z.string().min(5, "কারণ অন্তত ৫ অক্ষরের হতে হবে।"),
});

/** GET /api/accounts/income?from=&to=&category= */
export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const canView = await checkPermission(session.user.id, session.user.systemRole, INCOME_MODULE as never, INCOME_VIEW as never);
    if (!canView) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const { searchParams } = req.nextUrl;
    const from     = searchParams.get("from");
    const to       = searchParams.get("to");
    const category = searchParams.get("category");

    const where: Record<string, unknown> = { isDeleted: false };
    if (from && to) where.date = { gte: new Date(from), lte: new Date(to) };
    if (category)   where.categoryId = category;

    const [income, categories] = await Promise.all([
      prisma.incomeEntry.findMany({
        where:   where as never,
        orderBy: { date: "desc" },
        include: { category: { select: { name: true } } },
        take:    200,
      }),
      prisma.incomeCategory.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    ]);

    return NextResponse.json({ income, categories });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}

/** POST /api/accounts/income — add new income */
export async function POST(req: NextRequest) {
  try {
    const session  = await requireSession();
    const canCreate = await checkPermission(session.user.id, session.user.systemRole, INCOME_MODULE as never, INCOME_CREATE as never);
    if (!canCreate) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const body   = await req.json();
    const parsed = AddSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });

    const { receiptId, receiptNumber } = await issueReceipt({ prefix: "I", issuedBy: session.user.id });

    const entryId = await addIncomeEntry({
      ...parsed.data,
      date:        new Date(parsed.data.date),
      collectedBy: session.user.id,
      receiptNumber,
    });

    return NextResponse.json({ entryId, receiptId, receiptNumber, message: "আয় যোগ হয়েছে।" }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}

/** DELETE /api/accounts/income?id=xxx — soft delete */
export async function DELETE(req: NextRequest) {
  try {
    const session  = await requireSession();
    const canDelete = await checkPermission(session.user.id, session.user.systemRole, INCOME_MODULE as never, INCOME_DELETE as never);
    if (!canDelete) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const id   = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID প্রয়োজন।" }, { status: 400 });

    const body   = await req.json();
    const parsed = DeleteSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });

    await softDeleteEntry({ entryId: id, entryType: "income", reason: parsed.data.reason, deletedBy: session.user.id });
    return NextResponse.json({ message: "মুছে ফেলা হয়েছে।" });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
