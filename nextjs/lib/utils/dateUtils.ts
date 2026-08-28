// ═══════════════════════════════════════════════════════════
//  BARAKAH FINANCE — Date Utilities
// ═══════════════════════════════════════════════════════════

/**
 * Add N calendar months to a date.
 * Handles month-end edge cases correctly:
 *   Jan 31 + 1 month = Feb 28/29 (not March 3)
 */
export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);
  // If the day overflowed (e.g. Jan 31 → Feb 31 → Mar 3), roll back to last day of target month
  if (d.getDate() !== day) {
    d.setDate(0); // 0 = last day of previous month
  }
  return d;
}

/**
 * Format Date as YYYY-MM-DD
 */
export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Format a date as Bengali DD/MM/YYYY
 */
export function formatDateBn(date: Date): string {
  const dd   = String(date.getDate()).padStart(2, "0");
  const mm   = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = String(date.getFullYear());
  const str  = `${dd}/${mm}/${yyyy}`;
  return toBengaliDigits(str);
}

export function toBengaliDigits(s: string): string {
  return s.replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[parseInt(d)]);
}

/**
 * Get the number of calendar days between two dates
 */
export function daysBetween(from: Date, to: Date): number {
  return Math.ceil((to.getTime() - from.getTime()) / 86_400_000);
}

/**
 * Get YYYY-MM string for a date (for savings month keys)
 */
export function toMonthKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/**
 * Parse "YYYY-MM" → first day of that month as Date
 */
export function fromMonthKey(key: string): Date {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1);
}

/**
 * Get the Nth day of a given month/year (for savings due dates)
 * e.g. dueDay(15, 2026, 8) = August 15 2026
 */
export function dueDay(day: number, year: number, month: number): Date {
  // month is 1-indexed
  const lastDay = new Date(year, month, 0).getDate();
  return new Date(year, month - 1, Math.min(day, lastDay));
}
