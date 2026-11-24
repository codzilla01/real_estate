'use strict';

/**
 * المصادقة والجلسات:
 *  - Argon2id (عبر hash-wasm — WASM خالص، بلا ترجمة محلية)
 *  - كوكي جلسة HttpOnly موقّع بـ HMAC-SHA256
 */

const crypto = require('crypto');
const { argon2id, argon2Verify } = require('hash-wasm');

// معاملات Argon2id — متوافقة مع توصيات OWASP (64MiB / 3 تكرارات).
const ARGON_MEMORY_SIZE = 65536; // KiB
const ARGON_ITERATIONS = 3;
const ARGON_PARALLELISM = 1;
const ARGON_HASH_LENGTH = 32;
const SALT_BYTES = 16;

/** توليد هاش Argon2id بصيغة PHC قياسية (إصدار 19 + معاملات + ملح + هاش) */
async function hashPassword(password) {
    const salt = crypto.randomBytes(SALT_BYTES);
    return argon2id({
        password: String(password),
        salt,
        parallelism: ARGON_PARALLELISM,
        iterations: ARGON_ITERATIONS,
        memorySize: ARGON_MEMORY_SIZE,
        hashLength: ARGON_HASH_LENGTH,
        outputType: 'encoded',
    });
}

/** التحقق من كلمة مرور مقابل هاش PHC. أي خطأ = false (لا يُسرب تفاصيل). */
async function verifyPassword(password, hash) {
    try {
        if (!hash || typeof hash !== 'string' || !hash.startsWith('$')) return false;
        return await argon2Verify({ password: String(password), hash });
    } catch (_) {
        return false;
    }
}

// ---------- الجلسات الموقّعة ----------

function b64url(input) {
    const buf = Buffer.isBuffer(input) ? input : Buffer.from(String(input), 'utf8');
    return buf.toString('base64url');
}

function fromB64url(str) {
    return Buffer.from(str, 'base64url').toString('utf8');
}

/** يوقّع حمولة الجلسة: base64url(payload).base64url(HMAC-SHA256) */
function signSession(payload, secret, ttlMs) {
    const now = Date.now();
    const body = {
        sub: payload.sub,
        kind: payload.kind,
        jti: crypto.randomBytes(16).toString('hex'), // معرّف لإبطال الجلسة عند الخروج
        iat: now,
        exp: now + ttlMs,
    };
    const encoded = b64url(JSON.stringify(body));
    const sig = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
    return `${encoded}.${sig}`;
}

/** يتحقق من التوقيع والصلاحية ويعيد الحمولة أو null. */
function verifySession(token, secret) {
    if (!token || typeof token !== 'string') return null;
    const dot = token.lastIndexOf('.');
    if (dot === -1) return null;
    const encoded = token.slice(0, dot);
    const sig = token.slice(dot + 1);

    const expected = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

    let body;
    try {
        body = JSON.parse(fromB64url(encoded));
    } catch (_) {
        return null;
    }
    if (!body || typeof body.exp !== 'number' || body.exp < Date.now()) return null;
    if (!body.sub || !body.kind) return null;
    return body;
}

// ---------- الكوكيز ----------

function parseCookies(header) {
    const out = {};
    if (!header) return out;
    for (const part of header.split(';')) {
        const idx = part.indexOf('=');
        if (idx === -1) continue;
        const k = part.slice(0, idx).trim();
        const v = part.slice(idx + 1).trim();
        if (k) out[k] = decodeURIComponent(v);
    }
    return out;
}

function serializeCookie(name, value, { maxAgeMs, secure, sameSite = 'Lax', path = '/' }) {
    const parts = [`${name}=${encodeURIComponent(value)}`, `Path=${path}`];
    if (maxAgeMs != null) parts.push(`Max-Age=${Math.floor(maxAgeMs / 1000)}`);
    parts.push('HttpOnly');
    parts.push(`SameSite=${sameSite}`);
    if (secure) parts.push('Secure');
    return parts.join('; ');
}

module.exports = {
    hashPassword,
    verifyPassword,
    signSession,
    verifySession,
    parseCookies,
    serializeCookie,
    ARGON_PARAMS: {
        memorySize: ARGON_MEMORY_SIZE,
        iterations: ARGON_ITERATIONS,
        parallelism: ARGON_PARALLELISM,
        hashLength: ARGON_HASH_LENGTH,
    },
};
