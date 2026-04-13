import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  decimal,
  timestamp,
  jsonb,
  pgEnum,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// ── ENUMS ──────────────────────────────────────

export const providerTypeEnum = pgEnum('provider_type', [
  'psychiatrist',
  'tms_center',
  'hospital',
  'neurologist',
  'mental_health_clinic',
  'primary_care',
  'nurse_practitioner',
]);

export const leadTypeEnum = pgEnum('lead_type', [
  'specialist_enquiry',
  'lead_magnet',
  'newsletter',
  'quiz_lead',
  'callback_request',
  'whatsapp_inquiry',
  'appointment_request',
  'contact',
]);

export const userRoleEnum = pgEnum('user_role', [
  'admin',
  'editor',
  'viewer',
  'clinic_owner',
  'patient',
]);

export const submissionSourceEnum = pgEnum('submission_source', [
  'website_form',
  'admin',
  'import',
  'api',
]);

export const claimStatusEnum = pgEnum('claim_status', [
  'pending',
  'verified',
  'rejected',
]);

export const subscriptionPlanEnum = pgEnum('subscription_plan', [
  'featured',
  'premium',
  'verified',
  'pro',
  'enterprise',
]);

export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'active',
  'canceled',
  'past_due',
]);

export const blogStatusEnum = pgEnum('blog_status', [
  'draft',
  'published',
  'scheduled',
]);

export const forumPostStatusEnum = pgEnum('forum_post_status', [
  'published',
  'pending',
  'removed',
]);

// ── JOB ENUMS ──────────────────────────────────────

export const jobStatusEnum = pgEnum('job_status', [
  'active',
  'paused',
  'filled',
  'closed',
]);

export const jobRoleCategoryEnum = pgEnum('job_role_category', [
  'tms_technician',
  'tms_physician',
  'nurse_tms',
  'psychologist',
  'front_desk',
  'office_manager',
  'billing',
  'marketing_coordinator',
  'community_outreach',
  'social_media',
  'data_researcher',
  'it_support',
  'other',
]);

export const jobEmploymentTypeEnum = pgEnum('job_employment_type', [
  'full_time',
  'part_time',
  'contract',
  'internship',
]);

export const jobApplicationStatusEnum = pgEnum('job_application_status', [
  'new',
  'viewed',
  'contacted',
  'rejected',
  'hired',
]);

// ── CLINICS ──────────────────────────────────────

export const clinics = pgTable('clinics', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  providerType: providerTypeEnum('provider_type'),

  // Location
  address: text('address'),
  city: text('city').notNull(),
  state: text('state').notNull(),
  zip: text('zip'),
  country: text('country').default('US').notNull(),
  lat: decimal('lat', { precision: 10, scale: 7 }),
  lng: decimal('lng', { precision: 10, scale: 7 }),

  // Contact
  phone: text('phone'),
  website: text('website'),
  email: text('email'),

  // Arrays (Postgres native text[])
  machines: text('machines').array(),
  specialties: text('specialties').array(),
  insurances: text('insurances').array(),
  openingHours: text('opening_hours').array(),

  // JSONB for flexible nested data
  accessibility: jsonb('accessibility').$type<{
    wheelchair_accessible?: boolean;
    lgbtq_friendly?: boolean;
    lgbtq_owned?: boolean;
    bipoc_owned?: boolean;
    veteran_friendly?: boolean;
    spanish_speaking?: boolean;
    multilingual?: boolean;
    languages_spoken?: string[];
    sensory_friendly?: boolean;
    trauma_informed?: boolean;
  }>(),
  availability: jsonb('availability').$type<{
    accepting_new_patients?: boolean;
    wait_time_weeks?: number;
    same_week_available?: boolean;
    evening_hours?: boolean;
    weekend_hours?: boolean;
    telehealth_consults?: boolean;
    virtual_followups?: boolean;
    home_visits?: boolean;
  }>(),
  pricing: jsonb('pricing').$type<{
    price_range?: 'budget' | 'moderate' | 'premium';
    session_price_min?: number;
    session_price_max?: number;
    full_course_price?: number;
    free_consultation?: boolean;
    payment_plans?: boolean;
    accepts_insurance?: boolean;
    cash_discount?: boolean;
  }>(),
  media: jsonb('media').$type<{
    hero_image_url?: string;
    logo_url?: string;
    gallery_urls?: string[];
    video_url?: string;
  }>(),
  googleProfile: jsonb('google_profile').$type<{
    place_id?: string;
    embed_url?: string;
    reviews_url?: string;
  }>(),
  faqs: jsonb('faqs').$type<{ question: string; answer: string }[]>(),
  createdBy: jsonb('created_by').$type<{
    name: string;
    email?: string;
    submitted_at: string;
    source: 'website_form' | 'admin' | 'import' | 'api';
  }>(),

  // Content
  description: text('description'),
  descriptionLong: text('description_long'),

  // Status
  verified: boolean('verified').default(false).notNull(),
  isFeatured: boolean('is_featured').default(false).notNull(),

  // Denormalized ratings for fast queries
  ratingAvg: decimal('rating_avg', { precision: 3, scale: 2 }).default('0'),
  reviewCount: integer('review_count').default(0).notNull(),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => [
  index('idx_clinics_state').on(table.state),
  index('idx_clinics_city').on(table.state, table.city),
  index('idx_clinics_verified').on(table.verified),
  index('idx_clinics_verified_rating').on(table.verified, table.ratingAvg),
  index('idx_clinics_country_verified').on(table.country, table.verified),
  index('idx_clinics_featured_rating').on(table.isFeatured, table.ratingAvg),
  index('idx_clinics_country').on(table.country),
]);

