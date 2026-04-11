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
]);

export const userRoleEnum = pgEnum('user_role', [
  'admin',
  'editor',
  'viewer',
  'clinic_owner',
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
  userName: text('user_name').notNull(),
  userEmail: text('user_email'),
  rating: integer('rating').notNull(),
  title: text('title'),
  body: text('body').notNull(),
  verified: boolean('verified').default(false).notNull(),
  approved: boolean('approved').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => [
  index('idx_reviews_clinic').on(table.clinicId),
  index('idx_reviews_approved').on(table.approved),
  index('idx_reviews_clinic_approved').on(table.clinicId, table.approved),
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
