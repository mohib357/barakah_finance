// ═══════════════════════════════════════════════════════════
//  BARAKAH FINANCE — NextAuth Configuration
//
//  Flow:
//  1. User submits identifier (phone/email/username) + password
//  2. CredentialsProvider verifies password
//  3. If role requires 2FA → session flag twoFARequired = true
//     → frontend redirects to /login/2fa
//  4. User enters TOTP or SMS OTP
//  5. On verify → twoFAVerified = true in session
//
//  Session strategy: JWT (no DB sessions via NextAuth;
//  we manage UserSession rows ourselves for security tracking).
//
//  Spec: "Admin, Super Admin, Member use the same login system."
// ═══════════════════════════════════════════════════════════

import type { NextAuthOptions, User as NextAuthUser } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { UserSystemRole } from "@prisma/client";
import prisma from "@/lib/db/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { roleRequires2FA } from "@/lib/auth/two-factor";

// ─────────────────────────────────────────────────────────
// Extend next-auth types (must mirror BFSession in session.ts)
// ─────────────────────────────────────────────────────────

declare module "next-auth" {
  interface Session {
    user: {
      id:              string;
      username:        string;
      firstName:       string;
      lastName?:       string | null;
      email?:          string | null;
      phone?:          string | null;
      systemRole:      UserSystemRole;
      isVerified:      boolean;
      isActive:        boolean;
      twoFAEnabled:    boolean;
      twoFARequired?:  boolean;  // true = must complete 2FA step
      twoFAVerified?:  boolean;
      profileComplete: number;
      photoUrl?:       string | null;
    };
  }

  interface User {
    id:              string;
    username:        string;
    firstName:       string;
    lastName?:       string | null;
    email?:          string | null;
    phone?:          string | null;
    systemRole:      UserSystemRole;
    isVerified:      boolean;
    isActive:        boolean;
    twoFAEnabled:    boolean;
    twoFARequired?:  boolean;
    twoFAVerified?:  boolean;
    profileComplete: number;
    photoUrl?:       string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id:              string;
    username:        string;
    firstName:       string;
    lastName?:       string | null;
    email?:          string | null;
    phone?:          string | null;
    systemRole:      UserSystemRole;
    isVerified:      boolean;
    isActive:        boolean;
    twoFAEnabled:    boolean;
    twoFARequired?:  boolean;
    twoFAVerified?:  boolean;
    profileComplete: number;
    photoUrl?:       string | null;
  }
}

// ─────────────────────────────────────────────────────────
// Helper: resolve user from identifier (phone/email/username)
// ─────────────────────────────────────────────────────────

async function resolveUserByIdentifier(identifier: string) {
  const q = identifier.toLowerCase().trim();
  return prisma.user.findFirst({
    where: {
      OR: [
        { phone:    q },
        { email:    q },
        { username: q },
      ],
    },
    include: {
      profile: { select: { photoUrl: true } },
    },
  });
}

