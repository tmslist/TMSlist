-- Add userId to reviews (links authenticated submissions to user account)
-- Add helpful/unhelpful counts (migrate from Redis-only tracking)
-- Add unique constraint (one verified review per user per clinic)

ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS helpful_count integer DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS unhelpful_count integer DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'tmslist';

-- One verified review per user per clinic (null userId = anonymous reviews, skip constraint)
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_unique_verified
  ON reviews (user_id, clinic_id)
  WHERE user_id IS NOT NULL;
