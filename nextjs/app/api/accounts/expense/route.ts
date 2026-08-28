export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { requireSession, checkPermission } from "@/lib/auth/session";
import { addExpenseEntry, softDeleteEntry } from "@/lib/services/AccountsService";
import { issueReceipt } from "@/lib/services/ReceiptService";
import prisma from "@/lib/db/prisma";
import { z } from "zod";

const AddSchema = z.object({
  categoryId:    z.string(),
  amount:        z.number().positive(),
  date:          z.string(),
  description:   z.string().optional(),
  paymentMethod: z.string().default("CASH"),
  accountId:     z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    await checkPermission(session.user.id, session.user.systemRole, "accounts" as never, "view" as never);

    const { searchParams } = req.nextUrl;
    const from     = searchParams.get("from");
    const to       = searchParams.get("to");
    const category = searchParams.get("category");

    const where: Record<string, unknown> = { isDeleted: false };
    if (from && to) where.date = { gte: new Date(from), lte: new Date(to) };
    if (category)   where.categoryId = category;

    const [expense, categories] = await Promise.all([
      prisma.expenseEntry.findMany({
        where:   where as never,
        orderBy: { date: "desc" },
        include: { category: { select: { id: true, name: true, parentId: true } } },
        take:    200,
      }),
      prisma.expenseCategory.findMany({
        where:   { isActive: true },
        orderBy: { name: "asc" },
        include: { children: { select: { id: true, name: true } } },
      }),
    ]);

    return NextResponse.json({ expense, categories });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session  = await requireSession();
    const canCreate = await checkPermission(session.user.id, session.user.systemRole, "accounts" as never, "create" as never);
    if (!canCreate) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const body   = await req.json();
    const parsed = AddSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });

    const { receiptId, receiptNumber } = await issueReceipt({ prefix: "E", issuedBy: session.user.id });
    const entryId = await addExpenseEntry({
      ...parsed.data,
      date:    new Date(parsed.data.date),
      addedBy: session.user.id,
      receiptNumber,
    });

    return NextResponse.json({ entryId, receiptId, receiptNumber, message: "ব্যয় যোগ হয়েছে।" }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session  = await requireSession();
    const canDelete = await checkPermission(session.user.id, session.user.systemRole, "accounts" as never, "delete" as never);
    if (!canDelete) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID প্রয়োজন।" }, { status: 400 });

    const { reason } = await req.json();
    if (!reason || reason.length < 5) return NextResponse.json({ error: "কারণ অন্তত ৫ অক্ষর।" }, { status: 400 });

    await softDeleteEntry({ entryId: id, entryType: "expense", reason, deletedBy: session.user.id });
    return NextResponse.json({ message: "মুছে ফেলা হয়েছে।" });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