// ─────────────────────────────────────────────────────────
// NextAuth Options
// ─────────────────────────────────────────────────────────

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge:   7 * 24 * 60 * 60, // 7 days
  },

  secret: process.env.NEXTAUTH_SECRET,

  pages: {
    signIn:  "/login",
    error:   "/login",
  },

  providers: [
    CredentialsProvider({
      id:   "credentials",
      name: "Barakah Finance",

      credentials: {
        identifier: { label: "Phone / Email / Username", type: "text" },
        password:   { label: "Password",                 type: "password" },
      },

      async authorize(credentials): Promise<NextAuthUser | null> {
        if (!credentials?.identifier || !credentials.password) {
          throw new Error("সব তথ্য পূরণ করুন।");
        }

        const user = await resolveUserByIdentifier(credentials.identifier);

        if (!user) {
          throw new Error("ব্যবহারকারী পাওয়া যায়নি।");
        }

        if (!user.isActive) {
          throw new Error("এই অ্যাকাউন্টটি নিষ্ক্রিয় করা হয়েছে।");
        }

        if (user.isLocked) {
          throw new Error(
            user.lockReason
              ? `অ্যাকাউন্ট লক করা আছে: ${user.lockReason}`
              : "অ্যাকাউন্ট লক করা আছে। অ্যাডমিনের সাথে যোগাযোগ করুন।"
          );
        }

        const passwordMatch = await verifyPassword(
          credentials.password,
          user.passwordHash
        );

        if (!passwordMatch) {
          throw new Error("পাসওয়ার্ড ভুল।");
        }

        // Check if this role requires 2FA
        const needs2FA = user.twoFAEnabled && (await roleRequires2FA(user.systemRole));

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data:  { lastLoginAt: new Date() },
        });

        return {
          id:              user.id,
          username:        user.username,
          firstName:       user.firstName,
          lastName:        user.lastName,
          email:           user.email,
          phone:           user.phone,
          systemRole:      user.systemRole,
          isVerified:      user.isVerified,
          isActive:        user.isActive,
          twoFAEnabled:    user.twoFAEnabled,
          twoFARequired:   needs2FA,
          twoFAVerified:   needs2FA ? false : undefined,
          profileComplete: user.profileComplete,
          photoUrl:        user.profile?.photoUrl ?? null,
        };
      },
    }),
  ],

  callbacks: {
    // ── jwt: persist custom fields in the token ──
    async jwt({ token, user, trigger, session: updatedSession }) {
      if (user) {
        // Initial sign-in — copy user fields into token
        token.id              = user.id;
        token.username        = user.username;
        token.firstName       = user.firstName;
        token.lastName        = user.lastName;
        token.email           = user.email;
        token.phone           = user.phone;
        token.systemRole      = user.systemRole;
        token.isVerified      = user.isVerified;
        token.isActive        = user.isActive;
        token.twoFAEnabled    = user.twoFAEnabled;
        token.twoFARequired   = user.twoFARequired;
        token.twoFAVerified   = user.twoFAVerified;
        token.profileComplete = user.profileComplete;
        token.photoUrl        = user.photoUrl;
      }

      // Support session.update() to set twoFAVerified after OTP/TOTP check
      if (trigger === "update" && updatedSession?.twoFAVerified !== undefined) {
        token.twoFAVerified  = updatedSession.twoFAVerified;
        token.twoFARequired  = updatedSession.twoFARequired ?? false;
      }

      // Refresh profile data on every token refresh (every ~5 min)
      // This picks up role changes, lock status, profile updates
      if (token.id && !user) {
        try {
          const fresh = await prisma.user.findUnique({
            where:  { id: token.id as string },
            select: {
              systemRole:      true,
              isActive:        true,
              isLocked:        true,
              isVerified:      true,
              twoFAEnabled:    true,
              profileComplete: true,
              profile:         { select: { photoUrl: true } },
            },
          });
          if (fresh) {
            token.systemRole      = fresh.systemRole;
            token.isActive        = fresh.isActive;
            token.isVerified      = fresh.isVerified;
            token.twoFAEnabled    = fresh.twoFAEnabled;
            token.profileComplete = fresh.profileComplete;
            token.photoUrl        = fresh.profile?.photoUrl ?? null;

            if (fresh.isLocked || !fresh.isActive) {
              // Force sign-out on next request
              throw new Error("Account deactivated");
            }
          }
        } catch {
          // If DB lookup fails, keep existing token data
        }
      }

      return token;
    },

    // ── session: expose token fields to client ──
    async session({ session, token }) {
      if (token) {
        session.user.id              = token.id as string;
        session.user.username        = token.username as string;
        session.user.firstName       = token.firstName as string;
        session.user.lastName        = token.lastName as string | null;
        session.user.email           = token.email as string | null;
        session.user.phone           = token.phone as string | null;
        session.user.systemRole      = token.systemRole as UserSystemRole;
        session.user.isVerified      = token.isVerified as boolean;
        session.user.isActive        = token.isActive as boolean;
        session.user.twoFAEnabled    = token.twoFAEnabled as boolean;
        session.user.twoFARequired   = token.twoFARequired as boolean | undefined;
        session.user.twoFAVerified   = token.twoFAVerified as boolean | undefined;
        session.user.profileComplete = token.profileComplete as number;
        session.user.photoUrl        = token.photoUrl as string | null;
      }
      return session;
    },
  },
};
