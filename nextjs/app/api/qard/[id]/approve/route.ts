export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { UserSystemRole, QardStatus } from "@/types/enums";
import { updateQardStatus } from "@/lib/services/QardService";
import { z } from "zod";

const Schema = z.object({
  action:          z.enum(["review","approve","reject","disburse"]),
  approvedAmount:  z.number().positive().optional(),
  rejectionReason: z.string().optional(),
  disbursedAmount: z.number().positive().optional(),
  disbursedAt:     z.string().optional(),
});

const ACTION_STATUS_MAP: Record<string, QardStatus> = {
  review:   QardStatus.UNDER_REVIEW,
  approve:  QardStatus.APPROVED,
  reject:   QardStatus.REJECTED,
  disburse: QardStatus.DISBURSED,
};

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();
    const isAdmin = session.user.systemRole === UserSystemRole.ADMIN || session.user.systemRole === UserSystemRole.SUPER_ADMIN;
    if (!isAdmin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const body   = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });

    const newStatus = ACTION_STATUS_MAP[parsed.data.action];
    if (!newStatus) return NextResponse.json({ error: "অজানা অ্যাকশন।" }, { status: 400 });

    await updateQardStatus({
      qardId:          params.id,
      newStatus,
      actionBy:        session.user.id,
      approvedAmount:  parsed.data.approvedAmount,
      rejectionReason: parsed.data.rejectionReason,
      disbursedAmount: parsed.data.disbursedAmount,
      disbursedAt:     parsed.data.disbursedAt ? new Date(parsed.data.disbursedAt) : undefined,
    });

    const messages: Record<string, string> = {
      review:   "পর্যালোচনায় স্থানান্তরিত হয়েছে।",
      approve:  "করজ অনুমোদিত হয়েছে।",
      reject:   "করজ প্রত্যাখ্যাত হয়েছে।",
      disburse: "করজ বিতরণ সম্পন্ন এবং সক্রিয় হয়েছে।",
    };

    return NextResponse.json({ message: messages[parsed.data.action] ?? "স্ট্যাটাস আপডেট হয়েছে।" });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
