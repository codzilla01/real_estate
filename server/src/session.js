/**
 * Passwordless session tokens.
 *
 * A session is an HMAC-signed compact token (JWT-like) carrying the admin id,
 * issued time and expiry. It is signed with SESSION_SECRET so the browser
 * cannot forge one — which is exactly what the old `localStorage.adminToken`
 * approach allowed.
 */
import crypto from 'node:crypto';
import { config } from './config.js';

function b64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function b64urlDecode(input) {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(padded, 'base64').toString('utf8');
}

function sign(data) {
  return crypto.createHmac('sha256', config.sessionSecret).update(data).digest('base64url');
}

/**
 * @param {object} payload  e.g. { sub: 1, role: '...', permissions: [...] }
 * @param {number} ttlSeconds
 * @returns {string} signed token
 */
export function signSession(payload, ttlSeconds = config.sessionTtlSeconds) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const body = {
    ...payload,
    iat: issuedAt,
    exp: issuedAt + ttlSeconds,
    jti: crypto.randomBytes(12).toString('hex'),
  };
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const claims = b64url(JSON.stringify(body));
  const data = `${header}.${claims}`;
  return `${data}.${sign(data)}`;
}

/**
 * Verifies a token and returns its claims, or null when invalid/expired.
 */
export function verifySession(token) {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [header, claims, signature] = parts;
  const expected = sign(`${header}.${claims}`);

  // Constant-time compare to avoid timing leaks.
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  let payload;
  try {
    payload = JSON.parse(b64urlDecode(claims));
  } catch {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  if (!payload.exp || payload.exp <= now) return null;

  return payload;
}

/** Short random id used for OTP request tracking. */
export function randomId(bytes = 16) {
  return crypto.randomBytes(bytes).toString('hex');
}

/** Generates a cryptographically strong 6-digit OTP. */
export function generateOtp(digits = 6) {
  const max = 10 ** digits;
  // Rejection sampling to avoid modulo bias.
  const limit = Math.floor(0xffffffff / max) * max;
  let value;
  do {
    value = crypto.randomBytes(4).readUInt32BE(0);
  } while (value >= limit);
  return String(value % max).padStart(digits, '0');
}

/**
 * Hashes an OTP with the session secret so the plaintext code is never stored
 * at rest, even in the in-memory challenge store.
 */
export function hashOtp(otp) {
  return crypto.createHmac('sha256', config.sessionSecret).update(String(otp)).digest('hex');
}

/** Timing-safe OTP comparison over their hashed forms. */
export function otpMatches(candidate, storedHash) {
  const a = Buffer.from(hashOtp(candidate));
  const b = Buffer.from(storedHash);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
