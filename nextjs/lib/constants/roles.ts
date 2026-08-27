// ═══════════════════════════════════════════════════════════
//  BARAKAH FINANCE — Role Definitions
//  Mirrors the UserSystemRole enum in prisma/schema.prisma.
//  Used for type-safe role checks across the entire app.
// ═══════════════════════════════════════════════════════════

import { UserSystemRole } from "@prisma/client";

/** Ordered hierarchy — higher index = higher privilege */
export const ROLE_HIERARCHY: UserSystemRole[] = [
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

/** Human-readable Bangla labels for each role */
export const ROLE_LABELS_BN: Record<UserSystemRole, string> = {
  USER:        "সাধারণ ব্যবহারকারী",
  MEMBER:      "সদস্য",
  CUSTOMER:    "গ্রাহক",
  INVESTOR:    "বিনিয়োগকারী",
  GUARANTOR:   "জামিনদার",
  WITNESS:     "সাক্ষী",
  STAFF:       "কর্মচারী",
  ADMIN:       "অ্যাডমিন",
  SUPER_ADMIN: "সুপার অ্যাডমিন",
};

export const ROLE_LABELS_EN: Record<UserSystemRole, string> = {
  USER:        "User",
  MEMBER:      "Member",
  CUSTOMER:    "Customer",
  INVESTOR:    "Investor",
  GUARANTOR:   "Guarantor",
  WITNESS:     "Witness",
  STAFF:       "Staff",
  ADMIN:       "Admin",
  SUPER_ADMIN: "Super Admin",
};

/** Roles that grant access to any admin panel section */
export const ADMIN_ROLES: UserSystemRole[] = [
  UserSystemRole.ADMIN,
  UserSystemRole.SUPER_ADMIN,
];

/** Roles that grant access to the member dashboard */
export const MEMBER_ROLES: UserSystemRole[] = [
  UserSystemRole.MEMBER,
  UserSystemRole.ADMIN,
  UserSystemRole.SUPER_ADMIN,
];

/** Check whether a role has at least admin-level access */
export function isAdminRole(role: UserSystemRole): boolean {
  return ADMIN_ROLES.includes(role);
}

/** Check whether role A is at least as privileged as role B */
export function hasMinimumRole(
  userRole: UserSystemRole,
  requiredRole: UserSystemRole
): boolean {
  return ROLE_HIERARCHY.indexOf(userRole) >= ROLE_HIERARCHY.indexOf(requiredRole);
}
