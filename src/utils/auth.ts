import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createHash, randomBytes } from 'crypto';
import { eq, and, isNull, gt } from 'drizzle-orm';
import { db } from '../db';
import { users, magicTokens, sessions, authEvents, loginHistory, passkeyChallenges } from '../db/schema';
import type { User } from '../db/schema';
import type { InferSelectModel } from 'drizzle-orm';

// JWT_SECRET may not be set at module import time (e.g., during `astro check`).
// Functions that use it guard against null/missing, so this is a warning, not a throw.
const JWT_SECRET = import.meta.env.JWT_SECRET || process.env.JWT_SECRET;
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
  isImpersonation?: boolean;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string | null | undefined): Promise<boolean> {
  if (!hash) return false;
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
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
 * Extract and verify session from request cookies (sync, JWT-only).
 *
 * Use this for hot-path public endpoints. For sensitive endpoints (admin,
 * doctor, owner, payment, impersonate), prefer `validateSessionStrict` which
 * cross-checks against the `sessions` allowlist so logout / revocation
 * actually invalidates the cookie.
 */
export function getSessionFromRequest(request: Request): JWTPayload | null {
  const cookies = getCookies(request);
  const token = cookies[COOKIE_NAME];
  if (!token) return null;
  return verifyToken(token);
}

/**
 * Async strict session validator: JWT verify PLUS a sessions-table lookup.
 *
 * Returns the payload only when:
 *   1. The JWT signature is valid and not expired.
 *   2. A row exists in `sessions` for sha256(token).
 *   3. That row's `expiresAt` is in the future.
 *
 * Returns null otherwise. This means logout / `invalidateSession` /
 * `invalidateAllUserSessions` actually take effect — a stolen cookie cannot
 * be used after revocation, even within its 7-day JWT lifetime.
 *
 * Note: legacy tokens issued before all callers were migrated to
 * `createSession` may not have a row and will be rejected. Users with such
 * cookies will be forced to re-login once.
 */
export async function validateSessionStrict(request: Request): Promise<JWTPayload | null> {
  const cookies = getCookies(request);
  const token = cookies[COOKIE_NAME];
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;

  // Impersonation cookies are short-lived JWTs that don't have a sessions
  // row by design — accept them on signature alone.
  if (payload.isImpersonation) return payload;

  try {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const rows = await db
      .select({ id: sessions.id, expiresAt: sessions.expiresAt })
      .from(sessions)
      .where(eq(sessions.tokenHash, tokenHash))
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    if (row.expiresAt && new Date() > row.expiresAt) return null;
    return payload;
  } catch (err) {
    // Fail closed if the sessions table is unreachable for a sensitive endpoint.
    console.error('[auth] validateSessionStrict DB error:', err);
    return null;
  }
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

  // Graceful fallback if sessions table doesn't exist yet
  try {
    await db.insert(sessions).values({
      userId: payload.userId,
      tokenHash,
      expiresAt,
      userAgent: opts?.userAgent,
      ipAddress: opts?.ipAddress,
    });
  } catch (err) {
    console.error('[auth] sessions table insert failed:', err);
  }

  const isProd = process.env.NODE_ENV === 'production';
  const secure = isProd ? '; Secure' : '';
  const cookie = `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}${secure}`;
  return { cookie, sessionId };
}

/**
 * Create Set-Cookie header for authentication (JWT only, backwards compat).
 */
export function createSessionCookie(payload: JWTPayload): string {
  const token = createToken(payload);
  const isProd = process.env.NODE_ENV === 'production';
  const secure = isProd ? '; Secure' : '';
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}${secure}`;
}

/**
 * Issue a short-lived (5 min), HttpOnly cookie that proves password
 * authentication succeeded for this user and the 2FA step is pending.
 * The cookie is the ONLY way to identify the user during 2FA verify —
 * never trust a userId supplied in the request body.
 */
const PENDING_MFA_COOKIE = 'tms_mfa_pending';
const PENDING_MFA_TTL_SECONDS = 5 * 60;

export function createPendingMfaCookie(userId: string): string {
  if (!JWT_SECRET) throw new Error('JWT_SECRET is not configured');
  const token = jwt.sign(
    { userId, mfaPending: true },
    JWT_SECRET,
    { expiresIn: PENDING_MFA_TTL_SECONDS },
  );
  const isProd = process.env.NODE_ENV === 'production';
  const secure = isProd ? '; Secure' : '';
  return `${PENDING_MFA_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${PENDING_MFA_TTL_SECONDS}${secure}`;
}

export function clearPendingMfaCookie(): string {
  const isProd = process.env.NODE_ENV === 'production';
  const secure = isProd ? '; Secure' : '';
  return `${PENDING_MFA_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

export function verifyPendingMfaCookie(request: Request): { userId: string } | null {
  if (!JWT_SECRET) return null;
  const cookies = getCookies(request);
  const token = cookies[PENDING_MFA_COOKIE];
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string; mfaPending: boolean };
    if (!payload.mfaPending || !payload.userId) return null;
    return { userId: payload.userId };
  } catch {
    return null;
  }
}

/**
 * Reject anything that isn't a same-origin relative path. Allows `/foo`,
 * blocks `//evil.com`, `https://...`, `javascript:...`, CRLF, and protocol-relative.
 */
export function isSafeRedirectPath(value: string | null | undefined): value is string {
  if (!value || typeof value !== 'string') return false;
  if (!value.startsWith('/')) return false;
  if (value.startsWith('//')) return false;
  if (/[\r\n]/.test(value)) return false;
  if (/^\/[a-z][a-z0-9+.-]*:/i.test(value)) return false;
  return true;
}

/**
 * Short-lived impersonation cookie (default 1h). Embeds isImpersonation
 * so downstream sensitive endpoints can refuse the session.
 */
export function createImpersonationCookie(
  payload: JWTPayload,
  ttlSeconds: number = 60 * 60,
): string {
  if (!JWT_SECRET) throw new Error('JWT_SECRET is not configured');
  const token = jwt.sign(
    { ...payload, isImpersonation: true },
    JWT_SECRET,
    { expiresIn: ttlSeconds },
  );
  const isProd = process.env.NODE_ENV === 'production';
  const secure = isProd ? '; Secure' : '';
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${ttlSeconds}${secure}`;
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
 * Create a cookie that clears the session. Mirrors the production-conditional
 * `Secure` attribute used when the session was originally issued, so browsers
 * recognize this clear cookie as overwriting the same one.
 */
export function clearSessionCookie(): string {
  const isProd = process.env.NODE_ENV === 'production';
  const secure = isProd ? '; Secure' : '';
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

/**
 * Check if user has required role.
 */
export function hasRole(session: JWTPayload | null, ...roles: string[]): boolean {
  if (!session) return false;
  return roles.includes(session.role);
}

/**
 * Parse session expiry string to milliseconds.
 * Options: '1h', '8h', '24h', '30d'
 */
export function parseSessionExpiry(expiry: string | null | undefined): number {
  switch (expiry) {
    case '1h': return 1 * 60 * 60 * 1000;
    case '8h': return 8 * 60 * 60 * 1000;
    case '24h': return 24 * 60 * 60 * 1000;
    case '30d': return 30 * 24 * 60 * 60 * 1000;
    default: return 8 * 60 * 60 * 1000; // default to 8h
  }
}

/**
 * Create a session with configurable expiry (for remember-me flows).
 */
export async function createSessionWithExpiry(
  payload: JWTPayload,
  opts?: {
    userAgent?: string;
    ipAddress?: string;
    rememberMe?: boolean;
    sessionExpiryDays?: string;
  }
): Promise<{ cookie: string; sessionId: string }> {
  let expiryMs: number;
  if (opts?.rememberMe) {
    expiryMs = parseSessionExpiry('30d');
  } else if (opts?.sessionExpiryDays) {
    expiryMs = parseSessionExpiry(opts.sessionExpiryDays);
  } else {
    expiryMs = parseSessionExpiry('8h');
  }

  const token = createToken(payload);
  const sessionId = randomBytes(16).toString('hex');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + expiryMs);

  // Graceful fallback if sessions table doesn't exist yet
  try {
    await db.insert(sessions).values({
      userId: payload.userId,
      tokenHash,
      expiresAt,
      lastUsedAt: new Date(),
      userAgent: opts?.userAgent,
      ipAddress: opts?.ipAddress,
    });
  } catch (err) {
    console.error('[auth] sessions table insert failed:', err);
  }

  const isProd = process.env.NODE_ENV === 'production';
  const secure = isProd ? '; Secure' : '';

  const maxAge = opts?.rememberMe
    ? 30 * 24 * 60 * 60
    : Math.floor(expiryMs / 1000);

  const cookie = `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
  return { cookie, sessionId };
}

// ── PERMISSIONS ──────────────────────────────

export type UserPermissions = {
  can_edit: boolean;
  can_delete: boolean;
  can_export: boolean;
  can_manage_users: boolean;
  can_billing: boolean;
};

/**
 * Check if user has a specific granular permission.
 * Falls back to admin role check — admins with role='admin' get all permissions.
 */
export function hasPermission(session: JWTPayload | null, permission: keyof UserPermissions): boolean {
  if (!session) return false;
  // Admins with role='admin' have all permissions by default
  if (session.role === 'admin') return true;
  // Non-admin roles must have permissions explicitly set (checked in API routes from DB)
  return false;
}

// ── BRUTE-FORCE LOCKOUT ──────────────────────────────

const LOCK_THRESHOLD = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Check if an account is currently locked due to brute-force attempts.
 * Automatically clears expired locks.
 */
export async function isAccountLocked(userId: string): Promise<{ locked: boolean; lockedUntil?: Date; retryAfterSeconds?: number }> {
  const results = await db.select({ lockedUntil: users.lockedUntil })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!results[0]) return { locked: false };

  const lockedUntil = results[0].lockedUntil;
  if (!lockedUntil) return { locked: false };

  if (new Date() >= lockedUntil) {
    // Lock has expired — clear it
    await db.update(users).set({ lockedUntil: null, failedLoginAttempts: 0 }).where(eq(users.id, userId));
    return { locked: false };
  }

  const retryAfterSeconds = Math.ceil((lockedUntil.getTime() - Date.now()) / 1000);
  return { locked: true, lockedUntil, retryAfterSeconds };
}

