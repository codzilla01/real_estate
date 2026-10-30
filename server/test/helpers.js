export const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
export const ADMIN_PHONE = process.env.TEST_ADMIN_PHONE || '6776057443';
export const CLIENT_PHONE = process.env.TEST_CLIENT_PHONE || '971501234567';

/**
 * Generates a unique phone number per run.
 *
 * The server enforces a resend cooldown and a per-window request cap, so a
 * fixed number would make the suite order-dependent and flaky. Client OTPs
 * are delivered to the configured admin chat regardless of the number, so any
 * well-formed number works for testing the client flow.
 */
export function uniquePhone(prefix = '97150') {
  const suffix = String(Date.now()).slice(-7);
  return `${prefix}${suffix}`;
}
