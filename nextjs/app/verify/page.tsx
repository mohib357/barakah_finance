"use client";
import { Suspense, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { Spinner } from "@/components/ui/Spinner";
import { ToastProvider, useToast } from "@/components/ui/Toast";

export default function VerifyPage() {
  return (
    <ToastProvider>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-[#1D9E75] rounded-full border-t-transparent" />
          </div>
        }
      >
        <VerifyInner />
      </Suspense>
    </ToastProvider>
  );
}

function VerifyInner() {
  const router       = useRouter();
  const params       = useSearchParams();
  const { showToast } = useToast();

  const phone   = params.get("phone")   ?? "";
  const purpose = (params.get("purpose") ?? "signup") as "signup" | "password_reset";

  const [code,      setCode]      = useState("");
  const [loading,   setLoading]   = useState(false);
  const [err,       setErr]       = useState("");
  const [remaining, setRemaining] = useState(120);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setRemaining((p) => {
        if (p <= 1) { clearInterval(timerRef.current); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const mins = Math.floor(remaining / 60);
  const secs = String(remaining % 60).padStart(2, "0");

  async function verify() {
    if (code.length !== 6) { setErr("৬ সংখ্যার OTP দিন।"); return; }
    setLoading(true);
    try {
      const res  = await fetch("/api/auth/verify-otp", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ phone, code, purpose }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error ?? "OTP ভুল।"); return; }
      showToast("✅ যাচাইকরণ সফল!");
      router.replace(purpose === "signup" ? "/login" : "/login?reset=1");
    } catch {
      setErr("সার্ভার সমস্যা।");
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    if (remaining > 0) return;
    const endpoint = purpose === "signup" ? "/api/auth/signup" : "/api/auth/forgot-password";
    try {
      await fetch(endpoint, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ phone }),
      });
      setRemaining(120);
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setRemaining((p) => { if (p <= 1) { clearInterval(timerRef.current); return 0; } return p - 1; });
      }, 1000);
      showToast("OTP পুনরায় পাঠানো হয়েছে।");
    } catch {
      setErr("পুনরায় পাঠাতে ব্যর্থ।");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFAF3] p-4">
      <div className="w-full max-w-sm rounded-2xl border border-[#1D9E75]/20 bg-white shadow-xl p-8">
        <div className="text-center mb-7">
          <span className="text-4xl">📱</span>
          <h1 className="mt-3 text-xl font-bold text-[#0D2B1A]">OTP যাচাইকরণ</h1>
          {phone && (
            <p className="text-sm text-gray-500 mt-1">
              <strong className="text-[#0D2B1A]">{phone}</strong> নম্বরে পাঠানো ৬ সংখ্যার কোড দিন।
            </p>
          )}
        </div>

        {err && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {err}
          </div>
        )}

        {/* Digit display boxes */}
        <div className="flex justify-center gap-2 mb-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={cn(
                "h-12 w-10 rounded-xl border-2 flex items-center justify-center text-xl font-bold",
                code[i] ? "border-[#1D9E75] text-[#0D2B1A]" : "border-gray-200 text-transparent",
              )}
            >
              {code[i] ?? "•"}
            </div>
          ))}
        </div>

        {/* Real input */}
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={(e) => { setErr(""); setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); }}
          onKeyDown={(e) => { if (e.key === "Enter") verify(); }}
          placeholder="000000"
          autoFocus
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-center text-2xl tracking-[0.5em] font-bold focus:outline-none focus:ring-2 focus:ring-[#1D9E75] mb-4"
        />

        <button
          onClick={verify}
          disabled={loading || code.length !== 6}
          className="w-full rounded-xl bg-[#1D9E75] py-3 text-sm font-semibold text-white hover:bg-[#0F6E56] disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
        >
          {loading && <Spinner size="sm" />}
          ✅ যাচাই করুন
        </button>

        <div className="mt-4 text-center text-xs text-gray-500">
          {remaining > 0 ? (
            <span>কোড মেয়াদ: <strong className="text-[#0D2B1A]">{mins}:{secs}</strong></span>
          ) : (
            <button onClick={resend} className="text-[#065F46] underline font-medium">
              পুনরায় OTP পাঠান
            </button>
          )}
        </div>

        <div className="mt-5 text-center text-xs">
          <Link href="/login" className="text-[#1D9E75] hover:underline">
            ← লগইনে ফিরে যান
          </Link>
        </div>
      </div>
    </div>
  );
}
