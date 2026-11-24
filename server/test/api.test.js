'use strict';

/**
 * اختبارات API — 11 اختباراً تغطي المصادقة والجلسات والحماية.
 * تُشغّل خادماً حقيقياً على منفذ عشوائي بمتغيرات بيئة معزولة.
 */

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const SERVER_DIR = path.resolve(__dirname, '..');
const { hashPassword } = require('../src/auth');

let child;
let baseUrl;
let auditLogPath;

before(async () => {
    const adminHash = await hashPassword('AdminPass123!');
    const clientHash = await hashPassword('ClientPass123!');
    auditLogPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'amk-audit-')), 'audit.log');

    child = spawn(process.execPath, ['src/server.js'], {
        cwd: SERVER_DIR,
        env: {
            ...process.env,
            PORT: '0',
            HOST: '127.0.0.1',
            NODE_ENV: 'test',
            SESSION_SECRET: 'test-secret-unit',
            AUDIT_LOG_PATH: auditLogPath,
            ADMIN1_USERNAME: 'admin',
            ADMIN1_NAME: 'مدير الاختبار',
            ADMIN1_FULL_NAME: 'مدير الاختبار الكامل',
            ADMIN1_ROLE: 'مسؤول رئيسي',
            ADMIN1_PERMISSIONS: 'all',
            ADMIN1_PASSWORD_HASH: adminHash,
            CLIENT1_USERNAME: 'client',
            CLIENT1_NAME: 'عميل الاختبار',
            CLIENT1_PASSWORD_HASH: clientHash,
        },
        stdio: ['ignore', 'pipe', 'pipe'],
    });

    baseUrl = await new Promise((resolve, reject) => {
        let buf = '';
        const timer = setTimeout(() => reject(new Error('انتهت المهلة في انتظار الخادم')), 30000);
        child.stdout.on('data', d => {
            buf += d.toString();
            const m = buf.match(/المنفذ (\d+)/);
            if (m) { clearTimeout(timer); resolve(`http://127.0.0.1:${m[1]}`); }
        });
        child.stderr.on('data', d => { buf += d.toString(); });
        child.on('exit', () => { clearTimeout(timer); reject(new Error('خرج الخادم مبكراً: ' + buf)); });
    });
});

after(() => {
    if (child && child.exitCode === null) child.kill('SIGTERM');
});

function cookieFrom(res) {
    const sc = res.headers.getSetCookie ? res.headers.getSetCookie() : [res.headers.get('set-cookie')];
    const raw = (sc || []).flat().find(c => c && c.startsWith('amk_admin='));
    return { header: raw || '', pair: raw ? raw.split(';')[0] : '' };
}

async function login(username, password) {
    const res = await fetch(`${baseUrl}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });
    const { header, pair } = cookieFrom(res);
    return { status: res.status, body: await res.json(), cookie: pair, cookieHeader: header };
}

test('1) GET /api/health يعمل', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.ok, true);
    assert.ok(body.time);
});

test('2) الصفحة الرئيسية تُقدَّم من الخادم', async () => {
    const res = await fetch(`${baseUrl}/`);
    assert.equal(res.status, 200);
    const html = await res.text();
    assert.match(html, /المكتب العقاري/);
});

test('3) مسار API غير موجود → 404 JSON', async () => {
    const res = await fetch(`${baseUrl}/api/nope`);
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.ok, false);
});

test('4) كلمة مرور خاطئة → 401 برسالة موحّدة', async () => {
    const { status, body } = await login('admin', 'WrongPass!');
    assert.equal(status, 401);
    assert.equal(body.ok, false);
    assert.match(body.message, /غير صحيحة/);
});

test('5) مستخدم غير موجود → نفس الرسالة تماماً (لا كشف للحسابات)', async () => {
    const wrongUser = await login('ghost-user', 'Whatever123!');
    const wrongPass = await login('admin', 'WrongPass!');
    assert.equal(wrongUser.status, wrongPass.status);
    assert.deepEqual(wrongUser.body, wrongPass.body);
});

test('6) تسجيل دخول صحيح → 200 + كوكي HttpOnly + ملف بلا أسرار', async () => {
    const { status, body, cookieHeader } = await login('admin', 'AdminPass123!');
    assert.equal(status, 200);
    assert.equal(body.ok, true);
    assert.equal(body.admin.username, undefined, 'لا تُعاد بيانات الدخول');
    assert.equal(body.admin.name, 'مدير الاختبار');
    assert.match(cookieHeader, /HttpOnly/, 'الكوكي يجب أن يكون HttpOnly');
    assert.match(cookieHeader, /SameSite=Lax/);
    assert.ok(!JSON.stringify(body).includes('$argon2'), 'لا هاش في الاستجابة');
});

test('7) GET /api/admin/session مع الكوكي يعيد المسؤول', async () => {
    const { cookie } = await login('admin', 'AdminPass123!');
    const res = await fetch(`${baseUrl}/api/admin/session`, { headers: { Cookie: cookie } });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.ok, true);
    assert.equal(body.admin.id, 'admin1');
});

test('8) GET /api/admin/session بدون كوكي → 401', async () => {
    const res = await fetch(`${baseUrl}/api/admin/session`);
    assert.equal(res.status, 401);
});

test('9) تسجيل الخروج يمسح الجلسة', async () => {
    const { cookie } = await login('admin', 'AdminPass123!');
    const out = await fetch(`${baseUrl}/api/admin/logout`, {
        method: 'POST',
        headers: { Cookie: cookie },
    });
    assert.equal(out.status, 200);
    const after = await fetch(`${baseUrl}/api/admin/session`, { headers: { Cookie: cookie } });
    assert.equal(after.status, 401);
});

test('10) /api/admin/admins يعيد ملفات عامة بلا أسرار', async () => {
    const res = await fetch(`${baseUrl}/api/admin/admins`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.ok, true);
    assert.ok(Array.isArray(body.admins));
    assert.ok(body.admins.length >= 1);
    for (const a of body.admins) {
        assert.equal(a.passwordHash, undefined);
        assert.equal(a.botToken, undefined);
        assert.equal(a.chatId, undefined);
    }
});

test('11) بعد 5 محاولات فاشلة يُحظر IP حتى مع كلمة مرور صحيحة', async () => {
    // قد تكون محاولات سابقة استهلكت جزءاً من الرصيد — نرصد لحظة الحظر خلال ≤5 محاولات.
    let sawLock = false;
    for (let i = 0; i < 5 && !sawLock; i++) {
        const r = await login('admin', `Bad-${i}-${Date.now()}!`);
        if (r.status === 429) sawLock = true;
        else assert.equal(r.status, 401);
    }
    assert.ok(sawLock, 'يجب أن يُحظر IP خلال 5 محاولات فاشلة كحد أقصى');
    const good = await login('admin', 'AdminPass123!');
    assert.equal(good.status, 429);
    assert.match(good.body.message, /تجاوز/);
});
