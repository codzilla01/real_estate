/**
 * Client (customer) authentication routes — username + password.
 *
 * Same security model as the admin gate:
 *   • passwords verified with Argon2id (or constant-time plaintext fallback)
 *   • unknown usernames and wrong passwords are indistinguishable
 *   • attempts are rate-limited and repeated failures lock the identity
 *   • the session is a signed HttpOnly cookie
 *
 * If no client accounts are configured (no CLIENT<n>_USERNAME), the public
 * site simply skips the customer login step.
 */
import express from 'express';
import { config } from '../config.js';
import { audit } from '../audit.js';
import { signSession, verifySession } from '../session.js';
import { burnPasswordCheck, verifyPassword } from '../password.js';
import {
  blockRemaining,
  countInWindow,
  isBlocked,
  registerFailure,
  registerSuccess,
} from '../login-store.js';

export const clientAuthRouter = express.Router();

const CLIENT_SESSION_COOKIE = 'almaktab_client_session';

const GENERIC_ERROR = 'اسم المستخدم أو كلمة المرور غير صحيحة';

function clientIp(req) {
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

function findClientByUsername(username) {
  const needle = String(username || '').trim().toLowerCase();
  if (!needle) return null;
  return config.clients.find((c) => c.username.toLowerCase() === needle) || null;
}

/**
 * POST /api/client/login  { username, password }
 */
clientAuthRouter.post('/login', async (req, res) => {
  const ip = clientIp(req);
  const userAgent = req.get('user-agent') || '';
  const username = String(req.body?.username || '').trim();
  const password = String(req.body?.password || '');

  if (!username || !password) {
    return res.status(400).json({ ok: false, message: 'الرجاء إدخال اسم المستخدم وكلمة المرور' });
  }

  if (config.clients.length === 0) {
    return res.status(503).json({
      ok: false,
      message: 'خدمة تسجيل دخول العملاء غير مُفعّلة حالياً.',
    });
  }

  const ipRequests = countInWindow(`client-login:${ip}`);
  if (ipRequests > config.maxLoginRequestsPerWindow) {
    audit({
      action: 'client.login.rate_limited',
      ip,
      userAgent,
      detail: `طلبات كثيرة (${ipRequests})`,
      alert: true,
      alertTitle: '🚫 تجاوز حد محاولات دخول العملاء',
    });
    return res.status(429).json({ ok: false, message: 'محاولات كثيرة جداً. حاول بعد قليل.' });
  }

  if (isBlocked(username, ip)) {
    const remaining = blockRemaining(username, ip);
    audit({
      action: 'client.login.blocked',
      ip,
      userAgent,
      detail: `محاولة دخول أثناء الحظر (${remaining} ثانية)`,
    });
    return res.status(429).json({
      ok: false,
      message: `تم تجاوز عدد المحاولات. حاول بعد ${Math.ceil(remaining / 60)} دقيقة.`,
    });
  }

  const client = findClientByUsername(username);

  if (!client) {
    await burnPasswordCheck(password);
    registerFailure(`client:${username}`, ip);
    audit({
      action: 'client.login.failed',
      ip,
      userAgent,
      detail: 'اسم مستخدم غير معروف',
    });
    return res.status(401).json({ ok: false, message: GENERIC_ERROR });
  }

  const valid = await verifyPassword(password, client.credential);

  if (!valid) {
    const result = registerFailure(`client:${username}`, ip);
    audit({
      action: 'client.login.failed',
      ip,
      userAgent,
      detail: result.blocked
        ? `كلمة مرور خاطئة — تم الحظر ${result.remainingSeconds} ثانية`
        : `كلمة مرور خاطئة (متبقي ${result.attemptsLeft} محاولات)`,
      alert: result.blocked,
    });

    if (result.blocked) {
      return res.status(429).json({
        ok: false,
        message: `تم تجاوز عدد المحاولات. حاول بعد ${Math.ceil(result.remainingSeconds / 60)} دقيقة.`,
      });
    }
    return res.status(401).json({ ok: false, message: GENERIC_ERROR });
  }

  registerSuccess(`client:${username}`);

  const token = signSession({ sub: `client:${client.id}`, username: client.username }, config.sessionTtlSeconds);
  res.cookie(CLIENT_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.secureCookies,
    path: '/',
    maxAge: config.sessionTtlSeconds * 1000,
  });

  audit({
    action: 'client.login.success',
    ip,
    userAgent,
    detail: `username=${client.username}`,
  });

  return res.json({
    ok: true,
    username: client.username,
    fullName: client.fullName,
    expiresIn: config.sessionTtlSeconds,
  });
});

/**
 * GET /api/client/session
 */
clientAuthRouter.get('/session', (req, res) => {
  const claims = verifySession(req.cookies?.[CLIENT_SESSION_COOKIE]);
  if (!claims || !String(claims.sub || '').startsWith('client:')) {
    return res.status(401).json({ ok: false, message: 'الجلسة غير صالحة أو منتهية' });
  }
  return res.json({
    ok: true,
    username: claims.username,
    expiresIn: claims.exp - Math.floor(Date.now() / 1000),
  });
});

/**
 * POST /api/client/logout
 */
clientAuthRouter.post('/logout', (req, res) => {
  res.clearCookie(CLIENT_SESSION_COOKIE, { path: '/' });
  return res.json({ ok: true });
});

export { CLIENT_SESSION_COOKIE };