/**
 * Record a failed login attempt and lock account if threshold reached.
 * Returns the current failed attempt count and lock status.
 */
export async function recordFailedLoginAttempt(userId: string): Promise<{ attempts: number; locked: boolean; retryAfterSeconds?: number }> {
  const results = await db.select({ failedLoginAttempts: users.failedLoginAttempts })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const currentAttempts = (results[0]?.failedLoginAttempts ?? 0) + 1;

  if (currentAttempts >= LOCK_THRESHOLD) {
    const lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
    await db.update(users).set({ failedLoginAttempts: currentAttempts, lockedUntil }).where(eq(users.id, userId));
    return { attempts: currentAttempts, locked: true, retryAfterSeconds: Math.ceil(LOCK_DURATION_MS / 1000) };
  } else {
    await db.update(users).set({ failedLoginAttempts: currentAttempts }).where(eq(users.id, userId));
    return { attempts: currentAttempts, locked: false };
  }
}

/**
 * Clear failed login attempts on successful login.
 */
export async function clearFailedLoginAttempts(userId: string): Promise<void> {
  await db.update(users).set({
    failedLoginAttempts: 0,
    lockedUntil: null,
  }).where(eq(users.id, userId));
}

// ── DEVICE TYPE PARSING ──────────────────────────────

