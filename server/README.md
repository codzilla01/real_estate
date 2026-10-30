# 🔐 Al Maktab — Admin Auth Server

خادم مصادقة خفيف يدير دخول **المسؤولين** و**العملاء** عبر رمز تحقق (OTP) يُرسل عبر Telegram.

## لماذا هذا الخادم موجود؟

قبل هذا المشروع كانت **كل الأسرار داخل ملفات HTML** التي يراها أي زائر:

| قبل ❌ | بعد ✅ |
|---|---|
| توكنات بوت Telegram في `index.html` / `login.html` / `admin.html` | التوكنات في `server/.env` على الخادم فقط |
| كلمة مرور `Admin123` مكتوبة في الكود | لا توجد كلمة مرور — OTP من الخادم |
| `adminToken` في `localStorage` (قابل للتزوير) | كوكي `HttpOnly` موقّع بـ HMAC |
| Dashboard يُرسم قبل التحقق | `body.auth-pending` يُخفي كل شيء حتى نجاح المصادقة |
| لا حد لمحاولات | حد 5 محاولات ثم حظر 15 دقيقة |
| لا سجل تدقيق | `server/data/audit.log` + إشعارات Telegram |

---

## 🚀 التشغيل السريع

```bash
cd server
npm install
cp .env.example .env      # ثم املأ القيم
npm start
```

الموقع يُقدَّم على `http://localhost:3000` — افتح `http://localhost:3000/admin.html`.

### توليد مفتاح الجلسات

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

ضع الناتج في `SESSION_SECRET` داخل `.env`.

---

## ⚙️ الإعدادات (`server/.env`)

| المتغيّر | الوصف | ملاحظات |
|---|---|---|
| `PORT` | منفذ الخادم | `3000` |
| `SESSION_SECRET` | مفتاح توقيع الجلسات | **إلزامي** — 32 حرفاً على الأقل |
| `ALLOWED_ORIGINS` | المصادر المسموح لها | عنوان موقعك، مفصول بفواصل |
| `SECURE_COOKIES` | إضافة `Secure` للكوكي | `true` في الإنتاج (HTTPS) |
| `ADMIN1_BOT_TOKEN` | توكن بوت المسؤول الأول | **لا تضعه في ملفات HTML** |
| `ADMIN1_CHAT_ID` | معرّف محادثة المسؤول | |
| `ADMIN1_NAME` / `ADMIN1_FULL_NAME` / `ADMIN1_ROLE` | بيانات العرض | تُعرض في لوحة التحكم |
| `ADMIN1_PERMISSIONS` | الصلاحيات | `all` أو `properties,clients` |
| `ALERT_BOT_TOKEN` / `ALERT_CHAT_ID` | قناة التنبيهات الأمنية | اختياري |

### إضافة مسؤول ثالث أو رابع

```bash
ADMIN3_NAME=سالم
ADMIN3_FULL_NAME=سالم أحمد
ADMIN3_ROLE=مشرف
ADMIN3_AVATAR=س
ADMIN3_BOT_TOKEN=123456789:AAxxxxxx
ADMIN3_CHAT_ID=987654321
ADMIN3_PERMISSIONS=properties
```

ثم أعد تشغيل الخادم. **لا حاجة لتعديل أي ملف HTML.**

> ملاحظة: يتم مطابقة رقم الهاتف المُدخل مع `ADMIN<n>_CHAT_ID` (أو `ADMIN<n>_PHONE` إن أضفته).
> لتفعيل `ADMIN<n>_PHONE` أضف الحقل إلى `config.js`.

---

## 🔌 الـ API

| الطريقة | المسار | الوصف |
|---|---|---|
| `POST` | `/api/admin/request-otp` | `{ phone }` → إرسال رمز تحقق |
| `POST` | `/api/admin/verify` | `{ challengeId, otp }` → إصدار كوكي الجلسة |
| `GET` | `/api/admin/session` | التحقق من صلاحية الجلسة |
| `POST` | `/api/admin/logout` | إنهاء الجلسة |
| `GET` | `/api/admin/admins` | قائمة المسؤولين (بيانات عامة فقط) |
| `POST` | `/api/admin/notify` | تسجيل حدث أمني |
| `POST` | `/api/client/request-otp` | طلب رمز للعميل |
| `POST` | `/api/client/verify` | تحقق العميل |
| `GET` | `/api/client/session` | جلسة العميل |
| `POST` | `/api/client/logout` | خروج العميل |
| `GET` | `/api/health` | حالة الخادم |

---

## 🛡️ الضوابط المطبّقة

**المصادقة**
- رمز OTP بـ 6 أرقام من `crypto.randomBytes` (بدون `Math.random`)
- يُخزَّن **هاش** الرمز فقط (`HMAC-SHA256`) — لا يُحفظ النص الصريح
- مقارنة بـ `timingSafeEqual` لمنع هجمات التوقيت
- صلاحية الرمز 5 دقائق · 5 محاولات كحد أقصى · حظر 15 دقيقة بعد تجاوزها

**الجلسات**
- كوكي `HttpOnly` + `SameSite=Lax` + `Secure` (في الإنتاج)
- رمز موقّع بـ HMAC-SHA256 — لا يمكن تزويره من DevTools
- مدة افتراضية 8 ساعات
- **عزل كامل**: كوكي العميل لا يفتح مسارات الأدمن والعكس

