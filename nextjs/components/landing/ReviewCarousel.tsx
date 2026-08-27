"use client";
import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useLang } from "@/lib/hooks/useLang";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils/cn";

interface Review {
  id: string;
  name: string;
  content: string;
  rating: number;
}

const DEFAULT_REVIEWS: Review[] = [
  { id: "r1", name: "মুহিব্বুল্লাহ আজাদ",  content: "সুদমুক্ত পথে ঋণ পেয়েছি — আলহামদুলিল্লাহ! অসাধারণ সেবা।",                  rating: 5 },
  { id: "r2", name: "আনোয়ার হোসেন",        content: "কিস্তিতে মোটরসাইকেল নিয়েছি। প্রক্রিয়া সহজ ও স্বচ্ছ।",                        rating: 5 },
  { id: "r3", name: "রাকিবুল ইসলাম",       content: "করজে হাসানা পেয়ে বিপদ থেকে রক্ষা পেয়েছি।",                                    rating: 4 },
  { id: "r4", name: "সাইফুল ইসলাম",        content: "হালাল পথে আর্থিক সহায়তা — এটাই দরকার ছিল।",                                    rating: 5 },
  { id: "r5", name: "ফাতেমা বেগম",          content: "ব্যবহার খুবই ভালো। সবাই আন্তরিক ও সহযোগী।",                                    rating: 4 },
  { id: "r6", name: "মাসুম বিল্লাহ",       content: "শরিয়াহ মোতাবেক সব কিছু — মনে শান্তি আছে।",                                    rating: 5 },
];

export default function ReviewCarousel() {
  const { data: session } = useSession();
  const { t } = useLang();
  const { showToast } = useToast();
  const [reviews, setReviews] = useState<Review[]>(DEFAULT_REVIEWS);
  const [paused, setPaused] = useState(false);
  const [text, setText] = useState("");
  const [star, setStar] = useState(0);
  const [anonName, setAnonName] = useState("");
  const [anonPhone, setAnonPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/public/reviews")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setReviews(data);
      })
      .catch(() => {});
  }, []);

  async function handleSubmit() {
    if (!text.trim()) { showToast("মতামত লিখুন।", "error"); return; }
    if (star === 0)    { showToast("স্টার রেটিং দিন।", "error"); return; }

    const user = session?.user;
    let name  = user?.firstName ?? "";
    let phone = user?.phone ?? "";

    if (!user) {
      if (!anonName.trim() || !anonPhone.trim()) {
        showToast("নাম ও মোবাইল নম্বর দিন।", "error"); return;
      }
      name  = anonName.trim();
      phone = anonPhone.trim();
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/public/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, content: text, rating: star, userId: user?.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast("✅ " + (data.message ?? "মতামত জমা হয়েছে!"));
      setText(""); setStar(0); setAnonName(""); setAnonPhone("");
    } catch (e: unknown) {
      showToast((e instanceof Error ? e.message : null) ?? "জমা ব্যর্থ।", "error");
    } finally {
      setSubmitting(false);
    }
  }

  const allReviews = [...reviews, ...reviews]; // duplicate for seamless loop

  return (
    <section id="reviews" className="py-20 overflow-hidden" style={{ background: "#FDFAF3" }}>
      <div className="mx-auto max-w-6xl px-5">
        <div className="text-center mb-10 reveal">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#1D9E75] mb-3">
            {t("review.eyebrow")}
          </span>
          <h2 className="text-3xl font-bold text-[#0D2B1A]" style={{ fontFamily: "'Noto Serif Bengali', serif" }}>
            {t("review.title")}
          </h2>
        </div>

        {/* ── Scrolling Track ── */}
        <div
          className="relative overflow-hidden mb-12"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div
            ref={trackRef}
            className="inline-flex gap-4"
            style={{
              animation: "reviewScroll 40s linear infinite",
              animationPlayState: paused ? "paused" : "running",
            }}
          >
            {allReviews.map((r, i) => (
              <div
                key={`${r.id}-${i}`}
                className="w-72 shrink-0 rounded-2xl border border-[#1D9E75]/15 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-base shrink-0"
                    style={{ background: `hsl(${(r.name.charCodeAt(0) * 37) % 360}, 55%, 40%)` }}
                  >
                    {r.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-[#0D2B1A]">{r.name}</p>
                    <p className="text-[#C9A227] text-sm">
                      {"★".repeat(r.rating ?? 5)}
                      <span className="text-gray-300">{"★".repeat(5 - (r.rating ?? 5))}</span>
                    </p>
                  </div>
                </div>
                <p className="text-sm text-[#4A5A4A] leading-relaxed">
                  &ldquo;{r.content}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Submit Form ── */}
        <div className="mx-auto max-w-lg reveal rounded-2xl border border-[#1D9E75]/20 bg-white p-7 shadow-sm">
          <h3 className="font-bold text-lg text-[#0D2B1A] mb-4">{t("review.submit")}</h3>

          {/* Anon fields — show if not logged in */}
          {!session?.user && (
            <div className="grid sm:grid-cols-2 gap-3 mb-4">
              <input
                value={anonName}
                onChange={(e) => setAnonName(e.target.value)}
                placeholder="আপনার নাম *"
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
              />
              <input
                value={anonPhone}
                onChange={(e) => setAnonPhone(e.target.value)}
                placeholder="মোবাইল নম্বর *"
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
              />
            </div>
          )}

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="আপনার অভিজ্ঞতা লিখুন..."
            rows={3}
            className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75] mb-3"
          />

          {/* Star rating */}
          <div className="flex gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setStar(n)}
                className={cn("text-2xl transition-transform hover:scale-125", n <= star ? "text-[#C9A227]" : "text-gray-300")}
              >
                ★
              </button>
            ))}
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full rounded-xl bg-[#1D9E75] py-2.5 text-sm font-semibold text-white hover:bg-[#0F6E56] disabled:opacity-60 transition-colors"
          >
            {submitting ? "জমা হচ্ছে..." : t("review.btn")}
          </button>
          <p className="mt-2 text-xs text-center text-[#4A5A4A]">{t("review.note")}</p>
        </div>
      </div>

      {/* reviewScroll keyframe is defined in globals.css */}
    </section>
  );
}
