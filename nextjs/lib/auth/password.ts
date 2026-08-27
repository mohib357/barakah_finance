// ═══════════════════════════════════════════════════════════
//  BARAKAH FINANCE — Password Utilities
//  bcrypt hashing + validation rules.
//  Min 8 chars, must contain at least one letter + one digit.
// ═══════════════════════════════════════════════════════════

import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

/** Hash a plaintext password */
export async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, SALT_ROUNDS);
}

/** Verify a plaintext password against its hash */
export async function verifyPassword(
  plaintext: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plaintext, hash);
}

/** Spec: min 8 chars, at least one letter AND one digit */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  message?: string;
} {
  if (password.length < 8) {
    return {
      valid:   false,
      message: "পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।",
    };
  }
  if (!/[a-zA-Z]/.test(password)) {
    return {
      valid:   false,
      message: "পাসওয়ার্ডে কমপক্ষে একটি ইংরেজি অক্ষর থাকতে হবে।",
    };
  }
  if (!/[0-9]/.test(password)) {
    return {
      valid:   false,
      message: "পাসওয়ার্ডে কমপক্ষে একটি সংখ্যা থাকতে হবে।",
    };
  }
  return { valid: true };
}
