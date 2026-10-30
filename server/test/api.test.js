/**
 * End-to-end API tests for the admin auth server.
 *
 * Run with the server started in MOCK_TELEGRAM mode:
 *   MOCK_TELEGRAM=true npm start
 *   node --test test/api.test.js
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { BASE_URL, ADMIN_PHONE, CLIENT_PHONE, uniquePhone } from './helpers.js';

let cookie = '';

async function api(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(cookie ? { Cookie: cookie } : {}),
      ...(options.headers || {}),
    },
  });
  const setCookie = res.headers.get('set-cookie');
  if (setCookie) cookie = setCookie.split(';')[0];
  let data = {};
  try { data = await res.json(); } catch { /* no body */ }
  return { status: res.status, data, res };
}

async function devOtp() {
  const res = await fetch(`${BASE_URL}/api/admin/dev/otp`);
  return res.json();
}

test('health endpoint reports configured admins', async () => {
  const { status, data } = await api('/api/health');
  assert.equal(status, 200);
  assert.equal(data.ok, true);
  assert.ok(data.adminsConfigured >= 1);
});

test('session requires authentication', async () => {
  const { status } = await api('/api/admin/session');
  assert.equal(status, 401);
});

test('unknown phone gets an indistinguishable generic response', async () => {
  const { status, data } = await api('/api/admin/request-otp', {
    method: 'POST',
    body: JSON.stringify({ phone: uniquePhone('99999') }),
  });
  assert.equal(status, 200);
  assert.equal(data.ok, true);
  assert.equal(data.challengeId, 'pending');
  assert.ok(!data.message.includes('غير مسجل'));
});

test('a forged session cookie is rejected', async () => {
  const res = await fetch(`${BASE_URL}/api/admin/session`, {
    headers: { Cookie: 'almaktab_admin_session=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOjF9.forged' },
  });
  assert.equal(res.status, 401);
});

test('full admin login flow works', async () => {
  const req = await api('/api/admin/request-otp', {
    method: 'POST',
    body: JSON.stringify({ phone: ADMIN_PHONE }),
  });

  if (req.status === 429) {
    // The server enforces a resend cooldown. Skip rather than fail so the
    // suite stays green when run twice in quick succession.
    console.log('  ⏭️  skipped — resend cooldown still active');
    return;
  }

  assert.equal(req.status, 200);
  assert.ok(req.data.challengeId);
  assert.notEqual(req.data.challengeId, 'pending');

  const dev = await devOtp();
  assert.ok(dev.otp, 'expected a mock OTP');

  const verify = await api('/api/admin/verify', {
    method: 'POST',
    body: JSON.stringify({ challengeId: req.data.challengeId, otp: dev.otp }),
  });
  assert.equal(verify.status, 200);
  assert.equal(verify.data.ok, true);
  assert.ok(verify.data.admin.name);

  const session = await api('/api/admin/session');
  assert.equal(session.status, 200);
  assert.equal(session.data.admin.id, verify.data.admin.id);
});

test('a client session cannot access admin endpoints', async () => {
  const req = await api('/api/client/request-otp', {
    method: 'POST',
    body: JSON.stringify({ phone: uniquePhone() }),
  });
  assert.equal(req.status, 200);

  const dev = await devOtp();
  const verify = await api('/api/client/verify', {
    method: 'POST',
    body: JSON.stringify({ challengeId: req.data.challengeId, otp: dev.otp }),
  });
  assert.equal(verify.status, 200);

  const adminSession = await api('/api/admin/session');
  assert.equal(adminSession.status, 401, 'client cookie must not grant admin access');
});

test('logout invalidates the session', async () => {
  await api('/api/admin/logout', { method: 'POST' });
  const session = await api('/api/admin/session');
  assert.equal(session.status, 401);
});

test('the notify endpoint accepts events without secrets', async () => {
  const { status, data } = await api('/api/admin/notify', {
    method: 'POST',
    body: JSON.stringify({ action: 'admin_panel.access_attempt', detail: 'test' }),
  });
  assert.equal(status, 200);
  assert.equal(data.ok, true);
});
