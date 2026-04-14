-- Auth Security Upgrade: Session tracking, token scoping, user verification fields
-- 2026-04-13

-- 1. Add purpose to magic_tokens (scopes tokens to portal/community/password-reset/email-verification)
ALTER TABLE magic_tokens
  ADD COLUMN IF NOT EXISTS purpose text NOT NULL DEFAULT 'portal-magic';

-- Add index for purpose-based queries
CREATE INDEX IF NOT EXISTS idx_magic_tokens_purpose ON magic_tokens(purpose);

-- 2. Create sessions table for session tracking + invalidation
CREATE TABLE IF NOT EXISTS sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  last_used_at timestamptz DEFAULT NOW(),
  user_agent text,
  ip_address text,
  created_at timestamptz DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token_hash);

-- 3. Add user verification fields
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS npi_number text,
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz;
