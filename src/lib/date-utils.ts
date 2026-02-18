import { TIMEZONE } from "./constants";

/** Date format validator: YYYY-MM-DD */
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Get current date in Asia/Jakarta timezone as YYYY-MM-DD string.
 *
 * Override priority (for testing):
 *   1. `override` argument  → e.g. from URL ?date=2026-03-15
 *   2. NEXT_PUBLIC_DATE_OVERRIDE env variable  → .env.local
 *   3. Real current date (production default)
 */
export function getTodayJakarta(override?: string | null): string {
  if (override && DATE_RE.test(override)) return override;
  const envOverride = process.env.NEXT_PUBLIC_DATE_OVERRIDE;
  if (envOverride && DATE_RE.test(envOverride)) return envOverride;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/**
 * Calculate day number (1-based) from start date
 */
export function getDayNumber(startDate: string, currentDate: string): number {
  const start = new Date(startDate + "T00:00:00Z");
  const current = new Date(currentDate + "T00:00:00Z");
  const diffMs = current.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays + 1;
}

/**
 * Get all dates from startDate for given number of days
 */
export function getDateRange(startDate: string, days: number): string[] {
  const dates: string[] = [];
  const [year, month, day] = startDate.split("-").map(Number);

  for (let i = 0; i < days; i++) {
    const date = new Date(Date.UTC(year, month - 1, day + i));
    dates.push(date.toISOString().split("T")[0]);
  }

  return dates;
}

/**
 * Format date to Indonesian locale string
 */
export function formatDateId(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00Z");
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Format date to short format
 */
export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00Z");
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

/**
 * Generate a random secret key
 */
export function generateSecretKey(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
