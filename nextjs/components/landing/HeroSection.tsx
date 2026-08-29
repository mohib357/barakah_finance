"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils/cn";
import { useLang } from "@/lib/hooks/useLang";

// ── Badge card from API ──────────────────────────────────
interface BadgeData {
  id: string;
  key: string;
  label: string;
  icon?: string;
  computedValue?: string;
  computedSub?: string;
  value?: string;
  isClickable?: boolean;
  targetUrl?: string;
}

const DEFAULT_BADGES: BadgeData[] = [
  { id: "b1", key: "members",  icon: "👥", label: "মোট সদস্য",    computedValue: "৩০+",  computedSub: "সক্রিয় সদস্য" },
  { id: "b2", key: "savings",  icon: "💰", label: "মোট সঞ্চয়",    computedValue: "—",    computedSub: "সদস্যদের সঞ্চয়" },
  { id: "b3", key: "loans",    icon: "🤝", label: "করজে হাসানা",   computedValue: "—",    computedSub: "চলমান করজ" },
  { id: "b4", key: "services", icon: "🌟", label: "আমাদের সেবা",   computedValue: "৪",    computedSub: "ধরনের হালাল সেবা" },
  { id: "b5", key: "products", icon: "🛒", label: "পণ্য ক্যাটালগ", computedValue: "—",    computedSub: "ধরনের পণ্য" },
];

export default function HeroSection() {
  const { data: session } = useSession();
  const { t } = useLang();
  const [badges, setBadges] = useState<BadgeData[]>(DEFAULT_BADGES);
  const [badgesLoaded, setBadgesLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/public/badges")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setBadges(data);
          setBadgesLoaded(true);
        }
      })
      .catch(() => {});
  }, []);

  function handleLoginGate(href: string) {
    if (session?.user) {
      window.location.href = href;
    } else {
      // Store redirect target and go to login
      sessionStorage.setItem("bf_redirect", href);
      window.location.href = `/login?callbackUrl=${encodeURIComponent(href)}`;
    }
  }

  return (
    <section
      id="home"
      className="relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0D2B1A 0%, #163a24 40%, #1a4a2e 100%)",
        minHeight: "calc(100vh - 106px)",
      }}
    >
      {/* Decorative pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C9A227' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative mx-auto max-w-[1400px] px-4 py-12 md:py-16 lg:flex lg:gap-8 lg:items-center">

        {/* ── Left Card (5 cols) ── */}
        <div className="lg:w-5/12 mb-10 lg:mb-0">
          <div
            className="reveal rounded-2xl border border-[#C9A227]/30 bg-white/5 backdrop-blur-sm p-8 md:p-10"
            style={{ animation: "fadeIn .6s ease both" }}
          >
            {/* Shariah badge — spec: "শরিয়ত সম্মত আর্থিক প্রতিষ্ঠান" */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#C9A227]/40 bg-[#C9A227]/10 px-4 py-1.5 text-xs font-semibold text-[#F0D78A] mb-6">
              🕌 শরিয়ত সম্মত আর্থিক প্রতিষ্ঠান
            </div>

            {/* Headline */}
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-white leading-tight mb-4" style={{ fontFamily: "'Noto Serif Bengali', serif" }}>
              ইসলামী অর্থনীতির আলোকে
              <br />
              <em className="not-italic text-[#C9A227]">সমৃদ্ধি সবার</em>
            </h1>

            {/* Quote box — highlighted border per spec */}
            <div className="relative rounded-xl border border-[#C9A227]/50 bg-[#C9A227]/8 px-5 py-4 mb-5">
              <p className="text-sm text-white/85 leading-relaxed">
                &ldquo;ইসলামী অর্থনীতির আলোকে সমাজ থেকে সূদের অভিশাপ দূর করে হালাল উপায়ে আর্থিক সহায়তা ও সমৃদ্ধি নিশ্চিত করাই আমাদের অঙ্গিকার।&rdquo;
              </p>
            </div>

            {/* Golden divider — spec: "গোল্ডেন কালারের মোটা হরিজন্টাল লাইন" */}
            <div className="h-1 w-full bg-gradient-to-r from-[#C9A227] via-[#F0D78A] to-[#C9A227] rounded-full mb-6 opacity-80" />

            {/* CTA buttons — spec: 3 buttons with distinct styles/colors */}
            <div className="flex flex-wrap gap-3">
              {/* Button 1: সদস্য হতে আবেদন করুন */}
              <button
                onClick={() => handleLoginGate("/apply")}
                className="flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white active:scale-95 transition-all shadow-lg"
                style={{ background: "linear-gradient(135deg,#1D9E75,#0F6E56)" }}
              >
                📝 সদস্য হতে আবেদন করুন
              </button>
              {/* Button 2: কেনাকাটা করুন */}
              <button
                onClick={() => handleLoginGate("/shop")}
                className="flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white active:scale-95 transition-all shadow-lg"
                style={{ background: "linear-gradient(135deg,#185FA5,#0D3D6E)" }}
              >
                🛒 কেনাকাটা করুন
              </button>
              {/* Button 3: আরও জানুন — outline/ghost style */}
              <Link
                href="/learn-more"
                className="flex items-center gap-2 rounded-xl border-2 border-[#C9A227]/60 px-5 py-3 text-sm font-semibold text-[#F0D78A] hover:bg-[#C9A227]/15 active:scale-95 transition-all"
              >
                📚 আরও জানুন
              </Link>
            </div>
          </div>
        </div>

        {/* ── Right: Badge Grid (7 cols) ── */}
        <div className="lg:w-7/12">
          <div
            className={cn(
              "grid gap-3",
              badges.length <= 4 ? "grid-cols-2" :
              badges.length <= 6 ? "grid-cols-2 md:grid-cols-3" :
              "grid-cols-2 md:grid-cols-3 lg:grid-cols-3"
            )}
          >
            {badges.map((badge, i) => (
              <BadgeCard key={badge.id} badge={badge} index={i} loaded={badgesLoaded} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function BadgeCard({ badge, index, loaded }: { badge: BadgeData; index: number; loaded: boolean }) {
  const displayValue = badge.computedValue ?? badge.value ?? "—";
  const displaySub   = badge.computedSub ?? "";

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/10 bg-white/8 backdrop-blur-sm p-5",
        "transition-all duration-300 hover:-translate-y-1 hover:border-[#C9A227]/50 hover:bg-white/12",
        badge.isClickable !== false && "cursor-pointer",
        "reveal"
      )}
      style={{ animation: `fadeIn .4s ease ${index * 80}ms both` }}
      onClick={() => {
        if (badge.targetUrl) window.location.href = badge.targetUrl;
      }}
      role={badge.isClickable !== false ? "button" : undefined}
      tabIndex={badge.isClickable !== false ? 0 : -1}
    >
      {/* Gold accent line on hover */}
      <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-[#C9A227] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="text-3xl mb-2">{badge.icon ?? "📊"}</div>
      <div
        className="text-xl font-bold text-[#C9A227] mb-0.5 transition-transform group-hover:scale-105"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {loaded || badge.key === "services" ? displayValue : (
          <span className="inline-block h-5 w-12 animate-pulse rounded bg-white/10" />
        )}
      </div>
      <div className="text-xs font-semibold text-white/90">{badge.label}</div>
      {displaySub && <div className="text-[10px] text-white/50 mt-0.5">{displaySub}</div>}
    </div>
  );
}
