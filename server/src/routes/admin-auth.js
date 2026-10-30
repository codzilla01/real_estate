/**
 * Admin authentication routes.
 *
 * POST /api/admin/request-otp  { phone }  -> { ok, challengeId, expiresIn }
 * POST /api/admin/verify      { challengeId, otp } -> { ok, admin } + session cookie
 * GET  /api/admin/session                -> { ok, admin } | 401
 * POST /api/admin/logout                 -> clears the cookie
 * GET  /api/admin/admins                 -> public list (id, name, role, avatar)
 *
 * The browser sends a phone number; the server maps it to an admin internally.
 * The response NEVER reveals whether a number is registered, and the admin
 * roster is intentionally not enumerable by phone number.
 */
import express from 'express';
import { config } from '../config.js';
import { audit } from '../audit.js';
import { signSession, verifySession } from '../session.js';
import { sendLoginSuccess, sendOtp } from '../telegram.js';
import {
  blockKey,
  blockRemaining,
  cooldownRemaining,
  countInWindow,
  createChallenge,
  getLastChallengeForDev,
  isBlocked,
  markCooldown,
  verifyChallenge,
} from '../otp-store.js';

export const adminAuthRouter = express.Router();

const SESSION_COOKIE = 'almaktab_admin_session';

/**
 * Normalises a phone number to comparable digits.
 * "971-50 123 4567" -> "971501234567"
 */
export function normalizePhone(input) {
  return String(input || '').replace(/\D/g, '');
}

/**
 * Matches a submitted phone against an admin's chat id.
 *
 * Telegram chat ids are numeric; a user may also configure an explicit
 * phone via ADMIN<n>_PHONE. We compare the digit-only forms and also allow
 * a phone to match when it shares the configured ADMIN<n>_CHAT_ID digits.
 */
function findAdminByPhone(phone) {
  const digits = normalizePhone(phone);
  if (!digits) return null;

  // Try the explicit phone fields first.
  for (const admin of config.admins) {
    const configured = normalizePhone(admin.phone);
    if (configured && (configured === digits || configured.endsWith(digits) || digits.endsWith(configured))) {
      return admin;
    }
  }

  // Fall back to matching against the numeric chat id.
  for (const admin of config.admins) {
    const chatDigits = normalizePhone(admin.chatId);
    if (chatDigits && (chatDigits === digits || chatDigits.endsWith(digits) || digits.endsWith(chatDigits))) {
      return admin;
    }
  }

  return null;
}

function clientIp(req) {
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

/** Cookie options shared by set/clear. */
function cookieOptions(req) {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.secureCookies,
    path: '/',
    maxAge: config.sessionTtlSeconds * 1000,
  };
}

/**
 * POST /api/admin/request-otp
 */
adminAuthRouter.post('/request-otp', async (req, res) => {
  const ip = clientIp(req);
  const userAgent = req.get('user-agent') || '';
  const phone = normalizePhone(req.body?.phone);
  const digits = normalizePhone(req.body?.phone);

  if (!digits || digits.length < 8) {
    // Respond generically so we do not leak validation rules.
    return res.status(400).json({
      ok: false,
      message: 'الرجاء إدخال رقم هاتف صحيح',
    });
  }

  // ---- Rate limits: per IP and per number ----
  if (isBlocked(`ip:${ip}`) || isBlocked(`phone:${digits}`)) {
    const remaining = Math.max(blockRemaining(`ip:${ip}`), blockRemaining(`phone:${digits}`));
    audit({
      action: 'otp.request.blocked',
      ip,
      userAgent,
      detail: `تم تجاوز حد المحاولات (${remaining} ثانية)`,
      alert: true,
      alertTitle: '🚫 حظر طلب رمز دخول',
    });
    return res.status(429).json({
      ok: false,
      message: `تم تجاوز عدد المحاولات المسموح. حاول بعد ${Math.ceil(remaining / 60)} دقيقة.`,
    });
  }

  const ipRequests = countInWindow(`ip-otp:${ip}`);
  const phoneRequests = countInWindow(`phone-otp:${digits}`);

  if (ipRequests > config.maxOtpRequestsPerWindow || phoneRequests > config.maxOtpRequestsPerWindow) {
    audit({
      action: 'otp.request.rate_limited',
      ip,
      userAgent,
      detail: `طلبات كثيرة (IP: ${ipRequests}، رقم: ${phoneRequests})`,
      alert: true,
      alertTitle: '🚫 تجاوز حد طلبات رموز الدخول',
    });
    return res.status(429).json({
      ok: false,
      message: 'تم إرسال طلبات كثيرة. حاول بعد قليل.',
    });
  }

  const cooldown = cooldownRemaining(`phone:${digits}`);
  if (cooldown > 0) {
    return res.status(429).json({
      ok: false,
      message: `يرجى الانتظار ${cooldown} ثانية قبل طلب رمز جديد.`,
    });
  }

  const admin = findAdminByPhone(phone);

  if (!admin) {
    // Uniform response for unknown numbers — no account enumeration.
    audit({
      action: 'otp.request.unknown_number',
      ip,
      userAgent,
      detail: 'رقم غير مسجل',
      alert: true,
      alertTitle: '⚠️ محاولة دخول برقم غير مسجل',
    });

    // Still create a throwaway challenge so the response timing looks the same.
    createChallenge(0, '000000');
    markCooldown(`phone:${digits}`);

    return res.json({
      ok: true,
      challengeId: 'pending',
      expiresIn: config.otpTtlSeconds,
      message: 'إذا كان الرقم مسجلاً لدينا فسيصلك رمز التحقق خلال لحظات.',
    });
  }

  const { id: challengeId, otp } = createChallenge(admin.id);
  markCooldown(`phone:${digits}`);

  const result = await sendOtp({
    botToken: admin.botToken,
    chatId: admin.chatId,
    fullName: admin.fullName,
    otp,
    expiresInMinutes: Math.round(config.otpTtlSeconds / 60),
  });

  if (!result.ok) {
    audit({
      action: 'otp.request.send_failed',
      adminId: admin.id,
      adminName: admin.fullName,
      ip,
      userAgent,
      detail: result.error,
      alert: true,
      alertTitle: '❌ فشل إرسال رمز الدخول عبر Telegram',
    });
    return res.status(502).json({
      ok: false,
      message: 'تعذّر إرسال رمز التحقق حالياً. حاول بعد قليل.',
    });
  }

  audit({
    action: 'otp.request.success',
    adminId: admin.id,
    adminName: admin.fullName,
    ip,
    userAgent,
  });

  return res.json({
    ok: true,
    challengeId,
    expiresIn: config.otpTtlSeconds,
    resendAfter: config.otpResendCooldownSeconds,
    message: 'تم إرسال رمز التحقق. تحقق من رسالة Telegram.',
  });
});

