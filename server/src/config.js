/**
 * Configuration loader.
 * Reads environment variables and builds the admin registry.
 * Secrets never leave this process.
 */
import 'node:process';
import dotenv from 'dotenv';

// A .env file must NEVER override variables that were already provided by the
// environment. Otherwise a developer's local .env would leak into test runs
// (and into production, where platform variables must win).
// Set SKIP_DOTENV=true to ignore the .env file entirely.
if (!process.env.SKIP_DOTENV) {
  dotenv.config({
    path: new URL('../.env', import.meta.url).pathname,
    override: false,
  });
}

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
 * Admin accounts are defined by env vars. An admin is only active when a
 * username AND a password credential are present, so a half-filled .env can
 * never create a login that silently fails.
 *
 * Credential resolution order:
 *   1. ADMIN<n>_PASSWORD_HASH  — Argon2id hash (preferred)
 *   2. ADMIN<n>_PASSWORD       — plaintext (fallback, warns at startup)
 *
 * The bot token / chat id are optional now: they are only needed for
 * security alerts, not for authentication.
 */
function buildAdmins() {
  const definitions = [
    {
      id: 1,
      username: process.env.ADMIN1_USERNAME || 'admin',
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
      username: process.env.ADMIN2_USERNAME || 'manager',
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
    .map((admin) => {
      const hash = (process.env[`ADMIN${admin.id}_PASSWORD_HASH`] || '').trim();
      const plain = (process.env[`ADMIN${admin.id}_PASSWORD`] || '').trim();
      const credential = hash || plain;

      return {
        ...admin,
        username: admin.username.trim(),
        passwordHash: hash,
        passwordPlain: plain,
        // The single credential used for verification.
        credential,
        usesPlaintextPassword: !hash && Boolean(plain),
        public: {
          id: admin.id,
          name: admin.name,
          role: admin.role,
          avatar: admin.avatar,
          permissions: admin.permissions,
        },
      };
    })
    .filter((admin) => admin.username && admin.credential);
}

/**
 * Client (customer) accounts. Optional — if none are configured the public
 * site simply skips the login step for customers.
 *
 * Each entry needs ADMIN-style credentials:
 *   CLIENT1_USERNAME, CLIENT1_PASSWORD_HASH or CLIENT1_PASSWORD
 */
function buildClients() {
  const clients = [];
  for (let i = 1; i <= 20; i++) {
    const username = (process.env[`CLIENT${i}_USERNAME`] || '').trim();
    if (!username) continue;

    const hash = (process.env[`CLIENT${i}_PASSWORD_HASH`] || '').trim();
    const plain = (process.env[`CLIENT${i}_PASSWORD`] || '').trim();
    const credential = hash || plain;
    if (!credential) continue;

    clients.push({
      id: i,
      username,
      fullName: (process.env[`CLIENT${i}_FULL_NAME`] || '').trim() || username,
      phone: (process.env[`CLIENT${i}_PHONE`] || '').trim(),
      credential,
      usesPlaintextPassword: !hash && Boolean(plain),
    });
  }
  return clients;
}

export const config = {
  port: int(process.env.PORT, 3000),
  env: process.env.NODE_ENV || 'development',
  publicUrl: (process.env.PUBLIC_URL || 'http://localhost:3000').replace(/\/$/, ''),
  allowedOrigins: list(process.env.ALLOWED_ORIGINS, ['http://localhost:3000']),
  sessionSecret: process.env.SESSION_SECRET || '',
  secureCookies: bool(process.env.SECURE_COOKIES, false),
  admins: buildAdmins(),
  clients: buildClients(),
  alert: {
    botToken: (process.env.ALERT_BOT_TOKEN || '').trim(),
    chatId: (process.env.ALERT_CHAT_ID || '').trim(),
  },
  sessionTtlSeconds: int(process.env.SESSION_TTL_SECONDS, 8 * 60 * 60), // 8 hours
  // Login throttling
  maxLoginAttempts: int(process.env.MAX_LOGIN_ATTEMPTS, 5), // per identity
  loginBlockSeconds: int(process.env.LOGIN_BLOCK_SECONDS, 15 * 60),
  maxLoginRequestsPerWindow: int(process.env.MAX_LOGIN_REQUESTS_PER_WINDOW, 10), // per IP
  loginWindowSeconds: int(process.env.LOGIN_WINDOW_SECONDS, 10 * 60),
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
    problems.push('FATAL: SESSION_SECRET is missing or shorter than 32 characters.');
  }
  if (config.sessionSecret === 'change_me_to_a_long_random_string_at_least_32_chars') {
    problems.push('FATAL: SESSION_SECRET is still the placeholder value.');
  }
  if (config.admins.length === 0) {
    problems.push(
      'FATAL: No active admins — set ADMIN1_USERNAME and ADMIN1_PASSWORD_HASH (or ADMIN1_PASSWORD).',
    );
  }
  if (config.env === 'production' && !config.secureCookies) {
    problems.push('SECURE_COOKIES should be true in production (HTTPS).');
  }

  // Plaintext passwords are workable but weaker — say so once, clearly.
  const plaintext = [
    ...config.admins.filter((a) => a.usesPlaintextPassword).map((a) => `ADMIN${a.id}`),
    ...config.clients.filter((c) => c.usesPlaintextPassword).map((c) => `CLIENT${c.id}`),
  ];
  if (plaintext.length) {
    problems.push(
      `Plaintext password used for: ${plaintext.join(', ')}. ` +
        'Run "npm run hash-password -- <password>" and set *_PASSWORD_HASH instead.',
    );
  }

  // Duplicate usernames would make login ambiguous.
  const usernames = config.admins.map((a) => a.username.toLowerCase());
  const dupes = usernames.filter((u, i) => usernames.indexOf(u) !== i);
  if (dupes.length) {
    problems.push(
      `FATAL: Duplicate admin usernames: ${[...new Set(dupes)].join(', ')} — login would be ambiguous.`,
    );
  }

  return problems;
}
