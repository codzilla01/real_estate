/**
 * Frontend integration tests for the auth gate.
 *
 * Loads the REAL admin.html / login.html / index.html in jsdom and drives
 * them against a REAL server, verifying the security-relevant behaviour:
 * the dashboard stays hidden until the server confirms a session, no admin
 * identities are exposed, and no secrets exist in the client code.
 *
 * Run with the server started in MOCK_TELEGRAM mode:
 *   node test/ui.test.js
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM, VirtualConsole } from 'jsdom';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE_ROOT = path.resolve(__dirname, '..', '..');
const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000';

let passed = 0;
let failed = 0;

function pass(msg) { console.log('  ✅', msg); passed++; }
function fail(msg) { console.log('  ❌', msg); failed++; process.exitCode = 1; }

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function makeDom(file, url, instrument) {
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', (e) => {
    if (!/Could not load|Not implemented/.test(e.message)) console.error('PAGE ERROR:', e.message);
  });

  let html = fs.readFileSync(path.join(SITE_ROOT, file), 'utf8');
  if (instrument) html = html.replace(instrument[0], instrument[1]);

  const dom = new JSDOM(html, {
    url,
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    virtualConsole,
    beforeParse(window) {
      window.fetch = async (u, opts) => {
        const res = await fetch(new URL(u, BASE).toString(), opts);
        const text = await res.text();
        return {
          ok: res.ok,
          status: res.status,
          json: async () => JSON.parse(text),
          text: async () => text,
        };
      };
      window.alert = () => {};
      window.confirm = () => true;
      window.matchMedia = () => ({
        matches: false, addListener() {}, removeListener() {},
        addEventListener() {}, removeEventListener() {},
      });
    },
  });

  return dom;
}

async function devOtp() {
  const res = await fetch(`${BASE}/api/admin/dev/otp`);
  return res.json();
}

async function testAdminGate() {
  console.log('\n=== admin.html — بوابة الدخول الموحّدة ===\n');

  const dom = makeDom('admin.html', `${BASE}/admin.html`);
  const { window } = dom;
  const doc = window.document;
  await wait(1200);

  if (doc.body.className.includes('auth-pending')) {
    pass('اللوحة مخفية قبل المصادقة (auth-pending)');
  } else {
    fail(`اللوحة ليست مخفية! body class = ${doc.body.className}`);
  }

  const overlay = doc.getElementById('admin-login-overlay');
  if (overlay && window.getComputedStyle(overlay).display !== 'none') {
    pass('بوابة الدخول ظاهرة');
  } else {
    fail('بوابة الدخول غير ظاهرة');
  }

  if (!doc.getElementById('admin-step-select')) {
    pass('خطوة "اختيار المسؤول" محذوفة (لا كشف لأسماء الحسابات)');
  } else {
    fail('ما زالت هناك خطوة اختيار المسؤول!');
  }

  const htmlText = doc.documentElement.innerHTML;
  if (!/Chat ID/.test(htmlText)) pass('لا يوجد عرض لـ Chat ID في الواجهة');
  else fail('لا يزال Chat ID معروضاً!');

  if (doc.getElementById('admin-phone-input')) pass('حقل إدخال رقم الهاتف موجود');
  else fail('حقل رقم الهاتف مفقود!');

  // Request an OTP through the UI.
  doc.getElementById('admin-phone-input').value = '6776057443';
  doc.getElementById('admin-request-code-btn').click();
  await wait(1500);

  const stepVerify = doc.getElementById('admin-step-verify');
  if (stepVerify && stepVerify.classList.contains('active')) {
    pass('انتقل إلى خطوة إدخال رمز التحقق');
  } else {
    fail('لم ينتقل إلى خطوة التحقق');
  }

  const err1 = doc.getElementById('admin-step1-error');
  if (!err1.classList.contains('show')) pass('لا يوجد خطأ في إرسال الرمز');
  else fail(`خطأ في إرسال الرمز: ${err1.textContent}`);

  // Submit the OTP.
  const dev = await devOtp();
  if (dev.otp) {
    for (let i = 1; i <= 6; i++) {
      const el = doc.getElementById('admin-otp-' + i);
      el.value = dev.otp[i - 1];
      el.dispatchEvent(new window.Event('input', { bubbles: true }));
    }
    await wait(2000);
  }

  const sidebar = doc.getElementById('sidebar');
  if (sidebar && window.getComputedStyle(sidebar).display !== 'none') {
    pass('اللوحة ظهرت بعد نجاح التحقق');
  } else {
    fail('اللوحة لم تظهر بعد التحقق!');
  }

  if (!doc.body.className.includes('auth-pending')) pass('أُزيل auth-pending بعد الدخول');
  else fail('ما زال auth-pending موجوداً');

  const sidebarName = doc.getElementById('sidebar-name');
  if (sidebarName && sidebarName.textContent.trim()) {
    pass(`اسم المسؤول ظهر في الشريط الجانبي: ${sidebarName.textContent.trim()}`);
  } else {
    fail('اسم المسؤول لم يظهر');
  }

  if (typeof window.logout === 'function') pass('دالة logout متاحة');
  else fail('دالة logout غير موجودة!');

  dom.window.close();
}

async function testClientLogin() {
  console.log('\n=== login.html — دخول العملاء عبر الخادم ===\n');

  const source = fs.readFileSync(path.join(SITE_ROOT, 'login.html'), 'utf8');
  if (!/AA[A-Za-z0-9_-]{30,}/.test(source)) pass('لا يوجد توكن بوت في login.html');
  else fail('يوجد توكن بوت في login.html!');
  if (!/api\.telegram\.org/.test(source)) pass('لا يوجد اتصال مباشر بتلغرام');
  else fail('يوجد اتصال مباشر بتلغرام!');

  const dom = makeDom('login.html', `${BASE}/login.html`);
  const { window } = dom;
  const doc = window.document;
  await wait(800);

  doc.getElementById('phoneInput').value = `97150${String(Date.now()).slice(-7)}`;
  doc.getElementById('sendOtpBtn').click();
  await wait(1500);

  const stepOtp = doc.getElementById('stepOtp');
  if (stepOtp && stepOtp.classList.contains('active')) pass('انتقل إلى خطوة رمز التحقق');
  else {
    const a = doc.getElementById('alertMessage');
    fail(`لم ينتقل لخطوة التحقق — ${a ? a.textContent : ''}`);
  }

  const dev = await devOtp();
  if (dev.otp) {
    doc.getElementById('otpInput').value = dev.otp;
    doc.getElementById('verifyBtn').click();
    await wait(1500);

    const alertText = doc.getElementById('alertMessage').textContent;
    if (alertText.includes('تم التحقق')) pass('تم التحقق بنجاح');
    else fail(`فشل التحقق: ${alertText}`);
  }

  dom.window.close();
}

async function testIndexSecretPress() {
  console.log('\n=== index.html — الضغط المطوّل على الشعار ===\n');

  const source = fs.readFileSync(path.join(SITE_ROOT, 'index.html'), 'utf8');
  if (!/Admin123/.test(source)) pass('لا توجد كلمة مرور Admin123 في index.html');
  else fail('Admin123 ما زالت موجودة!');
  if (!/AA[A-Za-z0-9_-]{30,}/.test(source)) pass('لا يوجد توكن بوت في index.html');
  else fail('يوجد توكن بوت في index.html!');

  // Instrument the redirect so jsdom navigation can be detected.
  const dom = makeDom('index.html', `${BASE}/index.html`, [
    "window.location.href = 'admin.html';",
    "window.__redirected = true; window.location.href = 'admin.html';",
  ]);
  const { window } = dom;
  const doc = window.document;
  await wait(800);

  const logo = doc.getElementById('adminLogo');
  if (logo) {
    logo.dispatchEvent(new window.MouseEvent('mousedown', { bubbles: true }));
    await wait(2600);
    if (window.__redirected === true) pass('الضغط المطوّل ينقل إلى admin.html');
    else fail('لم ينتقل إلى admin.html');
  } else {
    fail('الشعار غير موجود');
  }

  dom.window.close();
}

async function testAdminPanel() {
  console.log('\n=== لوحة الإدارة — إدارة المسؤولين ===\n');

  const dom = makeDom('admin.html', `${BASE}/admin.html`);
  const { window } = dom;
  const doc = window.document;
  await wait(1200);

  const roster = await (await fetch(`${BASE}/api/admin/admins`)).json();
  const rosterJson = JSON.stringify(roster);
  if (!/botToken|chatId|AA[A-Za-z0-9_-]{30,}/.test(rosterJson)) {
    pass('قائمة المسؤولين لا تحوي أي أسرار');
  } else {
    fail('تسريب أسرار في قائمة المسؤولين');
  }

  if (!doc.getElementById('adminBotToken')) pass('حقل إدخال توكن البوت محذوف من الواجهة');
  else fail('حقل توكن البوت ما زال موجوداً!');

  if (!doc.getElementById('adminChatId')) pass('حقل إدخال Chat ID محذوف من الواجهة');
  else fail('حقل Chat ID ما زال موجوداً!');

  // The settings panel (which holds #adminsList) is rendered by a template.
  if (typeof window.switchTab === 'function') {
    window.switchTab({ classList: { add() {}, remove() {} } }, 'settings');
  }
  await wait(400);

  if (typeof window.renderAdminsList === 'function') {
    window.renderAdminsList();
    await wait(600);

    const listHtml = doc.getElementById('adminsList')?.innerHTML || '';
    if (listHtml.includes('Dev') || listHtml.includes('Mr. Developer')) {
      pass('قائمة المسؤولين تُعرض بشكل صحيح');
    } else {
      fail('لم تُعرض قائمة المسؤولين');
    }

    if (!/Chat ID/.test(listHtml)) pass('لا يُعرض Chat ID في قائمة المسؤولين');
    else fail('Chat ID معروض في القائمة!');
  }

  dom.window.close();
}

(async () => {
  await testAdminGate();
  await testClientLogin();
  await testIndexSecretPress();
  await testAdminPanel();

  console.log('\n═══════════════════════════════════════════');
  console.log(`  النتيجة: ${passed} نجح، ${failed} فشل`);
  console.log('═══════════════════════════════════════════');
})().catch((e) => {
  console.error('TEST ERROR:', e);
  process.exit(1);
});
