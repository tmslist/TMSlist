CREATE TYPE "public"."job_status" AS ENUM('active', 'paused', 'filled', 'closed');--> statement-breakpoint
CREATE TYPE "public"."job_role_category" AS ENUM('tms_technician', 'tms_physician', 'nurse_tms', 'psychologist', 'front_desk', 'office_manager', 'billing', 'marketing_coordinator', 'community_outreach', 'social_media', 'data_researcher', 'it_support', 'other');--> statement-breakpoint
CREATE TYPE "public"."job_employment_type" AS ENUM('full_time', 'part_time', 'contract', 'internship');--> statement-breakpoint
CREATE TYPE "public"."job_application_status" AS ENUM('new', 'viewed', 'contacted', 'rejected', 'hired');--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"title" text NOT NULL,
	"role_category" "job_role_category" NOT NULL,
	"employment_type" "job_employment_type" NOT NULL DEFAULT 'full_time',
	"location" text NOT NULL,
	"remote" boolean DEFAULT false NOT NULL,
	"salary_min" integer,
	"salary_max" integer,
	"salary_display" text,
	"description" text NOT NULL,
	"requirements" text,
	"responsibilities" text,
	"benefits" text,
	"application_email" text,
	"application_url" text,
	"status" "job_status" NOT NULL DEFAULT 'active',
	"view_count" integer DEFAULT 0 NOT NULL,
	"application_count" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "job_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"clinic_id" uuid NOT NULL,
	"applicant_name" text NOT NULL,
	"applicant_email" text NOT NULL,
	"applicant_phone" text,
	"resume_url" text,
	"cover_letter" text,
	"linkedin_url" text,
	"clinic_owner_email" text,
	"status" "job_application_status" NOT NULL DEFAULT 'new',
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_jobs_clinic" ON "jobs" USING btree ("clinic_id");--> statement-breakpoint
CREATE INDEX "idx_jobs_created_by" ON "jobs" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_jobs_status" ON "jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_jobs_role_category" ON "jobs" USING btree ("role_category");--> statement-breakpoint
CREATE INDEX "idx_jobs_location" ON "jobs" USING btree ("location");--> statement-breakpoint
CREATE INDEX "idx_jobs_created" ON "jobs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_job_applications_job" ON "job_applications" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_job_applications_clinic" ON "job_applications" USING btree ("clinic_id");--> statement-breakpoint
CREATE INDEX "idx_job_applications_status" ON "job_applications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_job_applications_created" ON "job_applications" USING btree ("created_at");
