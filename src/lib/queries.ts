import { sql } from "./db";
import {
  Challenge,
  ChallengeWithProgress,
  CreateChallengeRequest,
  DailyProgress,
} from "./types";

// ============================================
// Challenge Queries
// ============================================

export async function createChallenge(
  data: CreateChallengeRequest
): Promise<Challenge> {
  const rows = await sql`
    INSERT INTO challenges (participant_1_name, participant_2_name, start_date, secret_key, duration_days)
    VALUES (${data.participant_1_name}, ${data.participant_2_name}, ${data.start_date}, ${data.secret_key}, ${data.duration_days ?? 30})
    RETURNING *
  `;
  if (!rows[0]) throw new Error("Failed to create challenge");
  return rows[0] as Challenge;
}

export async function getChallengeById(
  challengeId: string
): Promise<Challenge | null> {
  const rows = await sql`SELECT * FROM challenges WHERE id = ${challengeId}`;
  return (rows[0] as Challenge) ?? null;
}

export async function getChallengeWithProgress(
  challengeId: string
): Promise<ChallengeWithProgress | null> {
  const challenges = await sql`SELECT * FROM challenges WHERE id = ${challengeId}`;
  if (challenges.length === 0) return null;

  const progress = await sql`
    SELECT * FROM daily_progress
    WHERE challenge_id = ${challengeId}
    ORDER BY date ASC
  `;

  return {
    ...(challenges[0] as Challenge),
    progress: progress as DailyProgress[],
  };
}

export async function validateSecretKey(
  challengeId: string,
  secretKey: string
): Promise<boolean> {
  const challenge = await getChallengeById(challengeId);
  if (!challenge) return false;
  return challenge.secret_key === secretKey;
}

// ============================================
// Progress Queries
// ============================================

export async function upsertProgress({
  challengeId,
  participantNumber,
  date,
  fromPage,
  toPage,
  isMakeup = false,
  notes,
  actualReaderNumber,
}: {
  challengeId: string;
  participantNumber: 1 | 2;
  date: string;
  fromPage: number;
  toPage: number;
  isMakeup?: boolean;
  notes?: string;
  actualReaderNumber?: 1 | 2;
}): Promise<DailyProgress> {
  const rows = await sql`
    INSERT INTO daily_progress (challenge_id, participant_number, date, from_page, to_page, is_makeup, notes, actual_reader_number)
    VALUES (${challengeId}, ${participantNumber}, ${date}, ${fromPage}, ${toPage}, ${isMakeup}, ${notes ?? null}, ${actualReaderNumber ?? participantNumber})
    ON CONFLICT (challenge_id, participant_number, date)
    DO UPDATE SET
      from_page = EXCLUDED.from_page,
      to_page = EXCLUDED.to_page,
      is_makeup = EXCLUDED.is_makeup,
      notes = EXCLUDED.notes,
      actual_reader_number = EXCLUDED.actual_reader_number,
      updated_at = now()
    RETURNING *
  `;
  if (!rows[0]) throw new Error("Failed to update progress");
  return rows[0] as DailyProgress;
}

export async function getProgressByDate(
  challengeId: string,
  date: string
): Promise<DailyProgress[]> {
  const rows = await sql`
    SELECT * FROM daily_progress
    WHERE challenge_id = ${challengeId} AND date = ${date}
  `;
  return rows as DailyProgress[];
}

export async function deleteProgress(
  challengeId: string,
  participantNumber: 1 | 2,
  date: string
): Promise<void> {
  await sql`
    DELETE FROM daily_progress
    WHERE challenge_id = ${challengeId}
      AND participant_number = ${participantNumber}
      AND date = ${date}
  `;
}
