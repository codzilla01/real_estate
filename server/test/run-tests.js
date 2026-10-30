/**
 * Boots a dedicated test server (relaxed rate limits + mock Telegram) and
 * runs the API test suite against it.
 *
 *   npm test
 *
 * Using a separate instance keeps the suite deterministic and independent of
 * whatever the development server has already rate-limited.
 */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { once } from 'node:events';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER = path.join(__dirname, '..', 'src', 'server.js');

const PORT = process.env.TEST_PORT || '3999';

const env = {
  ...process.env,
  PORT,
  NODE_ENV: 'test',
  MOCK_TELEGRAM: 'true',
  SESSION_SECRET: 'test_only_secret_abcdefghijklmnopqrstuvwxyz0123456789',
  SECURE_COOKIES: 'false',
  ALLOWED_ORIGINS: `http://localhost:${PORT}`,
  PUBLIC_URL: `http://localhost:${PORT}`,
  // Relaxed limits so the suite is not order-dependent.
  MAX_OTP_REQUESTS_PER_WINDOW: '1000',
  OTP_RESEND_COOLDOWN_SECONDS: '0',
  LOGIN_BLOCK_SECONDS: '1',
  ADMIN1_BOT_TOKEN: 'test:token',
  ADMIN1_CHAT_ID: '6776057443',
};

const child = spawn(process.execPath, [SERVER], { env, stdio: ['ignore', 'pipe', 'pipe'] });

let output = '';
child.stdout.on('data', (d) => { output += d.toString(); });
child.stderr.on('data', (d) => { output += d.toString(); });

// Wait for the server to report it is listening.
const started = Date.now();
while (!/Al Maktab — Admin Auth Server/.test(output) && Date.now() - started < 15000) {
  await new Promise((r) => setTimeout(r, 100));
}

if (!/Al Maktab — Admin Auth Server/.test(output)) {
  console.error('Server failed to start:\n', output);
  child.kill('SIGTERM');
  process.exit(1);
}

process.env.TEST_BASE_URL = `http://localhost:${PORT}`;

try {
  const { default: run } = await import('node:test');
  // node:test runs the file passed via the CLI; here we spawn it ourselves so
  // the env var above is already in place.
  const testProcess = spawn(process.execPath, ['--test', path.join(__dirname, 'api.test.js')], {
    env: { ...env, TEST_BASE_URL: `http://localhost:${PORT}` },
    stdio: 'inherit',
  });
  const [code] = await once(testProcess, 'exit');
  process.exitCode = code ?? 1;
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  child.kill('SIGTERM');
}
