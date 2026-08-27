"use client";
// ── Wraps the entire app in NextAuth SessionProvider ──
// Required for useSession() hook to work in Client Components.

import { SessionProvider } from "next-auth/react";

export function AuthSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SessionProvider>{children}</SessionProvider>;
}
