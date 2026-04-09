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

// ── TYPE EXPORTS ──────────────────────────────

export type ClinicSearchInput = z.infer<typeof clinicSearchSchema>;
export type ClinicSubmitInput = z.infer<typeof clinicSubmitSchema>;
export type ReviewSubmitInput = z.infer<typeof reviewSubmitSchema>;
export type LeadSubmitInput = z.infer<typeof leadSubmitSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ContactFormInput = z.infer<typeof contactFormSchema>;
