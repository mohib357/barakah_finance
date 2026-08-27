"use client";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { useToast } from "@/components/ui/Toast";

type Tab = "member" | "product" | "qard";

const TABS: Array<{ key: Tab; label: string }> = [
  { key: "member",  label: "নতুন সদস্য" },
  { key: "product", label: "পণ্য রিকোয়েস্ট" },
  { key: "qard",    label: "করজে হাসানা" },
];

export default function QuickApply() {
  const [tab, setTab] = useState<Tab>("member");
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  // Shared form state
  const [name, setName]       = useState("");
  const [phone, setPhone]     = useState("");
  const [nid, setNid]         = useState("");
  const [job, setJob]         = useState("");
  const [address, setAddress] = useState("");
  const [product, setProduct] = useState("");
  const [price, setPrice]     = useState("");
  const [amount, setAmount]   = useState("");
  const [startMonth, setStartMonth] = useState("");

  // Quick preview for product tab
  const previewTotal = price ? Math.round(parseFloat(price) * 1.1) : 0;
  const previewInst  = previewTotal ? Math.round(previewTotal / 6) : 0;

  async function handleSubmit() {
    if (!name.trim() || !phone.trim()) {
      showToast("নাম ও মোবাইল নম্বর বাধ্যতামূলক।", "error"); return;
    }
    if (tab === "qard") {
      const a = parseFloat(amount);
      if (!a || a > 15000) { showToast("সর্বোচ্চ ১৫,০০০ টাকা লিখুন।", "error"); return; }
    }

    setSubmitting(true);
    try {
      await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: tab, name, phone,
          ...(tab === "member"  && { nid, profession: job, address }),
          ...(tab === "product" && { product, price }),
          ...(tab === "qard"    && { amount, startMonth }),
        }),
      });
      const msgs: Record<Tab, string> = {
        member:  "✅ সদস্য আবেদন জমা হয়েছে! কমিটি শীঘ্রই যোগাযোগ করবেন।",
        product: "✅ পণ্য রিকোয়েস্ট জমা হয়েছে!",
        qard:    "✅ করজে হাসানা আবেদন জমা হয়েছে!",
      };
      showToast(msgs[tab]);
      setName(""); setPhone(""); setNid(""); setJob(""); setAddress("");
      setProduct(""); setPrice(""); setAmount(""); setStartMonth("");
    } catch {
      showToast("জমা ব্যর্থ।", "error");
    } finally {
      setSubmitting(false);
    }
  }

  const inp = "w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]";

  return (
    <section id="apply" className="py-20 px-5 bg-white dark:bg-[#112214]">
      <div className="mx-auto max-w-2xl">
        <div className="text-center mb-10 reveal">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#1D9E75] mb-3">অনলাইন আবেদন</span>
          <h2 className="text-3xl font-bold text-[#0D2B1A] dark:text-white" style={{ fontFamily: "'Noto Serif Bengali', serif" }}>
            আজই আবেদন করুন
          </h2>
        </div>

        <div className="reveal rounded-2xl border border-[#1D9E75]/20 bg-[#FDFAF3] dark:bg-white/5 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-[#1D9E75]/15">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "flex-1 py-3 text-sm font-semibold transition-colors",
                  tab === t.key
                    ? "border-b-2 border-[#1D9E75] text-[#1D9E75] bg-white dark:bg-white/5"
                    : "text-[#4A5A4A] dark:text-white/50 hover:text-[#1D9E75]"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-7 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#4A5A4A] dark:text-white/60 mb-1">পূর্ণ নাম *</label>
                <input className={inp} value={name} onChange={(e) => setName(e.target.value)} placeholder="আপনার নাম" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#4A5A4A] dark:text-white/60 mb-1">মোবাইল *</label>
                <input className={inp} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXXXXXXXX" />
              </div>
            </div>

            {/* Member fields */}
            {tab === "member" && (
              <>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#4A5A4A] dark:text-white/60 mb-1">NID *</label>
                    <input className={inp} value={nid} onChange={(e) => setNid(e.target.value)} placeholder="NID নম্বর" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#4A5A4A] dark:text-white/60 mb-1">পেশা</label>
                    <input className={inp} value={job} onChange={(e) => setJob(e.target.value)} placeholder="পেশা" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4A5A4A] dark:text-white/60 mb-1">ঠিকানা *</label>
                  <input className={inp} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="বিস্তারিত ঠিকানা" />
                </div>
              </>
            )}

            {/* Product fields */}
            {tab === "product" && (
              <>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#4A5A4A] dark:text-white/60 mb-1">পণ্যের নাম *</label>
                    <input className={inp} value={product} onChange={(e) => setProduct(e.target.value)} placeholder="Samsung Galaxy A55" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#4A5A4A] dark:text-white/60 mb-1">মূল্য (৳) *</label>
                    <input className={inp} type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="৳" />
                  </div>
                </div>
                {previewTotal > 0 && (
                  <div className="rounded-xl border border-[#1D9E75]/20 bg-green-50 px-4 py-2.5 text-xs text-[#065F46]">
                    মোট: <strong>৳{previewTotal.toLocaleString("en-IN")}</strong> &nbsp;|&nbsp;
                    ডাউন: <strong>৳{previewInst.toLocaleString("en-IN")}</strong> &nbsp;|&nbsp;
                    মাসিক: <strong>৳{previewInst.toLocaleString("en-IN")} × ৫</strong>
                  </div>
                )}
              </>
            )}

            {/* Qard fields */}
            {tab === "qard" && (
              <>
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
                  ⚠️ সদস্যদের জন্য। সর্বোচ্চ ১৫,০০০ টাকা। ৩ মাসে পরিশোধযোগ্য।
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#4A5A4A] dark:text-white/60 mb-1">পরিমাণ * (সর্বোচ্চ ১৫,০০০)</label>
                    <input className={inp} type="number" max={15000} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="৳" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#4A5A4A] dark:text-white/60 mb-1">পরিশোধের মাস</label>
                    <input className={inp} type="month" value={startMonth} onChange={(e) => setStartMonth(e.target.value)} />
                  </div>
                </div>
              </>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full rounded-xl bg-[#1D9E75] py-3 text-sm font-semibold text-white hover:bg-[#0F6E56] disabled:opacity-60 transition-colors"
            >
              {submitting ? "জমা হচ্ছে..." : {
                member: "সদস্য আবেদন জমা দিন →",
                product: "পণ্য রিকোয়েস্ট জমা দিন →",
                qard: "করজে হাসানা আবেদন →",
              }[tab]}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
