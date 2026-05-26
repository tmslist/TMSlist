-- Saved clinics now reference the JSON directory (string IDs like "ca-la-001"),
-- not the legacy `clinics` Postgres table. Drop the FK + uuid type so save works.

ALTER TABLE "saved_clinics" DROP CONSTRAINT IF EXISTS "saved_clinics_clinic_id_clinics_id_fk";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_saved_clinics_unique";--> statement-breakpoint
ALTER TABLE "saved_clinics" ALTER COLUMN "clinic_id" SET DATA TYPE text USING "clinic_id"::text;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_saved_clinics_unique" ON "saved_clinics" USING btree ("user_id","clinic_id");
