import { supabase } from "./supabase";
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
  const { data: challenge, error } = await supabase
    .from("challenges")
    .insert({
      participant_1_name: data.participant_1_name,
      participant_2_name: data.participant_2_name,
      start_date: data.start_date,
      secret_key: data.secret_key,
      duration_days: data.duration_days ?? 30,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create challenge: ${error.message}`);
  return challenge;
}

export async function getChallengeById(
  challengeId: string
): Promise<Challenge | null> {
  const { data, error } = await supabase
    .from("challenges")
    .select("*")
    .eq("id", challengeId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // Not found
    throw new Error(`Failed to fetch challenge: ${error.message}`);
  }

  return data;
}

export async function getChallengeWithProgress(
  challengeId: string
): Promise<ChallengeWithProgress | null> {
  const { data: challenge, error: challengeError } = await supabase
    .from("challenges")
    .select("*")
    .eq("id", challengeId)
    .single();

  if (challengeError) {
    if (challengeError.code === "PGRST116") return null;
    throw new Error(
      `Failed to fetch challenge: ${challengeError.message}`
    );
  }

  const { data: progress, error: progressError } = await supabase
    .from("daily_progress")
    .select("*")
    .eq("challenge_id", challengeId)
    .order("date", { ascending: true });

  if (progressError) {
    throw new Error(
      `Failed to fetch progress: ${progressError.message}`
    );
  }

  return {
    ...challenge,
    progress: progress ?? [],
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
  const { data, error } = await supabase
    .from("daily_progress")
    .upsert(
      {
        challenge_id: challengeId,
        participant_number: participantNumber,
        date,
        from_page: fromPage,
        to_page: toPage,
        is_makeup: isMakeup,
        notes: notes || null,
        actual_reader_number: actualReaderNumber ?? participantNumber,
      },
      {
        onConflict: "challenge_id,participant_number,date",
      }
    )
    .select()
    .single();

  if (error) throw new Error(`Failed to update progress: ${error.message}`);
  return data;
}

export async function getProgressByDate(
  challengeId: string,
  date: string
): Promise<DailyProgress[]> {
  const { data, error } = await supabase
    .from("daily_progress")
    .select("*")
    .eq("challenge_id", challengeId)
    .eq("date", date);

  if (error) throw new Error(`Failed to fetch progress: ${error.message}`);
  return data ?? [];
}
