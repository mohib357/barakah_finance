import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes safely — prevents conflicting utilities */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Convert ASCII digits to Bengali digits */
export function toBengaliDigits(n: number | string): string {
  return String(n).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[parseInt(d)]);
}

/** Format money with Bengali digits and ৳ symbol */
export function formatMoney(amount: number, bengali = true): string {
  const formatted = Math.abs(amount).toLocaleString("en-IN");
  const num = bengali ? toBengaliDigits(formatted) : formatted;
  return `৳${num}`;
}

/** Format a date as DD/MM/YYYY in Bengali */
export function formatDate(date: Date | string, bengali = true): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = String(d.getFullYear());
  const str = `${dd}/${mm}/${yyyy}`;
  return bengali ? toBengaliDigits(str) : str;
}

/** Get initials from a Bengali/English name */
export function getInitials(name: string): string {
  const clean = name
    .replace(/জনাব|মাওলানা|হাফেজ|হা\.|ক্বারী|মাও\./g, "")
    .trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (!parts.length) return "ব";
  return parts[0][0] ?? "ব";
}

/** Generate a random color from a fixed palette (stable per index) */
export const AVATAR_COLORS = [
  "#1D9E75", "#639922", "#BA7517", "#185FA5", "#3B6D11",
  "#0F6E56", "#854F0B", "#3C3489", "#993C1D", "#972B56",
];
export function avatarColor(index: number): string {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

/** Installment calculation — Method A (full cost) */
export function calcMethodA(
  cost: number,
  travel: number,
  n: number,
  profitRate = 10
): { total: number; profit: number; perInstall: number; lastInstall: number; schedule: { num: number; amount: number }[] } {
  const base   = cost + travel;
  const profit = Math.round(base * profitRate / 100);
  const total  = base + profit;
  const per    = Math.round(total / n);
  const last   = Math.round(total - per * (n - 1));
  const schedule = Array.from({ length: n }, (_, i) => ({
    num: i + 1,
    amount: i === n - 1 ? last : per,
  }));
  return { total, profit, perInstall: per, lastInstall: last, schedule };
}

/** Installment calculation — Method B (Shariah financed-amount) */
export function calcMethodB(
  cost: number,
  down: number,
  n: number,
  profitRate = 10
): { financed: number; profit: number; totalSale: number; remaining: number; perInstall: number; lastInstall: number; schedule: Array<{ label: string; amount: number; note: string }> } {
  const financed  = cost - down;
  const profit    = Math.round(financed * profitRate / 100);
  const totalSale = cost + profit;
  const remaining = totalSale - down;
  const per       = Math.round(remaining / n);
  const last      = Math.round(remaining - per * (n - 1));

  const schedule: Array<{ label: string; amount: number; note: string }> = [
    { label: "ডাউনপেমেন্ট", amount: down, note: "ক্রয়ের সময়" },
    ...Array.from({ length: n }, (_, i) => ({
      label: `${toBengaliDigits(i + 1)} কিস্তি`,
      amount: i === n - 1 ? last : per,
      note: `${toBengaliDigits(i + 1)} মাস পরে`,
    })),
  ];

  return { financed, profit, totalSale, remaining, perInstall: per, lastInstall: last, schedule };
}
