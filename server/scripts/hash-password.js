#!/usr/bin/env node
/**
 * Generates an Argon2id hash for a password.
 *
 * Usage:
 *   npm run hash-password -- "my secret password"
 *   npm run hash-password -- "my secret password" --env ADMIN1_PASSWORD_HASH
 *
 * The output is meant to be pasted into server/.env as
 *   ADMIN1_PASSWORD_HASH=$argon2id$...
 *
 * Passwords are never written to disk or logged in plain text.
 */
import { hashPassword } from '../src/password.js';

const args = process.argv.slice(2);
const envNameIndex = args.indexOf('--env');
const envName = envNameIndex !== -1 ? args[envNameIndex + 1] : null;

const passwordArgs = args.filter((a, i) => a !== '--env' && args[i - 1] !== '--env');
const password = passwordArgs.join(' ');

if (!password) {
  console.error('❌ يرجى تمرير كلمة المرور، مثال:');
  console.error('   npm run hash-password -- "كلمة المرور"');
  process.exit(1);
}

if (password.length < 8) {
  console.warn('⚠️  كلمة المرور أقصر من 8 أحرف — يُنصح بكلمة أطول.');
}

const hash = await hashPassword(password);

console.log('\n✅ تم توليد الهاش. انسخ السطر التالي إلى server/.env:\n');
console.log(envName ? `${envName}=${hash}` : hash);
console.log('\n💡 لا تستخدم ADMIN<n>_PASSWORD (نص صريح) إن أمكن — الهاش هو الخيار الآمن.\n');
