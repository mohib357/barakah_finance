"use client";
import Link from "next/link";

const PANELS = [
  {
    role: "Admin",
    icon: "🛡️",
    title: "অ্যাডমিন প্যানেল",
    gradient: "from-[#0D2B1A] to-[#163a24]",
    accent: "#C9A227",
    items: ["রিয়েল-টাইম ড্যাশবোর্ড", "সদস্য ব্যবস্থাপনা", "পণ্য অনুমোদন ও বাতিল", "আর্থিক রিপোর্ট", "নোটিশ ও ব্যাজ নিয়ন্ত্রণ"],
    href: "/login",
    btnLabel: "অ্যাডমিন লগইন",
  },
  {
    role: "Member",
    icon: "👥",
    title: "সদস্য প্যানেল",
    gradient: "from-[#1D9E75] to-[#0F6E56]",
    accent: "#fff",
    items: ["ব্যক্তিগত সঞ্চয় প্রোফাইল", "লভ্যাংশের হিসাব", "করজে হাসানা আবেদন", "মাসিক সঞ্চয় স্ট্যাটাস", "ডকুমেন্ট আপলোড"],
    href: "/login",
    btnLabel: "সদস্য লগইন",
  },
  {
    role: "Customer",
    icon: "🛒",
    title: "গ্রাহক প্যানেল",
    gradient: "from-[#BA7517] to-[#854F0B]",
    accent: "#fff",
    items: ["পণ্য রিকোয়েস্ট পাঠান", "কিস্তি ট্র্যাকার", "আবেদনের অবস্থা", "পেমেন্ট ইতিহাস", "ডকুমেন্ট আপলোড"],
    href: "/login",
    btnLabel: "গ্রাহক লগইন",
  },
];

export default function PanelsSection() {
  return (
    <section id="panels" className="py-20 px-5 bg-white dark:bg-[#112214]">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-12 reveal">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#1D9E75] mb-3">ব্যবহারকারী পোর্টাল</span>
          <h2 className="text-3xl font-bold text-[#0D2B1A] dark:text-white" style={{ fontFamily: "'Noto Serif Bengali', serif" }}>
            তিনটি প্যানেল, তিনটি সেবা
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {PANELS.map((p) => (
            <div key={p.role} className={`reveal rounded-2xl bg-gradient-to-br ${p.gradient} p-6 flex flex-col`}>
              <span className="inline-block rounded-full bg-white/20 px-3 py-0.5 text-xs font-bold text-white mb-3 self-start">
                {p.role}
              </span>
              <div className="text-4xl mb-2">{p.icon}</div>
              <h3 className="font-bold text-white text-lg mb-3">{p.title}</h3>
              <ul className="space-y-1.5 mb-5 flex-1">
                {p.items.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-white/80">
                    <span className="text-[#C9A227]">✓</span> {item}
                  </li>
                ))}
              </ul>
              <Link
                href={p.href}
                className="block text-center rounded-xl border border-white/30 py-2.5 text-sm font-semibold text-white hover:bg-white/15 transition-colors"
              >
                {p.btnLabel}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
