-- ============================================
-- Khatam Berdua - Database Schema
-- ============================================

-- Challenges table: stores the challenge configuration
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  secret_key TEXT NOT NULL,
  participant_1_name TEXT NOT NULL,
  participant_2_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  duration_days SMALLINT NOT NULL DEFAULT 30 CHECK (duration_days >= 1 AND duration_days <= 365),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Daily progress table: stores daily reading progress per participant
CREATE TABLE daily_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  participant_number SMALLINT NOT NULL CHECK (participant_number IN (1, 2)),
  date DATE NOT NULL,
  from_page SMALLINT NOT NULL DEFAULT 0 CHECK (from_page >= 0 AND from_page <= 604),
  to_page SMALLINT NOT NULL DEFAULT 0 CHECK (to_page >= 0 AND to_page <= 604),
  pages_read SMALLINT GENERATED ALWAYS AS (to_page - from_page + 1) STORED,
  is_makeup BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  -- Who physically read the pages. For normal readings = participant_number.
  -- For makeup readings where someone reads on behalf of another, this stores
  -- the actual reader while participant_number stores the debt owner.
  actual_reader_number SMALLINT CHECK (actual_reader_number IN (1, 2)),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Each participant can only have one entry per day per challenge
  UNIQUE (challenge_id, participant_number, date),
  
  -- Ensure to_page >= from_page
  CHECK (to_page >= from_page)
);

-- Indexes for common queries
CREATE INDEX idx_daily_progress_challenge_id ON daily_progress(challenge_id);
CREATE INDEX idx_daily_progress_date ON daily_progress(challenge_id, date);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to both tables
CREATE TRIGGER challenges_updated_at
  BEFORE UPDATE ON challenges
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER daily_progress_updated_at
  BEFORE UPDATE ON daily_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Row Level Security (RLS) - disabled since we use secret_key auth
-- If you want to enable RLS later, add policies here
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_progress ENABLE ROW LEVEL SECURITY;

-- Allow all operations (no auth, secret_key validated in app)
CREATE POLICY "Allow all on challenges" ON challenges FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on daily_progress" ON daily_progress FOR ALL USING (true) WITH CHECK (true);
