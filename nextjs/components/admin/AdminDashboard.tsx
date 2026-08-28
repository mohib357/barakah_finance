"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { cn, formatMoney, toBengaliDigits } from "@/lib/utils/cn";
import { Spinner } from "@/components/ui/Spinner";
import { UserSystemRole } from "@/types/enums";

// ── Types ──────────────────────────────────────────────────
interface DashStats {
  totalMembers: number; totalUsers: number;
  pendingApplications: number; pendingKYC: number;
  activeOrders: number; overdueInstallments: number;
  activeQard: number; pendingQard: number;
  lowStockProducts: number; totalIncome: number;
  totalExpense: number; netBalance: number;
  pendingReviews: number; totalSavings: number;
}
interface PendingActions { membership: number; kyc: number; qard: number; overdue: number; lowStock: number; reviews: number; }
interface Activity { action: string; module: string; detail?: string | null; userName?: string | null; createdAt: string; }

interface Props {
  user: { firstName: string; lastName?: string | null; systemRole: UserSystemRole; id: string; };
}

export default function AdminDashboard({ user }: Props) {
  const [stats,   setStats]   = useState<DashStats | null>(null);
  const [pending, setPending] = useState<PendingActions | null>(null);
  const [activity,setActivity]= useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setTick] = useState(0);

  async function load() {
    try {
      const res = await fetch("/api/dashboard/stats");
      if (!res.ok) return;
      const d = await res.json();
      setStats(d.stats);
      setPending(d.pendingActions);
      setActivity(d.recentActivity ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // Auto-refresh every 30 seconds
    const iv = setInterval(() => { load(); setTick((p) => p + 1); }, 30_000);
    return () => clearInterval(iv);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#FDFAF3]">
      <Spinner size="lg" />
    </div>
  );

  const isSuperAdmin = user.systemRole === UserSystemRole.SUPER_ADMIN;
  const totalPending = pending ? Object.values(pending).reduce((a, b) => a + b, 0) : 0;

  return (
    <div className="min-h-screen bg-[#FDFAF3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#0D2B1A]">
              স্বাগতম, {user.firstName}!
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {isSuperAdmin ? "Super Admin" : "Admin"} · ড্যাশবোর্ড সারসংক্ষেপ
            </p>
          </div>
          <button
            onClick={load}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            🔄 রিফ্রেশ
          </button>
        </div>

        {/* ── Priority Alert Queue ── */}
        {pending && totalPending > 0 && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <h2 className="font-bold text-amber-800 text-sm mb-3 flex items-center gap-2">
              ⚠️ মুলতবি কার্যক্রম ({toBengaliDigits(totalPending)}টি)
            </h2>
            <div className="flex flex-wrap gap-3">
              {pending.membership > 0 && (
                <AlertBadge href="/admin/members" count={pending.membership} label="সদস্য আবেদন" color="bg-blue-100 text-blue-700 border-blue-200" />
              )}
              {pending.kyc > 0 && (
                <AlertBadge href="/admin/members" count={pending.kyc} label="KYC যাচাই" color="bg-purple-100 text-purple-700 border-purple-200" />
              )}
              {pending.qard > 0 && (
                <AlertBadge href="/admin/qard" count={pending.qard} label="করজ আবেদন" color="bg-teal-100 text-teal-700 border-teal-200" />
              )}
              {pending.overdue > 0 && (
                <AlertBadge href="/admin/orders" count={pending.overdue} label="মেয়াদোত্তীর্ণ কিস্তি" color="bg-red-100 text-red-700 border-red-200" />
              )}
              {pending.lowStock > 0 && (
                <AlertBadge href="/admin/products" count={pending.lowStock} label="কম স্টক" color="bg-orange-100 text-orange-700 border-orange-200" />
              )}
              {pending.reviews > 0 && (
                <AlertBadge href="/admin/reviews" count={pending.reviews} label="রিভিউ" color="bg-gray-100 text-gray-700 border-gray-200" />
              )}
            </div>
          </div>
        )}

        {/* ── Financial KPI Row ── */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            <StatCard icon="💰" label="মোট আয়"       value={formatMoney(stats.totalIncome)}  color="text-green-600" bg="bg-green-50" />
            <StatCard icon="📤" label="মোট ব্যয়"      value={formatMoney(stats.totalExpense)} color="text-red-600"   bg="bg-red-50"   />
            <StatCard icon="🏦" label="নেট ব্যালেন্স" value={formatMoney(stats.netBalance)}   color={stats.netBalance >= 0 ? "text-blue-600" : "text-red-600"} bg="bg-blue-50" />
            <StatCard icon="💸" label="মোট সঞ্চয়"     value={formatMoney(stats.totalSavings)} color="text-[#1D9E75]"  bg="bg-[#E1F5EE]" />
          </div>
        )}

        {/* ── Operational KPIs ── */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            <MiniStat icon="👥" label="সক্রিয় সদস্য"  value={stats.totalMembers}    href="/admin/members"  />
            <MiniStat icon="📦" label="চলমান অর্ডার"  value={stats.activeOrders}    href="/admin/orders"   />
            <MiniStat icon="🤝" label="সক্রিয় করজ"   value={stats.activeQard}      href="/admin/qard"     />
            <MiniStat icon="👤" label="মোট ব্যবহারকারী" value={stats.totalUsers}   href="/admin/members"  />
            <MiniStat icon="⏰" label="মেয়াদোত্তীর্ণ" value={stats.overdueInstallments} href="/admin/orders" danger={stats.overdueInstallments > 0} />
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* ── Quick Actions ── */}
          <div className="lg:col-span-1">
            <h2 className="font-bold text-[#0D2B1A] text-sm mb-3">দ্রুত কার্যক্রম</h2>
            <div className="space-y-2">
              {QUICK_ACTIONS.map((a) => (
                <Link
                  key={a.href}
                  href={a.href}
                  className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 hover:shadow-sm hover:border-[#1D9E75]/30 transition-all group"
                >
                  <span className="text-xl">{a.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#0D2B1A] group-hover:text-[#1D9E75] transition-colors">{a.label}</p>
                    <p className="text-xs text-gray-400">{a.desc}</p>
                  </div>
                  <span className="text-gray-300 group-hover:text-[#1D9E75] transition-colors">→</span>
                </Link>
              ))}
            </div>
          </div>

          {/* ── Live Activity Feed ── */}
          <div className="lg:col-span-2">
            <h2 className="font-bold text-[#0D2B1A] text-sm mb-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              লাইভ কার্যক্রম
            </h2>
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
              {activity.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">কোনো কার্যক্রম নেই।</div>
              ) : (
                <div className="divide-y divide-gray-50 max-h-[420px] overflow-y-auto">
                  {activity.map((a, i) => (
                    <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50/50">
                      <span className="text-base mt-0.5">{MODULE_ICONS[a.module] ?? "📋"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#0D2B1A]">
                          {a.userName ?? "System"} · <span className="text-[#1D9E75]">{a.action.replace(/_/g, " ")}</span>
                        </p>
                        {a.detail && <p className="text-xs text-gray-500 truncate mt-0.5">{a.detail}</p>}
                      </div>
                      <span className="text-[10px] text-gray-400 shrink-0 mt-0.5">
                        {new Date(a.createdAt).toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Module Navigation Grid ── */}
        <div className="mt-8">
          <h2 className="font-bold text-[#0D2B1A] text-sm mb-3">সকল মডিউল</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {MODULES.map((m) => (
              <Link
                key={m.href}
                href={m.href}
                className="flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white p-4 text-center hover:shadow-md hover:border-[#1D9E75]/40 transition-all"
              >
                <span className="text-3xl">{m.icon}</span>
                <span className="text-xs font-semibold text-[#0D2B1A]">{m.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────

function StatCard({ icon, label, value, color, bg }: { icon: string; label: string; value: string; color: string; bg: string }) {
  return (
    <div className={cn("rounded-2xl border border-gray-100 bg-white shadow-sm p-4 flex items-center gap-3")}>
      <div className={cn("text-2xl w-11 h-11 rounded-xl flex items-center justify-center shrink-0", bg)}>{icon}</div>
      <div>
        <div className={cn("font-bold text-base", color)}>{value}</div>
        <div className="text-xs text-gray-500">{label}</div>
      </div>
    </div>
  );
}

function MiniStat({ icon, label, value, href, danger }: { icon: string; label: string; value: number; href: string; danger?: boolean }) {
  return (
    <Link href={href} className={cn(
      "rounded-2xl border bg-white shadow-sm p-4 text-center hover:shadow-md transition-all",
      danger && value > 0 ? "border-red-200 bg-red-50" : "border-gray-100"
    )}>
      <div className="text-2xl mb-1">{icon}</div>
      <div className={cn("text-xl font-bold", danger && value > 0 ? "text-red-600" : "text-[#0D2B1A]")}>
        {toBengaliDigits(value)}
      </div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </Link>
  );
}

function AlertBadge({ href, count, label, color }: { href: string; count: number; label: string; color: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold hover:opacity-80 transition-opacity", color)}>
      <span className="font-bold">{toBengaliDigits(count)}</span>
      <span>{label}</span>
    </Link>
  );
}

// ── Data ─────────────────────────────────────────────────────

const MODULE_ICONS: Record<string, string> = {
  members: "👥", orders: "📦", qard: "🤝", accounts: "💼",
  products: "🛒", sms: "📱", committee: "🏛️", audit: "📋",
};

const QUICK_ACTIONS = [
  { href: "/admin/accounts",   icon: "💰", label: "পেমেন্ট সংগ্রহ",      desc: "সদস্য/ক্লাইন্ট পেমেন্ট নিন" },
  { href: "/admin/orders",     icon: "📦", label: "অর্ডার অনুমোদন",      desc: "পেন্ডিং অর্ডার দেখুন" },
  { href: "/admin/qard",       icon: "🤝", label: "করজ অনুমোদন",        desc: "কমিটি পর্যালোচনা" },
  { href: "/admin/members",    icon: "👥", label: "সদস্য আবেদন",         desc: "নতুন আবেদন পর্যালোচনা" },
  { href: "/admin/sms",        icon: "📱", label: "SMS পাঠান",            desc: "গ্রুপ বা ব্যক্তিগত" },
  { href: "/admin/audit-logs", icon: "📋", label: "অডিট লগ",             desc: "সকল কার্যক্রম দেখুন" },
];

const MODULES = [
  { href: "/admin/accounts",   icon: "💼", label: "হিসাব" },
  { href: "/admin/members",    icon: "👥", label: "সদস্য" },
  { href: "/admin/orders",     icon: "📦", label: "অর্ডার" },
  { href: "/admin/qard",       icon: "🤝", label: "করজ" },
  { href: "/admin/products",   icon: "🛒", label: "পণ্য" },
  { href: "/admin/sms",        icon: "📱", label: "SMS" },
  { href: "/admin/committee",  icon: "🏛️", label: "কমিটি" },
  { href: "/admin/audit-logs", icon: "📋", label: "অডিট" },
  { href: "/admin/accounts",   icon: "📊", label: "রিপোর্ট" },
  { href: "/",                 icon: "🌐", label: "মূল সাইট" },
];
