"use client";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { toBengaliDigits, formatMoney, calcMethodA, calcMethodB } from "@/lib/utils/cn";
import { useLang } from "@/lib/hooks/useLang";

type CalcMode = 1 | 2;

const INSTALLMENT_OPTIONS = [
  { value: 3,  label: "৩ কিস্তি" },
  { value: 6,  label: "৬ কিস্তি" },
  { value: 9,  label: "৯ কিস্তি" },
  { value: 12, label: "১২ কিস্তি" },
];

export default function InstallmentCalculator() {
  const { t } = useLang();
  const [mode, setMode] = useState<CalcMode>(1);

  // Mode 1 state
  const [m1Price,  setM1Price]  = useState("");
  const [m1Travel, setM1Travel] = useState("0");
  const [m1N,      setM1N]      = useState(6);

  // Mode 2 state
  const [m2Cost,   setM2Cost]   = useState("");
  const [m2Down,   setM2Down]   = useState("");
  const [m2Rate,   setM2Rate]   = useState("10");
  const [m2N,      setM2N]      = useState(6);

  // ── Mode 1 result ──
  const m1Result = (() => {
    const cost   = parseFloat(m1Price)  || 0;
    const travel = parseFloat(m1Travel) || 0;
    if (cost <= 0) return null;
    return calcMethodA(cost, travel, m1N);
  })();

  // ── Mode 2 result ──
  const m2Result = (() => {
    const cost = parseFloat(m2Cost) || 0;
    const down = parseFloat(m2Down) || 0;
    const rate = parseFloat(m2Rate) || 10;
    if (cost <= 0 || cost <= down) return null;
    return calcMethodB(cost, down, m2N, rate);
  })();

  return (
    <section
      id="calculator"
      className="py-20 px-5"
      style={{ background: "linear-gradient(135deg, #0D2B1A 0%, #163a24 100%)" }}
    >
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="text-center mb-10 reveal">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#C9A227] mb-3">
            {t("calc.eyebrow")}
          </span>
          <h2
            className="text-3xl font-bold text-white mb-2"
            style={{ fontFamily: "'Noto Serif Bengali', serif" }}
          >
            {t("calc.title")}
          </h2>
          <p className="text-white/55 text-sm">{t("calc.subtitle")}</p>
        </div>

        {/* Mode tabs — spec: "পদ্ধতি-১: সরাসরি মূল্য" and "পদ্ধতি-২: ডাউনপেমেন্ট ভিত্তিক" */}
        <div className="mb-6 flex gap-3 rounded-2xl bg-white/8 p-1.5">
          <TabBtn active={mode === 1} onClick={() => setMode(1)}>📊 পদ্ধতি-১: সম্পূর্ণ মূল্য ভিত্তিক</TabBtn>
          <TabBtn active={mode === 2} onClick={() => setMode(2)}>💳 পদ্ধতি-২: অর্থায়িত পরিমাণ ভিত্তিক</TabBtn>
        </div>

        <div className="rounded-2xl bg-white/8 backdrop-blur-sm border border-white/10 p-6 md:p-8">

          {/* ── MODE 1 ── */}
          {mode === 1 && (
            <div className="space-y-4">
              <CalcField
                label="পণ্যের বাজারমূল্য (টাকা)"
                value={m1Price}
                onChange={setM1Price}
                placeholder="যেমন: ৫০০০০"
              />
              <CalcField
                label="যাতায়াত খরচ (টাকা)"
                value={m1Travel}
                onChange={setM1Travel}
                placeholder="০"
              />
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1.5">কিস্তির সংখ্যা</label>
                <div className="flex flex-wrap gap-2">
                  {INSTALLMENT_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      onClick={() => setM1N(o.value)}
                      className={cn(
                        "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                        m1N === o.value
                          ? "bg-[#C9A227] text-[#0D2B1A]"
                          : "bg-white/10 text-white/70 hover:bg-white/20"
                      )}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              {m1Result && (
                <div className="mt-5 rounded-xl border border-[#C9A227]/30 bg-[#C9A227]/8 p-5 space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <ResultCard label="মোট বিক্রয়মূল্য" value={formatMoney(m1Result.total)} />
                    <ResultCard label="লাভ (১০%)" value={formatMoney(m1Result.profit)} />
                    <ResultCard label="প্রতি কিস্তি" value={formatMoney(m1Result.perInstall)} />
                    <ResultCard label={`মোট কিস্তি`} value={toBengaliDigits(m1N) + " টি"} />
                  </div>
                  <ScheduleTable
                    rows={m1Result.schedule.map((s) => ({
                      label: toBengaliDigits(s.num) + (s.num === 1 ? " (ডাউনপেমেন্ট)" : " কিস্তি"),
                      amount: formatMoney(s.amount),
                      note: s.num === m1N ? "শেষ কিস্তি (সমন্বয়)" : "",
                    }))}
                  />
                </div>
              )}
            </div>
          )}

          {/* ── MODE 2 ── */}
          {mode === 2 && (
            <div className="space-y-4">
              {/* Shariah note */}
              <div className="flex items-start gap-2 rounded-xl border border-[#C9A227]/30 bg-[#C9A227]/10 px-4 py-3 text-xs text-[#F0D78A]">
                <span className="text-base">📌</span>
                <span>
                  <strong>শরিয়াহ পদ্ধতি:</strong> ডাউনপেমেন্ট বাদে শুধু অর্থায়িত অংশের উপর লাভ ধরা হয়।
                </span>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <CalcField label="পণ্যের ক্রয়মূল্য (টাকা) *" value={m2Cost} onChange={setM2Cost} placeholder="যেমন: ৩০০০০" />
                <CalcField label="ডাউনপেমেন্ট (টাকা)" value={m2Down} onChange={setM2Down} placeholder="যেমন: ১০০০০" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <CalcField label="লাভের হার (%)" value={m2Rate} onChange={setM2Rate} placeholder="১০" />
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1.5">কিস্তির সংখ্যা</label>
                  <div className="flex flex-wrap gap-2">
                    {INSTALLMENT_OPTIONS.map((o) => (
                      <button
                        key={o.value}
                        onClick={() => setM2N(o.value)}
                        className={cn(
                          "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                          m2N === o.value
                            ? "bg-[#C9A227] text-[#0D2B1A]"
                            : "bg-white/10 text-white/70 hover:bg-white/20"
                        )}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {m2Result && (
                <div className="mt-5 rounded-xl border border-[#C9A227]/30 bg-[#C9A227]/8 p-5 space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <ResultCard label="অর্থায়িত পরিমাণ"   value={formatMoney(m2Result.financed)} />
                    <ResultCard label="লাভ (অর্থায়নের উপর)" value={formatMoney(m2Result.profit)} />
                    <ResultCard label="মোট বিক্রয়মূল্য"   value={formatMoney(m2Result.totalSale)} />
                    <ResultCard label="ডাউন বাদে বাকি"    value={formatMoney(m2Result.remaining)} />
                    <ResultCard label="মাসিক কিস্তি"       value={formatMoney(m2Result.perInstall)} />
                    <ResultCard label="মোট কিস্তি"         value={toBengaliDigits(m2N) + " টি"} />
                  </div>
                  <ScheduleTable
                    rows={m2Result.schedule.map((s) => ({
                      label: s.label,
                      amount: formatMoney(s.amount),
                      note: s.note,
                    }))}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ── Sub-components ──────────────────────────────────────

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 rounded-xl py-2.5 text-xs sm:text-sm font-semibold transition-all duration-200",
        active
          ? "bg-[#C9A227] text-[#0D2B1A] shadow-md"
          : "text-white/60 hover:text-white/90 hover:bg-white/10"
      )}
    >
      {children}
    </button>
  );
}

function CalcField({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-white/80 mb-1.5">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#C9A227] focus:border-[#C9A227]"
      />
    </div>
  );
}

function ResultCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/10 p-3 text-center">
      <div className="text-base font-bold text-[#C9A227]">{value}</div>
      <div className="text-[10px] text-white/60 mt-0.5">{label}</div>
    </div>
  );
}

function ScheduleTable({ rows }: { rows: Array<{ label: string; amount: string; note: string }> }) {
  return (
    <div>
      <h4 className="text-xs font-bold text-white/70 uppercase tracking-wider mb-2">কিস্তি সময়সূচী</h4>
      <div className="rounded-xl overflow-hidden border border-white/10">
        <table className="w-full text-xs text-white/80">
          <thead>
            <tr className="bg-white/10 text-white/60">
              <th className="text-left px-3 py-2">কিস্তি</th>
              <th className="text-right px-3 py-2">পরিমাণ</th>
              <th className="text-right px-3 py-2 hidden sm:table-cell">বিবরণ</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className={cn("border-t border-white/5", i % 2 === 0 ? "" : "bg-white/5")}>
                <td className="px-3 py-2">{r.label}</td>
                <td className="px-3 py-2 text-right font-semibold text-[#C9A227]">{r.amount}</td>
                <td className="px-3 py-2 text-right text-white/40 hidden sm:table-cell">{r.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
