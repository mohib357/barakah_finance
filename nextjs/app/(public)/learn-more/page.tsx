"use client";
// ═══════════════════════════════════════════════════════════
//  BARAKAH FINANCE — আরও জানুন (Learn More)
//  Route: /learn-more
//
//  Website.txt spec:
//  "এই পেইজে ন্যাভবার ও নোটিশবারের নিচেই ৮ টি অপশন থাকবে।
//   (i) উদ্দেশ্য ও লক্ষ্য, (ii) প্যাকেজ, (iii) সদস্য হওয়ার
//   নিয়মনীতি, (iv) কিস্তিতে পণ্য ক্রয়ের নিয়ম-নীতি,
//   (v) করজে হাসানা নেওয়ার নিয়ম-নীতি, (vi) চ্যারিটি
//   সহোযোগিতা, (vii) সদস্য প্রোফাইল, (viii) কমিটিবৃন্দ।"
// ═══════════════════════════════════════════════════════════

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { cn, toBengaliDigits, formatMoney, calcMethodB } from "@/lib/utils/cn";
import { Spinner } from "@/components/ui/Spinner";
import { ToastProvider, useToast } from "@/components/ui/Toast";

// ─────────────────────────────────────────────────────────────
// Tab definitions
// ─────────────────────────────────────────────────────────────
type Tab = "objectives" | "packages" | "membership" | "installment" | "qard" | "charity" | "members" | "committee";

const TABS: { key: Tab; icon: string; label: string }[] = [
  { key: "objectives",  icon: "🎯", label: "উদ্দেশ্য ও লক্ষ্য" },
  { key: "packages",    icon: "💎", label: "প্যাকেজ/ইনভেস্ট" },
  { key: "membership",  icon: "📋", label: "সদস্য হওয়ার নিয়মনীতি" },
  { key: "installment", icon: "🛒", label: "কিস্তিতে পণ্য ক্রয়" },
  { key: "qard",        icon: "🤝", label: "করজে হাসানা" },
  { key: "charity",     icon: "❤️",  label: "চ্যারিটি সহযোগিতা" },
  { key: "members",     icon: "👥", label: "সদস্য প্রোফাইল" },
  { key: "committee",   icon: "🏛️", label: "কমিটিবৃন্দ" },
];

export default function LearnMorePage() {
  return (
    <ToastProvider>
      <Suspense fallback={<div className="flex justify-center py-20"><Spinner size="lg" /></div>}>
        <LearnMoreInner />
      </Suspense>
    </ToastProvider>
  );
}

// ─────────────────────────────────────────────────────────────
// Main inner component
// ─────────────────────────────────────────────────────────────
function LearnMoreInner() {
  const params  = useSearchParams();
  const router  = useRouter();
  const initial = (params.get("tab") as Tab) ?? "objectives";
  const [tab, setTab] = useState<Tab>(initial);

  function switchTab(t: Tab) {
    setTab(t);
    router.replace(`/learn-more?tab=${t}`, { scroll: false });
  }

  return (
    <div className="min-h-screen bg-[#FDFAF3]">
      {/* ── Page header ── */}
      <div className="bg-[#0D2B1A] py-8 px-4 text-center">
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Noto Serif Bengali',serif" }}>
          আরও জানুন
        </h1>
        <p className="text-sm text-white/50 mt-1">বারাকাহ ফাইন্যান্স সম্পর্কে বিস্তারিত তথ্য</p>
      </div>

      {/* ── 8 Tab buttons — horizontal scrollable ── */}
      <div className="sticky top-[70px] z-30 bg-white border-b border-gray-100 shadow-sm overflow-x-auto">
        <div className="flex min-w-max px-2 py-1 gap-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => switchTab(t.key)}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap px-4 py-2.5 rounded-xl text-xs font-semibold transition-all",
                tab === t.key
                  ? "bg-[#1D9E75] text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-50 hover:text-[#1D9E75]"
              )}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {tab === "objectives"  && <ObjectivesTab />}
        {tab === "packages"    && <PackagesTab />}
        {tab === "membership"  && <MembershipTab />}
        {tab === "installment" && <InstallmentTab />}
        {tab === "qard"        && <QardTab />}
        {tab === "charity"     && <CharityTab />}
        {tab === "members"     && <MembersTab />}
        {tab === "committee"   && <CommitteeTab />}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// (i) উদ্দেশ্য ও লক্ষ্য
