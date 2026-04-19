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
  ratingAvg: decimal('rating_avg', { precision: 3, scale: 2 }).default('0').notNull(),
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
  ownerResponse: text('owner_response'),
  ownerResponseAt: timestamp('owner_response_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => [
  index('idx_reviews_clinic').on(table.clinicId),
  index('idx_reviews_approved').on(table.approved),
  index('idx_reviews_clinic_approved').on(table.clinicId, table.approved),
  index('idx_reviews_user').on(table.userId),
  index('idx_reviews_created').on(table.createdAt),
  index('idx_reviews_clinic_approved_created').on(table.clinicId, table.approved, table.createdAt),
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
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => [
  index('idx_leads_type').on(table.type),
  index('idx_leads_created').on(table.createdAt),
  index('idx_leads_clinic').on(table.clinicId),
  index('idx_leads_email').on(table.email),
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

// ── SESSIONS ──────────────────────────────────────

export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }).defaultNow(),
  userAgent: text('user_agent'),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_sessions_user').on(table.userId),
  index('idx_sessions_token').on(table.tokenHash),
]);

// ── USERS (AUTH) ──────────────────────────────────

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  role: userRoleEnum('role').notNull().default('viewer'),
  name: text('name'),
  clinicId: uuid('clinic_id').references(() => clinics.id),
  emailVerified: boolean('email_verified').notNull().default(false),
  emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
  npiNumber: text('npi_number'),
  termsAcceptedAt: timestamp('terms_accepted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  failedLoginAttempts: integer('failed_login_attempts').default(0).notNull(),
  lockedUntil: timestamp('locked_until', { withTimezone: true }),
  knownDevices: jsonb('known_devices').$type<Array<{
    deviceHash: string;
    ipAddress: string;
    userAgent: string;
    deviceType: string;
    firstSeenAt: string;
    lastSeenAt: string;
  }>>(),
  permissions: jsonb('permissions').$type<{
    can_edit: boolean;
    can_delete: boolean;
    can_export: boolean;
    can_manage_users: boolean;
    can_billing: boolean;
  }>(),
  sessionExpiry: text('session_expiry').default('8h'),

  // TOTP 2FA
  totpSecret: text('totp_secret'),
  totpEnabled: boolean('totp_enabled').default(false).notNull(),
  totpVerifiedAt: timestamp('totp_verified_at', { withTimezone: true }),

  // Passkeys (WebAuthn)
  passkeys: jsonb('passkeys').$type<Array<{
    credentialID: string;
    credentialPublicKey: string;
    counter: number;
    deviceType: string;
    nickname?: string;
    createdAt: string;
  }>>(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => [
  index('idx_users_clinic').on(table.clinicId),
  index('idx_users_role').on(table.role),
]);

// ── MAGIC LINK TOKENS ──────────────────────────────

export const magicTokenPurposeEnum = pgEnum('magic_token_purpose', [
  'portal-magic',
  'community-magic',
  'password-reset',
  'email-verification',
]);

export const magicTokens = pgTable('magic_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull(),
  token: text('token').notNull().unique(),
  purpose: magicTokenPurposeEnum('purpose').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_magic_tokens_token').on(table.token),
  index('idx_magic_tokens_email').on(table.email),
  index('idx_magic_tokens_purpose').on(table.purpose),
]);

// ── PASSKEY CHALLENGES (temporary, short-lived) ──────────────

export const passkeyChallenges = pgTable('passkey_challenges', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  challenge: text('challenge').notNull(),        // raw base64url challenge string
  challengeHash: text('challenge_hash').notNull(), // SHA-256 hash for verification
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_passkey_challenges_user').on(table.userId),
  index('idx_passkey_challenges_hash').on(table.challengeHash),
  index('idx_passkey_challenges_expires').on(table.expiresAt),
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

// ── AUTH EVENTS ──────────────────────────────────

export const authEvents = pgTable('auth_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  action: text('action').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_auth_events_user').on(table.userId),
  index('idx_auth_events_action').on(table.action),
  index('idx_auth_events_created').on(table.createdAt),
]);

// ── LOGIN HISTORY ──────────────────────────────────

