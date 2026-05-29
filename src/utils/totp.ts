import { db } from '../db';
import { eq } from 'drizzle-orm';
import { users } from '../db/schema';

// Generate a random TOTP secret (base32 encoded)
export function generateTOTPSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  for (let i = 0; i < 32; i++) {
    secret += chars[Math.floor(Math.random() * chars.length)];
  }
  return secret;
}

// Verify a TOTP token (6-digit)
export function verifyTOTP(secret: string, token: string): boolean {
  if (!secret || !token || token.length !== 6 || !/^\d{6}$/.test(token)) {
    return false;
  }

  // TOTP implementation: T = floor((unixtime - epoch) / period)
  const epoch = 0;
  const period = 30;
  const digits = 6;

  // Get current time bucket
  const now = Math.floor(Date.now() / 1000);
  const currentT = Math.floor((now - epoch) / period);

  // Check current and adjacent time buckets (±1) for clock skew
  for (let offset = -1; offset <= 1; offset++) {
    const t = currentT + offset;
    if ( HOTP(secret, t, digits) === token) {
      return true;
    }
  }
  return false;
}

// HOTP algorithm (RFC 4226)
function HOTP(secret: string, counter: number, digits: number): string {
  const key = base32Decode(secret);
  const counterBytes = new Uint8Array(8);
  let value = counter;
  for (let i = 7; i >= 0; i--) {
    counterBytes[i] = value & 0xff;
    value = Math.floor(value / 256);
  }

  const hmac = hmacSHA1(key, counterBytes);
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = binary % Math.pow(10, digits);
  return String(otp).padStart(digits, '0');
}

// HMAC-SHA1
function hmacSHA1(key: Uint8Array, message: Uint8Array): Uint8Array {
  const BLOCK_SIZE = 64;

  // Pad or hash key to BLOCK_SIZE
  const k = new Uint8Array(BLOCK_SIZE);
  if (key.length > BLOCK_SIZE) {
    const hashed = sha1(key);
    k.set(hashed);
  } else {
    k.set(key);
  }

  const ipad = new Uint8Array(BLOCK_SIZE);
  const opad = new Uint8Array(BLOCK_SIZE);
  for (let i = 0; i < BLOCK_SIZE; i++) {
    ipad[i] = k[i] ^ 0x36;
    opad[i] = k[i] ^ 0x5c;
  }

  const inner = new Uint8Array(BLOCK_SIZE + message.length);
  inner.set(ipad);
  inner.set(message, BLOCK_SIZE);
  const innerHash = sha1(inner);

  const outer = new Uint8Array(BLOCK_SIZE + innerHash.length);
  outer.set(opad);
  outer.set(innerHash, BLOCK_SIZE);
  return sha1(outer);
}

// SHA-1 hash
function sha1(data: Uint8Array): Uint8Array {
  // Simple SHA-1 implementation for base32-decode compatibility
  const h = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0];

  // Pre-process: add padding
  const ml = data.length * 8;
  const padded = new Uint8Array(Math.ceil((data.length + 9) / 64) * 64);
  padded.set(data);
  padded[data.length] = 0x80;

  // Write message length in bits as big-endian 64-bit
  const view = new DataView(padded.buffer);
  view.setUint32(padded.length - 4, ml, false);

  // Process each 512-bit (64-byte) block
  const w = new Uint32Array(80);

  for (let block = 0; block < padded.length / 64; block++) {
    const offset = block * 64;
    for (let i = 0; i < 16; i++) {
      w[i] = view.getUint32(offset + i * 4, false);
    }
    for (let i = 16; i < 80; i++) {
      w[i] = rotl32(w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16], 1);
    }

    let [a, b, c, d, e] = h;

    for (let i = 0; i < 80; i++) {
      let f: number, k: number;
      if (i < 20) {
        f = (b & c) | (~b & d);
        k = 0x5a827999;
      } else if (i < 40) {
        f = b ^ c ^ d;
        k = 0x6ed9eba1;
      } else if (i < 60) {
        f = (b & c) | (b & d) | (c & d);
        k = 0x8f1bbcdc;
      } else {
        f = b ^ c ^ d;
        k = 0xca62c1d6;
      }

      const temp = (rotl32(a, 5) + f + e + k + w[i]) >>> 0;
      e = d;
      d = c;
      c = rotl32(b, 30);
      b = a;
      a = temp;
    }

    h[0] = (h[0] + a) >>> 0;
    h[1] = (h[1] + b) >>> 0;
    h[2] = (h[2] + c) >>> 0;
    h[3] = (h[3] + d) >>> 0;
    h[4] = (h[4] + e) >>> 0;
  }

  const result = new Uint8Array(20);
  const resView = new DataView(result.buffer);
  for (let i = 0; i < 5; i++) {
    resView.setUint32(i * 4, h[i], false);
  }
  return result;
}

function rotl32(x: number, n: number): number {
  return ((x << n) | (x >>> (32 - n))) >>> 0;
}

// Base32 decode (RFC 4648)
function base32Decode(encoded: string): Uint8Array {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const padded = encoded.toUpperCase().replace(/\s/g, '').padEnd(Math.ceil(encoded.length / 8) * 8, '=');

  let bits = '';
  for (const char of padded) {
    if (char === '=') break;
    const val = alphabet.indexOf(char);
    if (val < 0) continue;
    bits += val.toString(2).padStart(5, '0');
  }

  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return new Uint8Array(bytes);
}

// Generate a TOTP QR code URL (for authenticator apps)
export function generateOTPAuthUrl(secret: string, email: string, issuer = 'TMSList'): string {
  const label = encodeURIComponent(`${issuer}:${email}`);
  return `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
}

// Enable TOTP for a user after verification
export async function enableUserTOTP(userId: string) {
  await db.update(users)
    .set({ totpEnabled: true, totpVerifiedAt: new Date(), updatedAt: new Date() })
    .where(eq(users.id, userId));
}

// Disable TOTP for a user
export async function disableUserTOTP(userId: string) {
  await db.update(users)
    .set({ totpSecret: null, totpEnabled: false, totpVerifiedAt: null, updatedAt: new Date() })
    .where(eq(users.id, userId));
}