// ── DOCTORS ──────────────────────────────────────

export const doctors = pgTable('doctors', {
  id: uuid('id').defaultRandom().primaryKey(),
  clinicId: uuid('clinic_id').notNull().references(() => clinics.id, { onDelete: 'cascade' }),
  slug: text('slug').unique(),
  name: text('name').notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  credential: text('credential'),
  title: text('title'),
  school: text('school'),
  yearsExperience: integer('years_experience'),
  specialties: text('specialties').array(),
  bio: text('bio'),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => [
  index('idx_doctors_clinic').on(table.clinicId),
  index('idx_doctors_slug').on(table.slug),
]);

// ── REVIEWS ──────────────────────────────────────

export const reviews = pgTable('reviews', {
  id: uuid('id').defaultRandom().primaryKey(),
  clinicId: uuid('clinic_id').notNull().references(() => clinics.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  userName: text('user_name').notNull(),
  userEmail: text('user_email'),
  rating: integer('rating').notNull(),
  title: text('title'),
  body: text('body').notNull(),
  verified: boolean('verified').default(false).notNull(),
  approved: boolean('approved').default(false).notNull(),
  helpfulCount: integer('helpful_count').default(0).notNull(),
  unhelpfulCount: integer('unhelpful_count').default(0).notNull(),
  source: text('source').default('tmslist'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => [
  index('idx_reviews_clinic').on(table.clinicId),
  index('idx_reviews_approved').on(table.approved),
  index('idx_reviews_clinic_approved').on(table.clinicId, table.approved),
  index('idx_reviews_user').on(table.userId),
]);

// ── LEADS ──────────────────────────────────────

export const leads = pgTable('leads', {
  id: uuid('id').defaultRandom().primaryKey(),
  type: leadTypeEnum('type').notNull(),
  name: text('name'),
  email: text('email').notNull(),
  phone: text('phone'),
  message: text('message'),
  clinicId: uuid('clinic_id').references(() => clinics.id),
  doctorName: text('doctor_name'),
  clinicName: text('clinic_name'),
  sourceUrl: text('source_url'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => [
  index('idx_leads_type').on(table.type),
  index('idx_leads_created').on(table.createdAt),
  index('idx_leads_clinic').on(table.clinicId),
]);

// ── QUESTIONS / FAQ ──────────────────────────────

export const questions = pgTable('questions', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  category: text('category').notNull(),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  relatedSlugs: text('related_slugs').array(),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => [
  index('idx_questions_category').on(table.category),
  index('idx_questions_sort').on(table.sortOrder),
]);

// ── TREATMENTS ──────────────────────────────────

export const treatments = pgTable('treatments', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  fullName: text('full_name'),
  description: text('description'),
  fdaApproved: boolean('fda_approved').default(false),
  conditions: text('conditions').array(),
  howItWorks: text('how_it_works'),
  sessionDuration: text('session_duration'),
  treatmentCourse: text('treatment_course'),
  insuranceCoverage: text('insurance_coverage'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
});

// ── USERS (AUTH) ──────────────────────────────────

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  role: userRoleEnum('role').notNull().default('viewer'),
  name: text('name'),
  clinicId: uuid('clinic_id').references(() => clinics.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => [
  index('idx_users_clinic').on(table.clinicId),
  index('idx_users_role').on(table.role),
]);

// ── MAGIC LINK TOKENS ──────────────────────────────

export const magicTokens = pgTable('magic_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull(),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_magic_tokens_token').on(table.token),
  index('idx_magic_tokens_email').on(table.email),
]);

// ── AUDIT LOG ──────────────────────────────────

export const auditLog = pgTable('audit_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id'),
  details: jsonb('details').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_audit_user').on(table.userId),
  index('idx_audit_created').on(table.createdAt),
]);

// ── CLINIC CLAIMS ──────────────────────────────────

export const clinicClaims = pgTable('clinic_claims', {
  id: uuid('id').defaultRandom().primaryKey(),
  clinicId: uuid('clinic_id').notNull().references(() => clinics.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id),
  email: text('email').notNull(),
  verificationToken: text('verification_token').notNull().unique(),
  status: claimStatusEnum('status').notNull().default('pending'),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
}, (table) => [
  index('idx_claims_clinic').on(table.clinicId),
  index('idx_claims_status').on(table.status),
  index('idx_claims_email').on(table.email),
]);

// ── SUBSCRIPTIONS (Stripe) ──────────────────────────

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  clinicId: uuid('clinic_id').notNull().references(() => clinics.id, { onDelete: 'cascade' }),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  plan: subscriptionPlanEnum('plan').notNull(),
  status: subscriptionStatusEnum('status').notNull().default('active'),
  billingCurrency: text('billing_currency').default('usd'),
  razorpayCustomerId: text('razorpay_customer_id'),
  razorpaySubscriptionId: text('razorpay_subscription_id'),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_subscriptions_clinic').on(table.clinicId),
  index('idx_subscriptions_status').on(table.status),
]);

