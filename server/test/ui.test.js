'use strict';

/**
 * فحوص الواجهة — 26 فحصاً: تتأكد أن الملفات المقدَّمة للمتصفح
 * لا تحوي أسراراً وأنها تستخدم الخادم للمصادقة.
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

const indexHtml = read('index.html');
const loginHtml = read('login.html');
const adminHtml = read('admin.html');
const vercelJson = read('vercel.json');
const dockerfile = read('Dockerfile');
const readme = read('README.md');

const TELEGRAM_TOKEN_RE = /\b\d{8,12}:[A-Za-z0-9_-]{30,}\b/;

test('index.html: لا توكن بوت تيليجرام', () => {
    assert.ok(!TELEGRAM_TOKEN_RE.test(indexHtml));
});

test('index.html: لا كلمة المرور الافتراضية القديمة', () => {
    assert.ok(!/Admin123/i.test(indexHtml));
});

test('index.html: الضغط المطول على الشعار ينقل للوحة التحكم', () => {
    assert.match(indexHtml, /adminLogo/);
    assert.match(indexHtml, /setTimeout\([\s\S]{0,2000}?2000/);
});

test('index.html: عناوين API نسبية (نفس المنشأ)', () => {
    assert.match(indexHtml, /window\.ADMIN_API_BASE \|\| ''/);
});

test('login.html: يرسل الدخول إلى /api/client/login', () => {
    assert.match(loginHtml, /\/api\/client/);
    assert.match(loginHtml, /['"`]\/login['"`]/);
});

test('login.html: يُرسل الكوكي مع الطلبات', () => {
    assert.match(loginHtml, /credentials:\s*'include'/);
});

test('login.html: يتحقق من الجلسة عبر /session', () => {
    assert.match(loginHtml, /\/session/);
});

test('login.html: لا يخزّن كلمات مرور في localStorage', () => {
    assert.ok(!/localStorage\.(setItem|getItem)\([^)]*password/i.test(loginHtml));
});

test('login.html: خالٍ من الأسرار', () => {
    assert.ok(!TELEGRAM_TOKEN_RE.test(loginHtml));
    assert.ok(!/\$argon2/.test(loginHtml));
    assert.ok(!/Admin123/i.test(loginHtml));
});

test('login.html: يحتوي حقلي اسم المستخدم وكلمة المرور', () => {
    assert.match(loginHtml, /id="usernameInput"/);
    assert.match(loginHtml, /id="passwordInput"/);
});

test('login.html: لا تستخدم OTP في المتصفح', () => {
    assert.ok(!/generateOTP|verifyOTP|otpCode\s*=/i.test(loginHtml));
});

test('admin.html: يستخدم /api/admin لواجهة المصادقة', () => {
    assert.match(adminHtml, /\/api\/admin/);
});

test('admin.html: يرسل الدخول إلى /login', () => {
    assert.match(adminHtml, /authFetch\(['"`]\/login['"`]/);
});

test('admin.html: لديه تسجيل خروج /logout', () => {
    assert.match(adminHtml, /authFetch\(['"`]\/logout['"`],\s*\{\s*method:\s*'POST'/);
});

test('admin.html: يتحقق من الجلسة عبر /session', () => {
    assert.match(adminHtml, /authFetch\(['"`]\/session['"`]\)/);
});

test('admin.html: يجلب المسؤولين من /api/admin/admins', () => {
    assert.match(adminHtml, /\/api\/admin\/admins/);
});

test('admin.html: لا يحوي هاش أو مفاتيح أسرار', () => {
    assert.ok(!/\$argon2/.test(adminHtml));
    assert.ok(!/PASSWORD_HASH\s*=\s*[^.\s]/.test(adminHtml));
});

test('admin.html: الواجهة مخفية قبل التحقق (auth-pending)', () => {
    assert.match(adminHtml, /document\.body\.classList\.add\('auth-pending'\)/);
    const bootIdx = adminHtml.indexOf("classList.add('auth-pending')");
    const authIdx = adminHtml.indexOf('checkAuth()');
    assert.ok(bootIdx !== -1 && authIdx !== -1 && bootIdx < authIdx + 2000, 'الإخفاء يسبق/يترافق مع التحقق');
});

test('admin.html: لا يعتمد على adminToken من localStorage', () => {
    assert.ok(!/getItem\(\s*['"]adminToken['"]/.test(adminHtml));
});

test('admin.html: Ctrl+Shift+A يفتح بوابة الدخول', () => {
    assert.match(adminHtml, /ctrlKey[\s\S]{0,80}shiftKey[\s\S]{0,80}[Aa]/);
});

test('كل ملفات HTML: خالية من توكنات تيليجرام', () => {
    for (const html of [indexHtml, loginHtml, adminHtml]) {
        assert.ok(!TELEGRAM_TOKEN_RE.test(html));
    }
});

test('كل ملفات HTML: لا تعيين BOT_TOKEN بقيمة', () => {
    for (const html of [indexHtml, loginHtml, adminHtml]) {
        assert.ok(!/BOT_TOKEN\s*[=:]\s*['"]?\d/i.test(html));
    }
});

test('كل ملفات HTML: لا توليد/تحقق OTP داخل المتصفح', () => {
    const otpLogicRe = /generateOTP|verifyOTP|otpCode\s*=|Math\.random\(\)\s*\*?\s*10{5,}/i;
    for (const html of [indexHtml, loginHtml, adminHtml]) {
        assert.ok(!otpLogicRe.test(html));
    }
});

test('vercel.json: يوجّه /api إلى server/src/server.js', () => {
    assert.match(vercelJson, /\/api\/\(\.\*\)[\s\S]*?server\/src\/server\.js/);
});

test('Dockerfile: يشغّل server/src/server.js', () => {
    assert.match(dockerfile, /CMD \["node", "server\/src\/server\.js"\]/);
});

test('README.md: لا يذكر كلمة المرور الافتراضية', () => {
    assert.ok(!/Admin123/i.test(readme));
});
