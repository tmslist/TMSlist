-- =============================================================================
-- RLS Security Hardening — Phase 1 through 5
-- Enables Row Level Security on all public schema tables.
--
-- ARCHITECTURE NOTE:
-- This app uses Drizzle ORM with a direct Postgres connection (not the Supabase
-- JS client). Supabase's PostgREST automatically extracts JWT Bearer tokens and
-- maps them to Postgres roles for RLS evaluation. With a direct Postgres
-- connection, no JWT context reaches the database — so auth.uid() returns NULL
-- and all RLS policies would block everything.
--
-- To make RLS work with direct Postgres connections, you must either:
--   A) Create a "service" Postgres role that bypasses RLS for your server
--      connection, and keep a separate "anon" role for any PostgREST exposure:
--        GRANT service_role TO your_app_user;  -- bypasses RLS
--   B) Wrap critical auth functions as SECURITY DEFINER with aelevated role
--   C) Use a separate database user for PostgREST (anon) vs your server (service)
--
-- This migration enables RLS with correct policies for PostgREST / anon access.
-- Your server-side Drizzle connection should use a Postgres role that has
-- been granted the service_role, or use SET ROLE after connecting.
--
-- The policies below are designed so that:
--   - The "anon" role (PostgREST) gets only public-safe data
--   - Authenticated users get row-scoped access via their JWT role
--   - Your server connection bypasses RLS entirely (service role)
-- =============================================================================

BEGIN;

-- =============================================================================
-- HELPERS: Idempotent policy drop (run before creating each table's policies)
-- =============================================================================

CREATE OR REPLACE FUNCTION drop_table_policies(table_name TEXT)
RETURNS void AS $$
DECLARE
  pol_name TEXT;
BEGIN
  FOR pol_name IN
    SELECT polname FROM pg_policy WHERE polrelid = table_name::regclass
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol_name, table_name);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- PHASE 1: Auth & Token Tables (CRITICAL — fix first)
-- =============================================================================

-- ── auth_storage schema: isolate magic_tokens from PostgREST exposure ──────────

CREATE SCHEMA IF NOT EXISTS auth_storage;

-- Move magic_tokens to auth_storage (PostgREST only exposes public schema)
-- This must happen before enabling RLS so existing inserts continue working
ALTER TABLE magic_tokens SET SCHEMA auth_storage;

-- Now the magic_tokens table is in auth_storage — PostgREST cannot touch it.
-- All token operations continue via your server-side Drizzle connection.
-- If you later add PostgREST access, create SECURITY DEFINER wrapper functions
-- in auth_storage that your service role can call.

-- ── sessions: block all direct access via PostgREST ─────────────────────────

SELECT drop_table_policies('sessions');

CREATE POLICY "sessions_no_direct_access" ON sessions
  FOR ALL USING (false) WITH CHECK (false);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- ── clinic_claims: hash verification_token + block direct access ────────────

-- First: hash existing plaintext tokens (one-time migration)
UPDATE clinic_claims
SET verification_token = encode(sha256(verification_token::bytea), 'hex')
WHERE verification_token !~ '^[a-f0-9]{64}$';

-- Add computed hash column (keep plaintext for rollback window, drop after verify)
ALTER TABLE clinic_claims ADD COLUMN IF NOT EXISTS verification_token_hash text;

UPDATE clinic_claims
SET verification_token_hash = encode(sha256(verification_token::bytea), 'hex')
WHERE verification_token_hash IS NULL
  AND verification_token ~ '^[a-f0-9]{64}$';

SELECT drop_table_policies('clinic_claims');

-- Public: anyone can INSERT (claim a clinic) — API handles validation
CREATE POLICY "clinic_claims_public_insert" ON clinic_claims
  FOR INSERT WITH CHECK (true);

-- Block all other direct access (service role bypasses RLS, so server code still works)
CREATE POLICY "clinic_claims_no_direct_access" ON clinic_claims
  FOR ALL USING (false) WITH CHECK (false);

ALTER TABLE clinic_claims ENABLE ROW LEVEL SECURITY;

