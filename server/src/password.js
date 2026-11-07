/**
 * Password hashing and verification.
 *
 * Two storage formats are supported so the project can start with a plain
 * password and be hardened later without downtime:
 *
 *   1. **Argon2id hash** (preferred) — `$argon2id$v=19$m=...`
 *      Set ADMIN<n>_PASSWORD_HASH to the value produced by
 *      `npm run hash-password -- "your password"`.
 *
 *   2. **Plaintext** (fallback) — ADMIN<n>_PASSWORD
 *      Read from .env. Convenient for quick setup, but anyone able to read
 *      the file sees the password, so a hash is strongly preferred.
 *
 * The plaintext path is still compared in constant time, and the config
 * loader warns loudly when it is used.
 */
import crypto from 'node:crypto';
import argon2 from 'argon2';

/** Argon2id parameters — a solid default balance for a small server. */
const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19456, // 19 MiB
  timeCost: 2,
  parallelism: 1,
};

/**
 * Hashes a plaintext password with Argon2id.
 * @param {string} password
 * @returns {Promise<string>} encoded hash
 */
export async function hashPassword(password) {
  return argon2.hash(String(password), ARGON2_OPTIONS);
}

/**
 * Verifies a password against a stored credential.
 *
 * Accepts either an encoded Argon2 hash or a plaintext password. Both
 * comparisons are constant-time so the response time does not leak which
 * part was wrong.
 *
 * @param {string} password  the password supplied by the user
 * @param {string} stored    the stored credential (hash or plaintext)
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(password, stored) {
  const candidate = String(password ?? '');
  const credential = String(stored ?? '');

  if (!credential) return false;

  // --- Argon2 hash ---
  if (credential.startsWith('$argon2')) {
    try {
      return await argon2.verify(credential, candidate);
    } catch {
      return false;
    }
  }

  // --- Plaintext fallback ---
  const a = Buffer.from(candidate);
  const b = Buffer.from(credential);
  if (a.length !== b.length) {
    // Still burn a comparison so the timing does not reveal the length.
    crypto.timingSafeEqual(a, a);
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}

/**
 * True when the stored credential is a plaintext password rather than a hash.
 */
export function isPlaintext(stored) {
  const credential = String(stored ?? '');
  return credential.length > 0 && !credential.startsWith('$argon2') && !credential.startsWith('$2');
}

/**
 * A dummy hash used to equalise the timing of logins for usernames that do
 * not exist. Without it, a missing user returns noticeably faster than a
 * wrong password, which allows account enumeration.
 */
let dummyHash = null;
export async function getDummyHash() {
  if (!dummyHash) {
    dummyHash = await hashPassword(crypto.randomBytes(24).toString('hex'));
  }
  return dummyHash;
}

/**
 * Verifies a password against a dummy hash — burns the same time as a real
 * verification so unknown usernames and wrong passwords are indistinguishable.
 */
export async function burnPasswordCheck(password) {
  const hash = await getDummyHash();
  await verifyPassword(password, hash);
  return false;
}
