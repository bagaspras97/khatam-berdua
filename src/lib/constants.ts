// ============================================
// Constants
// ============================================

export const TOTAL_PAGES = 604; // Total pages in one mushaf
export const DEFAULT_CHALLENGE_DURATION = 30;
export const MAX_PAGES_PER_ENTRY = 25;
export const TIMEZONE = "Asia/Jakarta";

// Pre-calculated targets for common durations
export const DURATION_PRESETS = [
  { days: 15, label: "15 Hari (40 hal/hari)" },
  { days: 30, label: "30 Hari (20 hal/hari)" },
  { days: 60, label: "60 Hari (10 hal/hari)" },
] as const;

/**
 * Get per-day targets and page ranges dynamically based on challenge duration.
 * Distributes 604 pages across the duration with special handling:
 * - Day 1 gets ceiling(pages/day) to ensure P1 gets +1 page
 * - Days 2 to N-1 get floor(pages/day) evenly
 * - Last day gets remaining pages to reach 604
 */
export function getDayTargets(
  dayNumber: number,
  durationDays: number
): {
  targetP1: number;
  targetP2: number;
  total: number;
  expectedStart: number;
  expectedEnd: number;
} {
  const pagesPerDay = TOTAL_PAGES / durationDays;
  const firstDayPages = Math.ceil(pagesPerDay);
  const middleDayPages = Math.floor(pagesPerDay);
  
  let expectedStart: number;
  let expectedEnd: number;
  
  if (dayNumber === 1) {
    // Day 1: gets ceiling to ensure extra page
    expectedStart = 1;
    expectedEnd = firstDayPages;
  } else if (dayNumber === durationDays) {
    // Last day: reads remaining pages to 604
    expectedStart = firstDayPages + (dayNumber - 2) * middleDayPages + 1;
    expectedEnd = TOTAL_PAGES;
  } else {
    // Middle days: floor pages per day
    expectedStart = firstDayPages + (dayNumber - 2) * middleDayPages + 1;
    expectedEnd = expectedStart + middleDayPages - 1;
  }
  
  const total = expectedEnd - expectedStart + 1;
  
  // Split between P1 and P2
  let targetP1: number;
  let targetP2: number;
  
  if (dayNumber === 1) {
    // Day 1: P1 always gets the extra page (11 vs 10 for 30-day)
    targetP2 = Math.floor(total / 2);
    targetP1 = total - targetP2;
  } else {
    // Other days: alternate who gets extra if total is odd
    targetP1 = dayNumber % 2 === 1 ? Math.ceil(total / 2) : Math.floor(total / 2);
    targetP2 = total - targetP1;
  }

  return {
    targetP1,
    targetP2,
    total,
    expectedStart,
    expectedEnd,
  };
}