// ─────────────────────────────────────────────────────────────
function ObjectivesTab() {
  return (
    <div className="space-y-8 animate-fade-in">
      <Section title="মূল উদ্দেশ্য" icon="🎯">
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { icon: "🕌", title: "সুদমুক্ত অর্থনীতি",    text: "সমাজ থেকে সুদের অভিশাপ দূর করে সম্পূর্ণ শরিয়াহসম্মত ও হালাল উপায়ে আর্থিক লেনদেনের ক্ষেত্র তৈরি করা।" },
            { icon: "🤝", title: "আর্থিক সহায়তা",       text: "সদস্যদের আপদকালীন প্রয়োজনে বিনা সুদে 'করজে হাসানা' প্রদানের মাধ্যমে পারস্পরিক সহযোগিতা নিশ্চিত করা।" },
            { icon: "📦", title: "সহজ কিস্তি সুবিধা",  text: "সাধারণ মানুষকে ১০%-এর মতো সামান্য লাভে কিস্তিতে পণ্য ক্রয়ের সুবিধা দিয়ে তাদের জীবনমান সহজ করা।" },
            { icon: "💰", title: "সঞ্চয় ও বিনিয়োগ",  text: "সদস্যদের ক্ষুদ্র ক্ষুদ্র সঞ্চয়কে একত্রিত করে একটি শক্তিশালী তহবিল গঠন করা এবং তা হালাল ব্যবসায় বিনিয়োগ করা।" },
          ].map((o) => (
            <div key={o.title} className="rounded-2xl border border-[#1D9E75]/15 bg-white p-5 hover:shadow-md transition-shadow">
              <div className="text-2xl mb-2">{o.icon}</div>
              <h3 className="font-bold text-[#0D2B1A] mb-1" style={{ fontFamily: "'Noto Serif Bengali',serif" }}>{o.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{o.text}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="ভিশন" icon="🌟">
        <div className="space-y-4">
          {[
            { title: "দেশব্যাপী বিস্তার",    text: "৩০ জন সদস্য নিয়ে যাত্রা শুরু করলেও, এই সুদমুক্ত সেবা ও ভ্রাতৃত্বের মডেলকে টেকসইভাবে পুরো দেশব্যাপী ছড়িয়ে দেওয়া।" },
            { title: "আদর্শ মডেল তৈরি",   text: "দেশে একটি স্বচ্ছ এবং আধুনিক সুদমুক্ত আর্থিক প্রতিষ্ঠানের সফল উদাহরণ তৈরি করা, যেখানে সচ্ছতা ও ন্যায়বিচারই হবে মূল ভিত্তি।" },
          ].map((v) => (
            <div key={v.title} className="flex gap-3 rounded-2xl border border-[#C9A227]/20 bg-[#FDFAF3] p-4">
              <div className="h-2 w-2 rounded-full bg-[#C9A227] mt-1.5 shrink-0" />
              <div>
                <h4 className="font-bold text-[#0D2B1A] text-sm mb-1">{v.title}</h4>
                <p className="text-sm text-gray-600 leading-relaxed">{v.text}</p>
              </div>
            </div>
          ))}
        </div>
        <blockquote className="mt-5 rounded-2xl border-l-4 border-[#C9A227] bg-[#C9A227]/8 px-5 py-4 text-sm text-[#0D2B1A] italic leading-relaxed">
          &ldquo;সুদমুক্ত লেনদেনে সমৃদ্ধি সবার — এই স্লোগানকে ধারণ করে একটি আত্মনির্ভরশীল ও ইনসাফভিত্তিক সমাজ বিনির্মাণ করাই আমাদের প্রধান লক্ষ্য।&rdquo;
        </blockquote>
      </Section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// (ii) প্যাকেজ/ইনভেস্ট
// ─────────────────────────────────────────────────────────────
function PackagesTab() {
  const PACKAGES = [
    {
      icon: "💰", name: "মাসিক সঞ্চয়", color: "from-[#1D9E75] to-[#0F6E56]",
      amount: "৳২,০০০/মাস", unit: "১ ইউনিট = ৳২,০০০",
      desc: "প্রতি মাসে ২,০০০ টাকা সঞ্চয়। সদস্যরা আনুপাতিক হারে নেট মুনাফার ৬০% পাবেন।",
      features: ["মাসিক নির্ধারিত পরিমাণ", "Unit ভিত্তিক হিসাব", "দিনভিত্তিক মুনাফা", "মূলধন সুরক্ষিত"],
    },
    {
      icon: "💎", name: "এককালীন বিনিয়োগ", color: "from-[#C9A227] to-[#9A7D0A]",
      amount: "যেকোনো পরিমাণ", unit: "Fractional unit সাপোর্ট",
      desc: "একবারে যেকোনো পরিমাণ বিনিয়োগ করুন। ৳৫,০০০ = ২.৫ ইউনিট হিসেবে গণনা হবে।",
      features: ["Fractional unit", "তাৎক্ষণিক সক্রিয়করণ", "আনুপাতিক মুনাফা", "যেকোনো পরিমাণ"],
    },
    {
      icon: "🏗️", name: "প্রজেক্ট বিনিয়োগ", color: "from-[#185FA5] to-[#0D3D6E]",
      amount: "প্রজেক্ট ভেদে", unit: "নির্দিষ্ট মেয়াদ",
      desc: "নির্দিষ্ট ব্যবসায়িক প্রজেক্টে বিনিয়োগ করুন এবং সেই প্রজেক্টের মুনাফা আনুপাতিক হারে পান।",
      features: ["নির্দিষ্ট প্রজেক্ট", "মেয়াদ ভিত্তিক", "প্রজেক্ট ট্র্যাকিং", "স্বচ্ছ হিসাব"],
    },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="rounded-2xl border border-[#1D9E75]/20 bg-[#E1F5EE] p-4 text-sm text-[#065F46]">
        <strong>মুনাফা বণ্টন নীতি:</strong> নেট মুনাফার <strong>৬০%</strong> সদস্যদের মধ্যে ইউনিট ও সক্রিয় দিন অনুপাতে বণ্টিত হয়।
        <strong> ৩৫%</strong> সংগঠন পরিচালনায়। <strong>৫%</strong> চ্যারিটি ফান্ডে।
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        {PACKAGES.map((p) => (
          <div key={p.name} className="rounded-2xl overflow-hidden border border-gray-100 bg-white shadow-sm hover:shadow-lg transition-shadow">
            <div className={cn("bg-gradient-to-br p-5 text-white", p.color)}>
              <span className="text-3xl">{p.icon}</span>
              <h3 className="font-bold text-lg mt-2">{p.name}</h3>
              <p className="text-sm text-white/80 mt-0.5">{p.amount}</p>
              <p className="text-xs text-white/60 mt-0.5">{p.unit}</p>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600 leading-relaxed mb-3">{p.desc}</p>
              <ul className="space-y-1.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="text-[#1D9E75]">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link href="/apply" className="mt-4 block text-center rounded-xl bg-[#1D9E75] py-2 text-xs font-semibold text-white hover:bg-[#0F6E56] transition-colors">
                আবেদন করুন →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// (iii) সদস্য হওয়ার নিয়মনীতি
// ─────────────────────────────────────────────────────────────
function MembershipTab() {
  const steps = [
    { num: "১", title: "নিবন্ধন করুন",       desc: "/login → নিবন্ধন ট্যাব → মোবাইল OTP দিয়ে যাচাই করুন।" },
    { num: "২", title: "আবেদন ফরম পূরণ করুন", desc: "৫-ধাপে ব্যক্তিগত তথ্য, নমিনি, বিনিয়োগ ধরন, NID ও ছবি জমা দিন।" },
    { num: "৩", title: "কমিটি অনুমোদন",       desc: "আহ্বায়ক কমিটি আবেদন পর্যালোচনা করবেন। সাধারণত ১-৩ কার্যদিবসের মধ্যে।" },
    { num: "৪", title: "পেমেন্ট করুন",        desc: "অনুমোদনের পর ফরম ফি ৳১০০ ও প্রথম বিনিয়োগ বিকাশ/নগদ/ব্যাংকে পরিশোধ করুন।" },
    { num: "৫", title: "সদস্য আইডি পান",     desc: "পেমেন্ট নিশ্চিত হলে ৬ সংখ্যার সদস্য আইডি SMS-এ পাবেন।" },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
        <h3 className="font-bold text-[#0D2B1A] mb-4">সদস্য হওয়ার ধাপসমূহ</h3>
        <div className="space-y-3">
          {steps.map((s, i) => (
            <div key={i} className="flex gap-4">
              <div className="h-8 w-8 rounded-full bg-[#1D9E75] flex items-center justify-center text-white font-bold text-sm shrink-0">{s.num}</div>
              <div className="flex-1">
                <p className="font-semibold text-[#0D2B1A] text-sm">{s.title}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <h3 className="font-bold text-amber-800 mb-3 text-sm">প্রয়োজনীয় কাগজপত্র</h3>
        <ul className="space-y-1.5 text-sm text-amber-700">
          {["জাতীয় পরিচয়পত্র (NID) / জন্ম নিবন্ধন","পাসপোর্ট সাইজ ছবি (সাদা ব্যাকগ্রাউন্ড)","মোবাইল নম্বর (OTP যাচাইয়ের জন্য)","নমিনির নাম ও মোবাইল নম্বর"].map((d) => (
            <li key={d} className="flex items-center gap-2"><span>📄</span>{d}</li>
          ))}
        </ul>
      </div>

      <Link href="/apply" className="block text-center rounded-2xl bg-[#1D9E75] py-4 text-base font-bold text-white hover:bg-[#0F6E56] transition-colors shadow-lg">
        📝 এখনই আবেদন করুন →
      </Link>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// (iv) কিস্তিতে পণ্য ক্রয় + Calculator
// ─────────────────────────────────────────────────────────────
function InstallmentTab() {
  const [cost,   setCost]   = useState("30000");
  const [down,   setDown]   = useState("10000");
  const [rate,   setRate]   = useState("10");
  const [nInst,  setNInst]  = useState(6);

  const result = (() => {
    const c = parseFloat(cost) || 0;
    const d = parseFloat(down) || 0;
    const r = parseFloat(rate) || 10;
    if (c <= 0 || c <= d) return null;
    return calcMethodB(c, d, nInst, r);
  })();

  const INP = "w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]";

  return (
    <div className="space-y-5 animate-fade-in">
      <Section title="কিস্তিতে পণ্য ক্রয়ের নিয়ম-নীতি" icon="📦">
        <div className="space-y-2.5 text-sm text-gray-700 leading-relaxed">
          <p>✅ সংগঠনের অনুমোদিত পণ্য ক্যাটালগ থেকে পণ্য বেছে নিন।</p>
          <p>✅ আবেদন করুন এবং কমিটির অনুমোদনের জন্য অপেক্ষা করুন।</p>
          <p>✅ অনুমোদনের পর প্রথম কিস্তি (ডাউনপেমেন্ট) পরিশোধ করুন।</p>
          <p>✅ পণ্য সরাসরি বাজার থেকে ক্রয় করে হস্তান্তর করা হবে।</p>
          <p>✅ লাভ ধরা হয় <strong>শুধুমাত্র অর্থায়িত অংশের উপর</strong> — ডাউনপেমেন্টের উপর নয় (শরিয়াহ পদ্ধতি)।</p>
          <p className="text-[#1D9E75] font-semibold">📌 উদাহরণ: পণ্য ৳৩০,০০০ — ডাউন ৳১০,০০০ — অর্থায়িত ৳২০,০০০ — ১০% লাভ = ৳২,০০০ — মোট বিক্রয় ৳৩২,০০০।</p>
        </div>
      </Section>

      {/* Installment Calculator — Method B */}
      <div className="rounded-2xl border border-[#0D2B1A]/20 overflow-hidden"
        style={{ background: "linear-gradient(135deg,#0D2B1A,#163a24)" }}>
        <div className="px-5 pt-5 pb-3">
          <p className="text-xs font-bold uppercase tracking-widest text-[#C9A227] mb-1">কিস্তি ক্যালকুলেটর</p>
          <h3 className="text-lg font-bold text-white">পদ্ধতি-২: অর্থায়িত পরিমাণ ভিত্তিক (শরিয়াহ)</h3>
        </div>
        <div className="px-5 pb-5 space-y-3">
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-white/70 mb-1">ক্রয়মূল্য (৳)</label>
              <input type="number" value={cost} onChange={(e) => setCost(e.target.value)} className={cn(INP, "bg-white/10 text-white border-white/20 placeholder:text-white/30")} placeholder="৳৩০,০০০" />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/70 mb-1">ডাউনপেমেন্ট (৳)</label>
              <input type="number" value={down} onChange={(e) => setDown(e.target.value)} className={cn(INP, "bg-white/10 text-white border-white/20 placeholder:text-white/30")} placeholder="৳১০,০০০" />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/70 mb-1">লাভের হার (%)</label>
              <input type="number" value={rate} onChange={(e) => setRate(e.target.value)} className={cn(INP, "bg-white/10 text-white border-white/20 placeholder:text-white/30")} placeholder="১০" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/70 mb-1.5">কিস্তির সংখ্যা</label>
            <div className="flex gap-2">
              {[3, 6, 9, 12].map((n) => (
                <button key={n} onClick={() => setNInst(n)}
                  className={cn("flex-1 rounded-lg py-2 text-xs font-semibold transition-colors",
                    nInst === n ? "bg-[#C9A227] text-[#0D2B1A]" : "bg-white/10 text-white/70 hover:bg-white/20"
                  )}>
                  {toBengaliDigits(n)} কিস্তি
                </button>
              ))}
            </div>
          </div>

          {result && (
            <div className="rounded-xl bg-white/10 p-4 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center">
                {[
                  ["অর্থায়িত", formatMoney(result.financed)],
                  ["লাভ",       formatMoney(result.profit)],
                  ["মোট মূল্য", formatMoney(result.totalSale)],
                  ["ডাউন বাদে বাকি", formatMoney(result.remaining)],
                  ["প্রতি কিস্তি",   formatMoney(result.perInstall)],
                  ["শেষ কিস্তি",    formatMoney(result.lastInstall)],
                ].map(([lbl, val]) => (
                  <div key={lbl} className="rounded-lg bg-white/10 p-2">
                    <div className="text-sm font-bold text-[#C9A227]">{val}</div>
                    <div className="text-[10px] text-white/50 mt-0.5">{lbl}</div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-white/40 text-center">* শেষ কিস্তিতে rounding সমন্বয় হয়। মোট = মোট মূল্য সর্বদা।</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// (v) করজে হাসানা
// ─────────────────────────────────────────────────────────────
function QardTab() {
  return (
    <div className="space-y-5 animate-fade-in">
      <Section title="করজে হাসানা নেওয়ার নিয়ম-নীতি" icon="🤝">
        <div className="rounded-2xl border border-[#1D9E75]/20 bg-[#E1F5EE] p-4 text-sm text-[#065F46] mb-4">
          <strong>করজে হাসানা কী?</strong> — ইসলামী শরিয়াহ অনুযায়ী, বিনা সুদে দেওয়া ঋণকে করজে হাসানা বলে। এটি সম্পূর্ণ হালাল এবং পরিশোধযোগ্য।
        </div>
        <div className="space-y-2.5 text-sm text-gray-700">
          {[
            "✅ শুধুমাত্র সক্রিয় সদস্যরা আবেদন করতে পারবেন।",
            "✅ সর্বোচ্চ ৳১৫,০০০ পর্যন্ত করজ পাওয়া যাবে।",
            "✅ সর্বোচ্চ ৩ মাসে পরিশোধযোগ্য।",
            "✅ কমিটির ৩-ধাপ অনুমোদন প্রয়োজন।",
            "✅ একজন সক্রিয় সদস্যকে জামিনদার হতে হবে।",
            "✅ সময়মতো পরিশোধ না করলে পরবর্তী বছর আবেদন করা যাবে না।",
            "⚠️ বিলম্ব ফি সম্পূর্ণ চ্যারিটি ফান্ডে জমা হয়।",
          ].map((r) => <p key={r}>{r}</p>)}
        </div>
      </Section>
      <Link href="/apply" className="block text-center rounded-2xl bg-[#1D9E75] py-4 text-base font-bold text-white hover:bg-[#0F6E56] transition-colors">
        🤝 করজে হাসানা আবেদন করুন →
      </Link>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// (vi) চ্যারিটি সহযোগিতা
// ─────────────────────────────────────────────────────────────
function CharityTab() {
  const { showToast } = useToast();
  const [name,    setName]    = useState("");
  const [father,  setFather]  = useState("");
  const [address, setAddress] = useState("");
  const [phone,   setPhone]   = useState("");
  const [email,   setEmail]   = useState("");
  const [reason,  setReason]  = useState("");
  const [sending, setSending] = useState(false);

  async function submit() {
    if (!name || !phone || !reason) { showToast("নাম, মোবাইল ও কারণ বাধ্যতামূলক।", "error"); return; }
    setSending(true);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ type: "charity", name, phone, address, reason }),
      });
      if (res.ok) {
        showToast("✅ আবেদন জমা হয়েছে! কমিটি পর্যালোচনা করবেন।");
        setName(""); setFather(""); setAddress(""); setPhone(""); setEmail(""); setReason("");
      }
    } catch { showToast("আবেদন ব্যর্থ।", "error"); }
    finally { setSending(false); }
  }

  const INP = "w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]";

  return (
    <div className="space-y-5 animate-fade-in">
      <Section title="চ্যারিটি সহযোগিতা" icon="❤️">
        <p className="text-sm text-gray-600 leading-relaxed">
          আর্থিক সংকটে পড়া মানুষদের সহায়তার জন্য বারাকাহ ফাইন্যান্স একটি পৃথক চ্যারিটি ফান্ড পরিচালনা করে।
          আবেদন করতে নিচের ফরমটি পূরণ করুন। লগইন করা থাকলে আবেদনের স্ট্যাটাস ট্র্যাক করতে পারবেন।
        </p>
      </Section>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 space-y-3">
        <h3 className="font-bold text-[#0D2B1A]">চ্যারিটি সহায়তার আবেদন</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <div><label className="block text-xs font-medium text-gray-500 mb-1">নাম *</label><input className={INP} value={name} onChange={(e) => setName(e.target.value)} placeholder="পূর্ণ নাম" /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1">পিতার নাম</label><input className={INP} value={father} onChange={(e) => setFather(e.target.value)} placeholder="পিতার নাম" /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1">মোবাইল *</label><input className={INP} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXXXXXXXX" /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1">ইমেইল</label><input className={INP} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ঐচ্ছিক" /></div>
          <div className="sm:col-span-2"><label className="block text-xs font-medium text-gray-500 mb-1">ঠিকানা</label><input className={INP} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="বিস্তারিত ঠিকানা" /></div>
          <div className="sm:col-span-2"><label className="block text-xs font-medium text-gray-500 mb-1">সহায়তার কারণ *</label><textarea className={cn(INP, "resize-none")} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="সংক্ষেপে কারণ বর্ণনা করুন" /></div>
        </div>
        <button onClick={submit} disabled={sending}
          className="w-full rounded-xl bg-[#1D9E75] py-3 text-sm font-semibold text-white hover:bg-[#0F6E56] disabled:opacity-60 transition-colors">
          {sending ? "পাঠানো হচ্ছে…" : "❤️ আবেদন জমা দিন"}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// (vii) সদস্য প্রোফাইল — searchable directory
// ─────────────────────────────────────────────────────────────
function MembersTab() {
  const [members,  setMembers]  = useState<{ id: string; name: string; memberID: string; phone?: string; address?: string }[]>([]);
  const [query,    setQuery]    = useState("");
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    fetch("/api/public/member-directory")
      .then((r) => r.ok ? r.json() : [])
      .then((d) => setMembers(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? members.filter((m) =>
        m.name.toLowerCase().includes(q) ||
        m.memberID.toLowerCase().includes(q) ||
        (m.phone ?? "").includes(q) ||
        (m.address ?? "").toLowerCase().includes(q)
      )
    : members;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="নাম, আইডি, মোবাইল বা ঠিকানা দিয়ে সার্চ করুন…"
          className="w-full rounded-xl border border-gray-200 pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <div className="text-4xl mb-2">👥</div>
          <p>{q ? "কোনো সদস্য পাওয়া যায়নি।" : "সদস্য তালিকা লোড হচ্ছে…"}</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {filtered.map((m, i) => (
            <div key={m.id} className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3 hover:shadow-sm transition-shadow">
              <div
                className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                style={{ background: ["#1D9E75","#C9A227","#185FA5","#BA7517","#3C3489","#972B56"][i % 6] }}
              >
                {m.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-[#0D2B1A] truncate">{m.name}</p>
                <p className="text-xs text-gray-400">আইডি: {m.memberID}</p>
                {m.address && <p className="text-[10px] text-gray-300 truncate">{m.address}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-center text-xs text-gray-400">
        {toBengaliDigits(filtered.length)} জন সদস্য
        {q && <span className="ml-1">«{query}» অনুসন্ধানে পাওয়া</span>}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// (viii) কমিটিবৃন্দ
// ─────────────────────────────────────────────────────────────
function CommitteeTab() {
  const [committee, setCommittee] = useState<{ id: string; name: string; designation: string; phone?: string | null }[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    fetch("/api/committee")
      .then((r) => r.ok ? r.json() : {})
      .then((d) => {
        const running = (d.sessions ?? []).find((s: { isActive: boolean; members: unknown[] }) => s.isActive);
        setCommittee(running?.members ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const DESIG_COLOR: Record<string, string> = {
    "সভাপতি":            "bg-[#C9A227] text-[#0D2B1A]",
    "সহ-সভাপতি":        "bg-amber-100 text-amber-800",
    "সাধারণ সম্পাদক":   "bg-blue-100 text-blue-800",
    "কোষাধ্যক্ষ":        "bg-green-100 text-green-800",
    "শরিয়াহ পরামর্শক": "bg-teal-100 text-teal-800",
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {loading ? (
        <div className="flex justify-center py-10"><Spinner /></div>
      ) : committee.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <div className="text-4xl mb-2">🏛️</div>
          <p>কমিটির তথ্য পাওয়া যাচ্ছে না।</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {committee.map((m, i) => (
            <div key={m.id} className="flex flex-col items-center text-center rounded-2xl border border-gray-100 bg-white p-5 hover:shadow-md transition-shadow">
              <div
                className="h-16 w-16 rounded-full flex items-center justify-center text-white font-bold text-xl mb-3 shadow-md"
                style={{ background: ["#1D9E75","#C9A227","#185FA5","#BA7517","#3C3489","#972B56"][i % 6] }}
              >
                {m.name[0]}
              </div>
              <h3 className="font-bold text-[#0D2B1A] text-sm">{m.name}</h3>
              <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold mt-1",
                DESIG_COLOR[m.designation] ?? "bg-gray-100 text-gray-700"
              )}>
                {m.designation}
              </span>
              {m.phone && (
                <p className="text-xs text-gray-400 mt-1.5">{m.phone}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Shared layout helper
// ─────────────────────────────────────────────────────────────
function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">{icon}</span>
        <h2 className="font-bold text-[#0D2B1A] text-lg" style={{ fontFamily: "'Noto Serif Bengali',serif" }}>
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}
