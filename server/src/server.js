'use strict';

/**
 * خادم المكتب العقاري — Express
 *  - يقدّم واجهات الموقع (index / login / admin)
 *  - API المصادقة: Argon2id + كوكي HttpOnly موقّع HMAC-SHA256
 *  - حماية من التخمين (5 محاولات ← حظر 15 دقيقة) + سجل تدقيق
 */

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');

const config = require('./config');
const auth = require('./auth');
const { appendAudit } = require('./audit');
const { notifyAdmins } = require('./telegram');

const GENERIC_LOGIN_ERROR = 'اسم المستخدم أو كلمة المرور غير صحيحة';
const LOCKED_MESSAGE = `تم تجاوز عدد المحاولات المسموح بها. يُرجى المحاولة بعد ${config.LOCK_MINUTES} دقيقة.`;

// ---------- منع التخمين (في الذاكرة، لكل IP) ----------
const attempts = new Map(); // ip -> { fails, last, lockedUntil }
let dummyHashPromise = null;

// ---------- إبطال الجلسات المسجّلة خروجاً (في الذاكرة) ----------
const revokedJtis = new Map(); // jti -> وقت الإبطال

function revokeSession(token) {
    const payload = auth.verifySession(token, config.SESSION_SECRET);
    if (payload?.jti) revokedJtis.set(payload.jti, Date.now());
}

function isRevoked(jti) {
    return jti ? revokedJtis.has(jti) : false;
}

function pruneRevoked() {
    const cutoff = Date.now() - config.SESSION_TTL_MS;
    for (const [jti, ts] of revokedJtis) {
        if (ts < cutoff) revokedJtis.delete(jti);
    }
}

function getDummyHash() {
    if (!dummyHashPromise) dummyHashPromise = auth.hashPassword('dummy-password-for-timing');
    return dummyHashPromise;
}

function isLocked(ip) {
    const rec = attempts.get(ip);
    if (!rec) return false;
    if (rec.lockedUntil && rec.lockedUntil > Date.now()) return true;
    // تنظيف السجلات المنتهية لمنع نمو الذاكرة
    if (rec.lockedUntil && rec.lockedUntil <= Date.now()) attempts.delete(ip);
    return false;
}

function registerFail(ip) {
    const now = Date.now();
    const rec = attempts.get(ip) || { fails: 0, last: now, lockedUntil: 0 };
    rec.fails += 1;
    rec.last = now;
    if (rec.fails >= config.MAX_LOGIN_ATTEMPTS) {
        rec.lockedUntil = now + config.LOCK_MINUTES * 60 * 1000;
    }
    attempts.set(ip, rec);
    return rec.lockedUntil;
}

function resetFails(ip) {
    attempts.delete(ip);
}

// ---------- التطبيق ----------

