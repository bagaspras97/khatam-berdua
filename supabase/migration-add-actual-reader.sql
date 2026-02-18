-- ============================================
-- Migration: Add actual_reader_number to track who physically read the pages
-- ============================================
-- Run this migration in your Supabase SQL editor.
--
-- Context: when participant A does a makeup reading for participant B's debt,
-- the row is stored with participant_number = B (debt owner) so gap detection
-- works correctly. actual_reader_number stores who actually read the pages (A),
-- enabling accurate per-person reading stats at khatam.

ALTER TABLE daily_progress
  ADD COLUMN IF NOT EXISTS actual_reader_number SMALLINT
    CHECK (actual_reader_number IN (1, 2));

-- For existing rows, assume the debt owner is also the actual reader
UPDATE daily_progress
  SET actual_reader_number = participant_number
  WHERE actual_reader_number IS NULL;
