// ═══════════════════════════════════════════════════════════
//  BARAKAH FINANCE — TOTP Two-Factor Authentication
//  Uses otplib (RFC 6238) for TOTP (Google Authenticator, etc.)
//  Super Admin requires 2FA per spec.
//  Secret stored encrypted in User.twoFASecret.
//  Phase 1 stores base32 secret as-is;
//  Phase 2 should encrypt at rest with AES-256-GCM.
// ═══════════════════════════════════════════════════════════

import { authenticator } from "otplib";
import QRCode from "qrcode";
import prisma from "@/lib/db/prisma";
import { UserSystemRole } from "@prisma/client";

const ISSUER = process.env.TOTP_ISSUER ?? "BarakahFinance";

/** Generate a new TOTP secret and its QR code data URL */
export async function setupTOTP(userId: string): Promise<{
  secret: string;
  otpauthUrl: string;
  qrCodeDataUrl: string;
}> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { username: true, email: true, phone: true },
  });

  const label = user.email ?? user.phone ?? user.username;
  const secret = authenticator.generateSecret(); // 20-byte base32

  const otpauthUrl = authenticator.keyuri(label, ISSUER, secret);
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

  // Store secret (will be confirmed after user verifies first code)
  await prisma.user.update({
    where: { id: userId },
    data:  { twoFASecret: secret, twoFAEnabled: false }, // not enabled until confirmed
  });

  return { secret, otpauthUrl, qrCodeDataUrl };
}

/** Confirm and activate TOTP after user enters their first valid code */
export async function confirmTOTP(userId: string, token: string): Promise<void> {
  const user = await prisma.user.findUniqueOrThrow({
    where:  { id: userId },
    select: { twoFASecret: true },
  });

  if (!user.twoFASecret) {
    throw new Error("TOTP setup করা হয়নি। আবার শুরু করুন।");
  }

  const isValid = authenticator.verify({ token, secret: user.twoFASecret });
  if (!isValid) {
    throw new Error("কোড সঠিক নয়। Authenticator App থেকে নতুন কোড দিন।");
  }

  await prisma.user.update({
    where: { id: userId },
    data:  { twoFAEnabled: true },
  });
}

/** Verify a TOTP token during login */
export function verifyTOTPToken(secret: string, token: string): boolean {
  return authenticator.verify({ token, secret });
}

/** Disable TOTP for a user (Super Admin action, or user self-service) */
export async function disableTOTP(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data:  { twoFAEnabled: false, twoFASecret: null },
  });
}

/** Check whether a specific role requires 2FA before granting a session */
export async function roleRequires2FA(role: UserSystemRole): Promise<boolean> {
  const settings = await prisma.systemSettings.findUnique({
    where:  { id: "global" },
    select: { superAdminRequires2FA: true, adminRequires2FA: true },
  });

  if (role === UserSystemRole.SUPER_ADMIN) {
    return settings?.superAdminRequires2FA ?? true; // default: mandatory
  }
  if (role === UserSystemRole.ADMIN) {
    return settings?.adminRequires2FA ?? false;
  }
  return false;
}
