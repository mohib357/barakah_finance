// ═══════════════════════════════════════════════════════════
//  BARAKAH FINANCE — TOTP Two-Factor Authentication
// ═══════════════════════════════════════════════════════════

import { authenticator } from "otplib";
import QRCode from "qrcode";
import prisma from "@/lib/db/prisma";
import { UserSystemRole } from "@/types/enums";

const ISSUER = process.env.TOTP_ISSUER ?? "BarakahFinance";

export async function setupTOTP(userId: string): Promise<{
  secret: string;
  otpauthUrl: string;
  qrCodeDataUrl: string;
}> {
  const user = await prisma.user.findUniqueOrThrow({
    where:  { id: userId },
    select: { username: true, email: true, phone: true },
  });
  const label  = user.email ?? user.phone ?? user.username;
  const secret = authenticator.generateSecret();
  const otpauthUrl    = authenticator.keyuri(label, ISSUER, secret);
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
  await prisma.user.update({ where: { id: userId }, data: { twoFASecret: secret, twoFAEnabled: false } });
  return { secret, otpauthUrl, qrCodeDataUrl };
}

export async function confirmTOTP(userId: string, token: string): Promise<void> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { twoFASecret: true } });
  if (!user.twoFASecret) throw new Error("TOTP setup করা হয়নি।");
  if (!authenticator.verify({ token, secret: user.twoFASecret })) {
    throw new Error("কোড সঠিক নয়।");
  }
  await prisma.user.update({ where: { id: userId }, data: { twoFAEnabled: true } });
}

export function verifyTOTPToken(secret: string, token: string): boolean {
  return authenticator.verify({ token, secret });
}

export async function disableTOTP(userId: string): Promise<void> {
  await prisma.user.update({ where: { id: userId }, data: { twoFAEnabled: false, twoFASecret: null } });
}

export async function roleRequires2FA(role: UserSystemRole): Promise<boolean> {
  const settings = await prisma.systemSettings.findUnique({
    where:  { id: "global" },
    select: { superAdminRequires2FA: true, adminRequires2FA: true },
  });
  if (role === UserSystemRole.SUPER_ADMIN) return settings?.superAdminRequires2FA ?? true;
  if (role === UserSystemRole.ADMIN)       return settings?.adminRequires2FA ?? false;
  return false;
}