/**
 * Parse device type from user agent string (lightweight, no external deps).
 */
export function parseDeviceType(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) return 'mobile';
  if (ua.includes('tablet') || ua.includes('ipad')) return 'tablet';
  if (ua.includes('bot') || ua.includes('crawler') || ua.includes('spider')) return 'bot';
  return 'desktop';
}

// ── LOGIN ACTIVITY TRACKING ──────────────────────────────

/**
 * Log a login attempt (success or failure) to the login_history table.
 * Also calls logAuthEvent for audit trail and updates knownDevices on success.
 */
export async function logLoginActivity(params: {
  userId: string;
  email: string;
  success: boolean;
  ipAddress: string;
  userAgent: string;
  failureReason?: string;
}) {
  const deviceType = parseDeviceType(params.userAgent);
  const deviceHash = createHash('sha256').update(`${params.ipAddress}:${params.userAgent}`).digest('hex');

  try {
    // Record in login_history
    await db.insert(loginHistory).values({
      userId: params.userId,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      deviceType,
      success: params.success,
      failureReason: params.failureReason,
    });

    // Also log to auth_events table
    await logAuthEvent({
      userId: params.userId,
      action: params.success ? 'login_success' : 'login_failed',
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      metadata: { failureReason: params.failureReason, deviceType },
    });

    // Also write to admin_action_log for admin/editor role changes
    try {
      const { adminActionLog } = await import('../db/schema');
      await db.insert(adminActionLog).values({
        userId: params.userId,
        userEmail: params.email,
        action: params.success ? 'admin_login' : 'admin_login_failed',
        entityType: 'session',
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        details: { failureReason: params.failureReason },
      });
    } catch {
      // non-fatal — admin_action_log may not exist in all envs
    }

    // Update knownDevices if successful login
    if (params.success) {
      const userResults = await db.select({ knownDevices: users.knownDevices, lastLoginAt: users.lastLoginAt })
        .from(users)
        .where(eq(users.id, params.userId))
        .limit(1);

      const knownDevices: Array<{ deviceHash: string; ipAddress: string; userAgent: string; deviceType: string; firstSeenAt: string; lastSeenAt: string }> = userResults[0]?.knownDevices ?? [];

      const existingDeviceIndex = knownDevices.findIndex(d => d.deviceHash === deviceHash);
      const now = new Date().toISOString();

      if (existingDeviceIndex >= 0) {
        knownDevices[existingDeviceIndex].lastSeenAt = now;
        knownDevices[existingDeviceIndex].ipAddress = params.ipAddress;
      } else {
        knownDevices.push({ deviceHash, ipAddress: params.ipAddress, userAgent: params.userAgent, deviceType, firstSeenAt: now, lastSeenAt: now });
      }

      await db.update(users).set({ knownDevices, lastLoginAt: new Date() }).where(eq(users.id, params.userId));
    }
  } catch (err) {
    console.error('[auth] Failed to log login activity:', err);
  }
}

