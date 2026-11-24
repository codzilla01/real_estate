'use strict';

/**
 * فحص أمني سريع: يتأكد أن الأسرار لا تُسرّب إلى الملفات التي تُقدَّم للمتصفح.
 * يُستخدم محلياً وفي CI. يخرج بحالة 1 عند اكتشاف مشكلة.
 */

const fs = require('fs');
const path = require('path');

const SERVER_DIR = path.resolve(__dirname, '..');
const ROOT = path.resolve(SERVER_DIR, '..');

const FILES = [
    path.join(ROOT, 'index.html'),
    path.join(ROOT, 'login.html'),
    path.join(ROOT, 'admin.html'),
];

function srcFiles(dir) {
    const out = [];
    if (!fs.existsSync(dir)) return out;
    for (const name of fs.readdirSync(dir)) {
        const full = path.join(dir, name);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) out.push(...srcFiles(full));
        else if (name.endsWith('.js')) out.push(full);
    }
    return out;
}
FILES.push(...srcFiles(path.join(SERVER_DIR, 'src')));

// أنماط الأسرار الممنوعة في ملفات الواجهة/الكود المقدم للعميل
const PATTERNS = [
    {
        id: 'telegram-bot-token',
        re: /\b\d{8,12}:[A-Za-z0-9_-]{30,}\b/,
        msg: 'توكن بوت تيليجرام — يجب أن يعيش في server/.env فقط',
    },
    {
        id: 'argon-hash',
        re: /\$argon2(?:id|i|d)\$v=\d+\$m=\d+,t=\d+,p=\d+\$[A-Za-z0-9+/_-]{8,}\$[A-Za-z0-9+/_-]{8,}/,
        msg: 'هاش Argon2 حقيقي — لا يُدرج في ملفات الواجهة، فقط في server/.env',
    },
    {
        id: 'default-password',
        re: /Admin123/i,
        msg: 'كلمة المرور الافتراضية القديمة — أُزيلت من المشروع',
    },
    {
        id: 'hardcoded-secret-assignment',
        re: /(?:bot_?token|chat_?id|api_?key|secret|password)\s*[:=]\s*['"][^'"]{6,}['"]/i,
        msg: 'سر مكتوب مباشرة في الكود — استخدم متغيرات البيئة',
    },
    {
        id: 'localStorage-token',
        re: /localStorage\.(?:getItem|setItem)\(\s*['"](?:adminToken|clientToken)/,
        msg: 'الاعتماد على توكن في localStorage — الجلسات يجب أن تكون كوكي HttpOnly',
    },
];

let issues = 0;

for (const file of FILES) {
    let content;
    try {
        content = fs.readFileSync(file, 'utf8');
    } catch (_) {
        continue;
    }
    for (const { id, re, msg } of PATTERNS) {
        const m = content.match(re);
        if (m) {
            issues++;
            console.error(`❌ [${id}] ${path.relative(ROOT, file)}`);
            console.error(`   ${msg}`);
            console.error(`   -match: ${m[0].slice(0, 80)}`);
        }
    }
}

// تحقق إضافي: ملف .env الحقيقي لا ينبغي أن يكون مرفقاً في الشجرة
if (fs.existsSync(path.join(SERVER_DIR, '.env'))) {
    console.warn('⚠️  يوجد ملف server/.env — تأكد أنه مستثنى من Git (موجود في .gitignore).');
}

if (issues > 0) {
    console.error(`\nفشل الفحص الأمني: ${issues} مشكلة.`);
    process.exit(1);
}

console.log(`✅ الفحص الأمني سليم (${FILES.length} ملفاً).`);
