"use client";
// ═══════════════════════════════════════════════════════════
//  BARAKAH FINANCE — Two-Factor Authentication Page
//  Route: /login/2fa
//
//  This page is reached automatically by middleware when:
//    session.twoFARequired === true AND twoFAVerified === false
//
//  Supports:
//    • TOTP (Google Authenticator / Authy) — Super Admin default
//    • SMS OTP — fallback
//
//  On success: calls session.update({ twoFAVerified: true })
//  then redirects to /admin (Super Admin) or /dashboard
//
//  Website.txt spec:
//    "সুপার এডমিনে লগইন করতে প্রত্যেকবার অটিপি দিয়ে লগইন করতে হবে।
//    এখোনে টু-ফেক্টর অথেনটিকেশন চালু রাখা যাবে।"
// ═══════════════════════════════════════════════════════════

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { Spinner } from "@/components/ui/Spinner";

export default function TwoFAPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FDFAF3]">
          <Spinner size="lg" />
        </div>
      }
    >
      <TwoFAInner />
    </Suspense>
  );
}

function TwoFAInner() {
  const router            = useRouter();
  const params            = useSearchParams();
  const { data: session, update } = useSession();
  const isAdminFlow       = params.get("admin") === "1";

  const [code,       setCode]       = useState("");
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [verifying,  setVerifying]  = useState(false);

  // If not logged in at all, redirect to login
  useEffect(() => {
    if (session === null) {
      router.replace("/login");
    }
  }, [session, router]);

  async function verify() {
    if (code.length !== 6) { setError("৬ সংখ্যার কোড দিন।"); return; }
    setVerifying(true); setError("");

    try {
      // Verify TOTP code against the user's stored secret
      const res = await fetch("/api/auth/verify-2fa", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ token: code }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "কোড সঠিক নয়। আবার চেষ্টা করুন।");
        setCode("");
        return;
      }

      // Mark 2FA as verified in the JWT session
      await update({ twoFAVerified: true, twoFARequired: false });

      // Redirect to admin if this was an admin flow, else dashboard
      const dest = isAdminFlow ? "/admin" : (params.get("callbackUrl") ?? "/dashboard");
      router.replace(dest);
    } catch {
      setError("সার্ভার সমস্যা। পরে চেষ্টা করুন।");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFAF3] p-4">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-[#1D9E75]/20 bg-white shadow-xl overflow-hidden">

          {/* Header */}
          <div
            className="p-8 text-center"
            style={{ background: "linear-gradient(135deg,#0D2B1A,#163a24)" }}
          >
            <div className="text-5xl mb-3">🔐</div>
            <h1 className="text-xl font-bold text-white" style={{ fontFamily: "'Noto Serif Bengali', serif" }}>
              দুই-ধাপ যাচাইকরণ
            </h1>
            <p className="text-xs text-[#C9A227] mt-1">Two-Factor Authentication</p>
          </div>

          <div className="p-7 space-y-5">
            <div className="text-center text-sm text-gray-600">
              <p>আপনার Authenticator App (Google Authenticator / Authy) থেকে</p>
              <p className="font-semibold text-[#0D2B1A] mt-1">৬ সংখ্যার TOTP কোড দিন।</p>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Digit boxes display */}
            <div className="flex justify-center gap-2">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "h-12 w-10 rounded-xl border-2 flex items-center justify-center text-xl font-bold transition-colors",
                    code[i]
                      ? "border-[#1D9E75] text-[#0D2B1A] bg-[#E1F5EE]"
                      : "border-gray-200 text-transparent"
                  )}
                >
                  {code[i] ?? "•"}
                </div>
              ))}
            </div>

            {/* Actual input */}
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => {
                setError("");
                const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                setCode(v);
                if (v.length === 6) {
                  // Auto-submit when 6 digits entered
                  setTimeout(() => {
                    const btn = document.getElementById("verify-btn") as HTMLButtonElement;
                    btn?.click();
                  }, 100);
                }
              }}
              onKeyDown={(e) => { if (e.key === "Enter") verify(); }}
              placeholder="000000"
              autoFocus
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-center text-2xl tracking-[0.5em] font-bold focus:outline-none focus:ring-2 focus:ring-[#1D9E75] focus:border-[#1D9E75]"
            />

            <button
              id="verify-btn"
              onClick={verify}
              disabled={verifying || loading || code.length !== 6}
              className="w-full rounded-xl bg-[#1D9E75] py-3 text-sm font-semibold text-white hover:bg-[#0F6E56] disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
            >
              {verifying && <Spinner size="sm" />}
              ✅ যাচাই করুন
            </button>

            {/* Help text */}
            <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-xs text-amber-700 space-y-1">
              <p className="font-semibold">TOTP কোড পাচ্ছেন না?</p>
              <p>১. Google Authenticator বা Authy অ্যাপ খুলুন।</p>
              <p>২. "Barakah Finance" এন্ট্রি খুঁজুন।</p>
              <p>৩. বর্তমান ৬ সংখ্যার কোড দিন (প্রতি ৩০ সেকেন্ডে পরিবর্তন হয়)।</p>
            </div>

            <div className="text-center text-xs">
              <Link href="/login" className="text-[#1D9E75] hover:underline">
                ← লগইনে ফিরে যান
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
