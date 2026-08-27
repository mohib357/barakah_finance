// ═══════════════════════════════════════════════════════════
//  BARAKAH FINANCE — RBAC Permission Matrix
// ═══════════════════════════════════════════════════════════

import { UserSystemRole } from "@/types/enums";

// ── Module identifiers ───────────────────────────────────────
export const MODULES = {
  DASHBOARD:       "dashboard",
  MEMBERS:         "members",
  CUSTOMERS:       "customers",
  PRODUCTS:        "products",
  ORDERS:          "orders",
  INSTALLMENTS:    "installments",
  PAYMENTS:        "payments",
  RECEIPTS:        "receipts",
  SAVINGS:         "savings",
  INVESTMENT:      "investment",
  PROJECTS:        "projects",
  ASSETS:          "assets",
  QARD:            "qard",
  CHARITY:         "charity",
  ACCOUNTS:        "accounts",
  EXPENSES:        "expenses",
  REPORTS:         "reports",
  PROFIT:          "profit",
  WITHDRAWALS:     "withdrawals",
  LEDGER:          "ledger",
  FUND_TRANSFERS:  "fund_transfers",
  NOTICES:         "notices",
  BADGES:          "badges",
  REVIEWS:         "reviews",
  POSTS:           "posts",
  GALLERY:         "gallery",
  WEBSITE_CONTENT: "website_content",
  SMS:             "sms",
  NOTIFICATIONS:   "notifications",
  COMMITTEE:       "committee",
  KYC:             "kyc",
  DOCUMENTS:       "documents",
  USERS:           "users",
  ROLES:           "roles",
  PERMISSIONS:     "permissions",
  AUDIT_LOGS:      "audit_logs",
  BACKUP:          "backup",
  SETTINGS:        "settings",
  ACTIVITY_LOG:    "activity_log",
} as const;

export type Module = (typeof MODULES)[keyof typeof MODULES];

// ── Action identifiers ───────────────────────────────────────
export const ACTIONS = {
  VIEW:    "view",
  CREATE:  "create",
  EDIT:    "edit",
  SUBMIT:  "submit",
  APPROVE: "approve",
  REJECT:  "reject",
  CANCEL:  "cancel",
  REVERSE: "reverse",
  DELETE:  "delete",
  EXPORT:  "export",
  PRINT:   "print",
  MANAGE:  "manage",
} as const;

export type Action = (typeof ACTIONS)[keyof typeof ACTIONS];

export interface Permission {
  module: Module;
  action: Action;
}

export function permKey(module: Module, action: Action): string {
  return `${module}:${action}`;
}

type PermissionSet = Partial<Record<Module, Action[]>>;

