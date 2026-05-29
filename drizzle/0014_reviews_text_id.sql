-- Allow reviews.clinicId to store string IDs from JSON data (e.g., "ca-la-001")
-- instead of requiring UUIDs. The reviews table is queried by string ID from the frontend.

ALTER TABLE "reviews" ALTER COLUMN "clinic_id" SET DATA TYPE text USING "clinic_id"::text;