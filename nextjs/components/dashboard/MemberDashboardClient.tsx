"use client";
// ═══════════════════════════════════════════════════════════
//  BARAKAH FINANCE — Member Dashboard (Client Component)
//
//  Receives pre-fetched, serialised data from the Server
//  Component in app/dashboard/page.tsx.
//
//  Tabs:
//    সারসংক্ষেপ  — portfolio KPIs + unit stats
//    সঞ্চয়       — monthly savings history
//    কিস্তি      — installment schedule tracker
//    করজ         — Qard-e-Hasana status
//
//  Website.txt spec:
//    "ইউজার তার ব্যক্তিগত প্রোফাইলে কত টাকা জমা করেছে,
//     তার টাকায় কী কী প্রজেক্ট নেওয়া আছে, কত তারিখে কত
//     টাকা জমা করেছে, সামনের কত তারিখে জমা করতে হবে।"
// ═══════════════════════════════════════════════════════════

import { useState } from "react";
import Link from "next/link";
import { cn, formatMoney, toBengaliDigits, formatDate } from "@/lib/utils/cn";
import { UserSystemRole } from "@/types/enums";
import type {
  PortfolioData,
  SavingRow,
  InstallmentRow,
  QardRow,
} from "@/app/dashboard/page";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface Props {
  user: {
    id:              string;
    firstName:       string;
    lastName:        string | null;
    username:        string;
    systemRole:      UserSystemRole;
    profileComplete: number;
    phone:           string | null;
  };
  portfolio:    PortfolioData;
  savings:      SavingRow[];
  installments: InstallmentRow[];
  qards:        QardRow[];
}

type Tab = "overview" | "savings" | "installments" | "qard";

// ─────────────────────────────────────────────────────────────
// Status labels & colours
// ─────────────────────────────────────────────────────────────

const STATUS_BN: Record<string, string> = {
  UPCOMING:       "আসন্ন",
  DUE:            "বাকি",
  PARTIALLY_PAID: "আংশিক",
  PAID:           "পরিশোধিত",
  OVERDUE:        "বকেয়া",
  WAIVED:         "মওকুফ",
  CANCELLED:      "বাতিল",
  APPLIED:        "আবেদনকৃত",
  UNDER_REVIEW:   "পর্যালোচনায়",
  APPROVED:       "অনুমোদিত",
  REJECTED:       "প্রত্যাখ্যাত",
  DISBURSED:      "বিতরিত",
  ACTIVE:         "সক্রিয়",
  COMPLETED:      "সম্পন্ন",
};

const STATUS_COLOR: Record<string, string> = {
  PAID:           "bg-green-50 text-green-700 border-green-200",
  ACTIVE:         "bg-green-50 text-green-700 border-green-200",
  COMPLETED:      "bg-green-50 text-green-700 border-green-200",
  APPROVED:       "bg-teal-50 text-teal-700 border-teal-200",
  UPCOMING:       "bg-gray-50 text-gray-600 border-gray-200",
  DUE:            "bg-amber-50 text-amber-700 border-amber-200",
  PARTIALLY_PAID: "bg-blue-50 text-blue-700 border-blue-200",
  OVERDUE:        "bg-red-50 text-red-700 border-red-200",
  APPLIED:        "bg-blue-50 text-blue-700 border-blue-200",
  UNDER_REVIEW:   "bg-amber-50 text-amber-700 border-amber-200",
  REJECTED:       "bg-red-50 text-red-700 border-red-200",
  DISBURSED:      "bg-purple-50 text-purple-700 border-purple-200",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn(
      "inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold shrink-0",
      STATUS_COLOR[status] ?? "bg-gray-50 text-gray-500 border-gray-200"
    )}>
      {STATUS_BN[status] ?? status}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────

