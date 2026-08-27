import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { verifyOTP } from "@/lib/auth/otp";
import { z } from "zod";

const Schema = z.object({
  phone:   z.string().optional(),
  email:   z.string().optional(),
  code:    z.string().length(6),
  purpose: z.enum(["signup", "password_reset", "2fa", "login"]),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "অবৈধ তথ্য।" }, { status: 400 });
    }

    const { phone, email, code, purpose } = parsed.data;

    // Find the user to get userId
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          ...(phone ? [{ phone }] : []),
          ...(email ? [{ email }] : []),
        ],
      },
      select: { id: true },
    });

    await verifyOTP({ phone, email, userId: user?.id, code, purpose });

    // Mark user as verified on signup
    if (purpose === "signup" && user) {
      await prisma.user.update({
        where: { id: user.id },
        data:  { isVerified: true, profileComplete: 40 },
      });
    }

    return NextResponse.json({ verified: true, message: "সফলভাবে যাচাই হয়েছে।", userId: user?.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "যাচাইকরণ ব্যর্থ।";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