**منع تسريب الحسابات**
- لا تُعرض أسماء المسؤولين أو أرقام محادثاتهم في أي مكان بالواجهة
- رقم غير مسجل يستقبل **رداً مطابقاً** لرقم مسجّل (لا يمكن تخمين التسجيل)
- صفحة الدخول لا تكشف وجود الحسابات مسبقاً

**الحدود**
- 3 طلبات OTP لكل 10 دقائق (لكل IP ولكل رقم)
- 60 ثانية بين عمليتي إرسال لنفس الرقم
- حد عام على `/api` (120 طلب/دقيقة)

**التدقيق**
- كل حدث يُسجَّل في `server/data/audit.log` (JSONL)
- الأحداث الحساسة (فشل دخول، حظر، رقم غير مسجل) تُرسل لـ `ALERT_CHAT_ID`

**الأسرار**
- **صفر** أسرار في ملفات HTML
- `security.txt` / `.gitignore` يمنع commit لملف `.env`

---

## 🧪 الاختبارات

```bash
npm test
```

يشغّل خادماً مخصصاً للاختبار (حدود مخفّفة + Telegram وهمي) ثم 8 اختبارات تغطي:
صحة الخادم · رفض الجلسة غير المصادَقة · indistinguishability للأرقام غير المسجلة ·
رفض الكوكي المزوّر · دورة الدخول الكاملة · عزل جلسة العميل · الخروج · نقطة الإشعار.

---

## 🧪 وضع التطوير (`MOCK_TELEGRAM`)

```bash
MOCK_TELEGRAM=true npm start
```

- لا يتصل بـ Telegram — يطبع الرسالة في الطرفية
- `GET /api/admin/dev/otp` يعرض آخر رمزصدر (لتسهيل الاختبار)
- **معطّل تماماً** ما لم يكن `MOCK_TELEGRAM=true`

> ملاحظة: في بعض البيئات (مثل الحاويات sandbox) `api.telegram.org` محجوب.
> استخدم `MOCK_TELEGRAM=true` للتطوير، وفعّل الوضع الحقيقي في الإنتاج.

---

## 🚀 النشر

### الخيار أ — Node + PM2 (موصى به)

```bash
npm ci --omit=dev
pm2 start src/server.js --name almaktab-auth --env production
pm2 save && pm2 startup
```

### الخيار ب — Docker

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY src ./src
EXPOSE 3000
CMD ["node", "src/server.js"]
```

```bash
docker run -d --name almaktab-auth \
  -p 3000:3000 \
  --env-file .env \
  -v "$(pwd)/data:/app/data" \
  almaktab-auth
```

### الخيار ج — Railway / Render / Fly.io

- **Build Command:** `npm ci --omit=dev`
- **Start Command:** `node src/server.js`
- أضف كل متغيّرات `.env` من لوحة التحكم
- فعّل `SECURE_COOKIES=true` و `ALLOWED_ORIGINS=https://your-domain.com`

### Nginx reverse proxy

```nginx
server {
    listen 443 ssl;
    server_name almaktab.ae;

    ssl_certificate     /etc/letsencrypt/live/almaktab.ae/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/almaktab.ae/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## ⚠️ قبل النشر — قائمة تحقّق

- [ ] `SESSION_SECRET` عشوائي وطويل (وليس `change_me...`)
- [ ] `SECURE_COOKIES=true` (الموقع على HTTPS)
- [ ] `ALLOWED_ORIGINS` يحتوي فقط على نطاقك الفعلي
- [ ] `NODE_ENV=production`
- [ ] توكنات البوت **فقط** في `.env` (أزل `MOCK_TELEGRAM`)
- [ ] `server/.env` غير مضاف إلى Git (تحقّق من `.gitignore`)
- [ ] البوت يستطيع مراسلة `ADMIN<n>_CHAT_ID` (اضغط Start في المحادثة أولاً)
- [ ] `ALERT_BOT_TOKEN` / `ALERT_CHAT_ID` مضبوطة (مستحسن)
- [ ] تم عمل backup لمجلد `server/data/audit.log`

---

## 🗂️ بنية المشروع

```
server/
├── src/
│   ├── server.js              # نقطة الدخول: Express + Helmet + CORS + static
│   ├── config.js              # قراءة .env وبناء قائمة المسؤولين
│   ├── session.js             # توقيع/تحقق الجلسات + توليد OTP بـ CSPRNG
│   ├── otp-store.js           # مخزن التحديات + عدّادات الحدود + الحظر
│   ├── telegram.js            # عميل Telegram Bot API (+ وضع mock)
│   ├── audit.js               # سجل التدقيق JSONL
│   └── routes/
│       ├── admin-auth.js      # مسارات الأدمن
│       └── client-auth.js     # مسارات العملاء
├── test/
│   ├── run-tests.js           # مُشغّل الاختبارات (خادم مخصص)
│   ├── api.test.js            # اختبارات الـ API
│   └── helpers.js
├── data/audit.log             # سجل التدقيق (يُنشأ تلقائياً)
├── .env.example
└── README.md
```
