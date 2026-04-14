-- Migration: add_owner_response_to_reviews
-- Created at: 2026-04-13 (1744500000000)

BEGIN;

ALTER TABLE "reviews" ADD COLUMN "owner_response" text;
ALTER TABLE "reviews" ADD COLUMN "owner_response_at" timestamp with time zone;

COMMIT;