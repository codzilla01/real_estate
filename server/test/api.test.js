/**
 * End-to-end API tests for the admin auth server.
 *
 * Run with the server started in MOCK_TELEGRAM mode:
 *   node --test test/api.test.js
 *
 * The suite is started automatically by test/run-tests.js against a dedicated
 * server with relaxed rate limits, so repeat runs stay deterministic.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { BASE_URL, ADMIN_USER, ADMIN_PASSWORD, CLIENT_USER, CLIENT_PASSWORD } from './helpers.js';

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

test('health endpoint reports configured admins and clients', async () => {
  const { status, data } = await api('/api/health');
  assert.equal(status, 200);
  assert.equal(data.ok, true);
  assert.ok(data.adminsConfigured >= 1);
});

test('session requires authentication', async () => {
  const { status } = await api('/api/admin/session');
  assert.equal(status, 401);
});

test('a wrong password and an unknown user are indistinguishable', async () => {
  const wrongPassword = await api('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ username: ADMIN_USER, password: 'definitely-wrong' }),
  });
  const unknownUser = await api('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ username: 'no-such-user', password: 'definitely-wrong' }),
  });

  assert.equal(wrongPassword.status, 401);
  assert.equal(unknownUser.status, 401);
  // Identical messages — the client must not be able to enumerate accounts.
  assert.equal(wrongPassword.data.message, unknownUser.data.message);
});

test('missing credentials are rejected', async () => {
  const { status } = await api('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ username: ADMIN_USER }),
  });
  assert.equal(status, 400);
});

test('a forged session cookie is rejected', async () => {
  const res = await fetch(`${BASE_URL}/api/admin/session`, {
    headers: { Cookie: 'almaktab_admin_session=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOjF9.forged' },
  });
  assert.equal(res.status, 401);
});

test('full admin login flow works', async () => {
  const login = await api('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ username: ADMIN_USER, password: ADMIN_PASSWORD }),
  });
  assert.equal(login.status, 200);
  assert.equal(login.data.ok, true);
  assert.ok(login.data.admin.name);

  const session = await api('/api/admin/session');
  assert.equal(session.status, 200);
  assert.equal(session.data.admin.id, login.data.admin.id);
});

test('the username is matched case-insensitively', async () => {
  const login = await api('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ username: ADMIN_USER.toUpperCase(), password: ADMIN_PASSWORD }),
  });
  assert.equal(login.status, 200);
  assert.equal(login.data.ok, true);
});

test('a client session cannot access admin endpoints', async () => {
  const login = await api('/api/client/login', {
    method: 'POST',
    body: JSON.stringify({ username: CLIENT_USER, password: CLIENT_PASSWORD }),
  });
  assert.equal(login.status, 200);

  const adminSession = await api('/api/admin/session');
  assert.equal(adminSession.status, 401, 'client cookie must not grant admin access');
});

test('the admin roster exposes no secrets', async () => {
  const { status, data } = await api('/api/admin/admins');
  assert.equal(status, 200);
  const json = JSON.stringify(data);
  assert.ok(!/credential|passwordHash|passwordPlain|botToken|chatId/.test(json));
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
