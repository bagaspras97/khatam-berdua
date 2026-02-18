// ============================================
// Type Definitions
// ============================================

export interface Challenge {
  id: string;
  secret_key: string;
  participant_1_name: string;
  participant_2_name: string;
  start_date: string; // ISO date string (YYYY-MM-DD)
  duration_days: number; // Challenge duration in days
  created_at: string;
  updated_at: string;
}

export interface DailyProgress {
  id: string;
  challenge_id: string;
  participant_number: 1 | 2;
  date: string; // ISO date string (YYYY-MM-DD)
  from_page: number;
  to_page: number;
  pages_read: number; // Computed: to_page - from_page + 1
  is_makeup: boolean; // Whether this is a makeup/catch-up reading
  notes?: string | null;
  // Who physically read the pages. For normal readings = participant_number.
  // For makeup on behalf of another: participant_number = debt owner, actual_reader_number = reader.
  actual_reader_number: 1 | 2;
  updated_at: string;
}

// API Request/Response types
export interface CreateChallengeRequest {
  participant_1_name: string;
  participant_2_name: string;
  start_date: string;
  secret_key: string;
  duration_days?: number; // Optional, defaults to 30
}

export interface UpdateProgressRequest {
  challenge_id: string;
  secret_key: string;
  participant_number: 1 | 2;
  date: string;
  from_page: number;
  to_page: number;
  is_makeup?: boolean;
  notes?: string;
}

export interface ChallengeWithProgress extends Challenge {
  progress: DailyProgress[];
}

// Missing pages info — per participant zone
export interface ParticipantMissing {
  ranges: Array<{ from: number; to: number }>;
  total: number;
}

export interface MissingPagesInfo {
  dayNumber: number;
  date: string;
  expectedStart: number;
  expectedEnd: number;
  participant1Missing: ParticipantMissing | null; // P1's zone debt
  participant2Missing: ParticipantMissing | null; // P2's zone debt
  missingRanges: Array<{ from: number; to: number }>; // combined (for backward compat)
  totalMissing: number;
}

// Computed stats
export interface DaySummary {
  date: string;
  dayNumber: number;
  participant1Pages: number;
  participant2Pages: number;
  participant1Range: string; // e.g., "1-10" or "-"
  participant2Range: string; // e.g., "11-20" or "-"
  totalPages: number;
  isComplete: boolean; // Both reached target
  missingPages?: MissingPagesInfo; // Info about missing pages for this day
}

export interface ChallengeStats {
  totalPagesRead: number;
  participant1Total: number;        // pages attributed to P1's debt zone
  participant2Total: number;        // pages attributed to P2's debt zone
  participant1ActualTotal: number;  // pages P1 physically read (incl. makeups for P2)
  participant2ActualTotal: number;  // pages P2 physically read (incl. makeups for P1)
  percentComplete: number;
  currentDay: number;
  daysRemaining: number;
  isOnTrack: boolean;
  dailySummaries: DaySummary[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
