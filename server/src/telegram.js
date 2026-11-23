'use strict';

/**
 * إشعارات تيليجرام الاختيارية — تُرسل أفضل جهد (best-effort):
 * لا تعطّل الطلب ولا تُظهر الأسرار في السجلات.
 */

const REQUEST_TIMEOUT_MS = 5000;

async function sendTelegramMessage(botToken, chatId, text) {
    if (!botToken || !chatId) return false;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
        const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: String(text).slice(0, 4000),
                disable_web_page_preview: true,
            }),
            signal: controller.signal,
        });
        return res.ok;
    } catch (_) {
        return false;
    } finally {
        clearTimeout(timer);
    }
}

/** يرسل نصاً إلى كل مسؤول لديه توكن + معرّف محادثة. بلا انتظار معيق. */
async function notifyAdmins(admins, text) {
    const targets = admins.filter(a => a.botToken && a.chatId);
    await Promise.allSettled(targets.map(a => sendTelegramMessage(a.botToken, a.chatId, text)));
}

module.exports = { sendTelegramMessage, notifyAdmins };
