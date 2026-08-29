// ═══════════════════════════════════════════════════════════
//  BARAKAH FINANCE — NextAuth Configuration
// ═══════════════════════════════════════════════════════════

import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { UserSystemRole } from "@/types/enums";
import prisma from "@/lib/db/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { roleRequires2FA } from "@/lib/auth/two-factor";

// ── Type augmentation ────────────────────────────────────────
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
      twoFARequired?:  boolean;
      twoFAVerified?:  boolean;
      profileComplete: number;
      photoUrl?:       string | null;
      defaultRedirect: string;   // "/admin" or "/dashboard" based on role
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
    defaultRedirect?: string;
  }
}

// ── Helpers ──────────────────────────────────────────────────
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
    include: { profile: { select: { photoUrl: true } } },
  });
}

// ── NextAuth options ──────────────────────────────────────────
export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 },
  secret:  process.env.NEXTAUTH_SECRET,
  pages:   { signIn: "/login", error: "/login" },

  providers: [
    CredentialsProvider({
      id:   "credentials",
      name: "Barakah Finance",
      credentials: {
        identifier: { label: "Phone / Email / Username", type: "text" },
        password:   { label: "Password",                 type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials.password) {
          throw new Error("সব তথ্য পূরণ করুন।");
        }
        const user = await resolveUserByIdentifier(credentials.identifier);
        if (!user)         throw new Error("ব্যবহারকারী পাওয়া যায়নি।");
        if (!user.isActive) throw new Error("এই অ্যাকাউন্টটি নিষ্ক্রিয়।");
        if (user.isLocked)  throw new Error(user.lockReason ?? "অ্যাকাউন্ট লক।");

        const ok = await verifyPassword(credentials.password, user.passwordHash);
        if (!ok) throw new Error("পাসওয়ার্ড ভুল।");

        const needs2FA = user.twoFAEnabled &&
          await roleRequires2FA(user.systemRole as UserSystemRole);

        await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

        return {
          id:              user.id,
          username:        user.username,
          firstName:       user.firstName,
          lastName:        user.lastName,
          email:           user.email,
          phone:           user.phone,
          systemRole:      user.systemRole as UserSystemRole,
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
    async jwt({ token, user, trigger, session: updatedSession }) {
      if (user) {
        token.id              = user.id;
        token.username        = user.username;
        token.firstName       = user.firstName;
        token.lastName        = user.lastName;
        token.email           = user.email ?? null;
        token.phone           = user.phone ?? null;
        token.systemRole      = user.systemRole;
        token.isVerified      = user.isVerified;
        token.isActive        = user.isActive;
        token.twoFAEnabled    = user.twoFAEnabled;
        token.twoFARequired   = user.twoFARequired;
        token.twoFAVerified   = user.twoFAVerified;
        token.profileComplete = user.profileComplete;
        token.photoUrl        = user.photoUrl ?? null;

        // Derive the correct post-login landing page from role
        const adminRoles: UserSystemRole[] = [
          UserSystemRole.SUPER_ADMIN,
          UserSystemRole.ADMIN,
          UserSystemRole.STAFF,
        ];
        token.defaultRedirect = adminRoles.includes(user.systemRole)
          ? "/admin"
          : "/dashboard";
      }
      if (trigger === "update" && updatedSession?.twoFAVerified !== undefined) {
        token.twoFAVerified = updatedSession.twoFAVerified as boolean;
        token.twoFARequired = updatedSession.twoFARequired as boolean ?? false;
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id              = token.id as string;
        session.user.username        = token.username as string;
        session.user.firstName       = token.firstName as string;
        session.user.lastName        = (token.lastName as string | null | undefined) ?? null;
        session.user.email           = (token.email as string | null | undefined) ?? null;
        session.user.phone           = (token.phone as string | null | undefined) ?? null;
        session.user.systemRole      = token.systemRole as UserSystemRole;
        session.user.isVerified      = token.isVerified as boolean;
        session.user.isActive        = token.isActive as boolean;
        session.user.twoFAEnabled    = token.twoFAEnabled as boolean;
        session.user.twoFARequired   = token.twoFARequired as boolean | undefined;
        session.user.twoFAVerified   = token.twoFAVerified as boolean | undefined;
        session.user.profileComplete = token.profileComplete as number;
        session.user.photoUrl        = (token.photoUrl as string | null | undefined) ?? null;
        session.user.defaultRedirect = (token.defaultRedirect as string | undefined) ?? "/dashboard";
      }
      return session;
    },
  },
};
