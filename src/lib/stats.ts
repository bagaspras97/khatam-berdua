import {
  ChallengeWithProgress,
  ChallengeStats,
  DaySummary,
  DailyProgress,
} from "./types";
import {
  TOTAL_PAGES,
  getDayTargets,
} from "./constants";
import { getDayNumber, getDateRange, getTodayJakarta } from "./date-utils";
import { detectMissingPages } from "./gap-utils";

/**
 * Compute challenge stats from challenge + progress data.
 * Pass `today` to override the current date (for testing).
 */
export function computeStats(
  challenge: ChallengeWithProgress,
  today?: string
): ChallengeStats {
  const effectiveToday = getTodayJakarta(today);
  const durationDays = challenge.duration_days;
  const dates = getDateRange(
    challenge.start_date,
    durationDays
  );

  // Build a map of progress keyed by "date-participantNumber"
  const progressMap = new Map<string, DailyProgress>();
  const progressByDate = new Map<string, DailyProgress[]>();
  
  for (const p of challenge.progress) {
    progressMap.set(`${p.date}-${p.participant_number}`, p);
    
    if (!progressByDate.has(p.date)) {
      progressByDate.set(p.date, []);
    }
    progressByDate.get(p.date)!.push(p);
  }

  let participant1Total = 0;
  let participant2Total = 0;
  let participant1ActualTotal = 0;
  let participant2ActualTotal = 0;

  const dailySummaries: DaySummary[] = dates.map((date, index) => {
    const p1Data = progressMap.get(`${date}-1`);
    const p2Data = progressMap.get(`${date}-2`);
    
    const p1Pages = p1Data?.pages_read ?? 0;
    const p2Pages = p2Data?.pages_read ?? 0;

    participant1Total += p1Pages;
    participant2Total += p2Pages;

    // Actual totals: based on who physically read, not who owned the debt
    for (const entry of progressByDate.get(date) ?? []) {
      if ((entry.actual_reader_number ?? entry.participant_number) === 1) {
        participant1ActualTotal += entry.pages_read;
      } else {
        participant2ActualTotal += entry.pages_read;
      }
    }

    // Detect missing pages for this day
    const dayNumber = index + 1;
    const { targetP1, targetP2 } = getDayTargets(dayNumber, durationDays);
    const dayProgress = progressByDate.get(date) || [];
    const missingPages = detectMissingPages(dayNumber, date, dayProgress, durationDays) ?? undefined;

    return {
      date,
      dayNumber,
      participant1Pages: p1Pages,
      participant2Pages: p2Pages,
      participant1Range: p1Data ? `${p1Data.from_page}-${p1Data.to_page}` : "-",
      participant2Range: p2Data ? `${p2Data.from_page}-${p2Data.to_page}` : "-",
      totalPages: p1Pages + p2Pages,
      isComplete:
        p1Pages >= targetP1 &&
        p2Pages >= targetP2,
      missingPages,
    };
  });

  const totalPagesRead = participant1Total + participant2Total;
  const currentDay = getDayNumber(challenge.start_date, effectiveToday);
  const clampedCurrentDay = Math.min(
    Math.max(currentDay, 1),
    durationDays
  );
  // Sum targets for all days up to currentDay
  let expectedPages = 0;
  for (let d = 1; d <= clampedCurrentDay; d++) {
    expectedPages += getDayTargets(d, durationDays).total;
  }

  return {
    totalPagesRead,
    participant1Total,
    participant2Total,
    participant1ActualTotal,
    participant2ActualTotal,
    percentComplete: Math.min(
      Math.round((totalPagesRead / TOTAL_PAGES) * 100),
      100
    ),
    currentDay: clampedCurrentDay,
    daysRemaining: Math.max(durationDays - clampedCurrentDay, 0),
    isOnTrack: totalPagesRead >= expectedPages,
    dailySummaries,
  };
}
