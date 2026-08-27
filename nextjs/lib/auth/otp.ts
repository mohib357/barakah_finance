// ═══════════════════════════════════════════════════════════
//  BARAKAH FINANCE — OTP Management
//  6-digit numeric OTP for signup, password reset, login 2FA.
//  Stored hashed in DB (OTPRecord model).
//  TTL: configurable via OTP_TTL_SECONDS env (default 10 min).
//  Max attempts: 5 before record is invalidated.
// ═══════════════════════════════════════════════════════════

import crypto from "crypto";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db/prisma";

const OTP_TTL_SECONDS = parseInt(process.env.OTP_TTL_SECONDS ?? "600", 10);
const MAX_ATTEMPTS = 5;

/** Generate a cryptographically random 6-digit OTP */
export function generateOTPCode(): string {
  const bytes = crypto.randomBytes(4);
  const num   = bytes.readUInt32BE(0) % 1_000_000;
  return num.toString().padStart(6, "0");
}

/** Create and persist an OTP record; returns the plaintext code for delivery */
export async function createOTP(options: {
  phone?:   string;
  email?:   string;
  userId?:  string;
  purpose:  "signup" | "password_reset" | "2fa" | "login";
}): Promise<string> {
  const { phone, email, userId, purpose } = options;

  // Invalidate any existing unused OTP for the same contact + purpose
  await prisma.oTPRecord.updateMany({
    where: {
      ...(phone  ? { phone }  : {}),
      ...(email  ? { email }  : {}),
      ...(userId ? { userId } : {}),
      purpose,
      isUsed: false,
    },
    data: { isUsed: true },
  });

  const code      = generateOTPCode();
  const codeHash  = await bcrypt.hash(code, 8);
  const expiresAt = new Date(Date.now() + OTP_TTL_SECONDS * 1000);

  await prisma.oTPRecord.create({
    data: {
      ...(phone  ? { phone }  : {}),
      ...(email  ? { email }  : {}),
      ...(userId ? { userId } : {}),
      code: codeHash,
      purpose,
      expiresAt,
    },
  });

  return code; // caller is responsible for delivering this via SMS / email
}

/** Verify an OTP code. Returns userId/phone/email on success, throws on failure. */
export async function verifyOTP(options: {
  phone?:  string;
  email?:  string;
  userId?: string;
  purpose: "signup" | "password_reset" | "2fa" | "login";
  code:    string;
}): Promise<{ verified: true }> {
  const { phone, email, userId, purpose, code } = options;

  const record = await prisma.oTPRecord.findFirst({
    where: {
      ...(phone  ? { phone }  : {}),
      ...(email  ? { email }  : {}),
      ...(userId ? { userId } : {}),
      purpose,
      isUsed: false,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!record) {
    throw new Error("OTP পাওয়া যায়নি। পুনরায় অনুরোধ করুন।");
  }

  // Expired
  if (new Date() > record.expiresAt) {
    await prisma.oTPRecord.update({
      where: { id: record.id },
      data:  { isUsed: true },
    });
    throw new Error("OTP-এর মেয়াদ শেষ হয়ে গেছে। পুনরায় অনুরোধ করুন।");
  }

  // Too many attempts
  if (record.attempts >= MAX_ATTEMPTS) {
    await prisma.oTPRecord.update({
      where: { id: record.id },
      data:  { isUsed: true },
    });
    throw new Error("অনেকবার ভুল কোড দেওয়া হয়েছে। পুনরায় OTP অনুরোধ করুন।");
  }

  const valid = await bcrypt.compare(code, record.code);

  if (!valid) {
    await prisma.oTPRecord.update({
      where: { id: record.id },
      data:  { attempts: { increment: 1 } },
    });
    const remaining = MAX_ATTEMPTS - record.attempts - 1;
    throw new Error(
      `ভুল OTP। আরও ${remaining} বার সুযোগ আছে।`
    );
  }

  // Mark as used
  await prisma.oTPRecord.update({
    where: { id: record.id },
    data:  { isUsed: true, usedAt: new Date() },
  });

  return { verified: true };
}

/** Convenience: send OTP via the configured SMS gateway */
export async function sendOTPViaSMS(
  phone: string,
  code: string,
  purpose: string
): Promise<{ sent: boolean; error?: string }> {
  const smsApiKey    = process.env.SMS_API_KEY;
  const smsApiUrl    = process.env.SMS_API_URL;
  const smsSenderId  = process.env.SMS_SENDER_ID;

  if (!smsApiKey || !smsApiUrl) {
    // In development, log the OTP to console instead
    if (process.env.NODE_ENV !== "production") {
      console.log(`[OTP-DEV] Phone: ${phone} | Purpose: ${purpose} | Code: ${code}`);
      return { sent: true };
    }
    return { sent: false, error: "SMS API configured নেই।" };
  }

  const purposeMessages: Record<string, string> = {
    signup:         `বারাকাহ ফাইন্যান্স নিবন্ধন OTP: ${code}। মেয়াদ ${OTP_TTL_SECONDS / 60} মিনিট। কাউকে দেবেন না।`,
    password_reset: `বারাকাহ ফাইন্যান্স পাসওয়ার্ড রিসেট OTP: ${code}। মেয়াদ ${OTP_TTL_SECONDS / 60} মিনিট।`,
    login:          `বারাকাহ ফাইন্যান্স লগইন OTP: ${code}। মেয়াদ ${OTP_TTL_SECONDS / 60} মিনিট।`,
    "2fa":          `বারাকাহ ফাইন্যান্স 2FA কোড: ${code}।`,
  };

  const message = purposeMessages[purpose] ?? `বারাকাহ ফাইন্যান্স OTP: ${code}।`;

  try {
    const url = new URL(smsApiUrl);
    url.searchParams.set("api_key",  smsApiKey);
    url.searchParams.set("type",     "text");
    url.searchParams.set("number",   phone);
    url.searchParams.set("message",  message);
    if (smsSenderId) url.searchParams.set("senderid", smsSenderId);

    const response = await fetch(url.toString(), {
      method: "GET",
      signal: AbortSignal.timeout(10_000),
    });

    const data = await response.json();
    const success =
      data.response_code === 202 ||
      data.error_code === "0" ||
      data.status === "SUCCESS";

    return { sent: success, error: success ? undefined : JSON.stringify(data) };
  } catch (err) {
    return { sent: false, error: String(err) };
  }
}
