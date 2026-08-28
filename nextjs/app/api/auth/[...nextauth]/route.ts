// Barakah Finance — NextAuth Route Handler
// Handles /api/auth/* (signin, signout, session, csrf, etc.)

export const dynamic = "force-dynamic";

import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth/config";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
