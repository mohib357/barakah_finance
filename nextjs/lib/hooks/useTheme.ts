"use client";
import { useState, useEffect } from "react";

const KEY = "bf_theme";

export function useTheme() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(KEY);
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = saved ? saved === "dark" : prefersDark;
    setDark(isDark);
    applyTheme(isDark);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    localStorage.setItem(KEY, next ? "dark" : "light");
    applyTheme(next);
  }

  return { dark, toggle };
}

function applyTheme(dark: boolean) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", dark);
  document.body.classList.toggle("dark-mode", dark);
}
