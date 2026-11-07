/**
 * In-memory store for login attempt counters and blocks.
 *
 * Replaces the previous OTP challenge store now that authentication is
 * username + password. Tracks failures per identity (username) and per IP
 * so neither brute-forcing one account nor spraying many accounts from one
 * host is possible.
 *
 * NOTE: in-memory only. A single instance is enough for a small office;
 * swap for Redis if you run more than one instance.
 */
import { config } from './config.js';

/** key -> { count, firstAt } sliding-window counters */
const windows = new Map();

/** key -> { count, blockedUntil } */
const counters = new Map();

function now() {
  return Date.now();
}

function pruneExpired() {
  const t = now();
  for (const [key, w] of windows) {
    if (w.firstAt + config.loginWindowSeconds * 1000 < t) windows.delete(key);
  }
  for (const [key, c] of counters) {
    if (c.blockedUntil && c.blockedUntil < t) counters.delete(key);
  }
}

// Lightweight periodic cleanup (no external dependency needed).
const cleanupTimer = setInterval(pruneExpired, 60_000);
cleanupTimer.unref?.();

/**
 * Records a failed attempt for an identity and blocks it once the limit is
 * exceeded.
 *
 * @param {string} identity  the username being attacked
 * @param {string} ip        the source IP
 * @returns {{ blocked: boolean, remainingSeconds: number, attemptsLeft: number }}
 */
export function registerFailure(identity, ip) {
  const key = `id:${String(identity || '').toLowerCase()}`;
  const entry = counters.get(key) || { count: 0, blockedUntil: 0 };

  entry.count += 1;

  let blocked = false;
  let remainingSeconds = 0;

  if (entry.count >= config.maxLoginAttempts) {
    entry.blockedUntil = now() + config.loginBlockSeconds * 1000;
    blocked = true;
    remainingSeconds = config.loginBlockSeconds;
    // Reset the counter so the next window starts fresh after the block.
    entry.count = 0;
  }

  counters.set(key, entry);

  // A single IP may not spray many usernames either.
  const ipKey = `ip:${ip}`;
  const ipEntry = counters.get(ipKey) || { count: 0, blockedUntil: 0 };
  ipEntry.count += 1;
  if (ipEntry.count >= config.maxLoginAttempts * 4) {
    ipEntry.blockedUntil = now() + config.loginBlockSeconds * 1000;
    ipEntry.count = 0;
  }
  counters.set(ipKey, ipEntry);

  return {
    blocked,
    remainingSeconds,
    attemptsLeft: Math.max(0, config.maxLoginAttempts - entry.count),
  };
}

/**
 * Clears the failure counter for an identity after a successful login.
 */
export function registerSuccess(identity) {
  counters.delete(`id:${String(identity || '').toLowerCase()}`);
}

/**
 * True when the identity (or the IP) is currently blocked.
 */
export function isBlocked(identity, ip) {
  const t = now();
  for (const key of [`id:${String(identity || '').toLowerCase()}`, `ip:${ip}`]) {
    const entry = counters.get(key);
    if (entry?.blockedUntil) {
      if (entry.blockedUntil > t) return true;
      counters.delete(key);
    }
  }
  return false;
}

/**
 * Remaining block time in seconds (0 when not blocked).
 */
export function blockRemaining(identity, ip) {
  const t = now();
  let remaining = 0;
  for (const key of [`id:${String(identity || '').toLowerCase()}`, `ip:${ip}`]) {
    const entry = counters.get(key);
    if (entry?.blockedUntil && entry.blockedUntil > t) {
      remaining = Math.max(remaining, Math.ceil((entry.blockedUntil - t) / 1000));
    }
  }
  return remaining;
}

/**
 * Sliding-window counter of login requests from an IP.
 * Returns the number of requests in the current window.
 */
export function countInWindow(key, windowSeconds = config.loginWindowSeconds) {
  const t = now();
  const entry = windows.get(key);
  if (!entry || entry.firstAt + windowSeconds * 1000 < t) {
    windows.set(key, { count: 1, firstAt: t });
    return 1;
  }
  entry.count += 1;
  return entry.count;
}
