/**
 * Boots a dedicated test server (relaxed rate limits + mock Telegram) and
 * runs the UI integration suite against it.
 *
 *   npm run test:ui
 *
 * A separate instance keeps the suite deterministic: the real server's
 * per-IP request caps would otherwise make repeat runs fail once the
 * limits are reached.
 */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { once } from 'node:events';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER = path.join(__dirname, '..', 'src', 'server.js');

const PORT = process.env.UI_TEST_PORT || '3998';

const env = {
  ...process.env,
  PORT,
  NODE_ENV: 'test',
  MOCK_TELEGRAM: 'true',
  // Ignore the developer's local .env so the test server is fully isolated.
  SKIP_DOTENV: 'true',
  SESSION_SECRET: 'test_only_secret_abcdefghijklmnopqrstuvwxyz0123456789',
  SECURE_COOKIES: 'false',
  FRAME_ANCESTORS: "'self'",
  ALLOWED_ORIGINS: `http://localhost:${PORT}`,
  PUBLIC_URL: `http://localhost:${PORT}`,
  // Relaxed limits so repeat runs stay green.
  MAX_LOGIN_REQUESTS_PER_WINDOW: '1000',
  MAX_LOGIN_ATTEMPTS: '1000',
  LOGIN_BLOCK_SECONDS: '1',
  ADMIN1_USERNAME: 'admin',
  ADMIN1_PASSWORD: 'Admin@2026!Secure',
  ADMIN1_NAME: 'Dev',
  ADMIN1_FULL_NAME: 'Mr. Developer',
  ADMIN1_ROLE: 'المسؤول الرئيسي',
  ADMIN1_AVATAR: 'D',
  ADMIN2_USERNAME: 'manager',
  ADMIN2_PASSWORD: 'Manager@2026!Secure',
  ADMIN2_NAME: 'مهند',
  ADMIN2_FULL_NAME: 'مهند عبد الخالق',
  ADMIN2_ROLE: 'المسؤول الثاني',
  ADMIN2_AVATAR: 'م',
  CLIENT1_USERNAME: 'client',
  CLIENT1_PASSWORD: 'Client@2026!Secure',
  CLIENT1_FULL_NAME: 'عميل تجريبي',
};

const child = spawn(process.execPath, [SERVER], { env, stdio: ['ignore', 'pipe', 'pipe'] });

let output = '';
child.stdout.on('data', (d) => { output += d.toString(); });
child.stderr.on('data', (d) => { output += d.toString(); });

const started = Date.now();
while (!/Al Maktab — Admin Auth Server/.test(output) && Date.now() - started < 15000) {
  await new Promise((r) => setTimeout(r, 100));
}

if (!/Al Maktab — Admin Auth Server/.test(output)) {
  console.error('Server failed to start:\n', output);
  child.kill('SIGTERM');
  process.exit(1);
}

try {
  const testProcess = spawn(process.execPath, [path.join(__dirname, 'ui.test.js')], {
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
