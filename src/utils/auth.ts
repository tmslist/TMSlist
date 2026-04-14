import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createHash, randomBytes } from 'crypto';
import { eq, and, isNull, gt } from 'drizzle-orm';
import { db } from '../db';
import { users, magicTokens, sessions } from '../db/schema';
import type { User } from '../db/schema';
import type { InferSelectModel } from 'drizzle-orm';

const JWT_SECRET = import.meta.env.JWT_SECRET || process.env.JWT_SECRET;
if (!JWT_SECRET && typeof window === 'undefined') {
  console.warn('[auth] JWT_SECRET is not set — authentication will not work');
}
const TOKEN_EXPIRY = '7d';
const COOKIE_NAME = 'tms_session';

export type MagicTokenPurpose = 'portal-magic' | 'community-magic' | 'password-reset' | 'email-verification';
export type UserRole = 'admin' | 'editor' | 'viewer' | 'clinic_owner';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  clinicId?: string;
  sessionId?: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function createToken(payload: JWTPayload): string {
  if (!JWT_SECRET) throw new Error('JWT_SECRET is not configured');
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): JWTPayload | null {
  if (!JWT_SECRET) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const results = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return results[0] ?? null;
}

export async function createUser(email: string, password: string, name: string, role: UserRole = 'viewer') {
  const passwordHash = await hashPassword(password);
  const result = await db.insert(users).values({
    email,
    passwordHash,
    name,
    role,
  }).returning();
  return result[0];
}

function getCookies(request: Request): Record<string, string> {
  const cookieHeader = request.headers.get('cookie') || '';
  return Object.fromEntries(
    cookieHeader.split(';').map(c => {
      const [key, ...val] = c.trim().split('=');
      return [key, val.join('=')];
    })
  );
}

/**
 * Extract and verify session from request cookies.
 * Supports both JWT cookie (backwards compat) and session-ID-based sessions.
 */
export function getSessionFromRequest(request: Request): JWTPayload | null {
  const cookies = getCookies(request);
  const token = cookies[COOKIE_NAME];
  if (!token) return null;
  return verifyToken(token);
}

/**
 * Get IP address from request headers (handles proxies).
 */
export function getClientIpFromRequest(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;
  return '';
}

/**
 * Create session record and Set-Cookie header for authentication.
 */
export async function createSession(
  payload: JWTPayload,
  opts?: { userAgent?: string; ipAddress?: string }
): Promise<{ cookie: string; sessionId: string }> {
  const token = createToken(payload);
  const sessionId = randomBytes(16).toString('hex');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await db.insert(sessions).values({
    userId: payload.userId,
    tokenHash,
    expiresAt,
    userAgent: opts?.userAgent,
    ipAddress: opts?.ipAddress,
  });

  const secure = (process.env.NODE_ENV === 'production' || process.env.VERCEL === '1')
    ? '; Secure'
    : '';
  const cookie = `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}${secure}`;
  return { cookie, sessionId };
}

/**
 * Create Set-Cookie header for authentication (JWT only, backwards compat).
 */
