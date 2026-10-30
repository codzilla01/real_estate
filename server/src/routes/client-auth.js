/**
 * Client (customer) authentication routes — passwordless OTP.
 *
 * Same security model as the admin gate:
 *   • the OTP is generated on the server with a CSPRNG
 *   • only its HMAC hash is stored
 *   • the browser never sees a bot token
 *   • attempts are rate-limited
 */
import express from 'express';
import { config } from '../config.js';
import { audit } from '../audit.js';
import { signSession, verifySession } from '../session.js';
import { sendOtp } from '../telegram.js';
import {
  blockKey,
  blockRemaining,
  cooldownRemaining,
  countInWindow,
  createChallenge,
  isBlocked,
  markCooldown,
  verifyChallenge,
} from '../otp-store.js';

export const clientAuthRouter = express.Router();

const CLIENT_SESSION_COOKIE = 'almaktab_client_session';

/**
 * The chat that receives customer OTPs.
 * Reuses the first configured admin's bot so no extra secret is needed.
 */
function deliveryChannel() {
  const admin = config.admins[0];
  if (!admin) return null;
  return { botToken: admin.botToken, chatId: admin.chatId };
}

function clientIp(req) {
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

function normalizePhone(input) {
  return String(input || '').replace(/\D/g, '');
}

/**
 * A client session is a signed token — the browser cannot forge it.
 */
export function signClientSession(phone) {
  return signSession({ sub: `client:${phone}`, phone }, config.sessionTtlSeconds);
}

/**
 * POST /api/client/request-otp  { phone }
 */
clientAuthRouter.post('/request-otp', async (req, res) => {
  const ip = clientIp(req);
  const userAgent = req.get('user-agent') || '';
  const phone = normalizePhone(req.body?.phone);

  if (!phone || phone.length < 8) {
    return res.status(400).json({ ok: false, message: 'الرجاء إدخال رقم هاتف صحيح' });
  }

  if (isBlocked(`client-ip:${ip}`) || isBlocked(`client-phone:${phone}`)) {
    const remaining = Math.max(blockRemaining(`client-ip:${ip}`), blockRemaining(`client-phone:${phone}`));
    audit({
      action: 'client.otp.blocked',
      ip,
      userAgent,
      detail: `تجاوز حد المحاولات (${remaining} ثانية)`,
      alert: true,
      alertTitle: '🚫 حظر طلب رمز دخول عميل',
    });
    return res.status(429).json({
      ok: false,
      message: `تم تجاوز عدد المحاولات. حاول بعد ${Math.ceil(remaining / 60)} دقيقة.`,
    });
  }

  const ipRequests = countInWindow(`client-ip-otp:${ip}`);
  const phoneRequests = countInWindow(`client-phone-otp:${phone}`);

  if (ipRequests > config.maxOtpRequestsPerWindow || phoneRequests > config.maxOtpRequestsPerWindow) {
    audit({
      action: 'client.otp.rate_limited',
      ip,
      userAgent,
      detail: `طلبات كثيرة (IP: ${ipRequests}، رقم: ${phoneRequests})`,
      alert: true,
      alertTitle: '🚫 تجاوز حد طلبات رموز العملاء',
    });
    return res.status(429).json({ ok: false, message: 'تم إرسال طلبات كثيرة. حاول بعد قليل.' });
  }

  const cooldown = cooldownRemaining(`client-phone:${phone}`);
  if (cooldown > 0) {
    return res.status(429).json({
      ok: false,
      message: `يرجى الانتظار ${cooldown} ثانية قبل طلب رمز جديد.`,
    });
  }

  const channel = deliveryChannel();
  if (!channel) {
    return res.status(503).json({
      ok: false,
      message: 'خدمة الرسائل غير مُفعّلة حالياً. حاول لاحقاً.',
    });
  }

  const { id: challengeId, otp } = createChallenge(`client:${phone}`);
  markCooldown(`client-phone:${phone}`);

  const result = await sendOtp({
    botToken: channel.botToken,
    chatId: channel.chatId,
    fullName: `عميل ${phone}`,
    otp,
    expiresInMinutes: Math.round(config.otpTtlSeconds / 60),
  });

  if (!result.ok) {
    audit({
      action: 'client.otp.send_failed',
      ip,
      userAgent,
      detail: result.error,
    });
    return res.status(502).json({
      ok: false,
      message: 'تعذّر إرسال رمز التحقق حالياً. حاول بعد قليل.',
    });
  }

  audit({ action: 'client.otp.sent', ip, userAgent, detail: `phone=${phone.slice(-4)}` });

  return res.json({
    ok: true,
    challengeId,
    expiresIn: config.otpTtlSeconds,
    resendAfter: config.otpResendCooldownSeconds,
    message: 'تم إرسال رمز التحقق إلى رقمك عبر تلغرام.',
  });
});

/**
 * POST /api/client/verify  { challengeId, otp }
 */
clientAuthRouter.post('/verify', (req, res) => {
  const ip = clientIp(req);
  const userAgent = req.get('user-agent') || '';
  const challengeId = String(req.body?.challengeId || '');
  const otp = String(req.body?.otp || '').trim();

  if (!challengeId || !/^\d{6}$/.test(otp)) {
    return res.status(400).json({ ok: false, message: 'رمز غير صالح' });
  }

  const result = verifyChallenge(challengeId, otp);

  if (!result.ok) {
    if (result.reason === 'mismatch') {
      if (result.exhausted) {
        blockKey(`client-ip:${ip}`, config.loginBlockSeconds);
      }
      audit({
        action: 'client.login.failed',
        ip,
        userAgent,
        detail: `رمز خاطئ (متبقي ${result.attemptsLeft ?? 0} محاولات)`,
      });
      return res.status(401).json({
        ok: false,
        message: result.exhausted
          ? 'تم تجاوز عدد المحاولات. حاول لاحقاً.'
          : `رمز غير صحيح. متبقي ${result.attemptsLeft} محاولات.`,
      });
    }

    const messages = {
      expired: 'انتهت صلاحية الرمز. اطلب رمزاً جديداً.',
      attempts: 'تم تجاوز عدد المحاولات. اطلب رمزاً جديداً.',
      missing: 'الرمز غير موجود أو منتهي. اطلب رمزاً جديداً.',
    };
    return res.status(401).json({ ok: false, message: messages[result.reason] || 'تعذّر التحقق.' });
  }

  const adminId = result.adminId;
  const phone = String(adminId).startsWith('client:') ? String(adminId).slice(7) : '';

  const token = signClientSession(phone);
  res.cookie(CLIENT_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.secureCookies,
    path: '/',
    maxAge: config.sessionTtlSeconds * 1000,
  });

  audit({ action: 'client.login.success', ip, userAgent, detail: `phone=${phone.slice(-4)}` });

  return res.json({
    ok: true,
    phone,
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
    phone: claims.phone,
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
