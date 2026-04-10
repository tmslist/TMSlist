CREATE TABLE "blog_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"excerpt" text,
	"content" text NOT NULL,
	"cover_image" text,
	"author" text NOT NULL,
	"category" text,
	"tags" text[],
	"status" text DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"scheduled_at" timestamp with time zone,
	"meta_title" text,
	"meta_description" text,
	"og_image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	CONSTRAINT "blog_posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text,
	"read" boolean DEFAULT false NOT NULL,
	"link" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_overrides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"path" text NOT NULL,
	"meta_title" text,
	"meta_description" text,
	"og_image" text,
	"canonical_url" text,
	"no_index" boolean DEFAULT false,
	"structured_data" jsonb,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	CONSTRAINT "seo_overrides_path_unique" UNIQUE("path")
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid
);
--> statement-breakpoint
ALTER TABLE "clinics" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_overrides" ADD CONSTRAINT "seo_overrides_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_blog_status" ON "blog_posts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_blog_published" ON "blog_posts" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "idx_blog_category" ON "blog_posts" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_notifications_user" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_unread" ON "notifications" USING btree ("user_id","read");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_seo_path" ON "seo_overrides" USING btree ("path");--> statement-breakpoint
CREATE INDEX "idx_clinics_verified_rating" ON "clinics" USING btree ("verified","rating_avg");--> statement-breakpoint
CREATE INDEX "idx_clinics_country_verified" ON "clinics" USING btree ("country","verified");--> statement-breakpoint
CREATE INDEX "idx_clinics_featured_rating" ON "clinics" USING btree ("is_featured","rating_avg");--> statement-breakpoint
CREATE INDEX "idx_clinics_country" ON "clinics" USING btree ("country");--> statement-breakpoint
CREATE INDEX "idx_doctors_slug" ON "doctors" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_leads_clinic" ON "leads" USING btree ("clinic_id");--> statement-breakpoint
CREATE INDEX "idx_questions_category" ON "questions" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_questions_sort" ON "questions" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "idx_reviews_clinic_approved" ON "reviews" USING btree ("clinic_id","approved");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_saved_clinics_unique" ON "saved_clinics" USING btree ("user_id","clinic_id");--> statement-breakpoint
CREATE INDEX "idx_users_clinic" ON "users" USING btree ("clinic_id");--> statement-breakpoint
CREATE INDEX "idx_users_role" ON "users" USING btree ("role");