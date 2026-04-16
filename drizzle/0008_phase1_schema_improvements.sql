-- Migration: Phase 1 Schema Improvements
-- Added by: Claude Code (2026-04-16)
-- Description: Rating NOT NULL, soft-delete columns, performance indexes

-- 1. Make clinics.rating_avg NOT NULL (was nullable)
ALTER TABLE clinics ALTER COLUMN rating_avg SET NOT NULL;
ALTER TABLE clinics ALTER COLUMN rating_avg SET DEFAULT '0';

-- 2. Add soft-delete column to reviews (GDPR compliance)
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- 3. Add soft-delete column to leads (GDPR compliance)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- 4. Add performance indexes
CREATE INDEX IF NOT EXISTS idx_reviews_created ON reviews (created_at);
CREATE INDEX IF NOT EXISTS idx_reviews_clinic_approved_created ON reviews (clinic_id, approved, created_at);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads (email);
CREATE INDEX IF NOT EXISTS idx_blog_status_published ON blog_posts (status, published_at);
