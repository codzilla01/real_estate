/**
 * Al Maktab — Admin Auth Server
 *
 * Serves the static site and exposes a small JSON API that handles admin
 * authentication. The critical property: Telegram bot tokens live only in
 * this process's environment and are never sent to the browser.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { config, assertConfig } from './config.js';
import { adminAuthRouter } from './routes/admin-auth.js';
import { clientAuthRouter } from './routes/client-auth.js';
import { activeChallengeCount } from './otp-store.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE_ROOT = path.resolve(__dirname, '..', '..');

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');

/* ---------------- Security headers ---------------- */
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        // The site uses inline styles/scripts and CDN assets.
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://cdnjs.cloudflare.com'],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'https://cdnjs.cloudflare.com'],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
        connectSrc: ["'self'"],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }),
);

app.use(express.json({ limit: '32kb' }));
app.use(cookieParser());

/* ---------------- CORS ---------------- */
app.use((req, res, next) => {
  const origin = req.get('origin');
  if (origin && config.allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  }
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

/* ---------------- Global rate limit ---------------- */
app.use(
  '/api',
  rateLimit({
    windowMs: 60 * 1000,
    limit: 120,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { ok: false, message: 'طلبات كثيرة جداً. حاول بعد قليل.' },
  }),
);

/* ---------------- API ---------------- */
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    adminsConfigured: config.admins.length,
    activeChallenges: activeChallengeCount(),
    env: config.env,
  });
});

app.use('/api/admin', adminAuthRouter);
app.use('/api/client', clientAuthRouter);

app.use('/api', (req, res) => {
  res.status(404).json({ ok: false, message: 'المسار غير موجود' });
});

/* ---------------- Static site ---------------- */
app.use(
  express.static(SITE_ROOT, {
    extensions: ['html'],
    setHeaders(res, filePath) {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache');
      }
    },
  }),
);

app.get('/', (req, res) => {
  res.sendFile(path.join(SITE_ROOT, 'index.html'));
});

/* ---------------- Error handling ---------------- */
app.use((err, req, res, next) => {
  console.error('[server] unhandled error:', err);
  res.status(500).json({ ok: false, message: 'خطأ داخلي في الخادم' });
});

/* ---------------- Startup ---------------- */
const problems = assertConfig();

app.listen(config.port, '0.0.0.0', () => {
  console.log('─────────────────────────────────────────────');
  console.log('  Al Maktab — Admin Auth Server');
  console.log(`  URL:        http://0.0.0.0:${config.port}`);
  console.log(`  Env:        ${config.env}`);
  console.log(`  Admins:     ${config.admins.length} active`);
  console.log(`  Origins:    ${config.allowedOrigins.join(', ')}`);
  console.log('─────────────────────────────────────────────');

  if (problems.length) {
    console.warn('\n⚠️  Configuration warnings:');
    for (const p of problems) console.warn(`   • ${p}`);
    console.warn('');
  }
});

export { app };