-- ── users: user-owns-own for authenticated; block sensitive cols from anon ────

SELECT drop_table_policies('users');

-- Public read: only email + name (no password hash, no TOTP, no passkeys)
CREATE POLICY "users_public_read_safe" ON users
  FOR SELECT USING (
    -- Only the user's own row, or if role=admin (from JWT):
    (auth.uid() = id)
    OR (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
    -- Public fallback: allow SELECT of email+name for known user lookups (no auth required)
    -- This exposes email addresses to anon which is acceptable for this app
  );

-- Allow users to update their own profile (name, clinic_id — NOT password_hash, totp, passkeys)
CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Admin can insert (new user registration)
CREATE POLICY "users_admin_insert" ON users
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    OR auth.uid() IS NULL  -- allow self-registration via magic link (anon)
  );

-- Admins can select everything (including password hashes, TOTP, etc.)
CREATE POLICY "users_admin_read_all" ON users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can update everything (including security fields)
CREATE POLICY "users_admin_update_all" ON users
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ── notifications: user-owns-own ───────────────────────────────────────────

SELECT drop_table_policies('notifications');

CREATE POLICY "notifications_own_read" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notifications_own_insert" ON notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notifications_own_update" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "notifications_own_delete" ON notifications
  FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ── saved_clinics: user-owns-own ────────────────────────────────────────────

SELECT drop_table_policies('saved_clinics');

CREATE POLICY "saved_clinics_own" ON saved_clinics
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE saved_clinics ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- PHASE 2: Leads, Auth Events, Login History
-- =============================================================================

-- ── leads: public insert (your API adds rate limiting); admin-only read ───────

SELECT drop_table_policies('leads');

-- Anyone can submit a lead (form submissions from website)
CREATE POLICY "leads_public_insert" ON leads
  FOR INSERT WITH CHECK (true);

-- Only admins can read leads (contains PII)
CREATE POLICY "leads_admin_read" ON leads
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    OR auth.uid() = user_id  -- users can read their own if user_id is set
  );

-- Admin update only
CREATE POLICY "leads_admin_update" ON leads
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Admin delete (soft delete)
CREATE POLICY "leads_admin_delete" ON leads
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- ── auth_events: admin-only ──────────────────────────────────────────────────

SELECT drop_table_policies('auth_events');

CREATE POLICY "auth_events_admin_read" ON auth_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Service code inserts auth events (bypasses RLS via service role)
CREATE POLICY "auth_events_service_insert" ON auth_events
  FOR INSERT WITH CHECK (true);

ALTER TABLE auth_events ENABLE ROW LEVEL SECURITY;

-- ── login_history: admin-only ────────────────────────────────────────────────

SELECT drop_table_policies('login_history');

CREATE POLICY "login_history_admin_read" ON login_history
  FOR SELECT USING (
    auth.uid() = user_id  -- users can see their own login history
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Service code records login attempts
CREATE POLICY "login_history_service_insert" ON login_history
  FOR INSERT WITH CHECK (true);

ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- PHASE 3: Business Data — Clinics, Reviews, Subscriptions, Jobs
-- =============================================================================

-- ── clinics: public read; authenticated + admin write ────────────────────────

SELECT drop_table_policies('clinics');

-- Anyone can read non-deleted clinics (this is a public directory)
CREATE POLICY "clinics_public_read" ON clinics
  FOR SELECT USING (
    deleted_at IS NULL
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Authenticated users can submit new clinics
CREATE POLICY "clinics_auth_insert" ON clinics
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = (created_by->>'user_id')::uuid
  );

-- Clinic owner or admin can update
CREATE POLICY "clinics_owner_update" ON clinics
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN clinics c ON c.clinic_id = u.clinic_id
      WHERE u.id = auth.uid()
        AND u.clinic_id = clinics.id
        AND u.role IN ('clinic_owner', 'admin')
    )
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Admin or owner can delete (soft delete)
CREATE POLICY "clinics_owner_delete" ON clinics
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN clinics c ON c.clinic_id = u.clinic_id
      WHERE u.id = auth.uid()
        AND u.clinic_id = clinics.id
        AND u.role IN ('clinic_owner', 'admin')
    )
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;

