import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users } from '../db/schema';
import type { User } from '../db/schema';

const JWT_SECRET = import.meta.env.JWT_SECRET || process.env.JWT_SECRET;
if (!JWT_SECRET && typeof window === 'undefined') {
  console.warn('[auth] JWT_SECRET is not set — authentication will not work');
}
const TOKEN_EXPIRY = '7d';
const COOKIE_NAME = 'tms_session';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
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

export async function createUser(email: string, password: string, name: string, role: 'admin' | 'editor' | 'viewer' | 'clinic_owner' = 'viewer') {
  const passwordHash = await hashPassword(password);
  const result = await db.insert(users).values({
    email,
    passwordHash,
    name,
    role,
  }).returning();
  return result[0];
}

/**
 * Extract and verify session from request cookies.
 */
export function getSessionFromRequest(request: Request): JWTPayload | null {
  const cookieHeader = request.headers.get('cookie') || '';
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map(c => {
      const [key, ...val] = c.trim().split('=');
      return [key, val.join('=')];
    })
  );

  const token = cookies[COOKIE_NAME];
  if (!token) return null;

  return verifyToken(token);
}

/**
 * Create Set-Cookie header for authentication.
 */
export function createSessionCookie(payload: JWTPayload): string {
  const token = createToken(payload);
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}; Secure`;
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
