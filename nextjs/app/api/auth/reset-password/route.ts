import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { verifyOTP } from "@/lib/auth/otp";
import { hashPassword, validatePasswordStrength } from "@/lib/auth/password";
import { z } from "zod";

export const dynamic = "force-dynamic";


const Schema = z.object({
  phone:       z.string().min(10),
  code:        z.string().length(6),
  newPassword: z.string().min(8),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "à¦…à¦¬à§ˆà¦§ à¦¤à¦¥à§à¦¯à¥¤" }, { status: 400 });

    const { phone, code, newPassword } = parsed.data;
    const strength = validatePasswordStrength(newPassword);
    if (!strength.valid) return NextResponse.json({ error: strength.message }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { phone }, select: { id: true } });
    if (!user) return NextResponse.json({ error: "à¦¬à§à¦¯à¦¬à¦¹à¦¾à¦°à¦•à¦¾à¦°à§€ à¦ªà¦¾à¦“à¦¯à¦¼à¦¾ à¦¯à¦¾à¦¯à¦¼à¦¨à¦¿à¥¤" }, { status: 404 });

    await verifyOTP({ phone, userId: user.id, code, purpose: "password_reset" });

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data:  { passwordHash, passwordChangedAt: new Date() },
    });

    return NextResponse.json({ message: "à¦ªà¦¾à¦¸à¦“à¦¯à¦¼à¦¾à¦°à§à¦¡ à¦¸à¦«à¦²à¦­à¦¾à¦¬à§‡ à¦ªà¦°à¦¿à¦¬à¦°à§à¦¤à¦¨ à¦¹à¦¯à¦¼à§‡à¦›à§‡à¥¤" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "à¦ªà¦¾à¦¸à¦“à¦¯à¦¼à¦¾à¦°à§à¦¡ à¦°à¦¿à¦¸à§‡à¦Ÿ à¦¬à§à¦¯à¦°à§à¦¥à¥¤";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
