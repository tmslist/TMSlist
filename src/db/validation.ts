import { z } from 'zod';

// ── SHARED SCHEMAS ──────────────────────────────

export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

// ── CLINIC VALIDATION ──────────────────────────────

export const clinicSearchSchema = z.object({
  query: z.string().max(200).optional(),
  state: z.string().max(50).optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(2).toUpperCase().optional(),
  machines: z.array(z.string()).optional(),
  insurances: z.array(z.string()).optional(),
  specialties: z.array(z.string()).optional(),
  verified: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const clinicSubmitSchema = z.object({
  name: z.string().min(2).max(200),
  address: z.string().min(5).max(500),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(50),
  country: z.string().length(2).toUpperCase().default('US'),
  zip: z.string().min(3).max(10),
  phone: z.string().min(7).max(20),
  website: z.string().url().optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  machines: z.array(z.string()).optional().default([]),
  specialties: z.array(z.string()).optional().default([]),
  insurances: z.array(z.string()).optional().default([]),
  description: z.string().max(5000).optional(),
  submitterName: z.string().min(2).max(100),
  submitterEmail: z.string().email(),
});

// ── REVIEW VALIDATION ──────────────────────────────

export const reviewSubmitSchema = z.object({
  clinicId: z.string().uuid(),
  userName: z.string().min(2).max(100),
  userEmail: z.string().email().optional(),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().max(200).optional(),
  body: z.string().min(10).max(5000),
});

// ── LEAD VALIDATION ──────────────────────────────

export const leadSubmitSchema = z.object({
  type: z.enum(['specialist_enquiry', 'lead_magnet', 'newsletter', 'quiz_lead']),
  name: z.string().min(1).max(100).optional(),
  email: z.string().email(),
  phone: z.string().max(20).optional(),
  message: z.string().max(5000).optional(),
  clinicId: z.string().uuid().optional(),
  doctorName: z.string().max(200).optional(),
  clinicName: z.string().max(200).optional(),
  sourceUrl: z.string().max(500).optional(),
  metadata: z.record(z.unknown()).optional(),
});

// ── AUTH VALIDATION ──────────────────────────────

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const magicLinkSchema = z.object({
  email: z.string().email(),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(2).max(100),
  role: z.enum(['admin', 'editor', 'viewer', 'clinic_owner']).default('viewer'),
});

// ── CONTACT FORM VALIDATION ──────────────────────────────

export const contactFormSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().max(20).optional(),
  message: z.string().min(10).max(5000),
  clinicName: z.string().max(200).optional(),
  doctorName: z.string().max(200).optional(),
  condition: z.string().max(200).optional(),
  state: z.string().max(50).optional(),
});

// ── FORUM VALIDATION ──────────────────────────────

export const forumPostSchema = z.object({
  categoryId: z.string().uuid(),
  title: z.string().min(5).max(200),
  body: z.string().min(10).max(10000),
});

export const forumCommentSchema = z.object({
  postId: z.string().uuid(),
  parentId: z.string().uuid().optional(),
  body: z.string().min(3).max(5000),
});

export const forumVoteSchema = z.object({
  targetType: z.enum(['post', 'comment']),
  targetId: z.string().uuid(),
  value: z.union([z.literal(1), z.literal(-1)]),
});

export const forumReportSchema = z.object({
  targetType: z.enum(['post', 'comment']),
  targetId: z.string().uuid(),
  reason: z.string().min(5).max(500),
});

export const forumPostsQuerySchema = z.object({
  categoryId: z.string().uuid().optional(),
  sort: z.enum(['hot', 'new', 'top']).default('hot'),
  topPeriod: z.enum(['week', 'month', 'all']).default('all'),
  search: z.string().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

// ── TYPE EXPORTS ──────────────────────────────

export type ClinicSearchInput = z.infer<typeof clinicSearchSchema>;
export type ClinicSubmitInput = z.infer<typeof clinicSubmitSchema>;
export type ReviewSubmitInput = z.infer<typeof reviewSubmitSchema>;
export type LeadSubmitInput = z.infer<typeof leadSubmitSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ContactFormInput = z.infer<typeof contactFormSchema>;
export type ForumPostInput = z.infer<typeof forumPostSchema>;
export type ForumCommentInput = z.infer<typeof forumCommentSchema>;
export type ForumVoteInput = z.infer<typeof forumVoteSchema>;
export type ForumReportInput = z.infer<typeof forumReportSchema>;
export type ForumPostsQueryInput = z.infer<typeof forumPostsQuerySchema>;

// ── JOB VALIDATION ──────────────────────────────

export const jobQuerySchema = z.object({
  search: z.string().max(200).optional(),
  state: z.string().max(50).optional(),
  city: z.string().max(100).optional(),
  roleCategory: z.string().optional(),
  employmentType: z.string().optional(),
  remote: z.coerce.boolean().optional(),
  status: z.string().optional(),
  sort: z.enum(['newest', 'oldest']).default('newest'),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const jobSubmitSchema = z.object({
  title: z.string().min(3).max(200),
  roleCategory: z.enum([
    'tms_technician', 'tms_physician', 'nurse_tms', 'psychologist',
    'front_desk', 'office_manager', 'billing',
    'marketing_coordinator', 'community_outreach', 'social_media',
    'data_researcher', 'it_support', 'other',
  ]),
  employmentType: z.enum(['full_time', 'part_time', 'contract', 'internship']).default('full_time'),
  location: z.string().min(2).max(200),
  remote: z.boolean().default(false),
  salaryMin: z.coerce.number().int().min(0).optional(),
  salaryMax: z.coerce.number().int().min(0).optional(),
  salaryDisplay: z.string().max(100).optional(),
  description: z.string().min(50).max(10000),
  requirements: z.string().max(5000).optional(),
  responsibilities: z.string().max(5000).optional(),
  benefits: z.string().max(5000).optional(),
  applicationEmail: z.string().email().optional(),
  applicationUrl: z.string().url().optional().or(z.literal('')),
  expiresAt: z.string().datetime().optional(),
});

export const jobApplicationSubmitSchema = z.object({
  applicantName: z.string().min(2).max(100),
  applicantEmail: z.string().email(),
  applicantPhone: z.string().max(20).optional(),
  resumeUrl: z.string().url().optional().or(z.literal('')),
  coverLetter: z.string().max(5000).optional(),
  linkedInUrl: z.string().url().optional().or(z.literal('')),
});

export type JobQueryInput = z.infer<typeof jobQuerySchema>;
export type JobSubmitInput = z.infer<typeof jobSubmitSchema>;
export type JobApplicationSubmitInput = z.infer<typeof jobApplicationSubmitSchema>;
