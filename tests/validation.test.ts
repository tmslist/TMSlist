import { describe, it, expect } from 'vitest';
import {
  reviewSubmitSchema,
  leadSubmitSchema,
  loginSchema,
  clinicSearchSchema,
  clinicSubmitSchema,
  contactFormSchema,
} from '../src/db/validation';

describe('reviewSubmitSchema', () => {
  it('accepts valid review', () => {
    const result = reviewSubmitSchema.safeParse({
      clinicId: '550e8400-e29b-41d4-a716-446655440000',
      userName: 'John Doe',
      rating: 5,
      body: 'Great experience with TMS therapy here.',
    });
    expect(result.success).toBe(true);
  });

  it('rejects rating below 1', () => {
    const result = reviewSubmitSchema.safeParse({
      clinicId: '550e8400-e29b-41d4-a716-446655440000',
      userName: 'John',
      rating: 0,
      body: 'Some review text here',
    });
    expect(result.success).toBe(false);
  });

  it('rejects rating above 5', () => {
    const result = reviewSubmitSchema.safeParse({
      clinicId: '550e8400-e29b-41d4-a716-446655440000',
      userName: 'John',
      rating: 6,
      body: 'Some review text here',
    });
    expect(result.success).toBe(false);
  });

  it('rejects body shorter than 10 chars', () => {
    const result = reviewSubmitSchema.safeParse({
      clinicId: '550e8400-e29b-41d4-a716-446655440000',
      userName: 'John',
      rating: 4,
      body: 'Short',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid clinicId format', () => {
    const result = reviewSubmitSchema.safeParse({
      clinicId: 'not-a-uuid',
      userName: 'John',
      rating: 4,
      body: 'Valid review body text here',
    });
    expect(result.success).toBe(false);
  });
});

describe('leadSubmitSchema', () => {
  it('accepts valid specialist enquiry', () => {
    const result = leadSubmitSchema.safeParse({
      type: 'specialist_enquiry',
      email: 'test@example.com',
      name: 'Jane Doe',
      message: 'I need help finding a TMS clinic.',
    });
    expect(result.success).toBe(true);
  });

  it('accepts newsletter signup', () => {
    const result = leadSubmitSchema.safeParse({
      type: 'newsletter',
      email: 'user@test.com',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid lead type', () => {
    const result = leadSubmitSchema.safeParse({
      type: 'invalid_type',
      email: 'test@example.com',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const result = leadSubmitSchema.safeParse({
      type: 'newsletter',
      email: 'not-an-email',
    });
    expect(result.success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    const result = loginSchema.safeParse({
      email: 'admin@tmslist.com',
      password: 'securepassword123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects short password', () => {
    const result = loginSchema.safeParse({
      email: 'admin@tmslist.com',
      password: 'short',
    });
    expect(result.success).toBe(false);
  });
});

describe('clinicSearchSchema', () => {
  it('accepts empty search (returns defaults)', () => {
    const result = clinicSearchSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(20);
      expect(result.data.offset).toBe(0);
    }
  });

  it('accepts full search params', () => {
    const result = clinicSearchSchema.safeParse({
      query: 'TMS clinic',
      state: 'CA',
      city: 'Los Angeles',
      machines: ['NeuroStar'],
      verified: true,
      limit: 10,
    });
    expect(result.success).toBe(true);
  });

  it('rejects too long query', () => {
    const result = clinicSearchSchema.safeParse({
      query: 'x'.repeat(201),
    });
    expect(result.success).toBe(false);
  });
});

describe('clinicSubmitSchema', () => {
  it('accepts valid clinic submission', () => {
    const result = clinicSubmitSchema.safeParse({
      name: 'Test TMS Clinic',
      address: '123 Main Street',
      city: 'Dallas',
      state: 'TX',
      zip: '75201',
      phone: '2145551234',
      submitterName: 'Dr. Smith',
      submitterEmail: 'smith@clinic.com',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid ZIP code', () => {
    const result = clinicSubmitSchema.safeParse({
      name: 'Test Clinic',
      address: '123 Main Street',
      city: 'Dallas',
      state: 'TX',
      zip: 'ABCDE',
      phone: '2145551234',
      submitterName: 'Dr. Smith',
      submitterEmail: 'smith@clinic.com',
    });
    expect(result.success).toBe(false);
  });
});

describe('contactFormSchema', () => {
  it('accepts valid contact form', () => {
    const result = contactFormSchema.safeParse({
      name: 'Patient Name',
      email: 'patient@email.com',
      message: 'I would like to learn more about TMS therapy.',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing message', () => {
    const result = contactFormSchema.safeParse({
      name: 'Patient',
      email: 'patient@email.com',
    });
    expect(result.success).toBe(false);
  });
});
