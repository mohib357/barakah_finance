// ═══════════════════════════════════════════════════════════
//  BARAKAH FINANCE — Global Audit Log Service
//
//  Spec (Website.txt):
//  • Every significant action logged: User, Action, Module,
//    Record ID, Old Value, New Value, Reason, IP, Device, Time
//  • Audit Log cannot be deleted or edited by ANY admin
//  • Only Super Admin can VIEW audit log
//  • Used for financial reconciliation, security review,
//    and compliance
// ═══════════════════════════════════════════════════════════

import prisma from "@/lib/db/prisma";
import { AuditAction } from "@/types/enums";
import { headers } from "next/headers";

// ─────────────────────────────────────────────────────────────
// Core audit log writer
// ─────────────────────────────────────────────────────────────

export interface AuditParams {
  userId?:    string;
  action:     AuditAction | string;
  module:     string;
  recordId?:  string;
  oldValue?:  Record<string, unknown>;
  newValue?:  Record<string, unknown>;
  reason?:    string;
  ipAddress?: string;
  userAgent?: string;
}

export async function writeAuditLog(params: AuditParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId:    params.userId    ?? null,
        action:    params.action    as never,
        module:    params.module,
        recordId:  params.recordId  ?? null,
        oldValue:  params.oldValue  ?? null,
        newValue:  params.newValue  ?? null,
        reason:    params.reason    ?? null,
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
      },
    });
  } catch (err) {
    // Audit failures must not block the main operation — log to stderr
    console.error("[AuditLog] Failed to write audit entry:", err);
  }
}

// ─────────────────────────────────────────────────────────────
// Extract request metadata for audit (IP, UserAgent)
// Call from inside a Next.js Server Action or Route Handler
// ─────────────────────────────────────────────────────────────

export function getRequestMeta(): { ipAddress: string | null; userAgent: string | null } {
  try {
    const h = headers();
    const ip = (
      h.get("x-forwarded-for")?.split(",")[0].trim() ??
      h.get("x-real-ip") ??
      null
    );
    const ua = h.get("user-agent") ?? null;
    return { ipAddress: ip, userAgent: ua };
  } catch {
    return { ipAddress: null, userAgent: null };
  }
}

// ─────────────────────────────────────────────────────────────
// Activity Feed writer (real-time monitor — short retention)
// ─────────────────────────────────────────────────────────────

export async function writeActivity(params: {
  userId?:   string;
  userName?: string;
  action:    string;
  module:    string;
  detail?:   string;
  ipAddress?:string;
}): Promise<void> {
  try {
    await prisma.activityFeed.create({
      data: {
        userId:    params.userId    ?? null,
        userName:  params.userName  ?? null,
        action:    params.action,
        module:    params.module,
        detail:    params.detail    ?? null,
        ipAddress: params.ipAddress ?? null,
      },
    });

    // Prune old activity feed entries (keep last 500)
    const count = await prisma.activityFeed.count();
    if (count > 600) {
      const oldest = await prisma.activityFeed.findMany({
        orderBy: { createdAt: "asc" },
        take:    count - 500,
        select:  { id: true },
      });
      await prisma.activityFeed.deleteMany({
        where: { id: { in: oldest.map((o) => o.id) } },
      });
    }
  } catch (err) {
    console.error("[ActivityFeed] Failed to write entry:", err);
  }
}

// ─────────────────────────────────────────────────────────────
// Query audit log (Super Admin only — enforced at API level)
// ─────────────────────────────────────────────────────────────

export interface AuditLogFilter {
  userId?:   string;
  module?:   string;
  action?:   string;
  recordId?: string;
  from?:     Date;
  to?:       Date;
  page?:     number;
  limit?:    number;
}

export async function queryAuditLog(filter: AuditLogFilter) {
  const {
    userId, module, action, recordId,
    from, to,
    page  = 1,
    limit = 50,
  } = filter;

  const where = {
    ...(userId   ? { userId }   : {}),
    ...(module   ? { module }   : {}),
    ...(action   ? { action: action as never } : {}),
    ...(recordId ? { recordId } : {}),
    ...(from && to ? { createdAt: { gte: from, lte: to } } : {}),
  };

  const [entries, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip:    (page - 1) * limit,
      take:    limit,
      include: {
        user: { select: { firstName: true, lastName: true, username: true } },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { entries, total, page, limit, pages: Math.ceil(total / limit) };
}

// ─────────────────────────────────────────────────────────────
// Query live activity feed
// ─────────────────────────────────────────────────────────────

export async function queryActivityFeed(limit = 50) {
  return prisma.activityFeed.findMany({
    orderBy: { createdAt: "desc" },
    take:    limit,
  });
}
