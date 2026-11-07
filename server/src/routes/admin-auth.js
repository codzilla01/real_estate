/**
 * Admin authentication routes — username + password.
 *
 * POST /api/admin/login   { username, password } -> { ok, admin } + session cookie
 * GET  /api/admin/session                 -> { ok, admin } | 401
 * POST /api/admin/logout                  -> clears the cookie
 * GET  /api/admin/admins                  -> public list (id, name, role, avatar)
 * POST /api/admin/notify                  -> records a security event
 *
 * Security properties:
 *   • passwords are verified with Argon2id (or a constant-time plaintext
 *     comparison for the legacy fallback)
 *   • unknown usernames and wrong passwords take the same time and return
 *     the same message, so accounts cannot be enumerated
 *   • repeated failures lock the identity for a configurable period
 *   • the session is an HMAC-signed HttpOnly cookie issued by the server
 */
import express from 'express';
import { config } from '../config.js';
import { audit } from '../audit.js';
import { signSession, verifySession } from '../session.js';
import { burnPasswordCheck, verifyPassword } from '../password.js';
import { sendLoginSuccess } from '../telegram.js';
import {
  blockRemaining,
  countInWindow,
  isBlocked,
  registerFailure,
  registerSuccess,
} from '../login-store.js';

export const adminAuthRouter = express.Router();

const SESSION_COOKIE = 'almaktab_admin_session';

function clientIp(req) {
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

/** Cookie options shared by set/clear. */
function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.secureCookies,
    path: '/',
    maxAge: config.sessionTtlSeconds * 1000,
  };
}

/**
 * Finds an admin by username (case-insensitive).
 */
function findAdminByUsername(username) {
  const needle = String(username || '').trim().toLowerCase();
  if (!needle) return null;
  return config.admins.find((a) => a.username.toLowerCase() === needle) || null;
}

/**
 * A single generic message for every failure mode — the client must not be
 * able to tell "no such user" from "wrong password".
 */
const GENERIC_ERROR = 'اسم المستخدم أو كلمة المرور غير صحيحة';

/**
 * POST /api/admin/login
 */
