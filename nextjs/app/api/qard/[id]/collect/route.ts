export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { UserSystemRole } from "@/types/enums";
import { collectQardPayment } from "@/lib/services/QardService";
import { z } from "zod";

const Schema = z.object({
  installmentId:    z.string(),
  amount:           z.number().positive(),
  paymentMethod:    z.string().default("CASH"),
  sendSMSAlert:     z.boolean().optional(),
  backdateOverride: z.string().optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();
    const isAdmin = session.user.systemRole === UserSystemRole.ADMIN || session.user.systemRole === UserSystemRole.SUPER_ADMIN || session.user.systemRole === UserSystemRole.STAFF;
    if (!isAdmin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const body   = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });

    const { backdateOverride, ...rest } = parsed.data;
    const result = await collectQardPayment({
      ...rest,
      qardId:           params.id,
      collectedBy:      session.user.id,
      backdateOverride: backdateOverride ? new Date(backdateOverride) : undefined,
    });

    return NextResponse.json({ ...result, message: "করজ পরিশোধ গ্রহণ সম্পন্ন হয়েছে।" });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