export const loginHistory = pgTable('login_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  ipAddress: text('ip_address').notNull(),
  userAgent: text('user_agent'),
  deviceType: text('device_type'),
  success: boolean('success').notNull(),
  attemptedAt: timestamp('attempted_at', { withTimezone: true }).defaultNow().notNull(),
  failureReason: text('failure_reason'),
}, (table) => [
  index('idx_login_history_user').on(table.userId),
  index('idx_login_history_user_recent').on(table.userId, table.attemptedAt),
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
  index('idx_blog_status_published').on(table.status, table.publishedAt),
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

// ── PAGE CONTENT (CMS) ──────────────────────────────────────────────────────

export const pageContent = pgTable('page_content', {
  id: uuid('id').defaultRandom().primaryKey(),
  page: text('page').notNull(),       // e.g. 'homepage', 'about', 'faq', 'contact'
  section: text('section').notNull(), // e.g. 'hero', 'features', 'cta', 'pricing_section'
  title: text('title'),
  content: text('content'),           // markdown or HTML
  imageUrl: text('image_url'),
  order: integer('order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => [
  uniqueIndex('idx_page_content_unique').on(table.page, table.section),
  index('idx_page_content_page').on(table.page),
  index('idx_page_content_order').on(table.page, table.order),
]);

// ── API KEYS ──────────────────────────────────

export const apiKeys = pgTable('api_keys', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  keyHash: text('key_hash').notNull().unique(),
  keyPrefix: text('key_prefix').notNull(),
  permissions: jsonb('permissions').$type<string[]>().default([]),
  rateLimitOverride: integer('rate_limit_override'),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_api_keys_prefix').on(table.keyPrefix),
  index('idx_api_keys_expires').on(table.expiresAt),
]);

// ── CLINIC BADGES ──────────────────────────────────

export const clinicBadges = pgTable('clinic_badges', {
  id: uuid('id').defaultRandom().primaryKey(),
  clinicId: uuid('clinic_id').notNull().references(() => clinics.id, { onDelete: 'cascade' }),
  badgeType: text('badge_type').notNull(),
  badgeName: text('badge_name').notNull(),
  badgeDescription: text('badge_description'),
  awardedAt: timestamp('awarded_at', { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
}, (table) => [
  index('idx_clinic_badges_clinic').on(table.clinicId),
]);

// ── DOCTOR BADGES ──────────────────────────────────

export const doctorBadges = pgTable('doctor_badges', {
  id: uuid('id').defaultRandom().primaryKey(),
  doctorId: uuid('doctor_id').notNull().references(() => doctors.id, { onDelete: 'cascade' }),
  badgeType: text('badge_type').notNull(),
  badgeName: text('badge_name').notNull(),
  badgeDescription: text('badge_description'),
  awardedAt: timestamp('awarded_at', { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
}, (table) => [
  index('idx_doctor_badges_doctor').on(table.doctorId),
]);

// ── REWARDS ──────────────────────────────────

export const rewards = pgTable('rewards', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  clinicId: uuid('clinic_id').references(() => clinics.id, { onDelete: 'cascade' }),
  points: integer('points').notNull().default(0),
  reason: text('reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_rewards_user').on(table.userId),
  index('idx_rewards_clinic').on(table.clinicId),
]);

export const clinicPoints = pgTable('clinic_points', {
  id: uuid('id').defaultRandom().primaryKey(),
  clinicId: uuid('clinic_id').notNull().references(() => clinics.id, { onDelete: 'cascade' }),
  totalPoints: integer('total_points').notNull().default(0),
  tier: text('tier').default('bronze'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_clinic_points_clinic').on(table.clinicId),
]);

// ── FUNNEL EVENTS ──────────────────────────────────

export const funnelEvents = pgTable('funnel_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventType: text('event_type').notNull(),
  step: text('step').notNull(),
  userId: uuid('user_id').references(() => users.id),
  sessionId: text('session_id'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_funnel_events_type').on(table.eventType),
  index('idx_funnel_events_step').on(table.step),
]);

// ── SEARCH QUERIES ──────────────────────────────────

export const searchQueries = pgTable('search_queries', {
  id: uuid('id').defaultRandom().primaryKey(),
  query: text('query').notNull(),
  resultsCount: integer('results_count').default(0),
  source: text('source'),
  userId: uuid('user_id').references(() => users.id),
  sessionId: text('session_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_search_queries_query').on(table.query),
]);

// ── SUPPORT TICKETS ──────────────────────────────────

export const supportTickets = pgTable('support_tickets', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  subject: text('subject').notNull(),
  body: text('body').notNull(),
  status: text('status').notNull().default('open'),
  priority: text('priority').default('normal'),
  assignedTo: uuid('assigned_to').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_support_tickets_user').on(table.userId),
  index('idx_support_tickets_status').on(table.status),
]);

export const ticketMessages = pgTable('ticket_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  ticketId: uuid('ticket_id').notNull().references(() => supportTickets.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id),
  body: text('body').notNull(),
  isStaffReply: boolean('is_staff_reply').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_ticket_messages_ticket').on(table.ticketId),
]);

// ── INCIDENTS ──────────────────────────────────

export const incidents = pgTable('incidents', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  severity: text('severity').notNull().default('low'),
  status: text('status').notNull().default('investigating'),
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  createdBy: uuid('created_by').references(() => users.id),
}, (table) => [
  index('idx_incidents_status').on(table.status),
  index('idx_incidents_severity').on(table.severity),
]);

export const incidentTimeline = pgTable('incident_timeline', {
  id: uuid('id').defaultRandom().primaryKey(),
  incidentId: uuid('incident_id').notNull().references(() => incidents.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id),
  event: text('event').notNull(),
  note: text('note'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_incident_timeline_incident').on(table.incidentId),
]);

// ── CITY WAITLISTS ──────────────────────────────────

export const cityWaitlists = pgTable('city_waitlists', {
  id: uuid('id').defaultRandom().primaryKey(),
  city: text('city').notNull(),
  state: text('state'),
  email: text('email'),
  position: integer('position').notNull(),
  status: text('status').notNull().default('waiting'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_city_waitlists_city').on(table.city),
]);

// ── PATIENT SURVEYS ──────────────────────────────────

export const patientSurveys = pgTable('patient_surveys', {
  id: uuid('id').defaultRandom().primaryKey(),
  doctorId: uuid('doctor_id').notNull().references(() => doctors.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id),
  surveyType: text('survey_type').notNull(),
  responses: jsonb('responses').$type<Record<string, unknown>>(),
  score: integer('score'),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_patient_surveys_doctor').on(table.doctorId),
  index('idx_patient_surveys_user').on(table.userId),
]);

// ── SURVEY RESPONSES ──────────────────────────────────

export const surveyResponses = pgTable('survey_responses', {
  id: uuid('id').defaultRandom().primaryKey(),
  surveyId: uuid('survey_id').notNull(),
  questionKey: text('question_key').notNull(),
  answer: text('answer').notNull(),
  score: integer('score'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_survey_responses_survey').on(table.surveyId),
]);

// ── TREATMENT PLANS ──────────────────────────────────

export const treatmentPlans = pgTable('treatment_plans', {
  id: uuid('id').defaultRandom().primaryKey(),
  doctorId: uuid('doctor_id').notNull().references(() => doctors.id, { onDelete: 'cascade' }),
  patientId: uuid('patient_id').references(() => users.id),
  treatmentType: text('treatment_type').notNull(),
  planData: jsonb('plan_data').$type<Record<string, unknown>>(),
  status: text('status').notNull().default('active'),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_treatment_plans_doctor').on(table.doctorId),
  index('idx_treatment_plans_patient').on(table.patientId),
]);

// ── HOSPITAL PRIVILEGES ──────────────────────────────────

export const hospitalPrivileges = pgTable('hospital_privileges', {
  id: uuid('id').defaultRandom().primaryKey(),
  doctorId: uuid('doctor_id').notNull().references(() => doctors.id, { onDelete: 'cascade' }),
  hospitalName: text('hospital_name').notNull(),
  department: text('department'),
  privilegesType: text('privileges_type'),
  startDate: timestamp('start_date', { withTimezone: true }),
  endDate: timestamp('end_date', { withTimezone: true }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_hospital_privileges_doctor').on(table.doctorId),
]);

// ── LEAD REMINDERS ──────────────────────────────────

export const leadReminders = pgTable('lead_reminders', {
  id: uuid('id').defaultRandom().primaryKey(),
  leadId: uuid('lead_id').notNull().references(() => leads.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id),
  reminderAt: timestamp('reminder_at', { withTimezone: true }).notNull(),
  message: text('message'),
  isCompleted: boolean('is_completed').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_lead_reminders_lead').on(table.leadId),
  index('idx_lead_reminders_at').on(table.reminderAt),
]);

// ── SECOND OPINIONS ──────────────────────────────────

export const secondOpinions = pgTable('second_opinions', {
  id: uuid('id').defaultRandom().primaryKey(),
  doctorId: uuid('doctor_id').notNull().references(() => doctors.id, { onDelete: 'cascade' }),
  patientId: uuid('patient_id').references(() => users.id),
  caseSummary: text('case_summary').notNull(),
  status: text('status').notNull().default('pending'),
  opinion: text('opinion'),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_second_opinions_doctor').on(table.doctorId),
  index('idx_second_opinions_patient').on(table.patientId),
]);

// ── DOCTOR EARNINGS ──────────────────────────────────

export const doctorEarnings = pgTable('doctor_earnings', {
  id: uuid('id').defaultRandom().primaryKey(),
  doctorId: uuid('doctor_id').notNull().references(() => doctors.id, { onDelete: 'cascade' }),
  period: text('period').notNull(),
  grossAmount: integer('gross_amount').default(0),
  netAmount: integer('net_amount').default(0),
  currency: text('currency').default('USD'),
  breakdown: jsonb('breakdown').$type<Record<string, unknown>>(),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_doctor_earnings_doctor').on(table.doctorId),
  index('idx_doctor_earnings_period').on(table.period),
]);

// ── DOCTOR EXPENSES ──────────────────────────────────

export const doctorExpenses = pgTable('doctor_expenses', {
  id: uuid('id').defaultRandom().primaryKey(),
  doctorId: uuid('doctor_id').notNull().references(() => doctors.id, { onDelete: 'cascade' }),
  category: text('category').notNull(),
  amount: integer('amount').notNull(),
  description: text('description'),
  date: timestamp('date', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_doctor_expenses_doctor').on(table.doctorId),
]);

// ── DOCTOR ENDORSEMENTS ──────────────────────────────────

export const doctorEndorsements = pgTable('doctor_endorsements', {
  id: uuid('id').defaultRandom().primaryKey(),
  endorserId: uuid('endorser_id').notNull().references(() => doctors.id, { onDelete: 'cascade' }),
  endorseeId: uuid('endorsee_id').notNull().references(() => doctors.id, { onDelete: 'cascade' }),
  skill: text('skill').notNull(),
  note: text('note'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_doctor_endorsements_endorser').on(table.endorserId),
  index('idx_doctor_endorsements_endorsee').on(table.endorseeId),
]);

// ── DOCTOR REFERRALS ──────────────────────────────────

export const doctorReferrals = pgTable('doctor_referrals', {
  id: uuid('id').defaultRandom().primaryKey(),
  referringDoctorId: uuid('referring_doctor_id').notNull().references(() => doctors.id, { onDelete: 'cascade' }),
  referredDoctorId: uuid('referred_doctor_id').notNull().references(() => doctors.id, { onDelete: 'cascade' }),
  patientId: uuid('patient_id').references(() => users.id),
  status: text('status').notNull().default('pending'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_doctor_referrals_referring').on(table.referringDoctorId),
  index('idx_doctor_referrals_referred').on(table.referredDoctorId),
]);

// ── DOCTOR MEDICAL LICENSES ──────────────────────────────────

export const doctorMedicalLicenses = pgTable('doctor_medical_licenses', {
  id: uuid('id').defaultRandom().primaryKey(),
  doctorId: uuid('doctor_id').notNull().references(() => doctors.id, { onDelete: 'cascade' }),
  state: text('state').notNull(),
  licenseNumber: text('license_number').notNull(),
  expirationDate: timestamp('expiration_date', { withTimezone: true }),
  isVerified: boolean('is_verified').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_doctor_medical_licenses_doctor').on(table.doctorId),
  uniqueIndex('idx_doctor_medical_licenses_unique').on(table.doctorId, table.state),
]);

// ── DOCTOR BOARD CERTIFICATIONS ──────────────────────────────────

export const doctorBoardCertifications = pgTable('doctor_board_certifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  doctorId: uuid('doctor_id').notNull().references(() => doctors.id, { onDelete: 'cascade' }),
  boardName: text('board_name').notNull(),
  certifiedAt: timestamp('certified_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  isVerified: boolean('is_verified').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_doctor_board_certifications_doctor').on(table.doctorId),
]);

// ── DOCTOR OUTCOMES ──────────────────────────────────

export const doctorOutcomes = pgTable('doctor_outcomes', {
  id: uuid('id').defaultRandom().primaryKey(),
  doctorId: uuid('doctor_id').notNull().references(() => doctors.id, { onDelete: 'cascade' }),
  treatmentType: text('treatment_type').notNull(),
  metricName: text('metric_name').notNull(),
  metricValue: integer('metric_value').notNull(),
  measurementPeriod: text('measurement_period'),
  sampleSize: integer('sample_size'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_doctor_outcomes_doctor').on(table.doctorId),
]);

// ── DOCTOR SPEAKING ──────────────────────────────────

export const doctorSpeaking = pgTable('doctor_speaking', {
  id: uuid('id').defaultRandom().primaryKey(),
  doctorId: uuid('doctor_id').notNull().references(() => doctors.id, { onDelete: 'cascade' }),
  eventName: text('event_name').notNull(),
  topic: text('topic').notNull(),
  location: text('location'),
  eventDate: timestamp('event_date', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_doctor_speaking_doctor').on(table.doctorId),
]);

// ── DOCTOR RANKINGS ──────────────────────────────────

export const doctorRankings = pgTable('doctor_rankings', {
  id: uuid('id').defaultRandom().primaryKey(),
  doctorId: uuid('doctor_id').notNull().references(() => doctors.id, { onDelete: 'cascade' }),
  rankingType: text('ranking_type').notNull(),
  rank: integer('rank').notNull(),
  score: integer('score'),
  period: text('period'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_doctor_rankings_doctor').on(table.doctorId),
  index('idx_doctor_rankings_type').on(table.rankingType),
]);

// ── DOCTOR MESSAGES ──────────────────────────────────

export const doctorMessages = pgTable('doctor_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  doctorId: uuid('doctor_id').notNull().references(() => doctors.id, { onDelete: 'cascade' }),
  senderId: uuid('sender_id').references(() => users.id),
  userId: uuid('user_id').references(() => users.id),
  patientEmail: text('patient_email'),
  subject: text('subject'),
  body: text('body').notNull(),
  direction: text('direction').notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  status: text('status').default('sent'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_doctor_messages_doctor').on(table.doctorId),
  index('idx_doctor_messages_user').on(table.userId),
  index('idx_doctor_messages_unread').on(table.doctorId, table.isRead),
]);

// ── DOCTOR AVAILABILITY ──────────────────────────────────

export const doctorProfileViews = pgTable('doctor_profile_views', {
  id: uuid('id').defaultRandom().primaryKey(),
  doctorId: uuid('doctor_id').notNull().references(() => doctors.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  referrer: text('referrer'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_doctor_profile_views_doctor').on(table.doctorId),
]);

// ── IMPORT BATCHES ──────────────────────────────────

export const importBatches = pgTable('import_batches', {
  id: uuid('id').defaultRandom().primaryKey(),
  filename: text('filename').notNull(),
  totalRows: integer('total_rows').default(0),
  successRows: integer('success_rows').default(0),
  failedRows: integer('failed_rows').default(0),
  status: text('status').notNull().default('pending'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ── LEGAL DOCUMENTS ──────────────────────────────────

export const legalDocuments = pgTable('legal_documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  type: text('type').notNull(),
  version: text('version').notNull(),
  content: text('content').notNull(),
  isActive: boolean('is_active').default(false),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('idx_legal_doc_unique').on(table.type, table.version),
]);

// ── RETENTION POLICIES ──────────────────────────────────

export const retentionPolicies = pgTable('retention_policies', {
  id: uuid('id').defaultRandom().primaryKey(),
  entityType: text('entity_type').notNull(),
  retentionDays: integer('retention_days').notNull(),
  description: text('description'),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ── COOKIE CONSENTS ──────────────────────────────────

export const cookieConsents = pgTable('cookie_consents', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  ipAddress: text('ip_address'),
  consentType: text('consent_type').notNull(),
  granted: boolean('granted').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_cookie_consents_user').on(table.userId),
]);

// ── CONSENT RECORDS ──────────────────────────────────

export const consentRecords = pgTable('consent_records', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  email: text('email'),
  consentType: text('consent_type').notNull(),
  category: text('category'),
  granted: boolean('granted').default(false),
  withdrawnAt: timestamp('withdrawn_at', { withTimezone: true }),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_consent_records_user').on(table.userId),
  index('idx_consent_records_email').on(table.email),
  index('idx_consent_records_type').on(table.consentType),
]);

// ── CLAIMS ──────────────────────────────────

export const claims = pgTable('claims', {
  id: uuid('id').defaultRandom().primaryKey(),
  patientId: uuid('patient_id').references(() => users.id),
  clinicId: uuid('clinic_id').references(() => clinics.id),
  insurerId: text('insurer_id'),
  planId: text('plan_id'),
  memberId: text('member_id'),
  status: text('status').notNull().default('submitted'),
  submittedAt: timestamp('submitted_at', { withTimezone: true }).defaultNow().notNull(),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  appealSubmittedAt: timestamp('appeal_submitted_at', { withTimezone: true }),
  claimAmount: decimal('claim_amount', { precision: 10, scale: 2 }),
  approvedAmount: decimal('approved_amount', { precision: 10, scale: 2 }),
  paidAmount: decimal('paid_amount', { precision: 10, scale: 2 }),
  denialReason: text('denial_reason'),
  appealReason: text('appeal_reason'),
  appealStatus: text('appeal_status'),
  notes: text('notes'),
  timeline: jsonb('timeline').$type<{ status: string; timestamp: string; note?: string }[]>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_claims_patient').on(table.patientId),
  index('idx_claims_clinic').on(table.clinicId),
  index('idx_claims_status').on(table.status),
  index('idx_claims_submitted').on(table.submittedAt),
]);

// ── INSURANCE ELIGIBILITY CHECKS ──────────────────────────────────

export const insuranceEligibilityChecks = pgTable('insurance_eligibility_checks', {
  id: uuid('id').defaultRandom().primaryKey(),
  patientId: uuid('patient_id').references(() => users.id),
  clinicId: uuid('clinic_id').references(() => clinics.id),
  insurerId: text('insurer_id'),
  planId: text('plan_id'),
  memberId: text('member_id'),
  groupNumber: text('group_number'),
  status: text('status').notNull().default('pending'),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  coverageDetails: jsonb('coverage_details').$type<{
    coversTMS?: boolean;
    copay?: number;
    deductible?: number;
    deductibleMet?: number;
    outOfPocketMax?: number;
    priorAuthRequired?: boolean;
    coveragePercent?: number;
    planType?: string;
    metalLevel?: string;
  }>(),
  eligibilityDetails: jsonb('eligibility_details').$type<Record<string, unknown>>(),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_eligibility_patient').on(table.patientId),
  index('idx_eligibility_status').on(table.status),
  index('idx_eligibility_verified').on(table.verifiedAt),
]);

// ── LEADERBOARDS ──────────────────────────────────

export const leaderboards = pgTable('leaderboards', {
  id: uuid('id').defaultRandom().primaryKey(),
  period: text('period').notNull(),
  category: text('category').notNull(),
  entityId: uuid('entity_id').notNull(),
  entityType: text('entity_type').notNull(),
  score: integer('score').notNull().default(0),
  rank: integer('rank'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_leaderboards_period').on(table.period),
  uniqueIndex('idx_leaderboards_unique').on(table.period, table.category, table.entityId),
]);

// ── MEDIA LIBRARY ──────────────────────────────────

export const mediaLibrary = pgTable('media_library', {
  id: uuid('id').defaultRandom().primaryKey(),
  filename: text('filename').notNull(),
  url: text('url').notNull(),
  mimeType: text('mime_type'),
  sizeBytes: integer('size_bytes'),
  alt: text('alt'),
  uploadedBy: uuid('uploaded_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ── FEATURE FLAGS ──────────────────────────────────

export const featureFlags = pgTable('feature_flags', {
  id: uuid('id').defaultRandom().primaryKey(),
  key: text('key').notNull().unique(),
  enabled: boolean('enabled').default(false),
  description: text('description'),
  rolloutPercentage: integer('rollout_percentage'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ── WEB VITALS ──────────────────────────────────

export const webVitals = pgTable('web_vitals', {
  id: uuid('id').defaultRandom().primaryKey(),
  metric: text('metric').notNull(),
  value: integer('value').notNull(),
  rating: text('rating'),
  url: text('url'),
  userId: uuid('user_id').references(() => users.id),
  sessionId: text('session_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_web_vitals_metric').on(table.metric),
  index('idx_web_vitals_url').on(table.url),
]);

// ── API ERRORS ──────────────────────────────────

export const apiErrors = pgTable('api_errors', {
  id: uuid('id').defaultRandom().primaryKey(),
  endpoint: text('endpoint').notNull(),
  method: text('method'),
  statusCode: integer('status_code'),
  errorMessage: text('error_message'),
  userId: uuid('user_id').references(() => users.id),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_api_errors_endpoint').on(table.endpoint),
  index('idx_api_errors_status').on(table.statusCode),
]);

// ── REDIRECTS ──────────────────────────────────

export const redirects = pgTable('redirects', {
  id: uuid('id').defaultRandom().primaryKey(),
  fromPath: text('from_path').notNull().unique(),
  toPath: text('to_path').notNull(),
  type: text('type').notNull().default('permanent'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ── WHITE LABEL CONFIGS ──────────────────────────────────

export const whiteLabelConfigs = pgTable('white_label_configs', {
  id: uuid('id').defaultRandom().primaryKey(),
  resellerId: uuid('reseller_id').references(() => users.id, { onDelete: 'cascade' }),
  domain: text('domain').notNull().unique(),
  brandName: text('brand_name'),
  logoUrl: text('logo_url'),
  primaryColor: text('primary_color'),
  customCss: text('custom_css'),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ── INSURANCE ──────────────────────────────────

export const insuranceInsurers = pgTable('insurance_insurers', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  logoUrl: text('logo_url'),
  website: text('website'),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const insurancePlans = pgTable('insurance_plans', {
  id: uuid('id').defaultRandom().primaryKey(),
  insurerId: uuid('insurer_id').notNull().references(() => insuranceInsurers.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  planType: text('plan_type'),
  coveragePercent: integer('coverage_percent'),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_insurance_plans_insurer').on(table.insurerId),
]);

// ── BULK CAMPAIGNS ──────────────────────────────────

export const bulkEmailCampaigns = pgTable('bulk_email_campaigns', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  subject: text('subject').notNull(),
  body: text('body').notNull(),
  status: text('status').notNull().default('draft'),
  sentCount: integer('sent_count').default(0),
  failedCount: integer('failed_count').default(0),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_bulk_email_campaigns_status').on(table.status),
]);

export const bulkSmsCampaigns = pgTable('bulk_sms_campaigns', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  message: text('message').notNull(),
  status: text('status').notNull().default('draft'),
  sentCount: integer('sent_count').default(0),
  failedCount: integer('failed_count').default(0),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ── LEAD ROUTING RULES ──────────────────────────────────

export const leadRoutingRules = pgTable('lead_routing_rules', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  priority: integer('priority').default(0),
  conditions: jsonb('conditions').$type<Record<string, unknown>>(),
  targetClinicIds: jsonb('target_clinic_ids').$type<string[]>(),
  distributionMethod: text('distribution_method').default('round_robin'),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ── GDPR REQUESTS ──────────────────────────────────

export const gdprRequests = pgTable('gdpr_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull(),
  type: text('type').notNull(),
  status: text('status').notNull().default('pending'),
  notes: text('notes'),
  history: jsonb('history').$type<{ status: string; note?: string; timestamp: string }[]>(),
  processedBy: uuid('processed_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_gdpr_requests_status').on(table.status),
  index('idx_gdpr_requests_email').on(table.email),
]);

// ── HEALTH CHECKS ──────────────────────────────────

export const healthChecks = pgTable('health_checks', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  status: text('status').notNull().default('healthy'),
  latencyMs: integer('latency_ms'),
  message: text('message'),
  checkedAt: timestamp('checked_at', { withTimezone: true }).defaultNow().notNull(),
});

// ── MAINTENANCE WINDOWS ──────────────────────────────────

export const maintenanceWindows = pgTable('maintenance_windows', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  startAt: timestamp('start_at', { withTimezone: true }).notNull(),
  endAt: timestamp('end_at', { withTimezone: true }),
  status: text('status').notNull().default('scheduled'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_maintenance_windows_status').on(table.status),
]);

// ── DOCTOR CME CREDITS ──────────────────────────────────

export const doctorCmeCredits = pgTable('doctor_cme_credits', {
  id: uuid('id').defaultRandom().primaryKey(),
  doctorId: uuid('doctor_id').notNull().references(() => doctors.id, { onDelete: 'cascade' }),
  creditsEarned: integer('credits_earned').notNull(),
  creditType: text('credit_type'),
  activityName: text('activity_name'),
  completionDate: timestamp('completion_date', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_doctor_cme_credits_doctor').on(table.doctorId),
]);

export const doctorTelehealth = pgTable('doctor_telehealth', {
  id: uuid('id').defaultRandom().primaryKey(),
  doctorId: uuid('doctor_id').notNull().references(() => doctors.id, { onDelete: 'cascade' }),
  platform: text('platform'),
  roomUrl: text('room_url'),
  enabled: boolean('enabled').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const doctorEducation = pgTable('doctor_education', {
  id: uuid('id').defaultRandom().primaryKey(),
  doctorId: uuid('doctor_id').notNull().references(() => doctors.id, { onDelete: 'cascade' }),
  degree: text('degree').notNull(),
  institution: text('institution').notNull(),
  yearCompleted: integer('year_completed'),
  field: text('field'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_doctor_education_doctor').on(table.doctorId),
]);

// ── DOCTOR AVAILABILITY ──────────────────────────────────

export const doctorAvailability = pgTable('doctor_availability', {
  id: uuid('id').defaultRandom().primaryKey(),
  doctorId: uuid('doctor_id').notNull().references(() => doctors.id, { onDelete: 'cascade' }),
  dayOfWeek: integer('day_of_week').notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  isAvailable: boolean('is_available').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_doctor_availability_doctor').on(table.doctorId),
]);

export const doctorAvailabilitySlots = pgTable('doctor_availability_slots', {
  id: uuid('id').defaultRandom().primaryKey(),
  doctorId: uuid('doctor_id').notNull().references(() => doctors.id, { onDelete: 'cascade' }),
  slotDate: timestamp('slot_date', { withTimezone: true }).notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  isBooked: boolean('is_booked').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_doctor_availability_slots_doctor').on(table.doctorId),
  index('idx_doctor_availability_slots_date').on(table.slotDate),
]);

// ── DOCTOR WAITLIST ──────────────────────────────────

export const doctorWaitlist = pgTable('doctor_waitlist', {
  id: uuid('id').defaultRandom().primaryKey(),
  doctorId: uuid('doctor_id').notNull().references(() => doctors.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id),
  email: text('email'),
  position: integer('position').notNull(),
  status: text('status').notNull().default('waiting'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_doctor_waitlist_doctor').on(table.doctorId),
]);

// ── DOCTOR APPOINTMENTS ──────────────────────────────────

export const doctorAppointments = pgTable('doctor_appointments', {
  id: uuid('id').defaultRandom().primaryKey(),
  doctorId: uuid('doctor_id').notNull().references(() => doctors.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
  durationMinutes: integer('duration_minutes').default(30),
  status: text('status').notNull().default('scheduled'),
  type: text('type'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_doctor_appointments_doctor').on(table.doctorId),
  index('idx_doctor_appointments_user').on(table.userId),
  index('idx_doctor_appointments_scheduled').on(table.scheduledAt),
]);

// ── EXPERIMENTS (A/B Tests) ──────────────────────────────────

export const experiments = pgTable('experiments', {
  id: uuid('id').defaultRandom().primaryKey(),
  key: text('key').notNull().unique(),
  description: text('description'),
  status: text('status').notNull().default('draft'),
  startDate: timestamp('start_date', { withTimezone: true }),
  endDate: timestamp('end_date', { withTimezone: true }),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_experiments_key').on(table.key),
  index('idx_experiments_status').on(table.status),
]);

export const experimentVariants = pgTable('experiment_variants', {
  id: uuid('id').defaultRandom().primaryKey(),
  experimentId: uuid('experiment_id').notNull().references(() => experiments.id, { onDelete: 'cascade' }),
  variantKey: text('variant_key').notNull(),
  description: text('description'),
  weight: integer('weight').notNull().default(50),
  isControl: boolean('is_control').default(false),
  metrics: jsonb('metrics').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_experiment_variants_experiment').on(table.experimentId),
  uniqueIndex('idx_experiment_variants_unique').on(table.experimentId, table.variantKey),
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
export type ApiKey = typeof apiKeys.$inferSelect;
export type ClinicBadge = typeof clinicBadges.$inferSelect;
export type DoctorBadge = typeof doctorBadges.$inferSelect;
export type GdprRequest = typeof gdprRequests.$inferSelect;
export type SupportTicket = typeof supportTickets.$inferSelect;
export type Incident = typeof incidents.$inferSelect;
export type AuthEvent = typeof authEvents.$inferSelect;
export type LoginHistory = typeof loginHistory.$inferSelect;
export type UserPermissions = {
  can_edit: boolean;
  can_delete: boolean;
  can_export: boolean;
  can_manage_users: boolean;
  can_billing: boolean;
};

export type TotpCredentials = {
  totpSecret: string;
  totpEnabled: boolean;
  totpVerifiedAt: Date | null;
};

export type PasskeyCredential = {
  credentialID: string;
  credentialPublicKey: string;
  counter: number;
  deviceType: string;
  nickname?: string;
  createdAt: string;
};

// ── BACKUPS ──────────────────────────────────

export const backups = pgTable('backups', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull().default('full'),
  status: text('status').notNull().default('pending'),
  sizeBytes: integer('size_bytes'),
  location: text('location'),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdBy: uuid('created_by').references(() => users.id),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_backups_status').on(table.status),
  index('idx_backups_created').on(table.createdAt),
]);

export const backupSchedules = pgTable('backup_schedules', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull().default('full'),
  frequency: text('frequency').notNull().default('daily'),
  retentionCount: integer('retention_count').default(7),
  enabled: boolean('enabled').default(true),
  lastRunAt: timestamp('last_run_at', { withTimezone: true }),
  nextRunAt: timestamp('next_run_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_backup_schedules_enabled').on(table.enabled),
]);

// ── DISASTER RECOVERY CONFIGS ──────────────────────────────────

export const disasterRecoveryConfigs = pgTable('disaster_recovery_configs', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  rpoMinutes: integer('rpo_minutes').notNull().default(60),
  rtoMinutes: integer('rto_minutes').notNull().default(240),
  failoverEnabled: boolean('failover_enabled').default(false),
  failoverStatus: text('failover_status').default('standby'),
  lastDrTestAt: timestamp('last_dr_test_at', { withTimezone: true }),
  lastDrTestResult: text('last_dr_test_result'),
  drTestLogs: jsonb('dr_test_logs').$type<{ timestamp: string; result: string; duration: number; notes?: string }[]>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
});

// ── SLA METRICS ──────────────────────────────────

export const slaMetrics = pgTable('sla_metrics', {
  id: uuid('id').defaultRandom().primaryKey(),
  period: text('period').notNull(),
  uptimePercent: decimal('uptime_percent', { precision: 5, scale: 3 }).notNull().default('100'),
  incidentCount: integer('incident_count').default(0),
  totalDowntimeMinutes: integer('total_downtime_minutes').default(0),
  affectedUsers: integer('affected_users').default(0),
  resolvedWithinRto: boolean('resolved_within_rto').default(true),
  complianceStatus: text('compliance_status').default('met'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_sla_metrics_period').on(table.period),
  uniqueIndex('idx_sla_metrics_period_unique').on(table.period),
]);

// ── LOCALES & TRANSLATIONS ──────────────────────────────────

export const locales = pgTable('locales', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  nativeName: text('native_name'),
  isActive: boolean('is_active').default(false),
  isRtl: boolean('is_rtl').default(false),
  pluralRules: text('plural_rules'),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const translations = pgTable('translations', {
  id: uuid('id').defaultRandom().primaryKey(),
  localeCode: text('locale_code').notNull().references(() => locales.code),
  key: text('key').notNull(),
  value: text('value').notNull(),
  context: text('context'),
  updatedBy: uuid('updated_by').references(() => users.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => [
  index('idx_translations_locale').on(table.localeCode),
  uniqueIndex('idx_translations_unique').on(table.localeCode, table.key),
  index('idx_translations_key').on(table.key),
]);
