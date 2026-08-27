// ═══════════════════════════════════════════════════════════
//  BARAKAH FINANCE — Application Enums
//
//  These mirror the Prisma schema enums exactly.
//  We define them here as TypeScript const objects so they
//  work at compile-time without a live database connection
//  (Prisma only exports enums after `prisma generate` with
//  a reachable database engine).
//
//  Usage:
//    import { UserSystemRole } from "@/types/enums";
//    if (role === UserSystemRole.SUPER_ADMIN) { ... }
// ═══════════════════════════════════════════════════════════

// ── User roles ──────────────────────────────────────────────
export const UserSystemRole = {
  USER:        "USER",
  MEMBER:      "MEMBER",
  CUSTOMER:    "CUSTOMER",
  INVESTOR:    "INVESTOR",
  GUARANTOR:   "GUARANTOR",
  WITNESS:     "WITNESS",
  STAFF:       "STAFF",
  ADMIN:       "ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
} as const;
export type UserSystemRole = (typeof UserSystemRole)[keyof typeof UserSystemRole];

// ── Demographics ─────────────────────────────────────────────
export const Gender = {
  MALE:   "MALE",
  FEMALE: "FEMALE",
  OTHER:  "OTHER",
} as const;
export type Gender = (typeof Gender)[keyof typeof Gender];

export const Religion = {
  ISLAM:       "ISLAM",
  HINDUISM:    "HINDUISM",
  CHRISTIANITY:"CHRISTIANITY",
  BUDDHISM:    "BUDDHISM",
  OTHER:       "OTHER",
} as const;
export type Religion = (typeof Religion)[keyof typeof Religion];

export const BloodGroup = {
  A_POSITIVE:  "A_POSITIVE",
  A_NEGATIVE:  "A_NEGATIVE",
  B_POSITIVE:  "B_POSITIVE",
  B_NEGATIVE:  "B_NEGATIVE",
  AB_POSITIVE: "AB_POSITIVE",
  AB_NEGATIVE: "AB_NEGATIVE",
  O_POSITIVE:  "O_POSITIVE",
  O_NEGATIVE:  "O_NEGATIVE",
  UNKNOWN:     "UNKNOWN",
} as const;
export type BloodGroup = (typeof BloodGroup)[keyof typeof BloodGroup];

// ── Application lifecycle ────────────────────────────────────
export const ApplicationStatus = {
  DRAFT:           "DRAFT",
  PENDING:         "PENDING",
  UNDER_REVIEW:    "UNDER_REVIEW",
  APPROVED:        "APPROVED",
  REJECTED:        "REJECTED",
  CANCELLED:       "CANCELLED",
  PAYMENT_PENDING: "PAYMENT_PENDING",
  COMPLETED:       "COMPLETED",
} as const;
export type ApplicationStatus = (typeof ApplicationStatus)[keyof typeof ApplicationStatus];

