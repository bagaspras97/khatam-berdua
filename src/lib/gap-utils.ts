import { DailyProgress, MissingPagesInfo, ParticipantMissing } from "./types";
import { getDayTargets } from "./constants";

/**
 * Compute missing ranges within a specific page range
 */
function computeMissingInRange(
  readPages: Set<number>,
  start: number,
  end: number
): ParticipantMissing | null {
  const ranges: Array<{ from: number; to: number }> = [];
  let rangeStart: number | null = null;

  for (let page = start; page <= end; page++) {
    if (readPages.has(page)) {
      if (rangeStart !== null) {
        ranges.push({ from: rangeStart, to: page - 1 });
        rangeStart = null;
      }
    } else {
      rangeStart ??= page;
    }
  }
  if (rangeStart !== null) {
    ranges.push({ from: rangeStart, to: end });
  }

  if (ranges.length === 0) return null;
  const total = ranges.reduce((sum, r) => sum + r.to - r.from + 1, 0);
  return { ranges, total };
}

/**
 * Detect missing page ranges for a given day, split by participant zone.
 * P1 zone: expectedStart → expectedStart + targetP1 - 1
 * P2 zone: expectedStart + targetP1 → expectedEnd
 */
export function detectMissingPages(
  dayNumber: number,
  date: string,
  progressEntries: DailyProgress[],
  durationDays: number
): MissingPagesInfo | null {
  const { targetP1, expectedStart, expectedEnd } = getDayTargets(dayNumber, durationDays);
  const p1ZoneEnd = expectedStart + targetP1 - 1;
  const p2ZoneStart = expectedStart + targetP1;

  // All read pages (include makeup — if someone filled the gap it's no longer missing)
  const readPages = new Set<number>();
  for (const entry of progressEntries) {
    for (let page = entry.from_page; page <= entry.to_page; page++) {
      readPages.add(page);
    }
  }

  const participant1Missing = computeMissingInRange(readPages, expectedStart, p1ZoneEnd);
  const participant2Missing = computeMissingInRange(readPages, p2ZoneStart, expectedEnd);

  if (!participant1Missing && !participant2Missing) return null;

  const missingRanges = [
    ...(participant1Missing?.ranges ?? []),
    ...(participant2Missing?.ranges ?? []),
  ];
  const totalMissing = (participant1Missing?.total ?? 0) + (participant2Missing?.total ?? 0);

  return {
    dayNumber,
    date,
    expectedStart,
    expectedEnd,
    participant1Missing,
    participant2Missing,
    missingRanges,
    totalMissing,
  };
}

/**
 * Format missing ranges for display
 */
export function formatMissingRanges(ranges: Array<{ from: number; to: number }>): string {
  return ranges
    .map((range) => {
      if (range.from === range.to) {
        return `${range.from}`;
      }
      return `${range.from}-${range.to}`;
    })
    .join(", ");
}

/**
 * Check if page range overlaps with existing progress entries
 * @param fromPage - Start page of new entry
 * @param toPage - End page of new entry
 * @param existingProgress - Existing progress entries for the same date
 * @param excludeId - ID to exclude from check (when updating existing entry)
 * @returns Array of overlapping ranges, empty if no overlap
 */
export function detectOverlappingPages(
  fromPage: number,
  toPage: number,
  existingProgress: DailyProgress[],
  excludeId?: string
): Array<{ from: number; to: number; participantNumber: 1 | 2 }> {
  const overlaps: Array<{ from: number; to: number; participantNumber: 1 | 2 }> = [];

  for (const entry of existingProgress) {
    // Skip if this is the same entry being updated
    if (excludeId && entry.id === excludeId) continue;

    // Check if ranges overlap
    const overlapStart = Math.max(fromPage, entry.from_page);
    const overlapEnd = Math.min(toPage, entry.to_page);

    if (overlapStart <= overlapEnd) {
      overlaps.push({
        from: overlapStart,
        to: overlapEnd,
        participantNumber: entry.participant_number,
      });
    }
  }

  return overlaps;
}