// ── Role defaults ────────────────────────────────────────────
export const ROLE_DEFAULT_PERMISSIONS: Record<UserSystemRole, PermissionSet> = {
  USER: {
    [MODULES.DASHBOARD]:    [ACTIONS.VIEW],
    [MODULES.PRODUCTS]:     [ACTIONS.VIEW],
    [MODULES.REVIEWS]:      [ACTIONS.CREATE],
    [MODULES.POSTS]:        [ACTIONS.VIEW],
    [MODULES.GALLERY]:      [ACTIONS.VIEW],
    [MODULES.NOTIFICATIONS]:[ACTIONS.VIEW],
  },
  WITNESS: {
    [MODULES.DASHBOARD]:    [ACTIONS.VIEW],
    [MODULES.PRODUCTS]:     [ACTIONS.VIEW],
    [MODULES.NOTIFICATIONS]:[ACTIONS.VIEW],
  },
  GUARANTOR: {
    [MODULES.DASHBOARD]:    [ACTIONS.VIEW],
    [MODULES.CUSTOMERS]:    [ACTIONS.VIEW],
    [MODULES.ORDERS]:       [ACTIONS.VIEW],
    [MODULES.INSTALLMENTS]: [ACTIONS.VIEW],
    [MODULES.PRODUCTS]:     [ACTIONS.VIEW],
    [MODULES.NOTIFICATIONS]:[ACTIONS.VIEW],
  },
  CUSTOMER: {
    [MODULES.DASHBOARD]:    [ACTIONS.VIEW],
    [MODULES.ORDERS]:       [ACTIONS.VIEW, ACTIONS.SUBMIT],
    [MODULES.INSTALLMENTS]: [ACTIONS.VIEW],
    [MODULES.PRODUCTS]:     [ACTIONS.VIEW],
    [MODULES.PAYMENTS]:     [ACTIONS.VIEW],
    [MODULES.RECEIPTS]:     [ACTIONS.VIEW, ACTIONS.PRINT],
    [MODULES.NOTIFICATIONS]:[ACTIONS.VIEW],
  },
  INVESTOR: {
    [MODULES.DASHBOARD]:    [ACTIONS.VIEW],
    [MODULES.INVESTMENT]:   [ACTIONS.VIEW, ACTIONS.SUBMIT],
    [MODULES.PROJECTS]:     [ACTIONS.VIEW],
    [MODULES.PROFIT]:       [ACTIONS.VIEW],
    [MODULES.SAVINGS]:      [ACTIONS.VIEW],
    [MODULES.WITHDRAWALS]:  [ACTIONS.VIEW, ACTIONS.SUBMIT],
    [MODULES.NOTIFICATIONS]:[ACTIONS.VIEW],
  },
  MEMBER: {
    [MODULES.DASHBOARD]:    [ACTIONS.VIEW],
    [MODULES.SAVINGS]:      [ACTIONS.VIEW],
    [MODULES.INVESTMENT]:   [ACTIONS.VIEW, ACTIONS.SUBMIT],
    [MODULES.ORDERS]:       [ACTIONS.VIEW, ACTIONS.SUBMIT],
    [MODULES.INSTALLMENTS]: [ACTIONS.VIEW],
    [MODULES.PAYMENTS]:     [ACTIONS.VIEW],
    [MODULES.RECEIPTS]:     [ACTIONS.VIEW, ACTIONS.PRINT],
    [MODULES.QARD]:         [ACTIONS.VIEW, ACTIONS.SUBMIT],
    [MODULES.PROFIT]:       [ACTIONS.VIEW],
    [MODULES.PROJECTS]:     [ACTIONS.VIEW],
    [MODULES.WITHDRAWALS]:  [ACTIONS.VIEW, ACTIONS.SUBMIT],
    [MODULES.KYC]:          [ACTIONS.VIEW, ACTIONS.SUBMIT],
    [MODULES.PRODUCTS]:     [ACTIONS.VIEW],
    [MODULES.REVIEWS]:      [ACTIONS.CREATE],
    [MODULES.POSTS]:        [ACTIONS.VIEW],
    [MODULES.GALLERY]:      [ACTIONS.VIEW],
    [MODULES.NOTIFICATIONS]:[ACTIONS.VIEW],
  },
  STAFF: {
    [MODULES.DASHBOARD]:    [ACTIONS.VIEW],
    [MODULES.MEMBERS]:      [ACTIONS.VIEW, ACTIONS.CREATE, ACTIONS.EDIT],
    [MODULES.CUSTOMERS]:    [ACTIONS.VIEW, ACTIONS.CREATE, ACTIONS.EDIT],
    [MODULES.ORDERS]:       [ACTIONS.VIEW, ACTIONS.CREATE],
    [MODULES.INSTALLMENTS]: [ACTIONS.VIEW],
    [MODULES.PAYMENTS]:     [ACTIONS.VIEW, ACTIONS.CREATE],
    [MODULES.RECEIPTS]:     [ACTIONS.VIEW, ACTIONS.PRINT],
    [MODULES.SAVINGS]:      [ACTIONS.VIEW, ACTIONS.CREATE],
    [MODULES.QARD]:         [ACTIONS.VIEW],
    [MODULES.PRODUCTS]:     [ACTIONS.VIEW],
    [MODULES.REPORTS]:      [ACTIONS.VIEW, ACTIONS.EXPORT, ACTIONS.PRINT],
    [MODULES.SMS]:          [ACTIONS.VIEW, ACTIONS.CREATE],
    [MODULES.KYC]:          [ACTIONS.VIEW, ACTIONS.EDIT],
    [MODULES.NOTIFICATIONS]:[ACTIONS.VIEW],
    [MODULES.ACTIVITY_LOG]: [ACTIONS.VIEW],
  },
  ADMIN: {
    [MODULES.DASHBOARD]:       [ACTIONS.VIEW, ACTIONS.MANAGE],
    [MODULES.MEMBERS]:         [ACTIONS.VIEW, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.APPROVE, ACTIONS.REJECT, ACTIONS.EXPORT, ACTIONS.PRINT],
    [MODULES.CUSTOMERS]:       [ACTIONS.VIEW, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.APPROVE, ACTIONS.REJECT, ACTIONS.EXPORT, ACTIONS.PRINT],
    [MODULES.PRODUCTS]:        [ACTIONS.VIEW, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.DELETE, ACTIONS.EXPORT],
    [MODULES.ORDERS]:          [ACTIONS.VIEW, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.APPROVE, ACTIONS.REJECT, ACTIONS.CANCEL, ACTIONS.EXPORT, ACTIONS.PRINT],
    [MODULES.INSTALLMENTS]:    [ACTIONS.VIEW, ACTIONS.EDIT, ACTIONS.EXPORT, ACTIONS.PRINT],
    [MODULES.PAYMENTS]:        [ACTIONS.VIEW, ACTIONS.CREATE, ACTIONS.REVERSE, ACTIONS.EXPORT, ACTIONS.PRINT],
    [MODULES.RECEIPTS]:        [ACTIONS.VIEW, ACTIONS.PRINT, ACTIONS.CANCEL],
    [MODULES.SAVINGS]:         [ACTIONS.VIEW, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.EXPORT, ACTIONS.PRINT],
    [MODULES.INVESTMENT]:      [ACTIONS.VIEW, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.APPROVE],
    [MODULES.PROJECTS]:        [ACTIONS.VIEW, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.MANAGE],
    [MODULES.ASSETS]:          [ACTIONS.VIEW, ACTIONS.CREATE, ACTIONS.EDIT],
    [MODULES.QARD]:            [ACTIONS.VIEW, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.APPROVE, ACTIONS.REJECT, ACTIONS.EXPORT, ACTIONS.PRINT],
    [MODULES.CHARITY]:         [ACTIONS.VIEW, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.APPROVE, ACTIONS.EXPORT],
    [MODULES.ACCOUNTS]:        [ACTIONS.VIEW, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.REVERSE, ACTIONS.EXPORT, ACTIONS.PRINT],
    [MODULES.EXPENSES]:        [ACTIONS.VIEW, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.DELETE, ACTIONS.EXPORT],
    [MODULES.REPORTS]:         [ACTIONS.VIEW, ACTIONS.EXPORT, ACTIONS.PRINT],
    [MODULES.PROFIT]:          [ACTIONS.VIEW, ACTIONS.CREATE, ACTIONS.MANAGE],
    [MODULES.WITHDRAWALS]:     [ACTIONS.VIEW, ACTIONS.APPROVE, ACTIONS.REJECT],
    [MODULES.LEDGER]:          [ACTIONS.VIEW, ACTIONS.EXPORT],
    [MODULES.FUND_TRANSFERS]:  [ACTIONS.VIEW, ACTIONS.CREATE],
    [MODULES.NOTICES]:         [ACTIONS.VIEW, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.DELETE],
    [MODULES.BADGES]:          [ACTIONS.VIEW, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.DELETE],
    [MODULES.REVIEWS]:         [ACTIONS.VIEW, ACTIONS.APPROVE, ACTIONS.REJECT, ACTIONS.DELETE],
    [MODULES.POSTS]:           [ACTIONS.VIEW, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.DELETE],
    [MODULES.GALLERY]:         [ACTIONS.VIEW, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.DELETE],
    [MODULES.WEBSITE_CONTENT]: [ACTIONS.VIEW, ACTIONS.EDIT],
    [MODULES.SMS]:             [ACTIONS.VIEW, ACTIONS.CREATE, ACTIONS.MANAGE],
    [MODULES.NOTIFICATIONS]:   [ACTIONS.VIEW, ACTIONS.CREATE],
    [MODULES.COMMITTEE]:       [ACTIONS.VIEW, ACTIONS.CREATE, ACTIONS.EDIT],
    [MODULES.KYC]:             [ACTIONS.VIEW, ACTIONS.EDIT, ACTIONS.APPROVE, ACTIONS.REJECT],
    [MODULES.DOCUMENTS]:       [ACTIONS.VIEW, ACTIONS.CREATE],
    [MODULES.USERS]:           [ACTIONS.VIEW, ACTIONS.EDIT],
    [MODULES.AUDIT_LOGS]:      [ACTIONS.VIEW],
    [MODULES.ACTIVITY_LOG]:    [ACTIONS.VIEW],
    [MODULES.BACKUP]:          [ACTIONS.VIEW],
  },
  SUPER_ADMIN: Object.fromEntries(
    Object.values(MODULES).map((mod) => [mod, Object.values(ACTIONS)])
  ) as PermissionSet,
};

