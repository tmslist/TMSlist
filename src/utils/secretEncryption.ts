import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';

/**
 * AES-256-GCM encryption for sensitive at-rest secrets (TOTP secrets, etc.).
 *
 * Format: `enc:v1:<iv-hex>:<authTag-hex>:<ciphertext-hex>`
 *
 * Key resolution order:
 *   1. `TOTP_ENC_KEY` env var (preferred). Hex-encoded 32 bytes (64 hex chars).
 *   2. Derived from `JWT_SECRET` via SHA-256 — provides at-rest encryption
 *      even before TOTP_ENC_KEY is configured. NOT a substitute for a
 *      dedicated key, but better than plaintext.
 *
 * The `decryptSecret` helper passes legacy plaintext values through
 * unchanged (detected by the absence of the `enc:v1:` prefix), so existing
 * TOTP secrets continue to work after deploy and re-encrypt opportunistically.
 */

const PREFIX = 'enc:v1:';

function resolveKey(): Buffer {
  const explicit = process.env.TOTP_ENC_KEY;
  if (explicit) {
    if (!/^[0-9a-fA-F]{64}$/.test(explicit)) {
      throw new Error('TOTP_ENC_KEY must be 64 hex characters (32 bytes)');
    }
    return Buffer.from(explicit, 'hex');
  }
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('Cannot derive encryption key — TOTP_ENC_KEY and JWT_SECRET both unset');
  }
  // Derive a stable 32-byte key from JWT_SECRET. Domain-separate so the
  // derived key is not the same as anything else hashed from JWT_SECRET.
  return createHash('sha256').update('totp-enc-key-v1:' + jwtSecret).digest();
}

export function encryptSecret(plaintext: string): string {
  const key = resolveKey();
  const iv = randomBytes(12); // GCM standard IV length
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString('hex')}:${tag.toString('hex')}:${ct.toString('hex')}`;
}

export function isEncryptedSecret(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.startsWith(PREFIX);
}

export function decryptSecret(value: string): string {
  if (!isEncryptedSecret(value)) {
    // Legacy plaintext — return as-is. Caller may opportunistically re-encrypt.
    return value;
  }
  const rest = value.slice(PREFIX.length);
  const parts = rest.split(':');
  if (parts.length !== 3) throw new Error('Malformed encrypted secret');
  const [ivHex, tagHex, ctHex] = parts;
  const key = resolveKey();
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const ct = Buffer.from(ctHex, 'hex');
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
  return pt.toString('utf8');
}