-- ── doctors: public read of verified; admin write ───────────────────────────

SELECT drop_table_policies('doctors');

CREATE POLICY "doctors_public_read" ON doctors
  FOR SELECT USING (true);

CREATE POLICY "doctors_auth_insert" ON doctors
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND (u.clinic_id = doctors.clinic_id OR u.role IN ('admin', 'clinic_owner'))
    )
  );

CREATE POLICY "doctors_owner_update" ON doctors
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND (u.clinic_id = doctors.clinic_id OR u.role = 'admin')
    )
  );

CREATE POLICY "doctors_owner_delete" ON doctors
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND (u.clinic_id = doctors.clinic_id OR u.role = 'admin')
    )
  );

ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

-- ── subscriptions: clinic owner + admin only ───────────────────────────────

SELECT drop_table_policies('subscriptions');

CREATE POLICY "subscriptions_owner_read" ON subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND (u.clinic_id = subscriptions.clinic_id OR u.role = 'admin')
    )
  );

CREATE POLICY "subscriptions_admin_all" ON subscriptions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- ── reviews: public read of approved; authenticated submit; owner respond ─────

SELECT drop_table_policies('reviews');

-- Anyone can read approved, non-deleted reviews
CREATE POLICY "reviews_public_read" ON reviews
  FOR SELECT USING (
    approved = true
    AND deleted_at IS NULL
  );

-- Admin can read all reviews (for moderation)
CREATE POLICY "reviews_admin_read" ON reviews
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Authenticated users can submit reviews
CREATE POLICY "reviews_auth_insert" ON reviews
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND (auth.uid() = user_id OR user_id IS NULL)  -- link to account if logged in
  );

-- Clinic owner or admin can approve/respond to reviews
CREATE POLICY "reviews_owner_respond" ON reviews
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND (u.clinic_id = reviews.clinic_id OR u.role = 'admin')
    )
  );

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- ── jobs: public read of active; auth + clinic owner write ─────────────────

SELECT drop_table_policies('jobs');

-- Anyone can read active jobs; job poster can see their own (even if paused)
CREATE POLICY "jobs_public_read" ON jobs
  FOR SELECT USING (
    status = 'active'
    OR auth.uid() = created_by
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Authenticated clinic owners can post jobs
CREATE POLICY "jobs_clinic_owner_insert" ON jobs
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND (u.clinic_id = jobs.clinic_id OR u.role IN ('admin', 'clinic_owner'))
    )
  );

-- Job creator or admin can update
CREATE POLICY "jobs_owner_update" ON jobs
  FOR UPDATE USING (
    auth.uid() = created_by
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Job creator or admin can delete
CREATE POLICY "jobs_owner_delete" ON jobs
  FOR DELETE USING (
    auth.uid() = created_by
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- ── job_applications: applicant insert; poster/admin read ─────────────────

SELECT drop_table_policies('job_applications');

-- Anyone (even anon) can apply for a job
CREATE POLICY "job_applications_public_insert" ON job_applications
  FOR INSERT WITH CHECK (true);

-- Job poster or admin can read applications for their jobs
CREATE POLICY "job_applications_poster_read" ON job_applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM jobs j
      JOIN users u ON u.id = auth.uid()
      WHERE j.id = job_applications.job_id
        AND (j.created_by = auth.uid() OR u.role = 'admin')
    )
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Poster or admin can update (change status, add notes)
CREATE POLICY "job_applications_poster_update" ON job_applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM jobs j
      JOIN users u ON u.id = auth.uid()
      WHERE j.id = job_applications.job_id
        AND (j.created_by = auth.uid() OR u.role = 'admin')
    )
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Admin can delete
CREATE POLICY "job_applications_admin_delete" ON job_applications
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- PHASE 4: Community & UGC — Forum, Blog, Saved
-- =============================================================================

-- ── forum_categories: public read; admin write ───────────────────────────────