// ── SAVED CLINICS (User Favorites) ──────────────────

export const savedClinics = pgTable('saved_clinics', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  clinicId: uuid('clinic_id').notNull().references(() => clinics.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('idx_saved_clinics_unique').on(table.userId, table.clinicId),
]);

// ── COUNTRIES & REGIONS (International) ──────────────

export const countries = pgTable('countries', {
  code: text('code').primaryKey(), // ISO 3166-1 alpha-2
  name: text('name').notNull(),
  currency: text('currency').notNull().default('USD'),
  phonePrefix: text('phone_prefix'),
  locale: text('locale').default('en'),
  hasRegions: boolean('has_regions').default(true),
  enabled: boolean('enabled').default(false).notNull(),
  sortOrder: integer('sort_order').default(0),
});

export const regions = pgTable('regions', {
  id: uuid('id').defaultRandom().primaryKey(),
  countryCode: text('country_code').notNull().references(() => countries.code),
  code: text('code').notNull(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
}, (table) => [
  index('idx_regions_country').on(table.countryCode),
  uniqueIndex('idx_regions_country_code').on(table.countryCode, table.code),
]);

// ── SITE SETTINGS ──────────────────────────────────

export const siteSettings = pgTable('site_settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').$type<unknown>(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
  updatedBy: uuid('updated_by').references(() => users.id),
});

// ── BLOG POSTS ──────────────────────────────────