export function createSessionCookie(payload: JWTPayload): string {
  const token = createToken(payload);
  const secure = (process.env.NODE_ENV === 'production' || process.env.VERCEL === '1')
    ? '; Secure'
    : '';
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}${secure}`;
}

/**
 * Invalidate a session by token hash.
 */
export async function invalidateSession(token: string): Promise<void> {
  const tokenHash = createHash('sha256').update(token).digest('hex');
  await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
}

/**
 * Invalidate all sessions for a user.
 */
export async function invalidateAllUserSessions(userId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

/**
 * Create a cookie that clears the session.
 */
export function clearSessionCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

/**
 * Check if user has required role.
 */
export function hasRole(session: JWTPayload | null, ...roles: string[]): boolean {
  if (!session) return false;
  return roles.includes(session.role);
}

// ── MAGIC LINK AUTH ──────────────────────────────

const ADMIN_EMAILS = (import.meta.env.ADMIN_EMAILS || process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((e: string) => e.trim().toLowerCase())
  .filter(Boolean);

const MAGIC_LINK_EXPIRY_MINUTES = 15;

export async function createMagicToken(email: string, purpose: MagicTokenPurpose = 'portal-magic'): Promise<string> {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRY_MINUTES * 60 * 1000);

  await db.insert(magicTokens).values({
    email: email.toLowerCase(),
    token,
    purpose,
    expiresAt,
  });
  return token;
}

export async function verifyMagicToken(
  token: string,
  purpose?: MagicTokenPurpose
): Promise<{ email: string; purpose: MagicTokenPurpose } | null> {
  // Build where conditions
  const conditions = [
    eq(magicTokens.token, token),
    isNull(magicTokens.usedAt),
    gt(magicTokens.expiresAt, new Date()),
  ];
  if (purpose) {
    conditions.push(eq(magicTokens.purpose, purpose) as any);
  }

  // Atomic UPDATE...RETURNING to prevent race conditions (token replay attacks)
  const results = await db.update(magicTokens)
    .set({ usedAt: new Date() })
    .where(and(...conditions))
    .returning({ email: magicTokens.email, purpose: magicTokens.purpose });

  if (!results[0]) return null;
  return {
    email: results[0].email,
    purpose: results[0].purpose as MagicTokenPurpose,
  };
}

export async function getOrCreateUserByEmail(email: string): Promise<User> {
  const normalizedEmail = email.toLowerCase();
  const existing = await getUserByEmail(normalizedEmail);
  if (existing) return existing;

  // Auto-assign admin role if email is in ADMIN_EMAILS
  const role = ADMIN_EMAILS.includes(normalizedEmail) ? 'admin' as const : 'viewer' as const;

  const result = await db.insert(users).values({
    email: normalizedEmail,
    name: normalizedEmail.split('@')[0],
    role,
  }).returning();

  return result[0];
}

export function isAllowedEmail(email: string): boolean {
  if (ADMIN_EMAILS.length > 0) {
    return ADMIN_EMAILS.includes(email.toLowerCase());
  }
  return true;
}

// ── PASSWORD STRENGTH ──────────────────────────────

const COMMON_PASSWORDS = new Set([
  'password', 'password123', 'password1', '123456', '12345678', '123456789',
  'qwerty', 'abc123', 'monkey', 'master', 'dragon', 'letmein', 'login',
  'welcome', 'admin', 'admin123', 'iloveyou', 'sunshine', 'princess',
  'football', 'baseball', 'shadow', 'michael', 'ninja', 'mustang',
]);

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4; // 0=weakest, 4=strong
  feedback: string[];
}

export function checkPasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score++;
  else feedback.push('At least 8 characters');

  if (/[A-Z]/.test(password)) score++;
  else feedback.push('At least one uppercase letter');

  if (/[a-z]/.test(password)) score++;
  else feedback.push('At least one lowercase letter');

  if (/[0-9]/.test(password)) score++;
  else feedback.push('At least one number');

  if (/[^A-Za-z0-9]/.test(password)) score++;
  else feedback.push('At least one special character');

  // Penalize common passwords (max score stays 4)
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    score = 0;
    feedback.unshift('This is a commonly used password');
  }

  return { score: Math.min(score, 4) as 0 | 1 | 2 | 3 | 4, feedback };
}

export function isPasswordStrongEnough(password: string): boolean {
  const { score } = checkPasswordStrength(password);
  return score >= 3; // Requires at least: 8 chars + (upper OR lower) + number
}

// ── NPI VALIDATION ──────────────────────────────

const NPI_CHECKSUM_WEIGHTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 1];
const NPI_CHECKSUM_DIVISOR = 11;

export function validateNPI(npi: string): boolean {
  // NPI must be exactly 10 digits, starting with 1 or 2
  if (!/^\d{10}$/.test(npi)) return false;
  if (npi[0] !== '1' && npi[0] !== '2') return false;

  // Luhn-like checksum (NPI-10 algorithm)
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(npi[i]) * NPI_CHECKSUM_WEIGHTS[i];
  }
  const checkDigit = (NPI_CHECKSUM_DIVISOR - (sum % NPI_CHECKSUM_DIVISOR)) % NPI_CHECKSUM_DIVISOR;
  return checkDigit === parseInt(npi[9]);
}

// ── SESSION TYPES ──────────────────────────────

export type SessionRow = InferSelectModel<typeof sessions>;
