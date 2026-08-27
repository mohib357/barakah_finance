// ═══════════════════════════════════════════════════════════
//  BARAKAH FINANCE — OTP Management
//
//  SMS Gateway: BulkSMSBD (bulksmsbd.net)
//  API Key:     PEORenxMbnajRYOPGnsD
//  Sender ID:   8809617611021
//  Send URL:    http://bulksmsbd.net/api/smsapi
//  Balance URL: http://bulksmsbd.net/api/getBalanceApi
//
//  OTP flow:
//    createOTP()  → generates + stores bcrypt-hashed 6-digit code
//    sendOTPViaSMS() → sends via BulkSMSBD HTTP GET API
//    verifyOTP()  → validates code, marks used
// ═══════════════════════════════════════════════════════════

import crypto from "crypto";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db/prisma";

const OTP_TTL_SECONDS = parseInt(process.env.OTP_TTL_SECONDS ?? "600", 10);
const MAX_ATTEMPTS    = 5;

// ── BulkSMSBD config (from env) ──────────────────────────
const SMS_API_KEY     = process.env.SMS_API_KEY     ?? "";
const SMS_API_URL     = process.env.SMS_API_URL     ?? "http://bulksmsbd.net/api/smsapi";
const SMS_BALANCE_URL = process.env.SMS_BALANCE_URL ?? "http://bulksmsbd.net/api/getBalanceApi";
const SMS_SENDER_ID   = process.env.SMS_SENDER_ID   ?? "8809617611021";

// ─────────────────────────────────────────────────────────
// Generate a cryptographically secure 6-digit OTP
// ─────────────────────────────────────────────────────────
export function generateOTPCode(): string {
  const bytes = crypto.randomBytes(4);
  const num   = bytes.readUInt32BE(0) % 1_000_000;
  return num.toString().padStart(6, "0");
}

// ─────────────────────────────────────────────────────────
// Create and persist an OTP record.
// Returns the plaintext code — caller must deliver it.
// ─────────────────────────────────────────────────────────
export async function createOTP(options: {
  phone?:   string;
  email?:   string;
  userId?:  string;
  purpose:  "signup" | "password_reset" | "2fa" | "login";
}): Promise<string> {
  const { phone, email, userId, purpose } = options;

  // Invalidate any existing unused OTP for the same identity + purpose
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

  return code;
}

// ─────────────────────────────────────────────────────────
// Verify OTP. Throws descriptive Bengali error on failure.
// ─────────────────────────────────────────────────────────
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

  if (!record) throw new Error("OTP পাওয়া যায়নি। পুনরায় অনুরোধ করুন।");

  if (new Date() > record.expiresAt) {
    await prisma.oTPRecord.update({ where: { id: record.id }, data: { isUsed: true } });
    throw new Error("OTP-এর মেয়াদ শেষ হয়ে গেছে। পুনরায় অনুরোধ করুন।");
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    await prisma.oTPRecord.update({ where: { id: record.id }, data: { isUsed: true } });
    throw new Error("অনেকবার ভুল কোড। পুনরায় OTP অনুরোধ করুন।");
  }

  const valid = await bcrypt.compare(code, record.code);
  if (!valid) {
    await prisma.oTPRecord.update({ where: { id: record.id }, data: { attempts: { increment: 1 } } });
    const left = MAX_ATTEMPTS - record.attempts - 1;
    throw new Error(`ভুল OTP। আরও ${left} বার সুযোগ আছে।`);
  }

  await prisma.oTPRecord.update({ where: { id: record.id }, data: { isUsed: true, usedAt: new Date() } });
  return { verified: true };
}

