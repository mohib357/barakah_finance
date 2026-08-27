// ═══════════════════════════════════════════════════════════
//  BARAKAH FINANCE — Next.js Edge Middleware
//  Runs on Edge Runtime — no Prisma, no Node.js APIs.
// ═══════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { UserSystemRole } from "@/types/enums";
import { ROUTE_PERMISSION_MAP } from "@/lib/constants/permissions";

const ROLE_ORDER: UserSystemRole[] = [
  UserSystemRole.USER,
  UserSystemRole.WITNESS,
  UserSystemRole.GUARANTOR,
  UserSystemRole.CUSTOMER,
  UserSystemRole.INVESTOR,
  UserSystemRole.MEMBER,
  UserSystemRole.STAFF,
  UserSystemRole.ADMIN,
  UserSystemRole.SUPER_ADMIN,
];

function roleIndex(role: UserSystemRole): number {
  return ROLE_ORDER.indexOf(role);
}

const PUBLIC_PATH_PREFIXES = [
  "/",
  "/gallery",
  "/timeline",
  "/learn-more",
  "/login",
  "/signup",
  "/verify",
  "/forgot-password",
  "/reset-password",
  "/unauthorized",
  "/api/auth",
  "/api/public",
  "/api/applications",
  "/_next",
  "/favicon",
  "/robots",
  "/sitemap",
  "/image",
  "/fonts",
];

function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return PUBLIC_PATH_PREFIXES.some(
    (prefix) =>
      pathname.startsWith(prefix) &&
      (pathname.length === prefix.length ||
        pathname[prefix.length] === "/" ||
        pathname[prefix.length] === "?"),
  );
}

function applySecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set("X-Content-Type-Options",  "nosniff");
  res.headers.set("X-Frame-Options",          "SAMEORIGIN");
  res.headers.set("X-XSS-Protection",         "1; mode=block");
  res.headers.set("Referrer-Policy",          "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy",       "camera=(), microphone=(), geolocation=()");
  if (process.env.NODE_ENV === "production") {
    res.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }
  return res;
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return applySecurityHeaders(NextResponse.next());
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return applySecurityHeaders(NextResponse.redirect(loginUrl));
  }

  const userRole    = (token.systemRole as UserSystemRole) ?? UserSystemRole.USER;
  const isActive    = (token.isActive   as boolean) ?? true;
  const isVerified  = (token.isVerified as boolean) ?? false;
  const twoFARequired = (token.twoFARequired as boolean | undefined) ?? false;
  const twoFAVerified = (token.twoFAVerified as boolean | undefined) ?? false;

  if (!isActive) {
    return applySecurityHeaders(NextResponse.redirect(new URL("/login?error=AccountDeactivated", request.url)));
  }

  if (!isVerified && !pathname.startsWith("/verify")) {
    return applySecurityHeaders(NextResponse.redirect(new URL("/verify", request.url)));
  }

  if (twoFARequired && !twoFAVerified && !pathname.startsWith("/login/2fa")) {
    return applySecurityHeaders(NextResponse.redirect(new URL("/login/2fa", request.url)));
  }

  for (const rule of ROUTE_PERMISSION_MAP) {
    if (pathname.startsWith(rule.pathPrefix)) {
      if (roleIndex(userRole) < roleIndex(rule.requiredRole)) {
        return applySecurityHeaders(NextResponse.redirect(new URL("/unauthorized", request.url)));
      }
      break;
    }
  }

  if (pathname.startsWith("/admin")) {
    const isAdmin = userRole === UserSystemRole.ADMIN || userRole === UserSystemRole.SUPER_ADMIN;
    if (!isAdmin) {
      return applySecurityHeaders(NextResponse.redirect(new URL("/unauthorized", request.url)));
    }
    if (userRole === UserSystemRole.SUPER_ADMIN && (token.twoFAEnabled as boolean) && !twoFAVerified) {
      return applySecurityHeaders(NextResponse.redirect(new URL("/login/2fa?admin=1", request.url)));
    }
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|woff|woff2|ttf|eot)).*)",
  ],
};