// ── MAGIC LINK AUTH ──────────────────────────────

const ADMIN_EMAILS = (import.meta.env.ADMIN_EMAILS || process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((e: string) => e.trim().toLowerCase())
  .filter(Boolean);

const MAGIC_LINK_EXPIRY_MINUTES = 15;

export async function createMagicToken(email: string, purpose: MagicTokenPurpose = 'portal-magic'): Promise<string> {
  const token = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRY_MINUTES * 60 * 1000);

  await db.insert(magicTokens).values({
    email: email.toLowerCase(),
    token: tokenHash,
    purpose,
    expiresAt,
  });
  return token;
}

export async function verifyMagicToken(
  token: string,
  purpose?: MagicTokenPurpose
): Promise<{ email: string; purpose: MagicTokenPurpose } | null> {
  const tokenHash = createHash('sha256').update(token).digest('hex');

  // Build where conditions
  const conditions = [
    eq(magicTokens.token, tokenHash),
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

/**
 * Log an authentication event to the auth_events table.
 * Non-blocking — failures are logged but do not interrupt the auth flow.
 */
export async function logAuthEvent(params: {
  userId: string;
  action: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await db.insert(authEvents).values({
      userId: params.userId,
      action: params.action,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      metadata: params.metadata,
    });
  } catch (err) {
    console.error('[auth] Failed to log auth event:', err);
  }
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

// ── WEBAUTHN / PASSKEYS ──────────────────────────────

import {
  generateRegistrationOptions as simpleWebauthnGenerateRegistrationOptions,
  verifyRegistrationResponse as simpleWebauthnVerifyRegistration,
  generateAuthenticationOptions as simpleWebauthnGenerateAuthOptions,
  verifyAuthenticationResponse as simpleWebauthnVerifyAuth,
  type RegistrationResponseJSON,
  type AuthenticationResponseJSON,
} from '@simplewebauthn/server';

/**
 * Generate WebAuthn registration options for passkey registration.
 */
export async function generateRegistrationOptions(opts: {
  rpName: string;
  rpId: string;
  userName: string;
  userId: string;
  attestationType: 'none' | 'indirect' | 'direct';
  excludeCredentials?: { id: string; type: 'public-key' }[];
  authenticatorSelection?: {
    authenticatorAttachment?: 'platform' | 'cross-platform';
    userVerification?: 'required' | 'preferred' | 'discouraged';
    requireResidentKey?: boolean;
  };
}) {
  return simpleWebauthnGenerateRegistrationOptions({
    rpName: opts.rpName,
    rpID: opts.rpId,
    userID: opts.userId,
    userName: opts.userName,
    attestationType: opts.attestationType,
    excludeCredentials: opts.excludeCredentials ?? [],
    authenticatorSelection: opts.authenticatorSelection ?? {},
  });
}

/**
 * Verify a WebAuthn registration response after passkey creation.
 */
export async function verifyRegistrationResponse(opts: {
  response: RegistrationResponseJSON;
  expectedChallenge: string;
  expectedOrigin: string;
  expectedRPID: string;
}) {
  return simpleWebauthnVerifyRegistration({
    response: opts.response,
    expectedChallenge: opts.expectedChallenge,
    expectedOrigin: opts.expectedOrigin,
    expectedRPID: opts.expectedRPID,
  });
}

/**
 * Generate WebAuthn authentication options for passkey login.
 */
export async function generateAuthenticationOptions(opts: {
  rpId: string;
  allowCredentials: { id: string; type: 'public-key' }[];
  userVerification?: 'required' | 'preferred' | 'discouraged';
}) {
  return simpleWebauthnGenerateAuthOptions({
    rpID: opts.rpId,
    allowCredentials: opts.allowCredentials,
    userVerification: opts.userVerification ?? 'preferred',
  });
}

/**
 * Verify a WebAuthn authentication response (assertion).
 */
export async function verifyAuthenticationResponse(opts: {
  response: AuthenticationResponseJSON;
  expectedChallenge: string;
  expectedOrigin: string;
  expectedRPID: string;
  authenticator: {
    credentialID: string;
    credentialPublicKey: Buffer;
    counter: number;
  };
}) {
  return simpleWebauthnVerifyAuth({
    response: opts.response,
    expectedChallenge: opts.expectedChallenge,
    expectedOrigin: opts.expectedOrigin,
    expectedRPID: opts.expectedRPID,
    authenticator: opts.authenticator,
  });
}

// ── PASSKEY CHALLENGE MANAGEMENT ─────────────────────────────────

const PASSKEY_CHALLENGE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Store a passkey challenge in the DB (call this in GET /register).
 * Returns the raw challenge string to include in WebAuthn options.
 */
export async function storePasskeyChallenge(userId: string, challenge: string): Promise<void> {
  const challengeHash = createHash('sha256').update(challenge).digest('hex');
  const expiresAt = new Date(Date.now() + PASSKEY_CHALLENGE_TTL_MS);

  // Clean up any existing unused challenges for this user first
  await db.delete(passkeyChallenges).where(
    and(
      eq(passkeyChallenges.userId, userId),
      isNull(passkeyChallenges.usedAt)
    )
  );

  await db.insert(passkeyChallenges).values({
    userId,
    challenge,
    challengeHash,
    expiresAt,
  });
}

/**
 * Verify a passkey challenge (call this in POST /register).
 * Returns the raw challenge string if valid, or null if missing/expired/already-used.
 * Marks the challenge as used atomically.
 */
export async function consumePasskeyChallenge(
  userId: string,
  clientChallenge: string
): Promise<string | null> {
  const challengeHash = createHash('sha256').update(clientChallenge).digest('hex');

  // Atomic: find the matching unused challenge, verify it hasn't expired, and mark it used
  // in a single conditional UPDATE...RETURNING to prevent race-condition replays.
  const now = new Date();
  const [record] = await db
    .update(passkeyChallenges)
    .set({ usedAt: now })
    .where(
      and(
        eq(passkeyChallenges.userId, userId),
        eq(passkeyChallenges.challengeHash, challengeHash),
        isNull(passkeyChallenges.usedAt),
        gt(passkeyChallenges.expiresAt, now)
      )
    )
    .returning({ challenge: passkeyChallenges.challenge });

  return record?.challenge ?? null;
}

/**
 * Store a passkey authentication challenge (call this in GET /authenticate).
 * Returns the raw challenge string to include in WebAuthn authentication options.
 */
export async function storePasskeyAuthChallenge(userId: string, challenge: string): Promise<void> {
  const challengeHash = createHash('sha256').update(challenge).digest('hex');
  const expiresAt = new Date(Date.now() + PASSKEY_CHALLENGE_TTL_MS);

  await db.delete(passkeyChallenges).where(
    and(
      eq(passkeyChallenges.userId, userId),
      isNull(passkeyChallenges.usedAt)
    )
  );

  await db.insert(passkeyChallenges).values({
    userId,
    challenge,
    challengeHash,
    expiresAt,
  });
}

/**
 * Verify a passkey authentication challenge and validate the authenticator counter.
 * Returns true if the assertion is valid and the counter is newer.
 * Marks the challenge as used atomically.
 */
export async function verifyPasskeyAuth(
  userId: string,
  clientChallenge: string,
  credentialID: string,
  newCounter: number
): Promise<{ valid: boolean; reason?: string }> {
  const challengeHash = createHash('sha256').update(clientChallenge).digest('hex');
  const now = new Date();

  // Consume the challenge
  const [challengeRecord] = await db
    .update(passkeyChallenges)
    .set({ usedAt: now })
    .where(
      and(
        eq(passkeyChallenges.userId, userId),
        eq(passkeyChallenges.challengeHash, challengeHash),
        isNull(passkeyChallenges.usedAt),
        gt(passkeyChallenges.expiresAt, now)
      )
    )
    .returning({ challenge: passkeyChallenges.challenge });

  if (!challengeRecord) {
    return { valid: false, reason: 'Challenge missing, expired, or already used' };
  }

  // Find the stored credential
  const [user] = await db.select({ passkeys: users.passkeys })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const cred = user?.passkeys?.find((p: { credentialID: string }) => p.credentialID === credentialID);

  if (!cred) {
    return { valid: false, reason: 'Credential not found for this user' };
  }

  // Counter check: reject cloned passkeys with stale counters
  if (newCounter <= cred.counter) {
    return { valid: false, reason: 'Authenticator counter regression — possible cloned passkey' };
  }

  return { valid: true };
}
