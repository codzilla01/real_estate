export const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

// Credentials used by the test servers (see run-tests.js / run-ui-tests.js).
export const ADMIN_USER = process.env.TEST_ADMIN_USER || 'admin';
export const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'Admin@2026!Secure';
export const CLIENT_USER = process.env.TEST_CLIENT_USER || 'client';
export const CLIENT_PASSWORD = process.env.TEST_CLIENT_PASSWORD || 'Client@2026!Secure';
