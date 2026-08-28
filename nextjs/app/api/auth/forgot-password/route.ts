import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { createOTP, sendOTPViaSMS } from "@/lib/auth/otp";
import { z } from "zod";

export const dynamic = "force-dynamic";


const Schema = z.object({ phone: z.string().min(10) });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "à¦®à§‹à¦¬à¦¾à¦‡à¦² à¦¨à¦®à§à¦¬à¦° à¦¦à¦¿à¦¨à¥¤" }, { status: 400 });

    const { phone } = parsed.data;
    const user = await prisma.user.findUnique({ where: { phone }, select: { id: true } });
    // Return generic message even if user not found (security)
    if (!user) {
      return NextResponse.json({ message: "OTP à¦ªà¦¾à¦ à¦¾à¦¨à§‹ à¦¹à¦¯à¦¼à§‡à¦›à§‡à¥¤", smsSent: false });
    }

    const otpCode = await createOTP({ phone, userId: user.id, purpose: "password_reset" });
    const { sent } = await sendOTPViaSMS(phone, otpCode, "password_reset");

    const resp: Record<string, unknown> = { message: "OTP à¦ªà¦¾à¦ à¦¾à¦¨à§‹ à¦¹à¦¯à¦¼à§‡à¦›à§‡à¥¤", smsSent: sent };
    if (process.env.NODE_ENV !== "production") resp.demo_otp = otpCode;
    return NextResponse.json(resp);
  } catch {
    return NextResponse.json({ error: "à¦¸à¦¾à¦°à§à¦­à¦¾à¦° à¦¸à¦®à¦¸à§à¦¯à¦¾à¥¤" }, { status: 500 });
  }
}
