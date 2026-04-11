CREATE TYPE "public"."blog_status" AS ENUM('draft', 'published', 'scheduled');--> statement-breakpoint
CREATE TYPE "public"."claim_status" AS ENUM('pending', 'verified', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."forum_post_status" AS ENUM('published', 'pending', 'removed');--> statement-breakpoint
CREATE TYPE "public"."subscription_plan" AS ENUM('featured', 'premium', 'verified');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'canceled', 'past_due');--> statement-breakpoint
CREATE TABLE "forum_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"icon" text,
	"color" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"post_count" integer DEFAULT 0 NOT NULL,
	"last_activity_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "forum_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "forum_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"parent_id" uuid,
	"author_id" uuid NOT NULL,
	"body" text NOT NULL,
	"status" "forum_post_status" DEFAULT 'published' NOT NULL,
	"vote_score" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forum_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"status" "forum_post_status" DEFAULT 'published' NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"is_locked" boolean DEFAULT false NOT NULL,
	"vote_score" integer DEFAULT 0 NOT NULL,
	"comment_count" integer DEFAULT 0 NOT NULL,
	"last_activity_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "forum_posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "forum_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reporter_id" uuid NOT NULL,
	"target_type" text NOT NULL,
	"target_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"resolved" boolean DEFAULT false NOT NULL,
	"resolved_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forum_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"target_type" text NOT NULL,
	"target_id" uuid NOT NULL,
	"value" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "idx_clinics_slug";--> statement-breakpoint
DROP INDEX "idx_seo_path";--> statement-breakpoint
ALTER TABLE "blog_posts" ALTER COLUMN "status" SET DEFAULT 'draft'::"public"."blog_status";--> statement-breakpoint
ALTER TABLE "blog_posts" ALTER COLUMN "status" SET DATA TYPE "public"."blog_status" USING "status"::"public"."blog_status";--> statement-breakpoint
ALTER TABLE "clinic_claims" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."claim_status";--> statement-breakpoint
ALTER TABLE "clinic_claims" ALTER COLUMN "status" SET DATA TYPE "public"."claim_status" USING "status"::"public"."claim_status";--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "email" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "plan" SET DATA TYPE "public"."subscription_plan" USING "plan"::"public"."subscription_plan";--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "status" SET DEFAULT 'active'::"public"."subscription_status";--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "status" SET DATA TYPE "public"."subscription_status" USING "status"::"public"."subscription_status";--> statement-breakpoint
ALTER TABLE "doctors" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "treatments" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "treatments" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "forum_comments" ADD CONSTRAINT "forum_comments_post_id_forum_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."forum_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_comments" ADD CONSTRAINT "forum_comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_category_id_forum_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."forum_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_reports" ADD CONSTRAINT "forum_reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_reports" ADD CONSTRAINT "forum_reports_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_votes" ADD CONSTRAINT "forum_votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_forum_comments_post" ON "forum_comments" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "idx_forum_comments_parent" ON "forum_comments" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "idx_forum_comments_author" ON "forum_comments" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "idx_forum_posts_category" ON "forum_posts" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_forum_posts_author" ON "forum_posts" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "idx_forum_posts_status" ON "forum_posts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_forum_posts_category_activity" ON "forum_posts" USING btree ("category_id","last_activity_at");--> statement-breakpoint
CREATE INDEX "idx_forum_posts_score" ON "forum_posts" USING btree ("vote_score");--> statement-breakpoint
CREATE INDEX "idx_forum_posts_slug" ON "forum_posts" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_forum_reports_unresolved" ON "forum_reports" USING btree ("resolved");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_forum_votes_unique" ON "forum_votes" USING btree ("user_id","target_type","target_id");--> statement-breakpoint
CREATE INDEX "idx_forum_votes_target" ON "forum_votes" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "idx_claims_clinic" ON "clinic_claims" USING btree ("clinic_id");--> statement-breakpoint
CREATE INDEX "idx_claims_status" ON "clinic_claims" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_claims_email" ON "clinic_claims" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_subscriptions_clinic" ON "subscriptions" USING btree ("clinic_id");--> statement-breakpoint
CREATE INDEX "idx_subscriptions_status" ON "subscriptions" USING btree ("status");