// ─────────────────────────────────────────────────────────
// Send OTP via BulkSMSBD HTTP GET API
//
// BulkSMSBD GET format:
//   http://bulksmsbd.net/api/smsapi
//     ?api_key=KEY
//     &type=text
//     &number=PHONE
//     &senderid=SENDERID
//     &message=MESSAGE
//
// Success response: { response_code: 202, ... }
// ─────────────────────────────────────────────────────────
export async function sendOTPViaSMS(
  phone: string,
  code:  string,
  purpose: string
): Promise<{ sent: boolean; balance?: number; error?: string }> {

  // Dev: log to console, skip real API call
  if (!SMS_API_KEY || process.env.NODE_ENV === "development") {
    console.log(`\n[OTP-DEV] ────────────────────────────`);
    console.log(`  Phone:   ${phone}`);
    console.log(`  Purpose: ${purpose}`);
    console.log(`  Code:    ${code}`);
    console.log(`────────────────────────────────────\n`);
    return { sent: true };
  }

  // Build the Bangla message per BulkSMSBD template
  const ttlMin = Math.round(OTP_TTL_SECONDS / 60);
  const purposeMessages: Record<string, string> = {
    signup:         `Your Barakah Finance OTP is ${code}. Valid for ${ttlMin} minutes. Do not share.`,
    password_reset: `Your Barakah Finance OTP is ${code}. Valid for ${ttlMin} minutes. Password reset.`,
    login:          `Your Barakah Finance OTP is ${code}. Valid for ${ttlMin} minutes.`,
    "2fa":          `Your Barakah Finance 2FA code is ${code}.`,
  };
  const message = purposeMessages[purpose] ?? `Your Barakah Finance OTP is ${code}.`;

  try {
    // BulkSMSBD uses GET with query params
    const url = new URL(SMS_API_URL);
    url.searchParams.set("api_key",  SMS_API_KEY);
    url.searchParams.set("type",     "text");
    url.searchParams.set("number",   phone);
    url.searchParams.set("senderid", SMS_SENDER_ID);
    url.searchParams.set("message",  message);

    const response = await fetch(url.toString(), {
      method: "GET",
      signal: AbortSignal.timeout(12_000),
    });

    const text = await response.text();
    let data: Record<string, unknown> = {};
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    // BulkSMSBD: success = response_code 202
    const success =
      data.response_code === 202    ||
      data.response_code === "202"  ||
      data.error_code    === "0"    ||
      String(data.status).toUpperCase() === "SUCCESS";

    if (!success) {
      console.error("[SMS] BulkSMSBD error:", data);
    }

    return {
      sent:  success,
      error: success ? undefined : `BulkSMSBD: ${text.slice(0, 200)}`,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[SMS] Network error:", msg);
    return { sent: false, error: msg };
  }
}

// ─────────────────────────────────────────────────────────
// Check remaining SMS balance from BulkSMSBD
// GET http://bulksmsbd.net/api/getBalanceApi?api_key=KEY
// ─────────────────────────────────────────────────────────
export async function getSMSBalance(): Promise<number | null> {
  if (!SMS_API_KEY) return null;
  try {
    const url = new URL(SMS_BALANCE_URL);
    url.searchParams.set("api_key", SMS_API_KEY);
    const res  = await fetch(url.toString(), { signal: AbortSignal.timeout(8_000) });
    const text = await res.text();
    let data: Record<string, unknown> = {};
    try { data = JSON.parse(text); } catch { data = { raw: text }; }
    // BulkSMSBD returns { balance: "1234" } or { sms_balance: 1234 }
    const balance = data.balance ?? data.sms_balance ?? data.data;
    if (balance !== undefined) return parseFloat(String(balance));
    return null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────
// Generic SMS sender — for non-OTP messages (dues, notices)
// Supports template tokens: {name} {amount} {due_date} {member_id}
// ─────────────────────────────────────────────────────────
export async function sendSMS(
  phone: string,
  message: string
): Promise<{ sent: boolean; error?: string }> {
  if (!SMS_API_KEY || process.env.NODE_ENV === "development") {
    console.log(`[SMS-DEV] → ${phone}: ${message}`);
    return { sent: true };
  }
  try {
    const url = new URL(SMS_API_URL);
    url.searchParams.set("api_key",  SMS_API_KEY);
    url.searchParams.set("type",     "text");
    url.searchParams.set("number",   phone);
    url.searchParams.set("senderid", SMS_SENDER_ID);
    url.searchParams.set("message",  message);

    const res  = await fetch(url.toString(), { method: "GET", signal: AbortSignal.timeout(12_000) });
    const text = await res.text();
    let data: Record<string, unknown> = {};
    try { data = JSON.parse(text); } catch { data = { raw: text }; }
    const success = data.response_code === 202 || data.response_code === "202" || data.error_code === "0";
    return { sent: success, error: success ? undefined : text.slice(0, 200) };
  } catch (err) {
    return { sent: false, error: String(err) };
  }
}

/** Interpolate SMS template tokens */
export function interpolateSMSTemplate(
  template: string,
  vars: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ""));
}
