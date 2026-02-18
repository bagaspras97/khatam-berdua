-- Add duration_days column to challenges table
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS duration_days SMALLINT NOT NULL DEFAULT 30 CHECK (duration_days >= 1 AND duration_days <= 365);

-- Update existing challenges to have duration_days = 30 (they were created with this assumption)
UPDATE challenges SET duration_days = 30 WHERE duration_days IS NULL;
