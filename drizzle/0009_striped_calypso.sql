CREATE TYPE "public"."job_application_status" AS ENUM('new', 'viewed', 'contacted', 'rejected', 'hired');--> statement-breakpoint
CREATE TYPE "public"."job_employment_type" AS ENUM('full_time', 'part_time', 'contract', 'internship');--> statement-breakpoint
CREATE TYPE "public"."job_role_category" AS ENUM('tms_technician', 'tms_physician', 'nurse_tms', 'psychologist', 'front_desk', 'office_manager', 'billing', 'marketing_coordinator', 'community_outreach', 'social_media', 'data_researcher', 'it_support', 'other');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('active', 'paused', 'filled', 'closed');--> statement-breakpoint
CREATE TYPE "public"."magic_token_purpose" AS ENUM('portal-magic', 'community-magic', 'password-reset', 'email-verification');--> statement-breakpoint
ALTER TYPE "public"."lead_type" ADD VALUE 'callback_request';--> statement-breakpoint
ALTER TYPE "public"."lead_type" ADD VALUE 'whatsapp_inquiry';--> statement-breakpoint
ALTER TYPE "public"."lead_type" ADD VALUE 'appointment_request';--> statement-breakpoint
ALTER TYPE "public"."lead_type" ADD VALUE 'contact';--> statement-breakpoint
ALTER TYPE "public"."subscription_plan" ADD VALUE 'pro';--> statement-breakpoint
ALTER TYPE "public"."subscription_plan" ADD VALUE 'enterprise';--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'patient';--> statement-breakpoint
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
	"status" "job_application_status" DEFAULT 'new' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"title" text NOT NULL,
	"role_category" "job_role_category" NOT NULL,
	"employment_type" "job_employment_type" DEFAULT 'full_time' NOT NULL,
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
	"status" "job_status" DEFAULT 'active' NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"application_count" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "page_content" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page" text NOT NULL,
	"section" text NOT NULL,
	"title" text,
	"content" text,
	"image_url" text,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_forum_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"post_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"last_used_at" timestamp with time zone DEFAULT now(),
	"user_agent" text,
	"ip_address" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "clinics" ALTER COLUMN "rating_avg" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "forum_comments" ADD COLUMN "is_accepted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "magic_tokens" ADD COLUMN "purpose" "magic_token_purpose" NOT NULL;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "helpful_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "unhelpful_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "source" text DEFAULT 'tmslist';--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "owner_response" text;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "owner_response_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "billing_currency" text DEFAULT 'usd';--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "razorpay_customer_id" text;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "razorpay_subscription_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "npi_number" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "terms_accepted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_forum_posts" ADD CONSTRAINT "saved_forum_posts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_forum_posts" ADD CONSTRAINT "saved_forum_posts_post_id_forum_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."forum_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_job_applications_job" ON "job_applications" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_job_applications_clinic" ON "job_applications" USING btree ("clinic_id");--> statement-breakpoint
CREATE INDEX "idx_job_applications_status" ON "job_applications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_job_applications_created" ON "job_applications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_jobs_clinic" ON "jobs" USING btree ("clinic_id");--> statement-breakpoint
CREATE INDEX "idx_jobs_created_by" ON "jobs" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_jobs_status" ON "jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_jobs_role_category" ON "jobs" USING btree ("role_category");--> statement-breakpoint
CREATE INDEX "idx_jobs_location" ON "jobs" USING btree ("location");--> statement-breakpoint
CREATE INDEX "idx_jobs_created" ON "jobs" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_page_content_unique" ON "page_content" USING btree ("page","section");--> statement-breakpoint
CREATE INDEX "idx_page_content_page" ON "page_content" USING btree ("page");--> statement-breakpoint
CREATE INDEX "idx_page_content_order" ON "page_content" USING btree ("page","order");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_saved_forum_posts_unique" ON "saved_forum_posts" USING btree ("user_id","post_id");--> statement-breakpoint
CREATE INDEX "idx_sessions_user" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_sessions_token" ON "sessions" USING btree ("token_hash");--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_blog_status_published" ON "blog_posts" USING btree ("status","published_at");--> statement-breakpoint
CREATE INDEX "idx_leads_email" ON "leads" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_magic_tokens_purpose" ON "magic_tokens" USING btree ("purpose");--> statement-breakpoint
CREATE INDEX "idx_reviews_user" ON "reviews" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_reviews_created" ON "reviews" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_reviews_clinic_approved_created" ON "reviews" USING btree ("clinic_id","approved","created_at");