export default function MemberDashboardClient({
  user,
  portfolio,
  savings,
  installments,
  qards,
}: Props) {
  const [tab, setTab] = useState<Tab>("overview");

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
  const totalDeposit = parseFloat(portfolio.totalDeposit);
  const units        = parseFloat(portfolio.units);
  const profitEarned = parseFloat(portfolio.profitEarned);
  const unitValue    = parseFloat(portfolio.unitValue);

  // Summary stats
  const totalSavingsPaid  = savings.filter((s) => s.status === "PAID").reduce((a, s) => a + s.paidAmount, 0);
  const upcomingDue       = savings.find((s) => s.status === "DUE" || s.status === "UPCOMING");
  const overdueCount      = savings.filter((s) => s.status === "OVERDUE").length;
  const activeInstallments= installments.filter((i) => i.status !== "PAID" && i.status !== "CANCELLED");
  const nextInstallment   = activeInstallments.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];
  const activeQard        = qards.find((q) => q.status === "ACTIVE" || q.status === "DISBURSED");

  const TABS: { key: Tab; label: string; badge?: number }[] = [
    { key: "overview",      label: "সারসংক্ষেপ" },
    { key: "savings",       label: "সঞ্চয়",       badge: overdueCount > 0 ? overdueCount : undefined },
    { key: "installments",  label: "কিস্তি",       badge: activeInstallments.length > 0 ? activeInstallments.length : undefined },
    { key: "qard",          label: "করজ",          badge: activeQard ? 1 : undefined },
  ];

  return (
    <div className="min-h-screen bg-[#FDFAF3]">
      {/* ── Hadith / Quran bar — 70–80px, random on reload (Website.txt spec) ── */}
      <HadithBar />

      {/* ── Header ── */}
      <div className="bg-[#0D2B1A] text-white">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-white/50 uppercase tracking-wider">ড্যাশবোর্ড</p>
            <h1 className="text-xl font-bold mt-0.5" style={{ fontFamily: "'Noto Serif Bengali',serif" }}>
              স্বাগতম, {user.firstName}!
            </h1>
            <p className="text-xs text-white/50 mt-0.5">@{user.username} · {user.systemRole}</p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Profile completion ring */}
            <div className="relative h-14 w-14">
              <svg viewBox="0 0 36 36" className="h-14 w-14 -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2.5"/>
                <circle
                  cx="18" cy="18" r="15.9" fill="none"
                  stroke="#C9A227" strokeWidth="2.5" strokeLinecap="round"
                  strokeDasharray={`${user.profileComplete} ${100 - user.profileComplete}`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[#C9A227]">
                {toBengaliDigits(user.profileComplete)}%
              </div>
            </div>

            <Link href="/apply"
              className="rounded-xl border border-white/20 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 transition-colors whitespace-nowrap"
            >
              📝 আবেদন
            </Link>
          </div>
        </div>

        {/* Alert bar — overdue or next payment */}
        {(overdueCount > 0 || nextInstallment) && (
          <div className="border-t border-white/10">
            <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center gap-2 text-xs">
              {overdueCount > 0 && (
                <span className="rounded-lg bg-red-500/20 border border-red-400/30 px-3 py-1 text-red-200 font-semibold">
                  ⚠️ {toBengaliDigits(overdueCount)}টি বকেয়া সঞ্চয় আছে
                </span>
              )}
              {nextInstallment && (
                <span className="rounded-lg bg-[#C9A227]/20 border border-[#C9A227]/30 px-3 py-1 text-[#F0D78A]">
                  ⏰ পরবর্তী কিস্তি: {formatMoney(nextInstallment.remaining)} —{" "}
                  {formatDate(new Date(nextInstallment.dueDate))}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* ── Tabs ── */}
        <div className="flex gap-1 bg-white border border-gray-100 rounded-xl p-1 mb-6 shadow-sm overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "relative flex-1 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-semibold transition-all",
                tab === t.key
                  ? "bg-[#1D9E75] text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-50"
              )}
            >
              {t.label}
              {t.badge !== undefined && (
                <span className={cn(
                  "absolute -top-1 -right-1 h-4 w-4 rounded-full text-[9px] font-bold flex items-center justify-center",
                  tab === t.key ? "bg-white text-[#1D9E75]" : "bg-red-500 text-white"
                )}>
                  {toBengaliDigits(t.badge)}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ════════ TAB: OVERVIEW ════════ */}
        {tab === "overview" && (
          <div className="space-y-5">
            {/* Unit Portfolio KPI grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <KpiCard
                icon="💰"
                label="মোট সঞ্চয়"
                value={formatMoney(totalDeposit)}
                sub={`${toBengaliDigits(parseFloat(units.toFixed(4)))} ইউনিট`}
                color="text-[#1D9E75]"
              />
              <KpiCard
                icon="📈"
                label="অর্জিত মুনাফা"
                value={formatMoney(profitEarned)}
                sub={profitEarned > 0 ? "বণ্টিত হয়েছে" : "এখনো বণ্টিত হয়নি"}
                color="text-[#C9A227]"
              />
              <KpiCard
                icon="🏦"
                label="মূলধন"
                value={formatMoney(parseFloat(portfolio.principalAmount))}
                sub="সম্পূর্ণ ফেরতযোগ্য"
                color="text-blue-600"
              />
              <KpiCard
                icon="⏱️"
                label="সক্রিয় দিন"
                value={toBengaliDigits(portfolio.activeDays)}
                sub="মূলধন কার্যকর"
                color="text-purple-600"
              />
            </div>

            {/* Unit value info */}
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
              <h2 className="font-bold text-[#0D2B1A] text-sm mb-3 flex items-center gap-2">
                📊 ইউনিট পোর্টফোলিও
              </h2>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <InfoRow label="১ ইউনিটের মূল্য"  value={formatMoney(unitValue)} />
                <InfoRow label="আপনার ইউনিট"       value={`${toBengaliDigits(parseFloat(units.toFixed(4)))} ইউনিট`} />
                <InfoRow label="সক্রিয় হওয়ার তারিখ"
                  value={portfolio.activationDate
                    ? formatDate(new Date(portfolio.activationDate))
                    : "এখনো সক্রিয় নয়"
                  }
                />
                {portfolio.estimatedExit && (
                  <InfoRow
                    label="পূর্ণ উত্তোলনের আনুমানিক তারিখ"
                    value={formatDate(new Date(portfolio.estimatedExit))}
                  />
                )}
              </div>

              {/* Profit distribution formula */}
              <div className="mt-4 rounded-xl bg-[#E1F5EE] p-3 text-xs text-[#065F46] space-y-1">
                <p className="font-bold">মুনাফা বণ্টনের নিয়ম (Website.txt):</p>
                <p>নেট মুনাফার <strong>৬০%</strong> সদস্যদের মধ্যে আনুপাতিক হারে বণ্টিত হয়</p>
                <p>বণ্টন হিসাব: আপনার Weighted Capital ÷ মোট Weighted Capital × ৬০% মুনাফা</p>
              </div>
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { icon: "📝", label: "সদস্য আবেদন",      href: "/apply" },
                { icon: "🛒", label: "কেনাকাটা করুন",     href: "/shop" },
                { icon: "🤝", label: "করজে হাসানা",       href: "/dashboard#qard", onClick: () => setTab("qard") },
                { icon: "👤", label: "প্রোফাইল সম্পাদনা",  href: "/profile" },
                { icon: "🏛️", label: "কমিটি",             href: "/" },
                { icon: "📱", label: "সংযোগ",              href: "/" },
              ].map((item, i) => (
                item.onClick ? (
                  <button key={i} onClick={item.onClick}
                    className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 text-left hover:shadow-sm hover:border-[#1D9E75]/30 transition-all"
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-sm font-semibold text-[#0D2B1A]">{item.label}</span>
                  </button>
                ) : (
                  <Link key={i} href={item.href}
                    className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 hover:shadow-sm hover:border-[#1D9E75]/30 transition-all"
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-sm font-semibold text-[#0D2B1A]">{item.label}</span>
                  </Link>
                )
              ))}
            </div>
          </div>
        )}

        {/* ════════ TAB: SAVINGS ════════ */}
        {tab === "savings" && (
          <div className="space-y-4">
            {/* Summary bar */}
            <div className="grid grid-cols-3 gap-3">
              <KpiCard icon="✅" label="মোট পরিশোধিত" value={formatMoney(totalSavingsPaid)} color="text-green-600" />
              <KpiCard icon="⚠️" label="বকেয়া মাস"    value={toBengaliDigits(overdueCount)}  color="text-red-600" />
              <KpiCard
                icon="📅"
                label="পরবর্তী কিস্তি"
                value={upcomingDue ? formatMoney(upcomingDue.dueAmount - upcomingDue.paidAmount) : "—"}
                color="text-[#C9A227]"
              />
            </div>

            {/* Savings table */}
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                <h2 className="font-bold text-[#0D2B1A] text-sm">মাসিক সঞ্চয়ের ইতিহাস</h2>
                <span className="text-xs text-gray-400">{toBengaliDigits(savings.length)}টি রেকর্ড</span>
              </div>

              {savings.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <div className="text-4xl mb-3">💰</div>
                  <p>এখনো কোনো সঞ্চয় রেকর্ড নেই।</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 text-gray-500">
                      <tr>
                        <th className="px-4 py-3 text-left">মাস</th>
                        <th className="px-4 py-3 text-right">দেয় টাকা</th>
                        <th className="px-4 py-3 text-right">পরিশোধিত</th>
                        <th className="px-4 py-3 text-right">বাকি</th>
                        <th className="px-4 py-3 text-right">জরিমানা</th>
                        <th className="px-4 py-3 text-center">অবস্থা</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {savings.map((s) => {
                        const isOver = s.status === "OVERDUE";
                        return (
                          <tr key={s.id} className={cn("hover:bg-gray-50", isOver && "bg-red-50/20")}>
                            <td className="px-4 py-3 font-medium text-[#0D2B1A]">{s.month}</td>
                            <td className="px-4 py-3 text-right">{formatMoney(s.dueAmount)}</td>
                            <td className="px-4 py-3 text-right text-green-600">{formatMoney(s.paidAmount)}</td>
                            <td className={cn("px-4 py-3 text-right font-semibold", s.remainingAmount > 0 ? "text-red-600" : "text-green-600")}>
                              {formatMoney(s.remainingAmount)}
                            </td>
                            <td className="px-4 py-3 text-right text-orange-600">
                              {s.lateFee > 0 ? formatMoney(s.lateFee) : "—"}
                            </td>
                            <td className="px-4 py-3 text-center"><StatusBadge status={s.status} /></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════ TAB: INSTALLMENTS ════════ */}
        {tab === "installments" && (
          <div className="space-y-4">
            {installments.length === 0 ? (
              <div className="rounded-2xl border border-gray-100 bg-white shadow-sm text-center py-16">
                <div className="text-4xl mb-3">📦</div>
                <p className="text-gray-500 text-sm">কোনো কিস্তির অর্ডার নেই।</p>
                <Link href="/shop" className="inline-block mt-4 rounded-xl bg-[#1D9E75] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0F6E56] transition-colors">
                  🛒 শপে যান
                </Link>
              </div>
            ) : (
              (() => {
                // Group by order
                const byOrder = installments.reduce<Record<string, InstallmentRow[]>>((acc, inst) => {
                  if (!acc[inst.orderId]) acc[inst.orderId] = [];
                  acc[inst.orderId].push(inst);
                  return acc;
                }, {});
                return Object.entries(byOrder).map(([orderId, rows]) => {
                  const first = rows[0];
                  const paidCount   = rows.filter((r) => r.status === "PAID").length;
                  const totalCount  = rows.length;
                  const progress    = totalCount > 0 ? (paidCount / totalCount) * 100 : 0;
                  return (
                    <div key={orderId} className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                      <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-gray-50">
                        <div>
                          <p className="font-bold text-[#0D2B1A] text-sm">{first.productName}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            অর্ডার: <span className="font-mono">{first.orderNumber}</span>
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-[#0D2B1A]">{formatMoney(first.totalRemaining)}</p>
                          <p className="text-xs text-gray-400">বাকি / {formatMoney(first.totalPayable)}</p>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="px-5 py-3 border-b border-gray-50">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                          <span>{toBengaliDigits(paidCount)}/{toBengaliDigits(totalCount)} কিস্তি পরিশোধিত</span>
                          <span>{toBengaliDigits(Math.round(progress))}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#1D9E75] to-[#C9A227] transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Installment rows */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-gray-50 text-gray-500">
                            <tr>
                              <th className="px-4 py-2.5 text-left">#</th>
                              <th className="px-4 py-2.5 text-left">তারিখ</th>
                              <th className="px-4 py-2.5 text-right">পরিমাণ</th>
                              <th className="px-4 py-2.5 text-right">পরিশোধিত</th>
                              <th className="px-4 py-2.5 text-right">বাকি</th>
                              <th className="px-4 py-2.5 text-center">অবস্থা</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {rows.map((inst) => {
                              const isOver = inst.status === "OVERDUE";
                              const isDue  = inst.status === "DUE";
                              return (
                                <tr key={`${orderId}-${inst.installmentNum}`}
                                  className={cn(
                                    "hover:bg-gray-50",
                                    isOver && "bg-red-50/20",
                                    isDue  && "bg-amber-50/20"
                                  )}
                                >
                                  <td className="px-4 py-2.5 font-semibold text-[#0D2B1A]">
                                    {inst.installmentNum === 0 ? "ডাউন" : toBengaliDigits(inst.installmentNum)}
                                    {(isOver || isDue) && <span className="ml-1">{isOver ? "🔴" : "🟡"}</span>}
                                  </td>
                                  <td className="px-4 py-2.5 text-gray-500">
                                    {formatDate(new Date(inst.dueDate))}
                                  </td>
                                  <td className="px-4 py-2.5 text-right">{formatMoney(inst.dueAmount)}</td>
                                  <td className="px-4 py-2.5 text-right text-green-600">{formatMoney(inst.paidAmount)}</td>
                                  <td className={cn(
                                    "px-4 py-2.5 text-right font-semibold",
                                    inst.remaining > 0 ? (isOver ? "text-red-600" : "text-[#0D2B1A]") : "text-green-600"
                                  )}>
                                    {formatMoney(inst.remaining)}
                                  </td>
                                  <td className="px-4 py-2.5 text-center">
                                    <StatusBadge status={inst.status} />
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                });
              })()
            )}
          </div>
        )}

        {/* ════════ TAB: QARD ════════ */}
        {tab === "qard" && (
          <div className="space-y-4">
            {/* Apply banner */}
            {qards.length === 0 || !activeQard ? (
              <div className="rounded-2xl border border-[#1D9E75]/20 bg-[#E1F5EE] p-5 flex items-start gap-4">
                <span className="text-3xl shrink-0">🤝</span>
                <div className="flex-1">
                  <h3 className="font-bold text-[#0D2B1A] mb-1">করজে হাসানা আবেদন করুন</h3>
                  <p className="text-xs text-gray-600 mb-3">
                    বিনা সুদে সর্বোচ্চ ৳১৫,০০০ পর্যন্ত আর্থিক সহায়তা। সদস্যদের জন্য।
                  </p>
                  <Link
                    href="/api/qard"
                    className="inline-block rounded-xl bg-[#1D9E75] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0F6E56] transition-colors"
                  >
                    আবেদন করুন →
                  </Link>
                </div>
              </div>
            ) : null}

            {/* Qard list */}
            {qards.length === 0 ? (
              <div className="rounded-2xl border border-gray-100 bg-white shadow-sm text-center py-12">
                <div className="text-4xl mb-3">🤝</div>
                <p className="text-gray-500 text-sm">কোনো করজে হাসানা আবেদন নেই।</p>
              </div>
            ) : (
              qards.map((q) => (
                <div key={q.id} className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-50">
                    <div>
                      <p className="font-mono text-xs text-[#1D9E75] font-bold">{q.qardCode}</p>
                      <p className="font-bold text-[#0D2B1A] text-sm mt-0.5">
                        {formatMoney(q.approvedAmount ?? q.requestedAmount)}
                      </p>
                      <p className="text-xs text-gray-400">{toBengaliDigits(q.repaymentMonths)} মাসের মেয়াদ</p>
                    </div>
                    <StatusBadge status={q.status} />
                  </div>

                  <div className="grid grid-cols-3 divide-x divide-gray-50 text-xs">
                    <div className="px-4 py-3 text-center">
                      <div className="font-bold text-green-600 text-sm">{formatMoney(q.totalPaid)}</div>
                      <div className="text-gray-500 mt-0.5">পরিশোধিত</div>
                    </div>
                    <div className="px-4 py-3 text-center">
                      <div className={cn("font-bold text-sm", q.totalRemaining > 0 ? "text-red-600" : "text-green-600")}>
                        {formatMoney(q.totalRemaining)}
                      </div>
                      <div className="text-gray-500 mt-0.5">বাকি</div>
                    </div>
                    <div className="px-4 py-3 text-center">
                      <div className="font-bold text-[#0D2B1A] text-sm">
                        {toBengaliDigits(formatDate(new Date(q.createdAt)))}
                      </div>
                      <div className="text-gray-500 mt-0.5">আবেদনের তারিখ</div>
                    </div>
                  </div>

                  {/* Progress bar for active qard */}
                  {(q.status === "ACTIVE" || q.status === "DISBURSED") && (q.approvedAmount ?? q.requestedAmount) > 0 && (
                    <div className="px-5 py-3 border-t border-gray-50">
                      <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
                        <span>পরিশোধ অগ্রগতি</span>
                        <span>{toBengaliDigits(Math.round(q.totalPaid / (q.approvedAmount ?? q.requestedAmount) * 100))}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#1D9E75] transition-all"
                          style={{ width: `${(q.totalPaid / (q.approvedAmount ?? q.requestedAmount)) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

function KpiCard({
  icon, label, value, sub, color,
}: { icon: string; label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4">
      <div className="flex items-start gap-2.5">
        <span className="text-xl shrink-0">{icon}</span>
        <div className="min-w-0">
          <div className={cn("font-bold text-base truncate", color)}>{value}</div>
          <div className="text-xs text-gray-500 mt-0.5 leading-tight">{label}</div>
          {sub && <div className="text-[10px] text-gray-400 mt-0.5 truncate">{sub}</div>}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-gray-500 shrink-0">{label}:</span>
      <span className="font-semibold text-[#0D2B1A] text-right">{value}</span>
    </div>
  );
}
