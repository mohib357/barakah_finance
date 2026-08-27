"use client";
import { useState, useEffect, useCallback } from "react";
import { translations, type Lang, RTL_LANGS } from "@/lib/i18n/translations";

const STORAGE_KEY = "bf_lang";

/** Detect best language from browser */
function detectLang(): Lang {
  if (typeof window === "undefined") return "bn";
  const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
  if (stored && (stored === "bn" || stored === "en" || stored === "ar")) return stored;
  const browser = navigator.language?.toLowerCase() ?? "";
  if (browser.startsWith("ar")) return "ar";
  if (browser.startsWith("en")) return "en";
  return "bn"; // default: Bangla
}

export function useLang() {
  const [lang, setLangState] = useState<Lang>("bn");

  useEffect(() => {
    const detected = detectLang();
    setLangState(detected);
    applyLangToDom(detected);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, l);
    applyLangToDom(l);
  }, []);

  const t = useCallback(
    (key: string, fallback?: string): string => {
      return translations[lang]?.[key] ?? translations["bn"]?.[key] ?? fallback ?? key;
    },
    [lang]
  );

  return { lang, setLang, t, isRTL: RTL_LANGS.includes(lang) };
}

function applyLangToDom(lang: Lang) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = lang;
  document.documentElement.dir = RTL_LANGS.includes(lang) ? "rtl" : "ltr";
}
