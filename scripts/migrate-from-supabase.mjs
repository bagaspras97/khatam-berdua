/**
 * Migration script: Supabase → Neon
 * Run with: node scripts/migrate-from-supabase.mjs
 */

import { neon } from "@neondatabase/serverless";

// --- Credentials ---
const SUPABASE_URL = "https://xepccfdullrjkaixqkcm.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlcGNjZmR1bGxyamthaXhxa2NtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNDUzMTAsImV4cCI6MjA4NjkyMTMxMH0.trHI_Cl0vvsHb6faBFN8Xu2Sr6Az66MnyX_kGic9ZDI";
const DATABASE_URL =
  "postgresql://neondb_owner:npg_hBM2rpwACv3n@ep-wispy-smoke-a1db25fe-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const sql = neon(DATABASE_URL);

async function fetchFromSupabase(table) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  if (!res.ok) throw new Error(`Failed to fetch ${table}: ${res.statusText}`);
  return res.json();
}

async function migrateChallenges(challenges) {
  console.log(`Migrating ${challenges.length} challenges...`);
  for (const c of challenges) {
    await sql`
      INSERT INTO challenges (id, secret_key, participant_1_name, participant_2_name, start_date, duration_days, created_at, updated_at)
      VALUES (${c.id}, ${c.secret_key}, ${c.participant_1_name}, ${c.participant_2_name}, ${c.start_date}, ${c.duration_days}, ${c.created_at}, ${c.updated_at})
      ON CONFLICT (id) DO NOTHING
    `;
    console.log(`  ✓ Challenge: ${c.participant_1_name} & ${c.participant_2_name} (${c.id})`);
  }
}

async function migrateProgress(progress) {
  console.log(`Migrating ${progress.length} daily_progress rows...`);
  for (const p of progress) {
    // pages_read is GENERATED ALWAYS AS, so we skip it
    await sql`
      INSERT INTO daily_progress (id, challenge_id, participant_number, date, from_page, to_page, is_makeup, notes, actual_reader_number, updated_at)
      VALUES (${p.id}, ${p.challenge_id}, ${p.participant_number}, ${p.date}, ${p.from_page}, ${p.to_page}, ${p.is_makeup}, ${p.notes ?? null}, ${p.actual_reader_number}, ${p.updated_at})
      ON CONFLICT (id) DO NOTHING
    `;
    console.log(`  ✓ Progress: participant ${p.participant_number}, date ${p.date}`);
  }
}

async function main() {
  console.log("=== Migrasi Supabase → Neon ===\n");

  const challenges = await fetchFromSupabase("challenges");
  const progress = await fetchFromSupabase("daily_progress");

  console.log(`Data ditemukan: ${challenges.length} challenges, ${progress.length} progress rows\n`);

  if (challenges.length === 0 && progress.length === 0) {
    console.log("Tidak ada data untuk dimigrasikan.");
    return;
  }

  await migrateChallenges(challenges);
  await migrateProgress(progress);

  console.log("\n✅ Migrasi selesai!");
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
