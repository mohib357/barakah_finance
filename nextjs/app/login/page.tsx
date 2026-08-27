"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";

type Panel = "login" | "signup" | "otp" | "forgot" | "reset";

// ── OTP Timer ──────────────────────────────────────────────
function useOTPTimer(seconds = 120) {
  const [remaining, setRemaining] = useState(seconds);
  const [running, setRunning]     = useState(false);

  function start() { setRemaining(seconds); setRunning(true); }

  useEffect(() => {
    if (!running) return;
    if (remaining <= 0) { setRunning(false); return; }
    const t = setTimeout(() => setRemaining((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [running, remaining]);

  return { remaining, running, start, expired: remaining <= 0 };
}

// ── Username availability ──────────────────────────────────
function useUsernameCheck() {
  const [status, setStatus] = useState<"idle" | "checking" | "ok" | "taken">("idle");
  const [msg, setMsg]       = useState("");
  const timerRef            = useRef<ReturnType<typeof setTimeout>>();

  const check = useCallback((value: string) => {
    clearTimeout(timerRef.current);
    if (!value || value.length < 3) { setStatus("idle"); return; }
    setStatus("checking");
    timerRef.current = setTimeout(async () => {
      const res  = await fetch(`/api/auth/check-username?u=${encodeURIComponent(value)}`);
      const data = await res.json();
      setStatus(data.available ? "ok" : "taken");
      setMsg(data.message ?? "");
    }, 400);
  }, []);

  return { status, msg, check };
}

// ──────────────────────────────────────────────────────────
// Main page
// ──────────────────────────────────────────────────────────
export default function LoginPage() {
  return (
    <ToastProvider>
      <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-[#1D9E75] rounded-full border-t-transparent" /></div>}>
        <LoginPageInner />
      </React.Suspense>
    </ToastProvider>
  );
}

function LoginPageInner() {
  const router       = useRouter();
  const params       = useSearchParams();
  const { showToast } = useToast();
  const timer         = useOTPTimer(120);
  const unameCheck    = useUsernameCheck();

  // Determine initial panel from ?tab=signup
  const initialPanel = (params.get("tab") === "signup" ? "signup" : "login") as Panel;
  const [panel, setPanel]     = useState<Panel>(initialPanel);
  const [loading, setLoading] = useState(false);
  const [err, setErr]         = useState("");
  const [ok, setOk]           = useState("");

  // Login form
  const [liId, setLiId] = useState("");
  const [liPw, setLiPw] = useState("");
  const [liSee, setLiSee] = useState(false);

  // Signup form
  const [suFirst, setSuFirst]   = useState("");
  const [suLast, setSuLast]     = useState("");
  const [suDob, setSuDob]       = useState("");
  const [suUser, setSuUser]     = useState("");
  const [suPhone, setSuPhone]   = useState("");
  const [suEmail, setSuEmail]   = useState("");
  const [suPw, setSuPw]         = useState("");
  const [suPw2, setSuPw2]       = useState("");
  const [suPwSee, setSuPwSee]   = useState(false);
  const [suTerms, setSuTerms]   = useState(false);

  // OTP
  const [otpPhone, setOtpPhone] = useState("");
  const [otpCode, setOtpCode]   = useState("");
  const [otpPurpose, setOtpPurpose] = useState<"signup" | "password_reset">("signup");

  // Forgot / reset
  const [fpPhone, setFpPhone] = useState("");
  const [rpCode, setRpCode]   = useState("");
  const [rpPw, setRpPw]       = useState("");
  const [rpPw2, setRpPw2]     = useState("");

  function alert(msg: string, type?: "ok" | "err") {
    if (type === "ok") { setOk(msg); setErr(""); }
    else               { setErr(msg); setOk(""); }
  }

  // Auto-generate username from first name
  useEffect(() => {
    if (!suFirst) return;
    const base = suFirst.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 10) || "user";
    const candidate = base + Math.floor(Math.random() * 900 + 100);
    setSuUser(candidate);
    unameCheck.check(candidate);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suFirst]);

  function switchPanel(p: Panel) {
    setPanel(p); setErr(""); setOk("");
  }

  // ── LOGIN ──────────────────────────────────────────────
  async function doLogin() {
    if (!liId || !liPw) { alert("সব তথ্য পূরণ করুন।"); return; }
    setLoading(true);
    const res = await signIn("credentials", {
      identifier: liId, password: liPw, redirect: false,
    });
    setLoading(false);
    if (!res?.ok) {
      const msg = res?.error ?? "লগইন ব্যর্থ।";
      // Handle NextAuth error codes
      alert(
        msg === "CredentialsSignin"
          ? "ভুল আইডি বা পাসওয়ার্ড।"
          : decodeURIComponent(msg)
      );
      return;
    }
    // Redirect
    const cb = params.get("callbackUrl") ?? "/dashboard";
    router.replace(cb);
  }

  // ── SIGNUP ─────────────────────────────────────────────
  async function doSignup() {
    if (!suFirst || !suPhone || !suUser || !suPw || !suPw2) {
      alert("তারকা চিহ্নিত সব তথ্য পূরণ করুন।"); return;
    }
    if (suPw !== suPw2)    { alert("পাসওয়ার্ড মিলছে না।"); return; }
    if (!suTerms)          { alert("শর্তাবলীতে সম্মতি দিন।"); return; }
    if (unameCheck.status === "taken") { alert("এই ইউজারনেম নেওয়া হয়েছে।"); return; }

    setLoading(true);
    try {
      const res  = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: suFirst, lastName: suLast, dob: suDob,
          username: suUser, phone: suPhone, email: suEmail || undefined, password: suPw,
        }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error ?? "নিবন্ধন ব্যর্থ।"); return; }

      setOtpPhone(suPhone);
      setOtpPurpose("signup");
      timer.start();

      const msg = data.demo_otp
        ? `ডেমো OTP: ${data.demo_otp}` // dev only
        : "আপনার মোবাইলে OTP পাঠানো হয়েছে।";
      alert(msg, "ok");
      switchPanel("otp");
    } catch {
      alert("সার্ভার সমস্যা। পরে চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  }

  // ── VERIFY OTP ─────────────────────────────────────────
  async function doVerifyOTP() {
    if (otpCode.length !== 6) { alert("৬ সংখ্যার OTP দিন।"); return; }
    setLoading(true);
    try {
      const res  = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: otpPhone, code: otpCode, purpose: otpPurpose }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error ?? "OTP ভুল।"); return; }

      if (otpPurpose === "signup") {
        showToast("✅ নিবন্ধন সফল! লগইন করুন।");
        switchPanel("login");
      } else {
        switchPanel("reset");
      }
    } catch {
      alert("সার্ভার সমস্যা।");
    } finally {
      setLoading(false);
    }
  }

  // ── FORGOT PASSWORD ────────────────────────────────────
  async function doForgot() {
    if (!fpPhone || fpPhone.length < 10) { alert("সঠিক মোবাইল নম্বর দিন।"); return; }
    setLoading(true);
    try {
      const res  = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fpPhone }),
      });
      const data = await res.json();
      const msg = data.demo_otp ? `ডেমো OTP: ${data.demo_otp}` : "OTP পাঠানো হয়েছে।";
      alert(msg, "ok");
      setOtpPhone(fpPhone);
      setOtpPurpose("password_reset");
      timer.start();
      switchPanel("otp");
    } catch {
      alert("সার্ভার সমস্যা।");
    } finally {
      setLoading(false);
    }
  }

  // ── RESET PASSWORD ─────────────────────────────────────
  async function doReset() {
    if (rpPw !== rpPw2) { alert("পাসওয়ার্ড মিলছে না।"); return; }
    if (!rpCode || !rpPw) { alert("সব তথ্য পূরণ করুন।"); return; }
    setLoading(true);
    try {
      const res  = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fpPhone || otpPhone, code: rpCode, newPassword: rpPw }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error ?? "পাসওয়ার্ড রিসেট ব্যর্থ।"); return; }
      showToast("✅ পাসওয়ার্ড পরিবর্তন হয়েছে। লগইন করুন।");
      switchPanel("login");
    } catch {
      alert("সার্ভার সমস্যা।");
    } finally {
      setLoading(false);
    }
  }

  // ── RESEND OTP ─────────────────────────────────────────
  async function doResend() {
    if (timer.running) return;
    setLoading(true);
    try {
      const endpoint = otpPurpose === "signup" ? "/api/auth/signup" : "/api/auth/forgot-password";
      const body = otpPurpose === "signup"
        ? { firstName: suFirst, lastName: suLast, dob: suDob, username: suUser, phone: suPhone, email: suEmail || undefined, password: suPw }
        : { phone: otpPhone };

      const res  = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      const msg = data.demo_otp ? `ডেমো OTP: ${data.demo_otp}` : "OTP পুনরায় পাঠানো হয়েছে।";
      alert(msg, "ok");
      timer.start();
    } catch {
      alert("পুনরায় পাঠাতে ব্যর্থ।");
    } finally {
      setLoading(false);
    }
  }

  const labelCls = "block text-sm font-medium text-[#0D2B1A] mb-1.5";
  const inputCls = "w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75] focus:border-[#1D9E75] transition-all";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFAF3] p-4">
      <div className="w-full max-w-md">

        {/* Card */}
        <div className="rounded-2xl border border-[#1D9E75]/20 bg-white shadow-xl overflow-hidden">

          {/* Header */}
          <div
            className="p-8 text-center"
            style={{ background: "linear-gradient(135deg,#0D2B1A,#163a24)" }}
          >
            <div className="mx-auto mb-3 h-14 w-14 rounded-full ring-2 ring-[#C9A227] overflow-hidden relative">
              <Image src="/image/logo.png" alt="logo" fill className="object-cover" sizes="56px"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-xl font-bold text-[#C9A227]">ব</div>
            </div>
            <h1 className="text-xl font-bold text-white" style={{ fontFamily: "'Noto Serif Bengali', serif" }}>
              বারাকাহ ফাইন্যান্স
            </h1>
            <p className="text-xs text-[#C9A227] mt-1">সুদমুক্ত লেনদেনে সমৃদ্ধি সবার</p>
          </div>

          {/* Tabs — only for login/signup */}
          {(panel === "login" || panel === "signup") && (
            <div className="flex border-b border-gray-100">
              <TabBtn active={panel === "login"}  onClick={() => switchPanel("login")}>লগইন</TabBtn>
              <TabBtn active={panel === "signup"} onClick={() => switchPanel("signup")}>নিবন্ধন</TabBtn>
            </div>
          )}

          <div className="p-7">
            {/* Alert */}
            {(err || ok) && (
              <div className={cn(
                "mb-4 rounded-xl px-4 py-3 text-sm",
                err ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"
              )}>
                {err || ok}
              </div>
            )}

            {/* ── LOGIN ── */}
            {panel === "login" && (
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>মোবাইল / ইমেইল / ইউজারনেম *</label>
                  <input className={inputCls} value={liId} onChange={(e) => setLiId(e.target.value)} placeholder="01XXXXXXXXX বা username" />
                </div>
                <div>
                  <label className={labelCls}>পাসওয়ার্ড *</label>
                  <div className="relative">
                    <input className={inputCls + " pr-11"} type={liSee ? "text" : "password"} value={liPw}
                      onChange={(e) => setLiPw(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") doLogin(); }}
                      placeholder="••••••••"
                    />
                    <button type="button" onClick={() => setLiSee((p) => !p)}
                      className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                    >{liSee ? "🙈" : "👁"}</button>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button onClick={() => switchPanel("forgot")} className="text-xs text-[#065F46] underline">
                    পাসওয়ার্ড ভুলে গেছেন?
                  </button>
                </div>
                <button onClick={doLogin} disabled={loading}
                  className="w-full rounded-xl bg-[#1D9E75] py-3 text-sm font-semibold text-white hover:bg-[#0F6E56] disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
                >
                  {loading && <Spinner size="sm" />} 🔑 লগইন করুন
                </button>
              </div>
            )}

            {/* ── SIGNUP ── */}
            {panel === "signup" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>নাম *</label>
                    <input className={inputCls} value={suFirst} onChange={(e) => setSuFirst(e.target.value)} placeholder="প্রথম নাম" />
                  </div>
                  <div>
                    <label className={labelCls}>উপনাম</label>
                    <input className={inputCls} value={suLast} onChange={(e) => setSuLast(e.target.value)} placeholder="শেষ নাম" />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>জন্ম তারিখ *</label>
                  <input className={inputCls} type="date" value={suDob} onChange={(e) => setSuDob(e.target.value)} />
                </div>

                <div>
                  <label className={labelCls}>ইউজারনেম *</label>
                  <input
                    className={cn(inputCls,
                      unameCheck.status === "ok"    && "border-green-400 ring-green-400",
                      unameCheck.status === "taken" && "border-red-400 ring-red-400"
                    )}
                    value={suUser}
                    onChange={(e) => { setSuUser(e.target.value); unameCheck.check(e.target.value); }}
                    placeholder="username"
                  />
                  {unameCheck.status !== "idle" && (
                    <p className={cn("text-xs mt-1", unameCheck.status === "ok" ? "text-green-600" : unameCheck.status === "taken" ? "text-red-500" : "text-gray-400")}>
                      {unameCheck.status === "checking" ? "পরীক্ষা করা হচ্ছে..." : unameCheck.msg}
                    </p>
                  )}
                </div>

                <div>
                  <label className={labelCls}>মোবাইল নম্বর *</label>
                  <input className={inputCls} type="tel" value={suPhone} onChange={(e) => setSuPhone(e.target.value)} placeholder="01XXXXXXXXX" />
                </div>

                <div>
                  <label className={labelCls}>ইমেইল (ঐচ্ছিক)</label>
                  <input className={inputCls} type="email" value={suEmail} onChange={(e) => setSuEmail(e.target.value)} placeholder="email@example.com" />
                </div>

                <div>
                  <label className={labelCls}>পাসওয়ার্ড * (৮+ অক্ষর, সংখ্যা ও লেটার)</label>
                  <div className="relative">
                    <input className={inputCls + " pr-11"} type={suPwSee ? "text" : "password"} value={suPw} onChange={(e) => setSuPw(e.target.value)} placeholder="••••••••" />
                    <button type="button" onClick={() => setSuPwSee((p) => !p)} className="absolute inset-y-0 right-3 flex items-center text-gray-400">{suPwSee ? "🙈" : "👁"}</button>
                  </div>
                </div>

                <div>
                  <label className={labelCls}>পাসওয়ার্ড নিশ্চিতকরণ *</label>
                  <input className={cn(inputCls, suPw2 && suPw !== suPw2 && "border-red-400")} type="password" value={suPw2} onChange={(e) => setSuPw2(e.target.value)} placeholder="••••••••" />
                  {suPw2 && suPw !== suPw2 && <p className="text-xs text-red-500 mt-1">পাসওয়ার্ড মিলছে না।</p>}
                </div>

                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" checked={suTerms} onChange={(e) => setSuTerms(e.target.checked)} className="mt-0.5 rounded border-gray-300" />
                  <span className="text-xs text-gray-600">
                    আমি{" "}
                    <button type="button" className="text-[#065F46] underline">শর্তাবলী</button>
                    {" "}পড়েছি ও সম্মত আছি।
                  </span>
                </label>

                <button onClick={doSignup} disabled={loading || unameCheck.status === "taken"}
                  className="w-full rounded-xl bg-[#1D9E75] py-3 text-sm font-semibold text-white hover:bg-[#0F6E56] disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
                >
                  {loading && <Spinner size="sm" />} 📝 নিবন্ধন করুন
                </button>
              </div>
            )}

            {/* ── OTP ── */}
            {panel === "otp" && (
              <div className="space-y-5">
                <div className="text-center">
                  <p className="text-2xl mb-2">📱</p>
                  <p className="text-sm text-gray-600">
                    <strong>{otpPhone}</strong> নম্বরে ৬ সংখ্যার OTP পাঠানো হয়েছে।
                  </p>
                </div>

                <div>
                  <label className={labelCls}>OTP কোড *</label>
                  <input
                    className={cn(inputCls, "text-center text-2xl tracking-[0.5em] font-bold")}
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="000000"
                    inputMode="numeric"
                  />
                </div>

                <button onClick={doVerifyOTP} disabled={loading}
                  className="w-full rounded-xl bg-[#1D9E75] py-3 text-sm font-semibold text-white hover:bg-[#0F6E56] disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading && <Spinner size="sm" />} ✅ যাচাই করুন
                </button>

                <div className="text-center text-xs text-gray-500">
                  {timer.running
                    ? <span>পুনরায় পাঠান: {Math.floor(timer.remaining / 60)}:{String(timer.remaining % 60).padStart(2, "0")}</span>
                    : <button onClick={doResend} className="text-[#065F46] underline">পুনরায় OTP পাঠান</button>
                  }
                </div>
              </div>
            )}

            {/* ── FORGOT PASSWORD ── */}
            {panel === "forgot" && (
              <div className="space-y-4">
                <div className="text-center mb-2">
                  <p className="text-xl mb-1">🔐</p>
                  <p className="font-semibold text-[#0D2B1A]">পাসওয়ার্ড পুনরুদ্ধার</p>
                  <p className="text-xs text-gray-500 mt-1">আপনার মোবাইল নম্বর দিন। OTP পাঠানো হবে।</p>
                </div>
                <div>
                  <label className={labelCls}>মোবাইল নম্বর *</label>
                  <input className={inputCls} type="tel" value={fpPhone} onChange={(e) => setFpPhone(e.target.value)} placeholder="01XXXXXXXXX" />
                </div>
                <button onClick={doForgot} disabled={loading}
                  className="w-full rounded-xl bg-[#1D9E75] py-3 text-sm font-semibold text-white hover:bg-[#0F6E56] disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading && <Spinner size="sm" />} OTP পাঠান
                </button>
                <button onClick={() => switchPanel("login")} className="w-full text-center text-xs text-[#065F46] underline">
                  লগইনে ফিরে যান
                </button>
              </div>
            )}

            {/* ── RESET PASSWORD ── */}
            {panel === "reset" && (
              <div className="space-y-4">
                <div className="text-center mb-2">
                  <p className="text-xl mb-1">🔑</p>
                  <p className="font-semibold text-[#0D2B1A]">নতুন পাসওয়ার্ড সেট করুন</p>
                </div>
                <div>
                  <label className={labelCls}>OTP কোড *</label>
                  <input className={cn(inputCls, "text-center tracking-[0.5em] font-bold text-xl")} maxLength={6}
                    value={rpCode} onChange={(e) => setRpCode(e.target.value.replace(/\D/g, ""))} placeholder="000000" inputMode="numeric" />
                </div>
                <div>
                  <label className={labelCls}>নতুন পাসওয়ার্ড *</label>
                  <input className={inputCls} type="password" value={rpPw} onChange={(e) => setRpPw(e.target.value)} placeholder="নতুন পাসওয়ার্ড" />
                </div>
                <div>
                  <label className={labelCls}>পুনরায় পাসওয়ার্ড *</label>
                  <input className={cn(inputCls, rpPw2 && rpPw !== rpPw2 && "border-red-400")} type="password" value={rpPw2} onChange={(e) => setRpPw2(e.target.value)} placeholder="পুনরায় লিখুন" />
                </div>
                <button onClick={doReset} disabled={loading}
                  className="w-full rounded-xl bg-[#1D9E75] py-3 text-sm font-semibold text-white hover:bg-[#0F6E56] disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading && <Spinner size="sm" />} পাসওয়ার্ড পরিবর্তন করুন
                </button>
              </div>
            )}
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-gray-500">
          <Link href="/" className="text-[#1D9E75] hover:underline">← মূল পেজে ফিরে যান</Link>
        </p>
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={cn(
        "flex-1 py-3 text-sm font-semibold transition-colors",
        active
          ? "border-b-2 border-[#1D9E75] text-[#1D9E75]"
          : "text-gray-500 hover:text-[#1D9E75]"
      )}
    >{children}</button>
  );
}