// ── Payments ─────────────────────────────────────────────────
export const PaymentStatus = {
  PENDING:       "PENDING",
  INITIATED:     "INITIATED",
  PAID:          "PAID",
  PARTIALLY_PAID:"PARTIALLY_PAID",
  FAILED:        "FAILED",
  CANCELLED:     "CANCELLED",
  REFUNDED:      "REFUNDED",
  REVERSED:      "REVERSED",
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const PaymentMethod = {
  CASH:           "CASH",
  BANK_TRANSFER:  "BANK_TRANSFER",
  BKASH:          "BKASH",
  NAGAD:          "NAGAD",
  ROCKET:         "ROCKET",
  CARD:           "CARD",
  ONLINE_GATEWAY: "ONLINE_GATEWAY",
  OTHER:          "OTHER",
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

// ── Installments ─────────────────────────────────────────────
export const InstallmentStatus = {
  UPCOMING:      "UPCOMING",
  DUE:           "DUE",
  PARTIALLY_PAID:"PARTIALLY_PAID",
  PAID:          "PAID",
  OVERDUE:       "OVERDUE",
  WAIVED:        "WAIVED",
  CANCELLED:     "CANCELLED",
} as const;
export type InstallmentStatus = (typeof InstallmentStatus)[keyof typeof InstallmentStatus];

// ── Qard ─────────────────────────────────────────────────────
export const QardStatus = {
  APPLIED:        "APPLIED",
  UNDER_REVIEW:   "UNDER_REVIEW",
  APPROVED:       "APPROVED",
  REJECTED:       "REJECTED",
  DISBURSED:      "DISBURSED",
  ACTIVE:         "ACTIVE",
  PARTIALLY_PAID: "PARTIALLY_PAID",
  OVERDUE:        "OVERDUE",
  COMPLETED:      "COMPLETED",
  CANCELLED:      "CANCELLED",
} as const;
export type QardStatus = (typeof QardStatus)[keyof typeof QardStatus];

// ── KYC ──────────────────────────────────────────────────────
export const KYCStatus = {
  NOT_SUBMITTED:         "NOT_SUBMITTED",
  SUBMITTED:             "SUBMITTED",
  UNDER_REVIEW:          "UNDER_REVIEW",
  VERIFIED:              "VERIFIED",
  REJECTED:              "REJECTED",
  RESUBMISSION_REQUIRED: "RESUBMISSION_REQUIRED",
} as const;
export type KYCStatus = (typeof KYCStatus)[keyof typeof KYCStatus];

// ── Investment types ──────────────────────────────────────────
export const InvestType = {
  MONTHLY_SAVINGS:    "MONTHLY_SAVINGS",
  ONETIME_INVESTMENT: "ONETIME_INVESTMENT",
  PROJECT_INVESTMENT: "PROJECT_INVESTMENT",
} as const;
export type InvestType = (typeof InvestType)[keyof typeof InvestType];

// ── Profit calculation methods ────────────────────────────────
export const ProfitMethod = {
  FULL_COST_BASED: "FULL_COST_BASED",
  FINANCED_AMOUNT: "FINANCED_AMOUNT",
  CUSTOM:          "CUSTOM",
} as const;
export type ProfitMethod = (typeof ProfitMethod)[keyof typeof ProfitMethod];

// ── Fund types ────────────────────────────────────────────────
export const FundType = {
  GENERAL:            "GENERAL",
  INVESTMENT_BUSINESS:"INVESTMENT_BUSINESS",
  QARD_HASANA:        "QARD_HASANA",
  CHARITY:            "CHARITY",
  ORGANIZATION:       "ORGANIZATION",
} as const;
export type FundType = (typeof FundType)[keyof typeof FundType];

// ── Ledger ───────────────────────────────────────────────────
export const LedgerType = {
  INCOME:     "INCOME",
  EXPENSE:    "EXPENSE",
  TRANSFER:   "TRANSFER",
  REVERSAL:   "REVERSAL",
  ADJUSTMENT: "ADJUSTMENT",
} as const;
export type LedgerType = (typeof LedgerType)[keyof typeof LedgerType];

// ── Projects ─────────────────────────────────────────────────
export const ProjectStatus = {
  OPEN:      "OPEN",
  ACTIVE:    "ACTIVE",
  CLOSED:    "CLOSED",
  CANCELLED: "CANCELLED",
} as const;
export type ProjectStatus = (typeof ProjectStatus)[keyof typeof ProjectStatus];

// ── Assets ───────────────────────────────────────────────────
export const AssetStatus = {
  ACTIVE:             "ACTIVE",
  DISPOSED:           "DISPOSED",
  TRANSFERRED:        "TRANSFERRED",
  UNDER_MAINTENANCE:  "UNDER_MAINTENANCE",
} as const;
export type AssetStatus = (typeof AssetStatus)[keyof typeof AssetStatus];

// ── Reviews ──────────────────────────────────────────────────
export const ReviewStatus = {
  PENDING:  "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  HIDDEN:   "HIDDEN",
} as const;
export type ReviewStatus = (typeof ReviewStatus)[keyof typeof ReviewStatus];

// ── Posts ─────────────────────────────────────────────────────
export const PostType = {
  MANUAL:         "MANUAL",
  FACEBOOK_EMBED: "FACEBOOK_EMBED",
  ANNOUNCEMENT:   "ANNOUNCEMENT",
  NEWS:           "NEWS",
} as const;
export type PostType = (typeof PostType)[keyof typeof PostType];

// ── SMS ──────────────────────────────────────────────────────
export const SMSStatus = {
  SENT:    "SENT",
  FAILED:  "FAILED",
  PENDING: "PENDING",
} as const;
export type SMSStatus = (typeof SMSStatus)[keyof typeof SMSStatus];

// ── Receipts ─────────────────────────────────────────────────
export const ReceiptStatus = {
  ISSUED:      "ISSUED",
  CANCELLED:   "CANCELLED",
  INVALIDATED: "INVALIDATED",
} as const;
export type ReceiptStatus = (typeof ReceiptStatus)[keyof typeof ReceiptStatus];

// ── Withdrawals ───────────────────────────────────────────────
export const WithdrawalType = {
  PARTIAL:   "PARTIAL",
  FULL:      "FULL",
  EMERGENCY: "EMERGENCY",
} as const;
export type WithdrawalType = (typeof WithdrawalType)[keyof typeof WithdrawalType];

export const WithdrawalStatus = {
  PENDING:   "PENDING",
  APPROVED:  "APPROVED",
  REJECTED:  "REJECTED",
  PAID:      "PAID",
  CANCELLED: "CANCELLED",
} as const;
export type WithdrawalStatus = (typeof WithdrawalStatus)[keyof typeof WithdrawalStatus];

// ── Committee ─────────────────────────────────────────────────
export const CommitteeStatus = {
  ACTIVE:    "ACTIVE",
  EXPIRED:   "EXPIRED",
  DISSOLVED: "DISSOLVED",
} as const;
export type CommitteeStatus = (typeof CommitteeStatus)[keyof typeof CommitteeStatus];

// ── Notices ───────────────────────────────────────────────────
export const NoticeStyle = {
  NORMAL:  "NORMAL",
  BOLD:    "BOLD",
  ITALIC:  "ITALIC",
  COLORED: "COLORED",
} as const;
export type NoticeStyle = (typeof NoticeStyle)[keyof typeof NoticeStyle];

// ── Audit ─────────────────────────────────────────────────────
export const AuditAction = {
  CREATE:            "CREATE",
  UPDATE:            "UPDATE",
  DELETE:            "DELETE",
  CANCEL:            "CANCEL",
  REVERSE:           "REVERSE",
  APPROVE:           "APPROVE",
  REJECT:            "REJECT",
  LOGIN:             "LOGIN",
  LOGOUT:            "LOGOUT",
  PERMISSION_CHANGE: "PERMISSION_CHANGE",
  SETTING_CHANGE:    "SETTING_CHANGE",
  BACKUP:            "BACKUP",
  RESTORE:           "RESTORE",
  PASSWORD_CHANGE:   "PASSWORD_CHANGE",
  OTP_VERIFY:        "OTP_VERIFY",
  TWO_FA_ENABLE:     "TWO_FA_ENABLE",
  TWO_FA_DISABLE:    "TWO_FA_DISABLE",
} as const;
export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];