export function roleHasPermission(role: UserSystemRole, module: Module, action: Action): boolean {
  if (role === UserSystemRole.SUPER_ADMIN) return true;
  const actions = ROLE_DEFAULT_PERMISSIONS[role]?.[module];
  return actions?.includes(action) ?? false;
}

// Re-export role hierarchy so other modules can import from here
export { ROLE_HIERARCHY } from "@/lib/constants/roles";

export function getDefaultPermissionsForRole(role: UserSystemRole): Permission[] {
  if (role === UserSystemRole.SUPER_ADMIN) {
    return Object.values(MODULES).flatMap((mod) =>
      Object.values(ACTIONS).map((act) => ({ module: mod as Module, action: act as Action }))
    );
  }
  const set = ROLE_DEFAULT_PERMISSIONS[role] ?? {};
  return Object.entries(set).flatMap(([mod, actions]) =>
    (actions ?? []).map((act) => ({ module: mod as Module, action: act as Action }))
  );
}

export const ADMIN_ONLY_MODULES: Module[] = [
  MODULES.AUDIT_LOGS,
  MODULES.BACKUP,
  MODULES.SETTINGS,
  MODULES.PERMISSIONS,
  MODULES.ROLES,
  MODULES.ACTIVITY_LOG,
];

export const ROUTE_PERMISSION_MAP: Array<{
  pathPrefix: string;
  requiredRole: UserSystemRole;
  requireVerified?: boolean;
}> = [
  { pathPrefix: "/dashboard", requiredRole: UserSystemRole.USER,  requireVerified: true },
  { pathPrefix: "/profile",   requiredRole: UserSystemRole.USER,  requireVerified: true },
  { pathPrefix: "/apply",     requiredRole: UserSystemRole.USER,  requireVerified: true },
  { pathPrefix: "/shop",      requiredRole: UserSystemRole.USER,  requireVerified: true },
  { pathPrefix: "/admin",     requiredRole: UserSystemRole.ADMIN, requireVerified: true },
];