adminAuthRouter.post('/login', async (req, res) => {
  const ip = clientIp(req);
  const userAgent = req.get('user-agent') || '';
  const username = String(req.body?.username || '').trim();
  const password = String(req.body?.password || '');

  if (!username || !password) {
    return res.status(400).json({ ok: false, message: 'الرجاء إدخال اسم المستخدم وكلمة المرور' });
  }

  // ---- Rate limit by IP ----
  const ipRequests = countInWindow(`login:${ip}`);
  if (ipRequests > config.maxLoginRequestsPerWindow) {
    audit({
      action: 'login.rate_limited',
      ip,
      userAgent,
      detail: `طلبات كثيرة (${ipRequests})`,
      alert: true,
      alertTitle: '🚫 تجاوز حد محاولات الدخول',
    });
    return res.status(429).json({
      ok: false,
      message: 'محاولات كثيرة جداً. حاول بعد قليل.',
    });
  }

  // ---- Is this identity blocked? ----
  if (isBlocked(username, ip)) {
    const remaining = blockRemaining(username, ip);
    audit({
      action: 'login.blocked',
      ip,
      userAgent,
      detail: `محاولة دخول أثناء الحظر (${remaining} ثانية)`,
      alert: true,
      alertTitle: '🚫 محاولة دخول محظورة',
    });
    return res.status(429).json({
      ok: false,
      message: `تم تجاوز عدد المحاولات. حاول بعد ${Math.ceil(remaining / 60)} دقيقة.`,
    });
  }

  const admin = findAdminByUsername(username);

  // Unknown user → burn the same time as a real verification so the
  // response cannot be used to enumerate accounts.
  if (!admin) {
    await burnPasswordCheck(password);
    registerFailure(username, ip);
    audit({
      action: 'login.failed',
      ip,
      userAgent,
      detail: 'اسم مستخدم غير معروف',
    });
    return res.status(401).json({ ok: false, message: GENERIC_ERROR });
  }

  const valid = await verifyPassword(password, admin.credential);

  if (!valid) {
    const result = registerFailure(username, ip);
    audit({
      action: 'login.failed',
      adminId: admin.id,
      adminName: admin.fullName,
      ip,
      userAgent,
      detail: result.blocked
        ? `كلمة مرور خاطئة — تم الحظر ${result.remainingSeconds} ثانية`
        : `كلمة مرور خاطئة (متبقي ${result.attemptsLeft} محاولات)`,
      alert: result.blocked,
      alertTitle: '🚨 تجاوز عدد محاولات كلمة المرور',
    });

    if (result.blocked) {
      return res.status(429).json({
        ok: false,
        message: `تم تجاوز عدد المحاولات. حاول بعد ${Math.ceil(result.remainingSeconds / 60)} دقيقة.`,
      });
    }
    return res.status(401).json({ ok: false, message: GENERIC_ERROR });
  }

  // ---- Success ----
  registerSuccess(username);

  const token = signSession({
    sub: admin.id,
    name: admin.name,
    role: admin.role,
    avatar: admin.avatar,
    permissions: admin.permissions,
  });

  res.cookie(SESSION_COOKIE, token, cookieOptions());

  audit({
    action: 'login.success',
    adminId: admin.id,
    adminName: admin.fullName,
    ip,
    userAgent,
  });

  // Notify on the admin's own Telegram channel (if configured).
  if (admin.botToken && admin.chatId) {
    sendLoginSuccess({
      botToken: admin.botToken,
      chatId: admin.chatId,
      fullName: admin.fullName,
      ip,
      userAgent,
    }).catch(() => {});
  }

  return res.json({
    ok: true,
    admin: admin.public,
    expiresIn: config.sessionTtlSeconds,
  });
});

/**
 * GET /api/admin/session
 */
adminAuthRouter.get('/session', (req, res) => {
  const token = req.cookies?.[SESSION_COOKIE];
  const claims = verifySession(token);

  if (!claims) {
    return res.status(401).json({ ok: false, message: 'الجلسة غير صالحة أو منتهية' });
  }

  const admin = config.admins.find((a) => a.id === claims.sub);
  if (!admin) {
    return res.status(401).json({ ok: false, message: 'الجلسة غير صالحة' });
  }

  return res.json({
    ok: true,
    admin: admin.public,
    expiresIn: claims.exp - Math.floor(Date.now() / 1000),
  });
});

/**
 * POST /api/admin/logout
 */
adminAuthRouter.post('/logout', (req, res) => {
  const ip = clientIp(req);
  audit({ action: 'logout', ip, userAgent: req.get('user-agent') || '' });
  res.clearCookie(SESSION_COOKIE, { path: '/' });
  return res.json({ ok: true });
});

/**
 * GET /api/admin/admins — public roster for the dashboard UI.
 */
adminAuthRouter.get('/admins', (req, res) => {
  return res.json({
    ok: true,
    admins: config.admins.map((a) => a.public),
  });
});

/**
 * POST /api/admin/notify
 *
 * Lightweight endpoint used by the public site to report security-relevant
 * events. It accepts no secrets.
 */
adminAuthRouter.post('/notify', (req, res) => {
  const ip = clientIp(req);
  const action = String(req.body?.action || 'unknown').slice(0, 64);
  const detail = req.body?.detail ? String(req.body.detail).slice(0, 400) : null;

  audit({
    action: `site.${action}`,
    ip,
    userAgent: req.get('user-agent') || '',
    detail,
    alert: action.includes('access_attempt') || action.includes('failed'),
    alertTitle: '⚠️ محاولة الوصول للوحة التحكم',
  });

  return res.json({ ok: true });
});

export { SESSION_COOKIE };
