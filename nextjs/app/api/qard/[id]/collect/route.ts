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
    if (![UserSystemRole.ADMIN, UserSystemRole.SUPER_ADMIN, UserSystemRole.STAFF].includes(session.user.systemRole)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const parsed = Schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });

    const { backdateOverride, ...rest } = parsed.data;
    const result = await collectQardPayment({
      ...rest,
      qardId:           params.id,
      collectedBy:      session.user.id,
      backdateOverride: backdateOverride ? new Date(backdateOverride) : undefined,
    });

    return NextResponse.json({ ...result, message: "করজ পরিশোধ গ্রহণ সম্পন্ন।" });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