function createApp() {
    const app = express();
    app.disable('x-powered-by');
    app.set('trust proxy', 1);

    // أمان الترويسات — CSP متساهل عمداً لأن الوحدات مكتبة inline (قالب بلا build step)
    const frameAncestors = config.FRAME_ANCESTORS.split(',').map(s => s.trim()).filter(Boolean);
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'"],
                styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
                fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
                imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
                mediaSrc: ["'self'", 'data:', 'blob:', 'https:'],
                connectSrc: ["'self'"],
                frameAncestors,
            },
        },
        crossOriginEmbedderPolicy: false,
    }));

    app.use(express.json({ limit: '16kb' }));

    // محدد عام لمعدل الطلبات على /api
    const apiLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 600,
        standardHeaders: true,
        legacyHeaders: false,
        message: { ok: false, message: 'تم تجاوز معدل الطلبات المسموح. حاول لاحقاً.' },
    });
    app.use('/api', apiLimiter);

    // ---------- أدوات مساعدة ----------

    function clientIp(req) {
        return req.ip || req.socket?.remoteAddress || 'unknown';
    }

    function publicProfile(user) {
        return {
            id: user.id,
            name: user.name,
            fullName: user.fullName,
            avatar: user.avatar || '',
            ...(user.role !== undefined ? { role: user.role } : {}),
            ...(user.permissions !== undefined ? { permissions: user.permissions } : {}),
        };
    }

    function findUser(directory, username) {
        const needle = String(username).toLowerCase();
        return directory.find(u => u.username.toLowerCase() === needle) || null;
    }

    function issueSession(res, kind, user) {
        const token = auth.signSession(
            { sub: user.id, kind },
            config.SESSION_SECRET,
            config.SESSION_TTL_MS,
        );
        const name = kind === 'admin' ? config.COOKIE_NAME_ADMIN : config.COOKIE_NAME_CLIENT;
        res.setHeader('Set-Cookie', auth.serializeCookie(name, token, {
            maxAgeMs: config.SESSION_TTL_MS,
            secure: config.isProd,
        }));
    }

    function clearSession(res, kind) {
        const name = kind === 'admin' ? config.COOKIE_NAME_ADMIN : config.COOKIE_NAME_CLIENT;
        res.setHeader('Set-Cookie', auth.serializeCookie(name, '', {
            maxAgeMs: 0,
            secure: config.isProd,
        }));
    }

    /** يتحقق من الجلسة ويعيد الملف الشخصي العام أو null. */
    function sessionProfile(req, kind) {
        const name = kind === 'admin' ? config.COOKIE_NAME_ADMIN : config.COOKIE_NAME_CLIENT;
        const cookies = auth.parseCookies(req.headers.cookie);
        const payload = auth.verifySession(cookies[name], config.SESSION_SECRET);
        if (!payload || payload.kind !== kind) return null;
        if (isRevoked(payload.jti)) return null;
        const directory = kind === 'admin' ? config.admins : (config.clients.length ? config.clients : config.admins);
        const user = directory.find(u => u.id === payload.sub);
        return user ? publicProfile(user) : null;
    }

    async function handleLogin(req, res, kind) {
        const ip = clientIp(req);
        const prefix = kind === 'admin' ? 'admin' : 'client';
        const directory = kind === 'admin' ? config.admins : (config.clients.length ? config.clients : config.admins);

        if (isLocked(ip)) {
            appendAudit(config.AUDIT_LOG_PATH, { ip, action: `${prefix}.login.locked` });
            return res.status(429).json({ ok: false, message: LOCKED_MESSAGE });
        }

        const body = req.body || {};
        const username = typeof body.username === 'string' ? body.username.trim() : '';
        const password = typeof body.password === 'string' ? body.password : '';

        if (!username || !password) {
            return res.status(400).json({ ok: false, message: 'الرجاء إدخال اسم المستخدم وكلمة المرور' });
        }

        const user = findUser(directory, username);
        let ok = false;
        if (user) {
            ok = await auth.verifyPassword(password, user.passwordHash);
        } else {
            // تحقق وهمي لتوحيد زمن الاستجابة فلا يُستنتج وجود الحساب
            await auth.verifyPassword(password, await getDummyHash());
        }

        if (!ok) {
            const lockedUntil = registerFail(ip);
            appendAudit(config.AUDIT_LOG_PATH, {
                ip,
                action: `${prefix}.login.fail`,
                username,
                reason: user ? 'bad_password' : 'unknown_user',
            });
            if (lockedUntil) {
                return res.status(429).json({ ok: false, message: LOCKED_MESSAGE });
            }
            return res.status(401).json({ ok: false, message: GENERIC_LOGIN_ERROR });
        }

        resetFails(ip);
        issueSession(res, kind, user);
        appendAudit(config.AUDIT_LOG_PATH, { ip, action: `${prefix}.login.success`, username });

        if (kind === 'admin' && user.botToken && user.chatId) {
            notifyAdmins([user], `✅ تسجيل دخول ناجح للمسؤول ${user.name} (${user.username})\n🌐 IP: ${ip}`).catch(() => {});
        }

        const key = kind === 'admin' ? 'admin' : 'client';
        return res.json({ ok: true, [key]: publicProfile(user) });
    }

    // ---------- المسارات ----------

    app.get('/api/health', (req, res) => {
        res.json({ ok: true, service: 'almaktab-server', time: new Date().toISOString() });
    });

    // مصادقة المسؤولين
    app.post('/api/admin/login', (req, res) => handleLogin(req, res, 'admin'));
    app.get('/api/admin/session', (req, res) => {
        const profile = sessionProfile(req, 'admin');
        if (!profile) return res.status(401).json({ ok: false, message: 'غير مصرح — سجّل الدخول أولاً' });
        res.json({ ok: true, admin: profile });
    });
    app.post('/api/admin/logout', (req, res) => {
        const profile = sessionProfile(req, 'admin');
        const cookies = auth.parseCookies(req.headers.cookie);
        revokeSession(cookies[config.COOKIE_NAME_ADMIN]);
        pruneRevoked();
        clearSession(res, 'admin');
        appendAudit(config.AUDIT_LOG_PATH, { ip: clientIp(req), action: 'admin.logout', username: profile?.username });
        res.json({ ok: true });
    });

    // قائمة المسؤولين — عامة (الملفات الشخصية فقط، بلا أي سر)
    app.get('/api/admin/admins', (req, res) => {
        res.json({ ok: true, admins: config.admins.map(publicProfile) });
    });

    // إشعار/تدقيق من الواجهة (غير حاجب)
    app.post('/api/admin/notify', (req, res) => {
        const body = req.body || {};
        const action = typeof body.action === 'string' ? body.action.slice(0, 120) : 'unknown';
        const detail = typeof body.detail === 'string' ? body.detail.slice(0, 500) : null;
        appendAudit(config.AUDIT_LOG_PATH, { ip: clientIp(req), action: 'notify', event: action, detail });
        if (/access_attempt|login/.test(action)) {
            notifyAdmins(config.admins, `🔔 ${action}\n📄 ${detail || ''}\n🌐 IP: ${clientIp(req)}`).catch(() => {});
        }
        res.json({ ok: true });
    });

    // مصادقة العملاء
    app.post('/api/client/login', (req, res) => handleLogin(req, res, 'client'));
    app.get('/api/client/session', (req, res) => {
        const profile = sessionProfile(req, 'client');
        if (!profile) return res.status(401).json({ ok: false, message: 'غير مصرح — سجّل الدخول أولاً' });
        res.json({ ok: true, client: profile });
    });
    app.post('/api/client/logout', (req, res) => {
        const cookies = auth.parseCookies(req.headers.cookie);
        revokeSession(cookies[config.COOKIE_NAME_CLIENT]);
        pruneRevoked();
        clearSession(res, 'client');
        appendAudit(config.AUDIT_LOG_PATH, { ip: clientIp(req), action: 'client.logout' });
        res.json({ ok: true });
    });

    // 404 لمسارات API غير المعروفة
    app.use('/api', (req, res) => {
        res.status(404).json({ ok: false, message: 'المسار غير موجود' });
    });

    // ---------- الملفات الثابتة ----------
    function sendPage(res, file) {
        res.sendFile(path.join(config.ROOT, file), { headers: { 'Cache-Control': 'no-cache' } });
    }

    app.get('/', (req, res) => sendPage(res, 'index.html'));
    app.get('/index.html', (req, res) => sendPage(res, 'index.html'));
    app.get(['/login', '/login.html'], (req, res) => sendPage(res, 'login.html'));
    app.get(['/admin', '/admin.html'], (req, res) => sendPage(res, 'admin.html'));

    // أي مسار صفحة غير معروف without امتداد → الصفحة الرئيسية (سلوك ودّي)
    app.use((req, res, next) => {
        if (req.method !== 'GET' || req.path.startsWith('/api')) return next();
        if (path.extname(req.path)) return next();
        sendPage(res, 'index.html');
    });

    // 404 أخير
    app.use((req, res) => {
        res.status(404).send('404 — غير موجود');
    });

    // معالج الأخطاء (منها أخطاء تحليل JSON)
    // eslint-disable-next-line no-unused-vars
    app.use((err, req, res, next) => {
        if (err?.type === 'entity.parse.failed') {
            return res.status(400).json({ ok: false, message: 'JSON غير صالح' });
        }
        console.error('❌ خطأ في الخادم:', err);
        res.status(500).json({ ok: false, message: 'خطأ داخلي في الخادم' });
    });

    return app;
}

const app = createApp();

if (require.main === module) {
    if (config.admins.length === 0) {
        console.warn('⚠️  لا يوجد أي حساب مسؤول مُعرّف في .env — لن يعمل تسجيل الدخول.');
        console.warn('   انسخ server/.env.example إلى server/.env وأضف ADMIN1_USERNAME / ADMIN1_PASSWORD_HASH.');
    }
    const server = app.listen(config.PORT, config.HOST, () => {
        const actual = server.address().port;
        console.log(`🚀 الخادم يعمل على المنفذ ${actual} (http://${config.HOST}:${actual})`);
        console.log(`   البيئة: ${config.NODE_ENV} | المسؤولون: ${config.admins.length} | العملاء: ${config.clients.length}`);
    });
    process.on('SIGTERM', () => server.close(() => process.exit(0)));
    process.on('SIGINT', () => server.close(() => process.exit(0)));
}

module.exports = app;
