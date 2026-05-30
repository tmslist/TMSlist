-- Migration: add_onboarding_completed_at
-- Add onboarding tracking field to users table

ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;