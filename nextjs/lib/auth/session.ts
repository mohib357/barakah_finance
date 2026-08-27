// ═══════════════════════════════════════════════════════════
//  BARAKAH FINANCE — Session & Permission Utilities
// ═══════════════════════════════════════════════════════════

import { getServerSession as _getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/config";
import { UserSystemRole } from "@/types/enums";
import type { Module, Action } from "@/lib/constants/permissions";
import { roleHasPermission, ROLE_HIERARCHY } from "@/lib/constants/permissions";
import prisma from "@/lib/db/prisma";

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
    twoFAVerified?: boolean;
    twoFARequired?: boolean;
    profileComplete: number;
    photoUrl?:      string | null;
  };
}

export async function getServerSession(): Promise<BFSession | null> {
  return _getServerSession(authOptions) as Promise<BFSession | null>;
}

export async function requireSession(options?: {
  requiredRole?:   UserSystemRole;
  requireVerified?: boolean;
}): Promise<BFSession> {
  const session = await getServerSession();
  if (!session?.user) redirect("/login");

  if (options?.requireVerified && !session.user.isVerified) redirect("/verify");

  if (options?.requiredRole) {
    const userIdx     = ROLE_HIERARCHY.indexOf(session.user.systemRole);
    const requiredIdx = ROLE_HIERARCHY.indexOf(options.requiredRole);
    if (userIdx < requiredIdx) redirect("/unauthorized");
  }
  return session;
}

export async function checkPermission(
  userId:     string,
  role:       UserSystemRole,
  module:     Module,
  action:     Action,
): Promise<boolean> {
  if (role === UserSystemRole.SUPER_ADMIN) return true;

  const override = await prisma.userPermission.findUnique({
    where: { userId_module_action: { userId, module, action } },
    select: { isGranted: true },
  });
  if (override !== null) return override.isGranted;

  return roleHasPermission(role, module, action);
}

export async function getPermissionMap(
  userId: string,
  role:   UserSystemRole,
): Promise<Set<string>> {
  const { MODULES, ACTIONS, permKey } = await import("@/lib/constants/permissions");
  const set = new Set<string>();

  if (role === UserSystemRole.SUPER_ADMIN) {
    for (const mod of Object.values(MODULES)) {
      for (const act of Object.values(ACTIONS)) {
        set.add(permKey(mod as Module, act as Action));
      }
    }
    return set;
  }

  const { ROLE_DEFAULT_PERMISSIONS } = await import("@/lib/constants/permissions");
  const defaults = ROLE_DEFAULT_PERMISSIONS[role] ?? {};
  for (const [mod, actions] of Object.entries(defaults)) {
    for (const act of (actions ?? [])) {
      set.add(permKey(mod as Module, act as Action));
    }
  }

  const overrides = await prisma.userPermission.findMany({
    where:  { userId },
    select: { module: true, action: true, isGranted: true },
  });
  for (const o of overrides) {
    const key = permKey(o.module as Module, o.action as Action);
    if (o.isGranted) set.add(key);
    else             set.delete(key);
  }
  return set;
}
