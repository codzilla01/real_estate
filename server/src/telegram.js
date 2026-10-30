/**
 * Thin Telegram Bot API client.
 *
 * The bot token lives only on the server. The browser never talks to
 * Telegram directly and therefore never sees a token.
 */
import { config } from './config.js';

async function telegramRequest(token, method, payload) {
  if (config.mockTelegram) {
    console.log(`[telegram:mock] ${method} ->`, payload?.text ?? '');
    return { ok: true, result: { message_id: 0, mock: true } };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { ok: false, description: `Bad gateway response (${response.status})` };
    }
    return data;
  } catch (error) {
    const reason = error.name === 'AbortError' ? 'timeout' : error.message;
    return { ok: false, description: `Telegram request failed: ${reason}` };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Sends a message to a chat. Returns { ok, error? }.
 */
export async function sendMessage({ botToken, chatId, text, parseMode = 'HTML' }) {
  if (!botToken || !chatId) {
    return { ok: false, error: 'missing_config' };
  }

  const data = await telegramRequest(botToken, 'sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: parseMode,
    disable_web_page_preview: true,
  });

  if (data.ok) return { ok: true };
  return { ok: false, error: data.description || 'unknown_error' };
}

/**
 * Sends the OTP to an admin.
 */
export async function sendOtp({ botToken, chatId, fullName, otp, expiresInMinutes }) {
  const text = [
    '🔐 <b>رمز الدخول — لوحة تحكم المكتب العقاري</b>',
    '',
    `👤 <b>${escapeHtml(fullName)}</b>`,
    `🔢 الرمز: <b>${otp}</b>`,
    `⏰ صالح لمدة ${expiresInMinutes} دقيقة`,
    '',
    '⚠️ لا تشارك هذا الرمز مع أي شخص. لن يطلبه منك دعم الموقع.',
  ].join('\n');

  return sendMessage({ botToken, chatId, text });
}

/**
 * Sends a security alert to the configured alert chat.
 */
export async function sendSecurityAlert({ botToken, chatId, title, lines }) {
  const body = (lines || []).map((l) => `• ${escapeHtml(String(l))}`).join('\n');
  const text = [`🚨 <b>${escapeHtml(title)}</b>`, '', body].join('\n');
  return sendMessage({ botToken, chatId, text });
}

/**
 * Sends a login-success notification.
 */
export async function sendLoginSuccess({ botToken, chatId, fullName, ip, userAgent }) {
  const text = [
    '✅ <b>دخول ناجح إلى لوحة التحكم</b>',
    '',
    `👤 ${escapeHtml(fullName)}`,
    `🕒 ${new Date().toLocaleString('ar-EG', { timeZone: 'Asia/Dubai' })}`,
    `🌐 IP: ${escapeHtml(ip || 'غير معروف')}`,
    `🖥️ ${escapeHtml((userAgent || 'غير معروف').slice(0, 120))}`,
  ].join('\n');

  return sendMessage({ botToken, chatId, text });
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
