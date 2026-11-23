'use strict';

/**
 * إعدادات الخادم — تُقرأ من متغيرات البيئة (server/.env).
 * لا يوجد أي سر مكتوب في الكود: كل الأسرار تمر عبر البيئة.
 */

const fs = require('fs');
const path = require('path');

/** تحميل ملف .env بأمان (بدون مكتبات خارجية). لا يتجاوز القيم الموجودة مسبقاً. */
function loadDotEnv(envPath) {
    try {
        const raw = fs.readFileSync(envPath, 'utf8');
        for (const line of raw.split(/\r?\n/)) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            const eq = trimmed.indexOf('=');
            if (eq === -1) continue;
            const key = trimmed.slice(0, eq).trim();
            let value = trimmed.slice(eq + 1).trim();
            // إزالة علامات اقتباس محيطة إن وُجدت
            if ((value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            if (!(key in process.env)) process.env[key] = value;
        }
    } catch (_) {
        // الملف غير موجود — نعتمد على بيئة التشغيل فقط.
    }
}

/** إيجاد مجلد جذر المشروع (حيث ملفات HTML). */
function findRoot() {
    const candidates = [
        process.env.STATIC_ROOT,
        path.resolve(__dirname, '..', '..'),
        path.resolve(process.cwd()),
    ].filter(Boolean);
    for (const dir of candidates) {
        try {
            if (fs.existsSync(path.join(dir, 'index.html'))) return dir;
        } catch (_) { /* تجاهل */ }
    }
    return candidates[0];
}

const ROOT = findRoot();
loadDotEnv(path.join(__dirname, '..', '.env'));

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProd = NODE_ENV === 'production';

// سر توقيع الجلسات: يُولَّد مؤقتاً عند غيابه (تطوير فقط) ويُحذَّر منه.
let sessionSecret = process.env.SESSION_SECRET || '';
if (!sessionSecret) {
    sessionSecret = require('crypto').randomBytes(32).toString('hex');
    if (isProd) {
        console.warn('⚠️  SESSION_SECRET غير محدد في الإنتاج — الجلسات لن تصلح بعد إعادة التشغيل!');
    }
}

const SESSION_TTL_MS = parseInt(process.env.SESSION_TTL_HOURS || '8', 10) * 60 * 60 * 1000;

/** قراءة حسابات المسؤولين من ADMIN{n}_* */
function parseAdmins(env) {
    const admins = [];
    for (let n = 1; n <= 9; n++) {
        const p = `ADMIN${n}_`;
        const username = (env[p + 'USERNAME'] || '').trim();
        if (!username) continue;
        const passwordHash = (env[p + 'PASSWORD_HASH'] || '').trim();
        if (!passwordHash) {
            console.warn(`⚠️  تم تجاهل ${p}USERNAME — لا يوجد ${p}PASSWORD_HASH صالح.`);
            continue;
        }
        const name = (env[p + 'NAME'] || username).trim();
        const permissionsRaw = (env[p + 'PERMISSIONS'] || 'all').trim();
        admins.push({
            id: `admin${n}`,
            username,
            name,
            fullName: (env[p + 'FULL_NAME'] || name).trim(),
            role: (env[p + 'ROLE'] || 'مسؤول').trim(),
            permissions: permissionsRaw === 'all' ? ['all'] : permissionsRaw.split(',').map(s => s.trim()).filter(Boolean),
            avatar: (env[p + 'AVATAR'] || '').trim(),
            passwordHash,
            botToken: (env[p + 'BOT_TOKEN'] || '').trim(),
            chatId: (env[p + 'CHAT_ID'] || '').trim(),
        });
    }
    return admins;
}

/** قراءة حسابات العملاء من CLIENT{n}_* (اختيارية). */
function parseClients(env) {
    const clients = [];
    for (let n = 1; n <= 9; n++) {
        const p = `CLIENT${n}_`;
        const username = (env[p + 'USERNAME'] || '').trim();
        if (!username) continue;
        const passwordHash = (env[p + 'PASSWORD_HASH'] || '').trim();
        if (!passwordHash) {
            console.warn(`⚠️  تم تجاهل ${p}USERNAME — لا يوجد ${p}PASSWORD_HASH صالح.`);
            continue;
        }
        const name = (env[p + 'NAME'] || username).trim();
        clients.push({
            id: `client${n}`,
            username,
            name,
            fullName: (env[p + 'FULL_NAME'] || name).trim(),
            avatar: (env[p + 'AVATAR'] || '').trim(),
            passwordHash,
        });
    }
    return clients;
}

const admins = parseAdmins(process.env);
const clients = parseClients(process.env);

module.exports = {
    ROOT,
    NODE_ENV,
    isProd,
    PORT: parseInt(process.env.PORT || '3000', 10),
    HOST: process.env.HOST || '0.0.0.0',
    SESSION_SECRET: sessionSecret,
    SESSION_TTL_MS,
    COOKIE_NAME_ADMIN: 'amk_admin',
    COOKIE_NAME_CLIENT: 'amk_client',
    AUDIT_LOG_PATH: process.env.AUDIT_LOG_PATH || path.join(__dirname, '..', 'data', 'audit.log'),
    FRAME_ANCESTORS: (process.env.FRAME_ANCESTORS || "'none'").trim(),
    admins,
    clients,
    MAX_LOGIN_ATTEMPTS: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10),
    LOCK_MINUTES: parseInt(process.env.LOCK_MINUTES || '15', 10),
};
