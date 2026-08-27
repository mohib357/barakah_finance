"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "@/lib/hooks/useTheme";
import { useLang } from "@/lib/hooks/useLang";
import { cn } from "@/lib/utils/cn";

// ── Lang flag map ────────────────────────────────────────
const LANG_OPTIONS = [
  { code: "bn", flag: "🇧🇩", label: "বাংলা" },
  { code: "en", flag: "🇬🇧", label: "English" },
  { code: "ar", flag: "🇸🇦", label: "العربية" },
] as const;

export default function Navbar() {
  const { data: session } = useSession();
  const { dark, toggle: toggleDark } = useTheme();
  const { lang, setLang, t } = useLang();

  const [mobileOpen, setMobileOpen]   = useState(false);
  const [authDropOpen, setAuthDropOpen] = useState(false);
  const [langDropOpen, setLangDropOpen] = useState(false);
  const [userDropOpen, setUserDropOpen] = useState(false);
  const [visitor, setVisitor]         = useState<string>("—");
  const [scrolled, setScrolled]       = useState(false);

  const authRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Sticky nav shadow on scroll
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (authRef.current && !authRef.current.contains(e.target as Node)) setAuthDropOpen(false);
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangDropOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserDropOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Simulated visitor counter (Phase 2 — replace with real WebSocket or polling)
  useEffect(() => {
    setVisitor(String(Math.floor(Math.random() * 18) + 3));
    const iv = setInterval(() => {
      setVisitor(String(Math.floor(Math.random() * 18) + 3));
    }, 30_000);
    return () => clearInterval(iv);
  }, []);

  const user = session?.user;
  const isAdmin = user?.systemRole === "ADMIN" || user?.systemRole === "SUPER_ADMIN";

  const currentLang = LANG_OPTIONS.find((l) => l.code === lang) ?? LANG_OPTIONS[0];

  function scrollTo(id: string) {
    setMobileOpen(false);
    const el = document.getElementById(id);
    if (!el) return;
    const nav = document.querySelector("nav");
    const offset = (nav?.offsetHeight ?? 80) + 20;
    window.scrollTo({ top: el.offsetTop - offset, behavior: "smooth" });
  }

  function handleLogout() {
    signOut({ callbackUrl: "/" });
  }

  return (
    <>
      {/* ── Main Nav ── */}
      <nav
        className={cn(
          "fixed top-0 inset-x-0 z-40 transition-shadow duration-200",
          "bg-[#0D2B1A] text-white",
          scrolled && "shadow-[0_2px_20px_rgba(0,0,0,0.35)]"
        )}
      >
        <div className="mx-auto flex h-[70px] max-w-[1400px] items-center justify-between px-4 md:px-6">

          {/* ── Logo ── */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <div className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-[#C9A227]">
              <Image src="/image/logo.png" alt="Barakah Finance Logo" fill className="object-cover" sizes="40px"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-[#C9A227] bg-[#0D2B1A]">
                ব
              </span>
            </div>
            <div className="hidden sm:flex flex-col leading-tight">
              <strong className="text-sm font-bold text-white whitespace-nowrap">
                বারাকাহ ফাইন্যান্স – Barakah Finance
              </strong>
              <span className="text-[10px] text-[#C9A227] font-medium tracking-wide">
                সুদমুক্ত লেনদেনে সমৃদ্ধি সবার
              </span>
            </div>
          </Link>

          {/* ── Desktop Nav Links ── */}
          <ul className="hidden lg:flex items-center gap-1 text-sm">
            <NavLink onClick={() => scrollTo("about")}>{t("nav.about")}</NavLink>
            <NavLink onClick={() => scrollTo("calculator")}>{t("nav.calculator")}</NavLink>
            <NavLink href="/timeline">{t("nav.timeline")}</NavLink>
            <NavLink href="/gallery">{t("nav.gallery")}</NavLink>
            <NavLink href="/apply">{t("nav.apply")}</NavLink>
            {isAdmin && <NavLink href="/admin">🛡️ অ্যাডমিন</NavLink>}
          </ul>

          {/* ── Right Controls ── */}
          <div className="flex items-center gap-2">

            {/* Visitor counter */}
            <div className="hidden md:flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs">
              <span className="h-2 w-2 rounded-full bg-green-400 animate-blink" />
              <span>{visitor}</span>
            </div>

            {/* Dark mode toggle */}
            <button
              onClick={toggleDark}
              title={dark ? t("nav.lightMode") : t("nav.darkMode")}
              className={cn(
                "relative h-7 w-13 rounded-full transition-colors duration-300 px-1 flex items-center",
                dark ? "bg-[#C9A227]" : "bg-white/20"
              )}
              style={{ width: "48px" }}
            >
              <span
                className={cn(
                  "absolute h-5 w-5 rounded-full bg-white shadow transition-transform duration-300 flex items-center justify-center text-xs",
                  dark ? "translate-x-[22px]" : "translate-x-0"
                )}
              >
                {dark ? "🌙" : "☀️"}
              </span>
            </button>

            {/* Language switcher */}
            <div ref={langRef} className="relative">
              <button
                onClick={() => setLangDropOpen((p) => !p)}
                className="flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs hover:bg-white/20 transition-colors"
              >
                <span>{currentLang.flag}</span>
                <span className="hidden sm:inline">{currentLang.label}</span>
                <ChevronIcon />
              </button>
              {langDropOpen && (
                <div className="absolute right-0 top-full mt-1 w-36 rounded-xl bg-[#0D2B1A] border border-white/10 shadow-xl overflow-hidden z-50">
                  {LANG_OPTIONS.map((lo) => (
                    <button
                      key={lo.code}
                      onClick={() => { setLang(lo.code); setLangDropOpen(false); }}
                      className={cn(
                        "w-full flex items-center gap-2 px-4 py-2.5 text-sm text-white hover:bg-white/10 transition-colors",
                        lang === lo.code && "bg-white/15 font-semibold"
                      )}
                    >
                      <span>{lo.flag}</span>
                      <span>{lo.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Auth: show user menu if logged in, else login/signup dropdown */}
            {user ? (
              <div ref={userRef} className="relative">
                <button
                  onClick={() => setUserDropOpen((p) => !p)}
                  className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20 transition-colors"
                >
                  <div className="h-6 w-6 rounded-full bg-[#1D9E75] flex items-center justify-center text-xs font-bold">
                    {user.firstName?.[0] ?? "?"}
                  </div>
                  <span className="hidden md:inline max-w-[80px] truncate">{user.firstName}</span>
                  <ChevronIcon />
                </button>
                {userDropOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 rounded-xl bg-[#0D2B1A] border border-white/10 shadow-xl overflow-hidden z-50">
                    <div className="px-4 py-2.5 border-b border-white/10">
                      <p className="font-semibold text-sm text-white truncate">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-white/50">{user.phone ?? user.email}</p>
                    </div>
                    <DropLink href="/dashboard">📊 {t("nav.dashboard")}</DropLink>
                    <DropLink href="/profile">📋 {t("nav.profile")}</DropLink>
                    {isAdmin && <DropLink href="/admin">🛡️ অ্যাডমিন</DropLink>}
                    <hr className="border-white/10 my-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-white/10 transition-colors"
                    >
                      🚪 {t("nav.logout")}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // ── SPEC: login and signup MUST be SEPARATE items ──
              <div ref={authRef} className="relative">
                <button
                  onClick={() => setAuthDropOpen((p) => !p)}
                  className="flex items-center gap-1.5 rounded-xl bg-[#1D9E75] px-3 py-1.5 text-sm font-medium hover:bg-[#0F6E56] transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                  </svg>
                  <span className="hidden sm:inline">{t("nav.account")}</span>
                  <ChevronIcon />
                </button>
                {authDropOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 rounded-xl bg-[#0D2B1A] border border-white/10 shadow-xl overflow-hidden z-50">
                    {/* LOGIN — separate item */}
                    <Link
                      href="/login"
                      onClick={() => setAuthDropOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
                        <polyline points="10 17 15 12 10 7" />
                        <line x1="15" y1="12" x2="3" y2="12" />
                      </svg>
                      {t("nav.login")}
                    </Link>
                    {/* SIGNUP — separate item */}
                    <Link
                      href="/login?tab=signup"
                      onClick={() => setAuthDropOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors border-t border-white/10"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <line x1="19" y1="8" x2="19" y2="14" />
                        <line x1="22" y1="11" x2="16" y2="11" />
                      </svg>
                      {t("nav.signup")}
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Hamburger */}
            <button
              onClick={() => setMobileOpen((p) => !p)}
              className="lg:hidden flex flex-col justify-center gap-[5px] p-2 rounded-lg hover:bg-white/10"
              aria-label="মেনু"
            >
              <span className={cn("block h-0.5 w-5 bg-white transition-transform", mobileOpen && "translate-y-[7px] rotate-45")} />
              <span className={cn("block h-0.5 w-5 bg-white transition-opacity", mobileOpen && "opacity-0")} />
              <span className={cn("block h-0.5 w-5 bg-white transition-transform", mobileOpen && "-translate-y-[7px] -rotate-45")} />
            </button>
          </div>
        </div>

        {/* ── Mobile Menu ── */}
        <div
          className={cn(
            "lg:hidden overflow-hidden transition-all duration-300 border-t border-white/10",
            mobileOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="flex flex-col py-2 px-4 gap-1">
            <MobileLink onClick={() => scrollTo("about")}>{t("nav.about")}</MobileLink>
            <MobileLink onClick={() => scrollTo("calculator")}>{t("nav.calculator")}</MobileLink>
            <MobileLink href="/timeline" onClick={() => setMobileOpen(false)}>📅 {t("nav.timeline")}</MobileLink>
            <MobileLink href="/gallery" onClick={() => setMobileOpen(false)}>🖼️ {t("nav.gallery")}</MobileLink>
            <MobileLink href="/apply" onClick={() => setMobileOpen(false)}>{t("nav.apply")}</MobileLink>
            {user ? (
              <>
                <MobileLink href="/dashboard" onClick={() => setMobileOpen(false)}>📊 {t("nav.dashboard")}</MobileLink>
                <MobileLink href="/profile" onClick={() => setMobileOpen(false)}>📋 {t("nav.profile")}</MobileLink>
                {isAdmin && <MobileLink href="/admin" onClick={() => setMobileOpen(false)}>🛡️ অ্যাডমিন</MobileLink>}
                <button
                  onClick={() => { setMobileOpen(false); handleLogout(); }}
                  className="text-left px-3 py-2.5 text-sm text-red-400 hover:bg-white/10 rounded-lg transition-colors"
                >
                  🚪 {t("nav.logout")}
                </button>
              </>
            ) : (
              <>
                {/* Mobile: login and signup as SEPARATE items per spec */}
                <MobileLink href="/login" onClick={() => setMobileOpen(false)}>🔑 {t("nav.login")}</MobileLink>
                <MobileLink href="/login?tab=signup" onClick={() => setMobileOpen(false)}>📝 {t("nav.signup")}</MobileLink>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Backdrop for mobile ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Spacer so content isn't hidden behind sticky nav ── */}
      <div className="h-[70px]" />
    </>
  );
}

function NavLink({ href, onClick, children }: { href?: string; onClick?: () => void; children: React.ReactNode }) {
  const cls = "px-3 py-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer whitespace-nowrap";
  if (href) return <li><Link href={href} className={cls}>{children}</Link></li>;
  return <li><button onClick={onClick} className={cls}>{children}</button></li>;
}

function MobileLink({ href, onClick, children }: { href?: string; onClick?: () => void; children: React.ReactNode }) {
  const cls = "block px-3 py-2.5 rounded-lg text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors";
  if (href) return <Link href={href} onClick={onClick} className={cls}>{children}</Link>;
  return <button onClick={onClick} className={cls + " text-left w-full"}>{children}</button>;
}

function DropLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="block px-4 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors">
      {children}
    </Link>
  );
}

function ChevronIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
