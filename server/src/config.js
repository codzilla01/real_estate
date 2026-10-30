/**
 * Configuration loader.
 * Reads environment variables and builds the admin registry.
 * Secrets never leave this process.
 */
import 'node:process';
import dotenv from 'dotenv';

dotenv.config({ path: new URL('../.env', import.meta.url).pathname });

function bool(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).trim().toLowerCase());
}

function int(value, fallback) {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

function list(value, fallback = []) {
  if (!value) return fallback;
  return String(value)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Admin accounts are defined by env vars. An admin is only active when BOTH
 * a bot token and a chat id are present, so a half-filled .env can never
 * create a login that silently fails.
 */
function buildAdmins() {
  const definitions = [
    {
      id: 1,
      name: process.env.ADMIN1_NAME || 'Dev',
      fullName: process.env.ADMIN1_FULL_NAME || 'Mr. Developer',
      role: process.env.ADMIN1_ROLE || 'المسؤول الرئيسي',
      avatar: process.env.ADMIN1_AVATAR || 'D',
      botToken: (process.env.ADMIN1_BOT_TOKEN || '').trim(),
      chatId: (process.env.ADMIN1_CHAT_ID || '').trim(),
      permissions: list(process.env.ADMIN1_PERMISSIONS, ['all']),
    },
    {
      id: 2,
      name: process.env.ADMIN2_NAME || 'مهند',
      fullName: process.env.ADMIN2_FULL_NAME || 'مهند عبد الخالق - مالك المكتب العقاري',
      role: process.env.ADMIN2_ROLE || 'المسؤول الثاني',
      avatar: process.env.ADMIN2_AVATAR || 'م',
      botToken: (process.env.ADMIN2_BOT_TOKEN || '').trim(),
      chatId: (process.env.ADMIN2_CHAT_ID || '').trim(),
      permissions: list(process.env.ADMIN2_PERMISSIONS, ['all']),
    },
  ];

  return definitions
    .filter((a) => a.botToken && a.chatId)
    .map((a) => ({
      ...a,
      // Public profile — safe to send to the browser.
      public: {
        id: a.id,
        name: a.name,
        role: a.role,
        avatar: a.avatar,
        permissions: a.permissions,
      },
    }));
}

export const config = {
  port: int(process.env.PORT, 3000),
  env: process.env.NODE_ENV || 'development',
  publicUrl: (process.env.PUBLIC_URL || 'http://localhost:3000').replace(/\/$/, ''),
  allowedOrigins: list(process.env.ALLOWED_ORIGINS, ['http://localhost:3000']),
  sessionSecret: process.env.SESSION_SECRET || '',
  secureCookies: bool(process.env.SECURE_COOKIES, false),
  admins: buildAdmins(),
  alert: {
    botToken: (process.env.ALERT_BOT_TOKEN || '').trim(),
    chatId: (process.env.ALERT_CHAT_ID || '').trim(),
  },
  sessionTtlSeconds: int(process.env.SESSION_TTL_SECONDS, 8 * 60 * 60), // 8 hours
  otpTtlSeconds: int(process.env.OTP_TTL_SECONDS, 5 * 60), // 5 minutes
  otpMaxAttempts: int(process.env.OTP_MAX_ATTEMPTS, 5),
  otpResendCooldownSeconds: int(process.env.OTP_RESEND_COOLDOWN_SECONDS, 60),
  loginBlockSeconds: int(process.env.LOGIN_BLOCK_SECONDS, 15 * 60),
  maxOtpRequestsPerWindow: int(process.env.MAX_OTP_REQUESTS_PER_WINDOW, 3),
  otpWindowSeconds: int(process.env.OTP_WINDOW_SECONDS, 10 * 60),
  // When true, Telegram messages are logged instead of sent. Useful for local
  // development and for environments without access to api.telegram.org.
  mockTelegram: bool(process.env.MOCK_TELEGRAM, false),
};

/**
 * Warns loudly about insecure defaults so a misconfigured deployment fails
 * visibly rather than silently running wide open.
 */
export function assertConfig() {
  const problems = [];

  if (!config.sessionSecret || config.sessionSecret.length < 32) {
    problems.push('SESSION_SECRET is missing or shorter than 32 characters.');
  }
  if (config.sessionSecret === 'change_me_to_a_long_random_string_at_least_32_chars') {
    problems.push('SESSION_SECRET is still the placeholder value.');
  }
  if (config.admins.length === 0) {
    problems.push('No active admins: set at least ADMIN1_BOT_TOKEN and ADMIN1_CHAT_ID.');
  }
  if (config.env === 'production' && !config.secureCookies) {
    problems.push('SECURE_COOKIES should be true in production (HTTPS).');
  }

  return problems;
}
