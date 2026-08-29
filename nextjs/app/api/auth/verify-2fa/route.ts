export const dynamic = "force-dynamic";
// ═══════════════════════════════════════════════════════════
//  BARAKAH FINANCE — TOTP 2FA Verification
//  POST /api/auth/verify-2fa
//  Called by /login/2fa page after user enters TOTP token.
//  Verifies the 6-digit TOTP against the user's stored secret.
// ═══════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { verifyTOTPToken } from "@/lib/auth/two-factor";
import prisma from "@/lib/db/prisma";
import { writeAuditLog } from "@/lib/services/AuditService";
import { z } from "zod";

const Schema = z.object({
  token: z.string().length(6, "৬ সংখ্যার TOTP token প্রয়োজন।"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "লগইন প্রয়োজন।" }, { status: 401 });
    }

    const body   = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });
    }

    // Get user's TOTP secret
    const user = await prisma.user.findUnique({
      where:  { id: session.user.id },
      select: { twoFASecret: true, twoFAEnabled: true, firstName: true },
    });

    if (!user?.twoFAEnabled || !user.twoFASecret) {
      return NextResponse.json(
        { error: "2FA এই অ্যাকাউন্টে সক্রিয় নেই।" },
        { status: 400 }
      );
    }

    const isValid = verifyTOTPToken(user.twoFASecret, parsed.data.token);

    if (!isValid) {
      await writeAuditLog({
        userId:    session.user.id,
        action:    "OTP_VERIFY",
        module:    "auth",
        newValue:  { success: false },
        ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
      });
      return NextResponse.json({ error: "TOTP কোড সঠিক নয়। আবার চেষ্টা করুন।" }, { status: 401 });
    }

    await writeAuditLog({
      userId:    session.user.id,
      action:    "TWO_FA_ENABLE",
      module:    "auth",
      newValue:  { success: true, userId: session.user.id },
      ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
    });

    return NextResponse.json({
      verified: true,
      message:  "2FA যাচাইকরণ সফল।",
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "সার্ভার সমস্যা।" },
      { status: 500 }
    );
  }
}
