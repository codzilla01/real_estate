/**
 * In-memory store for OTP challenges and rate-limit counters.
 *
 * NOTE: this is intentionally in-memory. A single instance is enough for a
 * small office; swap for Redis/Postgres if you run more than one instance.
 */
import { config } from './config.js';
import { generateOtp, hashOtp, otpMatches, randomId } from './session.js';

/** challengeId -> { adminId, hash, expiresAt, attempts, issuedAt } */
const challenges = new Map();

/**
 * Development-only mirror of the most recently issued challenge.
 * Only populated when MOCK_TELEGRAM is on, so production never keeps
 * plaintext OTPs around.
 */
let devLastChallenge = null;

/** key -> { count, firstAt } sliding-window counters */
const windows = new Map();

/** key -> blockedUntil timestamp */
const blocks = new Map();

function now() {
  return Date.now();
}

function pruneExpired() {
  const t = now();
  for (const [id, c] of challenges) {
    if (c.expiresAt < t) challenges.delete(id);
  }
  for (const [key, w] of windows) {
    if (w.firstAt + config.otpWindowSeconds * 1000 < t) windows.delete(key);
  }
  for (const [key, until] of blocks) {
    if (until < t) blocks.delete(key);
  }
}

// Lightweight periodic cleanup (no external dependency needed).
const cleanupTimer = setInterval(pruneExpired, 60_000);
cleanupTimer.unref?.();

/**
 * Sliding-window counter. Returns the number of events in the current window.
 */
export function countInWindow(key, windowSeconds = config.otpWindowSeconds) {
  const t = now();
  const entry = windows.get(key);
  if (!entry || entry.firstAt + windowSeconds * 1000 < t) {
    windows.set(key, { count: 1, firstAt: t });
    return 1;
  }
  entry.count += 1;
  return entry.count;
}

/**
 * Returns the remaining cooldown in seconds for a key, or 0.
 */
export function cooldownRemaining(key, cooldownSeconds = config.otpResendCooldownSeconds) {
  const entry = windows.get(`cooldown:${key}`);
  if (!entry) return 0;
  const remaining = Math.ceil((entry.firstAt + cooldownSeconds * 1000 - now()) / 1000);
  return remaining > 0 ? remaining : 0;
}

export function markCooldown(key, cooldownSeconds = config.otpResendCooldownSeconds) {
  windows.set(`cooldown:${key}`, { count: 1, firstAt: now() });
}

/**
 * Blocks a key for the configured duration. Used after repeated OTP failures.
 */
export function blockKey(key, seconds = config.loginBlockSeconds) {
  blocks.set(key, now() + seconds * 1000);
}

export function isBlocked(key) {
  const until = blocks.get(key);
  if (!until) return false;
  if (until <= now()) {
    blocks.delete(key);
    return false;
  }
  return true;
}

export function blockRemaining(key) {
  const until = blocks.get(key);
  if (!until) return 0;
  return Math.max(0, Math.ceil((until - now()) / 1000));
}

/**
 * Creates a new OTP challenge for an admin.
 * Only the HASH of the code is retained.
 */
export function createChallenge(adminId, otp = generateOtp()) {
  const id = randomId(16);
  const nowTs = now();
  challenges.set(id, {
    id,
    adminId,
    hash: hashOtp(otp),
    expiresAt: nowTs + config.otpTtlSeconds * 1000,
    attempts: 0,
    issuedAt: nowTs,
  });

  if (config.mockTelegram) {
    devLastChallenge = { id, otp, adminId, expiresAt: nowTs + config.otpTtlSeconds * 1000 };
  }

  return { id, otp, expiresAt: nowTs + config.otpTtlSeconds * 1000 };
}

/**
 * Returns the last issued challenge (development only).
 */
export function getLastChallengeForDev() {
  if (!config.mockTelegram) return null;
  if (devLastChallenge && devLastChallenge.expiresAt < now()) return null;
  return devLastChallenge;
}

/**
 * Verifies an OTP challenge. Returns:
 *  { ok: true, adminId } | { ok: false, reason: 'expired'|'attempts'|'mismatch'|'missing' }
 */
export function verifyChallenge(challengeId, submittedOtp) {
  const challenge = challenges.get(challengeId);
  if (!challenge) return { ok: false, reason: 'missing' };
  if (challenge.expiresAt < now()) {
    challenges.delete(challengeId);
    return { ok: false, reason: 'expired' };
  }
  if (challenge.attempts >= config.otpMaxAttempts) {
    challenges.delete(challengeId);
    return { ok: false, reason: 'attempts' };
  }

  challenge.attempts += 1;

  if (!otpMatches(submittedOtp, challenge.hash)) {
    const exhausted = challenge.attempts >= config.otpMaxAttempts;
    if (exhausted) challenges.delete(challengeId);
    return {
      ok: false,
      reason: 'mismatch',
      attemptsLeft: Math.max(0, config.otpMaxAttempts - challenge.attempts),
      exhausted,
    };
  }

  challenges.delete(challengeId);
  return { ok: true, adminId: challenge.adminId };
}

export function activeChallengeCount() {
  return challenges.size;
}