export const blogPosts = pgTable('blog_posts', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  excerpt: text('excerpt'),
  content: text('content').notNull(),
  coverImage: text('cover_image'),
  author: text('author').notNull(),
  category: text('category'),
  tags: text('tags').array(),
  status: blogStatusEnum('status').notNull().default('draft'),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
  metaTitle: text('meta_title'),
  metaDescription: text('meta_description'),
  ogImage: text('og_image'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
  createdBy: uuid('created_by').references(() => users.id),
}, (table) => [
  index('idx_blog_status').on(table.status),
  index('idx_blog_published').on(table.publishedAt),
  index('idx_blog_category').on(table.category),
]);

// ── SEO OVERRIDES ──────────────────────────────────

export const seoOverrides = pgTable('seo_overrides', {
  id: uuid('id').defaultRandom().primaryKey(),
  path: text('path').notNull().unique(), // e.g., '/us/california/los-angeles'
  metaTitle: text('meta_title'),
  metaDescription: text('meta_description'),
  ogImage: text('og_image'),
  canonicalUrl: text('canonical_url'),
  noIndex: boolean('no_index').default(false),
  structuredData: jsonb('structured_data').$type<Record<string, unknown>>(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
  updatedBy: uuid('updated_by').references(() => users.id),
});

// ── NOTIFICATIONS ──────────────────────────────────

export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // new_lead, new_review, claim_approved, etc.
  title: text('title').notNull(),
  message: text('message'),
  read: boolean('read').default(false).notNull(),
  link: text('link'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_notifications_user').on(table.userId),
  index('idx_notifications_unread').on(table.userId, table.read),
]);

// ── FORUM CATEGORIES ──────────────────────────────

