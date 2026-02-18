-- ============================================
-- Migration: Add Missing Pages Tracking
-- ============================================
-- Run this if you already ran the old schema

-- Add new columns to daily_progress
ALTER TABLE daily_progress 
  ADD COLUMN IF NOT EXISTS is_makeup BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update existing records to have is_makeup = false
UPDATE daily_progress SET is_makeup = false WHERE is_makeup IS NULL;
