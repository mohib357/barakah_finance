// ═══════════════════════════════════════════════════════════
//  BARAKAH FINANCE — Next.js Edge Middleware
//
//  Responsibilities:
//  1. Protect authenticated routes (/dashboard, /profile, /apply, /shop, /admin)
//  2. Enforce minimum role requirements per route prefix
//  3. Block locked / inactive accounts immediately
//  4. Block incomplete 2FA sessions from accessing protected pages
//  5. Ensure clean public URLs (no .html leakage)
//  6. Security headers on every response
//
//  Runs on the EDGE runtime — cannot use Prisma directly.
//  All data comes from the JWT token (set in lib/auth/config.ts).
//
//  Spec: "Admin, Super Admin, Member use the same login system."
//        "Super Admin TOTP is mandatory."
// ═══════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { UserSystemRole } from "@prisma/client";
import { ROUTE_PERMISSION_MAP } from "@/lib/constants/permissions";

// ─────────────────────────────────────────────────────────
// Route groups & their minimum role requirements
// ─────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────
// Paths that are ALWAYS public (no JWT required)
// ─────────────────────────────────────────────────────────

const PUBLIC_PATH_PREFIXES = [
  "/",            // landing
  "/gallery",
  "/timeline",
  "/learn-more",
  "/login",
  "/signup",
  "/verify",
  "/forgot-password",
  "/reset-password",
  "/unauthorized",
  "/api/auth",    // NextAuth endpoints
  "/api/public",  // public API endpoints
  "/_next",       // Next.js internals
  "/favicon",
  "/robots",
  "/sitemap",
  "/images",
  "/fonts",
];

function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return PUBLIC_PATH_PREFIXES.some(
    (prefix) => pathname.startsWith(prefix) && (
      pathname.length === prefix.length ||
      pathname[prefix.length] === "/" ||
      pathname[prefix.length] === "?"
    )
  );
}

// ─────────────────────────────────────────────────────────
// Security headers added to every response
// ─────────────────────────────────────────────────────────

function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options",  "nosniff");
  response.headers.set("X-Frame-Options",          "SAMEORIGIN");
  response.headers.set("X-XSS-Protection",         "1; mode=block");
  response.headers.set("Referrer-Policy",          "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy",       "camera=(), microphone=(), geolocation=()");
  // HSTS — only in production
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }
  return response;
}

// ─────────────────────────────────────────────────────────
// Main middleware function
// ─────────────────────────────────────────────────────────

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // ── 1. Always-public paths — just add security headers ──
  if (isPublicPath(pathname)) {
    const response = NextResponse.next();
    return applySecurityHeaders(response);
  }

  // ── 2. Retrieve JWT token from cookie (edge-safe) ──
  const token = await getToken({
    req:    request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // ── 3. Not authenticated → redirect to login ──
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const userRole     = (token.systemRole as UserSystemRole) ?? UserSystemRole.USER;
  const isActive     = (token.isActive   as boolean) ?? true;
  const isVerified   = (token.isVerified as boolean) ?? false;
  const twoFARequired  = (token.twoFARequired as boolean | undefined) ?? false;
  const twoFAVerified  = (token.twoFAVerified as boolean | undefined) ?? false;

  // ── 4. Deactivated / locked account ──
  if (!isActive) {
    const response = NextResponse.redirect(new URL("/login?error=AccountDeactivated", request.url));
    return applySecurityHeaders(response);
  }

  // ── 5. Unverified account — only /verify is accessible ──
  if (!isVerified && !pathname.startsWith("/verify")) {
    const response = NextResponse.redirect(new URL("/verify", request.url));
    return applySecurityHeaders(response);
  }

  // ── 6. 2FA required but not yet verified this session ──
  //     Allow only /login/2fa to complete the flow
  if (twoFARequired && !twoFAVerified && !pathname.startsWith("/login/2fa")) {
    const response = NextResponse.redirect(new URL("/login/2fa", request.url));
    return applySecurityHeaders(response);
  }

  // ── 7. Check route-level role requirements from ROUTE_PERMISSION_MAP ──
  for (const rule of ROUTE_PERMISSION_MAP) {
    if (pathname.startsWith(rule.pathPrefix)) {
      const meetsRole = roleIndex(userRole) >= roleIndex(rule.requiredRole);

      if (!meetsRole) {
        // Redirect to appropriate error page
        const dest = isActive
          ? "/unauthorized"
          : "/login";
        const response = NextResponse.redirect(new URL(dest, request.url));
        return applySecurityHeaders(response);
      }

      // All route requirements satisfied — proceed
      break;
    }
  }

  // ── 8. Admin routes: additional check ──
  if (pathname.startsWith("/admin")) {
    const isAdmin =
      userRole === UserSystemRole.ADMIN ||
      userRole === UserSystemRole.SUPER_ADMIN;

    if (!isAdmin) {
      const response = NextResponse.redirect(new URL("/unauthorized", request.url));
      return applySecurityHeaders(response);
    }

    // Super Admin 2FA: if enabled and not yet verified, block even /admin
    // (twoFARequired + !twoFAVerified was already caught above, but double-check)
    if (
      userRole === UserSystemRole.SUPER_ADMIN &&
      (token.twoFAEnabled as boolean) &&
      !twoFAVerified
    ) {
      const response = NextResponse.redirect(new URL("/login/2fa?admin=1", request.url));
      return applySecurityHeaders(response);
    }
  }

  // ── 9. All checks passed — forward request with security headers ──
  const response = NextResponse.next();
  return applySecurityHeaders(response);
}

// ─────────────────────────────────────────────────────────
// Matcher: run middleware on all routes except static assets
// ─────────────────────────────────────────────────────────

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static  (static files)
     * - _next/image   (image optimization)
     * - favicon.ico
     * - Any file with an extension (.png, .jpg, .svg, etc.)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|woff|woff2|ttf|eot)).*)",
  ],
};
