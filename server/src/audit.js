/**
 * Append-only audit log.
 *
 * Every security-relevant event is recorded locally (JSONL) and mirrored to
 * Telegram when an alert channel is configured. The log deliberately records
 * the *fact* of a failed attempt but never the submitted OTP or password.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';
import { sendSecurityAlert } from './telegram.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_DIR = path.join(__dirname, '..', 'data');
const LOG_FILE = path.join(LOG_DIR, 'audit.log');

function ensureLogDir() {
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  } catch {
    /* ignore */
  }
}

/**
 * @param {object} event
 * @param {string} event.action      e.g. 'login.success'
 * @param {number} [event.adminId]
 * @param {string} [event.adminName]
 * @param {string} [event.ip]
 * @param {string} [event.userAgent]
 * @param {string} [event.detail]
 * @param {boolean} [event.alert]    send to Telegram alert channel
 */
export function audit(event) {
  const entry = {
    ts: new Date().toISOString(),
    action: event.action,
    adminId: event.adminId ?? null,
    adminName: event.adminName ?? null,
    ip: event.ip ?? null,
    userAgent: event.userAgent ?? null,
    detail: event.detail ?? null,
  };

  ensureLogDir();
  try {
    fs.appendFileSync(LOG_FILE, `${JSON.stringify(entry)}\n`, 'utf8');
  } catch (error) {
    console.error('[audit] failed to write log:', error.message);
  }

  if (event.alert && config.alert.botToken && config.alert.chatId) {
    sendSecurityAlert({
      botToken: config.alert.botToken,
      chatId: config.alert.chatId,
      title: event.alertTitle || 'تنبيه أمني',
      lines: [
        `الحدث: ${entry.action}`,
        entry.adminName ? `المستخدم: ${entry.adminName}` : null,
        `IP: ${entry.ip || 'غير معروف'}`,
        entry.detail ? `التفاصيل: ${entry.detail}` : null,
      ].filter(Boolean),
    }).catch(() => {});
  }

  return entry;
}

export function logPath() {
  return LOG_FILE;
}