export const forumCategories = pgTable('forum_categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  icon: text('icon'),
  color: text('color'),
  sortOrder: integer('sort_order').default(0).notNull(),
  postCount: integer('post_count').default(0).notNull(),
  lastActivityAt: timestamp('last_activity_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ── FORUM POSTS ──────────────────────────────────

export const forumPosts = pgTable('forum_posts', {
  id: uuid('id').defaultRandom().primaryKey(),
  categoryId: uuid('category_id').notNull().references(() => forumCategories.id),
  authorId: uuid('author_id').notNull().references(() => users.id),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  status: forumPostStatusEnum('status').notNull().default('published'),
  isPinned: boolean('is_pinned').default(false).notNull(),
  isLocked: boolean('is_locked').default(false).notNull(),
  voteScore: integer('vote_score').default(0).notNull(),
  commentCount: integer('comment_count').default(0).notNull(),
  lastActivityAt: timestamp('last_activity_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => [
  index('idx_forum_posts_category').on(table.categoryId),
  index('idx_forum_posts_author').on(table.authorId),
  index('idx_forum_posts_status').on(table.status),
  index('idx_forum_posts_category_activity').on(table.categoryId, table.lastActivityAt),
  index('idx_forum_posts_score').on(table.voteScore),
  index('idx_forum_posts_slug').on(table.slug),
]);

// ── FORUM COMMENTS ──────────────────────────────

export const forumComments = pgTable('forum_comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  postId: uuid('post_id').notNull().references(() => forumPosts.id, { onDelete: 'cascade' }),
  parentId: uuid('parent_id'),
  authorId: uuid('author_id').notNull().references(() => users.id),
  body: text('body').notNull(),
  status: forumPostStatusEnum('status').notNull().default('published'),
  isAccepted: boolean('is_accepted').default(false).notNull(),
  voteScore: integer('vote_score').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => [
  index('idx_forum_comments_post').on(table.postId),
  index('idx_forum_comments_parent').on(table.parentId),
  index('idx_forum_comments_author').on(table.authorId),
]);

// ── SAVED FORUM POSTS (Bookmarks) ──────────────────

export const savedForumPosts = pgTable('saved_forum_posts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  postId: uuid('post_id').notNull().references(() => forumPosts.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('idx_saved_forum_posts_unique').on(table.userId, table.postId),
]);

// ── FORUM VOTES ──────────────────────────────────

export const forumVotes = pgTable('forum_votes', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  targetType: text('target_type').notNull(),
  targetId: uuid('target_id').notNull(),
  value: integer('value').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('idx_forum_votes_unique').on(table.userId, table.targetType, table.targetId),
  index('idx_forum_votes_target').on(table.targetType, table.targetId),
]);

// ── FORUM REPORTS ──────────────────────────────────

export const forumReports = pgTable('forum_reports', {
  id: uuid('id').defaultRandom().primaryKey(),
  reporterId: uuid('reporter_id').notNull().references(() => users.id),
  targetType: text('target_type').notNull(),
  targetId: uuid('target_id').notNull(),
  reason: text('reason').notNull(),
  resolved: boolean('resolved').default(false).notNull(),
  resolvedBy: uuid('resolved_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_forum_reports_unresolved').on(table.resolved),
]);

// ── JOBS ──────────────────────────────────────

export const jobs = pgTable('jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  clinicId: uuid('clinic_id').notNull().references(() => clinics.id, { onDelete: 'cascade' }),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  title: text('title').notNull(),
  roleCategory: jobRoleCategoryEnum('role_category').notNull(),
  employmentType: jobEmploymentTypeEnum('employment_type').notNull().default('full_time'),
  location: text('location').notNull(),
  remote: boolean('remote').default(false).notNull(),
  salaryMin: integer('salary_min'),
  salaryMax: integer('salary_max'),
  salaryDisplay: text('salary_display'),
  description: text('description').notNull(),
  requirements: text('requirements'),
  responsibilities: text('responsibilities'),
  benefits: text('benefits'),
  applicationEmail: text('application_email'),
  applicationUrl: text('application_url'),
  status: jobStatusEnum('status').notNull().default('active'),
  viewCount: integer('view_count').default(0).notNull(),
  applicationCount: integer('application_count').default(0).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => [
  index('idx_jobs_clinic').on(table.clinicId),
  index('idx_jobs_created_by').on(table.createdBy),
  index('idx_jobs_status').on(table.status),
  index('idx_jobs_role_category').on(table.roleCategory),
  index('idx_jobs_location').on(table.location),
  index('idx_jobs_created').on(table.createdAt),
]);

// ── JOB APPLICATIONS ──────────────────────────────────

export const jobApplications = pgTable('job_applications', {
  id: uuid('id').defaultRandom().primaryKey(),
  jobId: uuid('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  clinicId: uuid('clinic_id').notNull().references(() => clinics.id),
  applicantName: text('applicant_name').notNull(),
  applicantEmail: text('applicant_email').notNull(),
  applicantPhone: text('applicant_phone'),
  resumeUrl: text('resume_url'),
  coverLetter: text('cover_letter'),
  linkedInUrl: text('linkedin_url'),
  clinicOwnerEmail: text('clinic_owner_email'),
  status: jobApplicationStatusEnum('status').notNull().default('new'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_job_applications_job').on(table.jobId),
  index('idx_job_applications_clinic').on(table.clinicId),
  index('idx_job_applications_status').on(table.status),
  index('idx_job_applications_created').on(table.createdAt),
]);

// ── TYPE EXPORTS ──────────────────────────────────

export type Clinic = typeof clinics.$inferSelect;
export type NewClinic = typeof clinics.$inferInsert;
export type Doctor = typeof doctors.$inferSelect;
export type NewDoctor = typeof doctors.$inferInsert;
export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type BlogPost = typeof blogPosts.$inferSelect;
export type NewBlogPost = typeof blogPosts.$inferInsert;
export type SeoOverride = typeof seoOverrides.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type ForumCategory = typeof forumCategories.$inferSelect;
export type ForumPost = typeof forumPosts.$inferSelect;
export type NewForumPost = typeof forumPosts.$inferInsert;
export type ForumComment = typeof forumComments.$inferSelect;
export type NewForumComment = typeof forumComments.$inferInsert;
export type ForumVote = typeof forumVotes.$inferSelect;
export type ForumReport = typeof forumReports.$inferSelect;
export type SavedForumPost = typeof savedForumPosts.$inferSelect;
export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
export type JobApplication = typeof jobApplications.$inferSelect;
export type NewJobApplication = typeof jobApplications.$inferInsert;
