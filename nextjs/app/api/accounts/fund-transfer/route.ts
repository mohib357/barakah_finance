export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { createFundTransfer } from "@/lib/services/AccountsService";
import { z } from "zod";

const Schema = z.object({
  fromAccountId: z.string(),
  toAccountId:   z.string(),
  amount:        z.number().positive(),
  reason:        z.string().optional(),
  date:          z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const body    = await req.json();
    const parsed  = Schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });

    const transferId = await createFundTransfer({
      ...parsed.data,
      date:          new Date(parsed.data.date),
      transferredBy: session.user.id,
    });

    return NextResponse.json({ transferId, message: "ফান্ড ট্রান্সফার সম্পন্ন হয়েছে।" }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
