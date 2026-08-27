// ═══════════════════════════════════════════════════════════
//  BARAKAH FINANCE — Session & Permission Utilities
//
//  checkPermission()  — resolves effective permission for a user
//                       by merging role defaults + DB overrides
//  getServerSession() — thin re-export for convenience
//  requireSession()   — server-component helper (throws redirect)
// ═══════════════════════════════════════════════════════════

import { getServerSession as _getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/config";
import { UserSystemRole } from "@prisma/client";
import type { Module, Action } from "@/lib/constants/permissions";
import { roleHasPermission } from "@/lib/constants/permissions";
import prisma from "@/lib/db/prisma";

// ─────────────────────────────────────────────────────────
// Types (extend next-auth session with our custom fields)
// ─────────────────────────────────────────────────────────

export interface BFSession {
  user: {
    id:             string;
    username:       string;
    firstName:      string;
    lastName?:      string | null;
    email?:         string | null;
    phone?:         string | null;
    systemRole:     UserSystemRole;
    isVerified:     boolean;
    isActive:       boolean;
    twoFAEnabled:   boolean;
    twoFAVerified?: boolean;   // true = TOTP was checked this session
    profileComplete: number;
    photoUrl?:      string | null;
  };
}

// ─────────────────────────────────────────────────────────
// Typed server session getter
// ─────────────────────────────────────────────────────────

export async function getServerSession(): Promise<BFSession | null> {
  return _getServerSession(authOptions) as Promise<BFSession | null>;
}

// ─────────────────────────────────────────────────────────
// requireSession — use in Server Components / Server Actions
// Redirects to /login if not authenticated.
// ─────────────────────────────────────────────────────────

export async function requireSession(options?: {
  requiredRole?: UserSystemRole;
  requireVerified?: boolean;
}): Promise<BFSession> {
  const session = await getServerSession();

  if (!session?.user) {
    redirect("/login");
  }

  if (options?.requireVerified && !session.user.isVerified) {
    redirect("/verify");
  }

  if (options?.requiredRole) {
    const roleOrder: UserSystemRole[] = [
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
    const userIdx     = roleOrder.indexOf(session.user.systemRole);
    const requiredIdx = roleOrder.indexOf(options.requiredRole);

    if (userIdx < requiredIdx) {
      redirect("/unauthorized");
    }
  }

  return session;
}

// ─────────────────────────────────────────────────────────
// checkPermission
// Resolves the EFFECTIVE permission by:
//   1. Checking role-level defaults
//   2. Applying any UserPermission row overrides from DB
// ─────────────────────────────────────────────────────────

export async function checkPermission(
  userId: string,
  role: UserSystemRole,
  module: Module,
  action: Action
): Promise<boolean> {
  // Super admin always passes
  if (role === UserSystemRole.SUPER_ADMIN) return true;

  // Check DB override first
  const override = await prisma.userPermission.findUnique({
    where: {
      userId_module_action: { userId, module, action },
    },
    select: { isGranted: true },
  });

  if (override !== null) {
    return override.isGranted;
  }

  // Fall back to role defaults
  return roleHasPermission(role, module, action);
}

// ─────────────────────────────────────────────────────────
// getPermissionMap
// Returns all effective permissions for a user as a
// flat Set<"module:action"> for O(1) client-side checks.
// ─────────────────────────────────────────────────────────

export async function getPermissionMap(
  userId: string,
  role: UserSystemRole
): Promise<Set<string>> {
  const set = new Set<string>();

  if (role === UserSystemRole.SUPER_ADMIN) {
    // Super admin has every permission — build full set
    const { MODULES, ACTIONS, permKey } = await import("@/lib/constants/permissions");
    for (const mod of Object.values(MODULES)) {
      for (const act of Object.values(ACTIONS)) {
        set.add(permKey(mod as Module, act as Action));
      }
    }
    return set;
  }

  // Start with role defaults
  const { ROLE_DEFAULT_PERMISSIONS, permKey } = await import("@/lib/constants/permissions");
  const defaults = ROLE_DEFAULT_PERMISSIONS[role] ?? {};
  for (const [mod, actions] of Object.entries(defaults)) {
    for (const act of (actions ?? [])) {
      set.add(permKey(mod as Module, act as Action));
    }
  }

  // Apply DB overrides
  const overrides = await prisma.userPermission.findMany({
    where: { userId },
    select: { module: true, action: true, isGranted: true },
  });

  for (const o of overrides) {
    const key = permKey(o.module as Module, o.action as Action);
    if (o.isGranted) {
      set.add(key);
    } else {
      set.delete(key);
    }
  }

  return set;
}