/**
 * POST /api/admin/verify
 */
adminAuthRouter.post('/verify', async (req, res) => {
  const ip = clientIp(req);
  const userAgent = req.get('user-agent') || '';
  const challengeId = String(req.body?.challengeId || '');
  const otp = String(req.body?.otp || '').trim();

  if (!challengeId || challengeId === 'pending' || !/^\d{6}$/.test(otp)) {
    return res.status(400).json({ ok: false, message: 'رمز غير صالح' });
  }

  const result = verifyChallenge(challengeId, otp);

  if (!result.ok) {
    if (result.reason === 'mismatch') {
      if (result.exhausted) {
        blockKey(`ip:${ip}`, config.loginBlockSeconds);
        blockKey(`challenge:${challengeId}`, config.loginBlockSeconds);
      }
      audit({
        action: 'login.failed',
        ip,
        userAgent,
        detail: `رمز خاطئ (متبقي ${result.attemptsLeft ?? 0} محاولات)`,
        alert: !!result.exhausted,
        alertTitle: '🚨 تجاوز عدد محاولات رمز الدخول',
      });
      return res.status(401).json({
        ok: false,
        message: result.exhausted
          ? 'تم تجاوز عدد المحاولات. تم تعليق الوصول مؤقتاً.'
          : `رمز غير صحيح. متبقي ${result.attemptsLeft} محاولات.`,
      });
    }

    const messages = {
      expired: 'انتهت صلاحية الرمز. اطلب رمزاً جديداً.',
      attempts: 'تم تجاوز عدد المحاولات. اطلب رمزاً جديداً.',
      missing: 'الرمز غير موجود أو منتهي. اطلب رمزاً جديداً.',
    };
    return res.status(401).json({
      ok: false,
      message: messages[result.reason] || 'تعذّر التحقق. حاول مرة أخرى.',
    });
  }

  const admin = config.admins.find((a) => a.id === result.adminId);
  if (!admin) {
    return res.status(401).json({ ok: false, message: 'تعذّر التحقق. حاول مرة أخرى.' });
  }

  const token = signSession({
    sub: admin.id,
    name: admin.name,
    role: admin.role,
    avatar: admin.avatar,
    permissions: admin.permissions,
  });

  res.cookie(SESSION_COOKIE, token, cookieOptions(req));

  audit({
    action: 'login.success',
    adminId: admin.id,
    adminName: admin.fullName,
    ip,
    userAgent,
  });

  sendLoginSuccess({
    botToken: admin.botToken,
    chatId: admin.chatId,
    fullName: admin.fullName,
    ip,
    userAgent,
  }).catch(() => {});

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
 * events (e.g. "someone opened the admin panel"). It records the event and
 * forwards it to the alert channel. It deliberately accepts no secrets.
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

/**
 * GET /api/admin/dev/otp — DEV ONLY.
 *
 * Exposes the last issued OTP so the flow can be tested without access to
 * api.telegram.org. Hard-disabled unless MOCK_TELEGRAM is enabled.
 */
adminAuthRouter.get('/dev/otp', (req, res) => {
  if (!config.mockTelegram) {
    return res.status(404).json({ ok: false, message: 'Not found' });
  }
  const challenge = getLastChallengeForDev();
  if (!challenge) {
    return res.json({ ok: true, challengeId: null, otp: null });
  }
  return res.json({ ok: true, challengeId: challenge.id, otp: challenge.otp });
});

export { SESSION_COOKIE };