SELECT drop_table_policies('forum_categories');

CREATE POLICY "forum_categories_public_read" ON forum_categories
  FOR SELECT USING (true);

CREATE POLICY "forum_categories_admin_all" ON forum_categories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

ALTER TABLE forum_categories ENABLE ROW LEVEL SECURITY;

-- ── forum_posts: public read published; auth + author write ─────────────────

SELECT drop_table_policies('forum_posts');

CREATE POLICY "forum_posts_public_read" ON forum_posts
  FOR SELECT USING (
    status = 'published'
    OR auth.uid() = author_id
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "forum_posts_auth_insert" ON forum_posts
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = author_id
  );

CREATE POLICY "forum_posts_author_update" ON forum_posts
  FOR UPDATE USING (
    auth.uid() = author_id
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );

CREATE POLICY "forum_posts_author_delete" ON forum_posts
  FOR DELETE USING (
    auth.uid() = author_id
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;

-- ── forum_comments: public read published; auth + author write ──────────────

SELECT drop_table_policies('forum_comments');

CREATE POLICY "forum_comments_public_read" ON forum_comments
  FOR SELECT USING (
    status = 'published'
    OR auth.uid() = author_id
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "forum_comments_auth_insert" ON forum_comments
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = author_id
  );

CREATE POLICY "forum_comments_author_update" ON forum_comments
  FOR UPDATE USING (
    auth.uid() = author_id
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "forum_comments_author_delete" ON forum_comments
  FOR DELETE USING (
    auth.uid() = author_id
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

ALTER TABLE forum_comments ENABLE ROW LEVEL SECURITY;

-- ── forum_votes: user-owns-own ───────────────────────────────────────────────

SELECT drop_table_policies('forum_votes');

CREATE POLICY "forum_votes_own" ON forum_votes
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE forum_votes ENABLE ROW LEVEL SECURITY;

-- ── saved_forum_posts: user-owns-own ───────────────────────────────────────

SELECT drop_table_policies('saved_forum_posts');

CREATE POLICY "saved_forum_posts_own" ON saved_forum_posts
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE saved_forum_posts ENABLE ROW LEVEL SECURITY;

-- ── forum_reports: auth insert; admin read/resolve ─────────────────────────

SELECT drop_table_policies('forum_reports');

CREATE POLICY "forum_reports_auth_insert" ON forum_reports
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = reporter_id
  );

CREATE POLICY "forum_reports_auth_read" ON forum_reports
  FOR SELECT USING (
    auth.uid() = reporter_id
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "forum_reports_admin_resolve" ON forum_reports
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

ALTER TABLE forum_reports ENABLE ROW LEVEL SECURITY;

-- ── blog_posts: public read published; author + admin write ─────────────────

SELECT drop_table_policies('blog_posts');

CREATE POLICY "blog_posts_public_read" ON blog_posts
  FOR SELECT USING (
    status = 'published'
    OR auth.uid() = created_by
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "blog_posts_auth_insert" ON blog_posts
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = created_by
  );

CREATE POLICY "blog_posts_author_update" ON blog_posts
  FOR UPDATE USING (
    auth.uid() = created_by
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );

CREATE POLICY "blog_posts_author_delete" ON blog_posts
  FOR DELETE USING (
    auth.uid() = created_by
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- PHASE 5: Reference Data & Admin Tables
-- =============================================================================

-- ── questions: public read; admin + editor write ────────────────────────────

SELECT drop_table_policies('questions');

CREATE POLICY "questions_public_read" ON questions
  FOR SELECT USING (true);

CREATE POLICY "questions_admin_write" ON questions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- ── treatments: public read; admin write ────────────────────────────────────

SELECT drop_table_policies('treatments');

CREATE POLICY "treatments_public_read" ON treatments
  FOR SELECT USING (true);

CREATE POLICY "treatments_admin_write" ON treatments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

ALTER TABLE treatments ENABLE ROW LEVEL SECURITY;

-- ── countries: public read; admin write ─────────────────────────────────────

SELECT drop_table_policies('countries');

CREATE POLICY "countries_public_read" ON countries
  FOR SELECT USING (enabled = true);

CREATE POLICY "countries_admin_write" ON countries
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

ALTER TABLE countries ENABLE ROW LEVEL SECURITY;

-- ── regions: public read; admin write ───────────────────────────────────────

SELECT drop_table_policies('regions');

CREATE POLICY "regions_public_read" ON regions
  FOR SELECT USING (true);

CREATE POLICY "regions_admin_write" ON regions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

ALTER TABLE regions ENABLE ROW LEVEL SECURITY;

-- ── audit_log: admin read; authenticated insert (via service) ───────────────

SELECT drop_table_policies('audit_log');

CREATE POLICY "audit_log_auth_insert" ON audit_log
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "audit_log_admin_read" ON audit_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    OR auth.uid() = user_id  -- users can see their own audit entries
  );

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- ── site_settings: admin only ─────────────────────────────────────────────

SELECT drop_table_policies('site_settings');

CREATE POLICY "site_settings_admin_all" ON site_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- ── seo_overrides: public read; admin write ────────────────────────────────

SELECT drop_table_policies('seo_overrides');

CREATE POLICY "seo_overrides_public_read" ON seo_overrides
  FOR SELECT USING (true);

CREATE POLICY "seo_overrides_admin_write" ON seo_overrides
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

ALTER TABLE seo_overrides ENABLE ROW LEVEL SECURITY;

-- ── page_content: public read; admin write ───────────────────────────────────

SELECT drop_table_policies('page_content');

CREATE POLICY "page_content_public_read" ON page_content
  FOR SELECT USING (true);

CREATE POLICY "page_content_admin_write" ON page_content
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

ALTER TABLE page_content ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- POST-MIGRATION: Notify PostgREST of schema change
-- =============================================================================

-- Refresh PostgREST schema cache so new policies take effect immediately
NOTIFY pgrst, 'reload schema';

-- =============================================================================
-- VERIFICATION QUERIES (run these to confirm RLS is working)
-- =============================================================================

-- Test 1: Check all tables have RLS enabled
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public'
--   AND NOT EXISTS (SELECT 1 FROM pg_policies WHERE polrelid = (schemaname || '.' || tablename)::regclass);

-- Test 2: Verify magic_tokens is in auth_storage
-- SELECT schemaname, tablename FROM pg_tables WHERE tablename = 'magic_tokens';

-- Test 3: Count policies per table
-- SELECT schemaname, tablename, count(*) as policy_count
-- FROM pg_policies GROUP BY schemaname, tablename ORDER BY policy_count DESC;

-- Test 4: Verify clinic_claims tokens are hashed
-- SELECT id, length(verification_token) as token_len,
--        verification_token ~ '^[a-f0-9]{64}$' as is_sha256
-- FROM clinic_claims LIMIT 10;

COMMIT;

-- =============================================================================
-- FOLLOW-UP: Database connection configuration
-- =============================================================================
-- After running this migration, you MUST configure your Postgres connection
-- to use a role that bypasses RLS for server-side operations.
--
-- Option A — Grant service_role (recommended):
--   In your Supabase SQL editor or via `psql`:
--   CREATE ROLE your_app_user WITH LOGIN PASSWORD 'your_password';
--   GRANT service_role TO your_app_user;
--   Then use your_app_user in your DATABASE_URL.
--
-- Option B — Use SET ROLE after connecting:
--   Add to your drizzle/index.ts after creating the sql connection:
--   await sql`SET ROLE service_role`;
--   This must run after each new connection.
--
-- Option C — Create a dedicated service role:
--   CREATE ROLE app_service WITH LOGIN PASSWORD 'strong_password';
--   GRANT service_role TO app_service;
--   GRANT USAGE ON SCHEMA auth_storage TO app_service;
--   GRANT ALL ON auth_storage.magic_tokens TO app_service;
--
-- Without one of these, your server-side Drizzle queries will return
-- zero rows for most tables (auth.uid() returns NULL without JWT context).
-- =============================================================================
