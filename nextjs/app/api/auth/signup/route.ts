import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { hashPassword, validatePasswordStrength } from "@/lib/auth/password";
import { createOTP, sendOTPViaSMS } from "@/lib/auth/otp";
import { z } from "zod";

export const dynamic = "force-dynamic";


const SignupSchema = z.object({
  firstName:  z.string().min(1).max(60),
  lastName:   z.string().max(60).optional(),
  dob:        z.string().optional(),
  username:   z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  phone:      z.string().min(10).max(15).optional(),
  email:      z.string().email().optional(),
  password:   z.string().min(8).max(100),
  referralId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = SignupSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message ?? "à¦…à¦¬à§ˆà¦§ à¦¤à¦¥à§à¦¯à¥¤";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const { firstName, lastName, dob, username, phone, email, password, referralId } = parsed.data;

    // Must have either phone or email
    if (!phone && !email) {
      return NextResponse.json({ error: "à¦®à§‹à¦¬à¦¾à¦‡à¦² à¦¨à¦®à§à¦¬à¦° à¦…à¦¥à¦¬à¦¾ à¦‡à¦®à§‡à¦‡à¦² à¦ªà§à¦°à¦¯à¦¼à§‹à¦œà¦¨à¥¤" }, { status: 400 });
    }

    // Password strength
    const strength = validatePasswordStrength(password);
    if (!strength.valid) {
      return NextResponse.json({ error: strength.message }, { status: 400 });
    }

    // Duplicate checks
    if (phone) {
      const existing = await prisma.user.findUnique({ where: { phone }, select: { id: true } });
      if (existing) return NextResponse.json({ error: "à¦à¦‡ à¦®à§‹à¦¬à¦¾à¦‡à¦² à¦¨à¦®à§à¦¬à¦°à§‡ à¦‡à¦¤à¦¿à¦®à¦§à§à¦¯à§‡ à¦…à§à¦¯à¦¾à¦•à¦¾à¦‰à¦¨à§à¦Ÿ à¦†à¦›à§‡à¥¤" }, { status: 409 });
    }
    if (email) {
      const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
      if (existing) return NextResponse.json({ error: "à¦à¦‡ à¦‡à¦®à§‡à¦‡à¦²à§‡ à¦‡à¦¤à¦¿à¦®à¦§à§à¦¯à§‡ à¦…à§à¦¯à¦¾à¦•à¦¾à¦‰à¦¨à§à¦Ÿ à¦†à¦›à§‡à¥¤" }, { status: 409 });
    }
    const usernameExist = await prisma.user.findUnique({ where: { username: username.toLowerCase() }, select: { id: true } });
    if (usernameExist) return NextResponse.json({ error: "à¦à¦‡ à¦‡à¦‰à¦œà¦¾à¦°à¦¨à§‡à¦® à¦¨à§‡à¦“à¦¯à¦¼à¦¾ à¦¹à¦¯à¦¼à§‡à¦›à§‡à¥¤" }, { status: 409 });

    // Validate referral
    let referredById: string | undefined;
    if (referralId) {
      const ref = await prisma.user.findFirst({
        where: { OR: [{ id: referralId }, { username: referralId }, { phone: referralId }] },
        select: { id: true },
      });
      referredById = ref?.id;
    }

    // Create user (unverified)
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName: lastName ?? null,
        username: username.toLowerCase(),
        phone:    phone ?? null,
        email:    email ?? null,
        passwordHash,
        isVerified:     false,
        profileComplete: 30,
        referredById: referredById ?? null,
        profile: { create: {} },
      },
      select: { id: true, phone: true, email: true },
    });

    // Generate and send OTP
    const otpCode = await createOTP({
      phone:   user.phone ?? undefined,
      email:   user.email ?? undefined,
      userId:  user.id,
      purpose: "signup",
    });

    let smsSent = false;
    if (user.phone) {
      const result = await sendOTPViaSMS(user.phone, otpCode, "signup");
      smsSent = result.sent;
    }

    const resp: Record<string, unknown> = {
      message: "OTP à¦ªà¦¾à¦ à¦¾à¦¨à§‹ à¦¹à¦¯à¦¼à§‡à¦›à§‡à¥¤",
      phone: user.phone,
      email: user.email,
      smsSent,
    };

    // Expose OTP in development only
    if (process.env.NODE_ENV !== "production") {
      resp.demo_otp = otpCode;
    }

    return NextResponse.json(resp, { status: 201 });
  } catch (err) {
    console.error("[signup]", err);
    return NextResponse.json({ error: "à¦¸à¦¾à¦°à§à¦­à¦¾à¦° à¦¸à¦®à¦¸à§à¦¯à¦¾ à¦¹à¦¯à¦¼à§‡à¦›à§‡à¥¤ à¦ªà¦°à§‡ à¦šà§‡à¦·à§à¦Ÿà¦¾ à¦•à¦°à§à¦¨à¥¤" }, { status: 500 });
  }
}
