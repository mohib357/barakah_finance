"use client";
import { useLang } from "@/lib/hooks/useLang";

const FEATURES = [
  { icon: "🕌", key: "shariah",     descKey: "feature.shariah.desc" },
  { icon: "🤝", key: "qard",        descKey: "feature.qard.desc" },
  { icon: "📦", key: "installment", descKey: "feature.install.desc" },
  { icon: "💰", key: "savings",     descKey: "feature.savings.desc" },
  { icon: "🔒", key: "security",    descKey: "feature.security.desc" },
  { icon: "📱", key: "notify",      descKey: "feature.notify.desc" },
] as const;

export default function WhySection() {
  const { t } = useLang();

  return (
    <section id="about" className="bg-white dark:bg-[#112214] py-20 px-5">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-14 reveal">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#1D9E75] mb-3">
            {t("about.eyebrow")}
          </span>
          <h2
            className="text-3xl md:text-4xl font-bold text-[#0D2B1A] dark:text-white mb-3"
            style={{ fontFamily: "'Noto Serif Bengali', serif" }}
          >
            {t("about.title")}
          </h2>
          <p className="mx-auto max-w-xl text-[#4A5A4A] dark:text-white/60 leading-relaxed">
            {t("about.subtitle")}
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <div
              key={f.key}
              className="group reveal relative overflow-hidden rounded-2xl border border-[#1D9E75]/12 bg-[#FDFAF3] dark:bg-white/5 p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-[#1D9E75]/30"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              {/* Teal gradient top accent on hover */}
              <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-[#1D9E75] to-[#639922] opacity-0 group-hover:opacity-100 transition-opacity rounded-t-2xl" />

              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#E1F5EE] dark:bg-[#1D9E75]/20 text-2xl">
                {f.icon}
              </div>
              <h3
                className="mb-2 text-base font-bold text-[#0D2B1A] dark:text-white"
                style={{ fontFamily: "'Noto Serif Bengali', serif" }}
              >
                {t(`feature.${f.key}`)}
              </h3>
              <p className="text-sm text-[#4A5A4A] dark:text-white/60 leading-relaxed">
                {t(f.descKey)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
