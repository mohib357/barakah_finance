export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { UserSystemRole } from "@/types/enums";
import { approveOrder, rejectOrder } from "@/lib/services/OrderService";
import { z } from "zod";

const Schema = z.object({
  action: z.enum(["approve", "reject"]),
  reason: z.string().optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();
    if (![UserSystemRole.ADMIN, UserSystemRole.SUPER_ADMIN].includes(session.user.systemRole as never)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const parsed = Schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });

    if (parsed.data.action === "approve") {
      await approveOrder(params.id, session.user.id);
      return NextResponse.json({ message: "অর্ডার অনুমোদিত হয়েছে।" });
    } else {
      if (!parsed.data.reason) return NextResponse.json({ error: "প্রত্যাখ্যানের কারণ দিন।" }, { status: 400 });
      await rejectOrder(params.id, session.user.id, parsed.data.reason);
      return NextResponse.json({ message: "অর্ডার প্রত্যাখ্যাত হয়েছে।" });
    }
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
