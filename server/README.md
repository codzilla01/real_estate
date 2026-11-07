# 🔐 Al Maktab — Admin Auth Server

خادم مصادقة خفيف يدير دخول **المسؤولين** و**العملاء** عبر **اسم مستخدم + كلمة مرور**، مع تشفير Argon2id، وحماية من التخمين، وسجل تدقيق.

## طريقة الدخول الآن

```
admin.html  ──►  اسم المستخدم + كلمة المرور  ──►  [الخادم]
                                                      │  • Argon2id verify
                                                      │  • حد المحاولات + الحظر
                                                      │  • إصدار كوكي HttpOnly موقّع
                                                      ▼
                                                  لوحة التحكم ✅
```

**لا يوجد OTP، ولا Telegram، ولا رموز سرية في المتصفح.**

---

## لماذا هذا التصميم؟

| قبل ❌ | بعد ✅ |
|---|---|
| توكنات بوت Telegram في ملفات HTML | **أُزيلت** — لا حاجة إليها للمصادقة |
| كلمة مرور `Admin123` مكتوبة في الكود | **أُزيلت** — لا كلمات مرور في الكود |
| OTP يُولَّد ويُتحقق منه في المتصفح | **الخادم** يتحقق من كلمة المرور |
| `adminToken` في `localStorage` (قابل للتزوير) | كوكي `HttpOnly` موقّع بـ HMAC |
| Dashboard يُرسم قبل اكتمال المصادقة | `body.auth-pending` يُخفي كل شيء حتى النجاح |
| لا حد لمحاولات | 5 محاولات ثم حظر 15 دقيقة |
| لا سجل تدقيق | `server/data/audit.log` + إشعارات Telegram اختيارية |

> Telegram لم يُحذف كلياً — صار **اختيارياً** ويُستخدم فقط لإرسال تنبيهات الدخول (نجاح/فشل)، ولا علاقة له بالمصادقة.

---

## 🚀 التشغيل السريع

```bash
cd server
npm install
cp .env.example .env
# املأ القيم:
#   ADMIN1_USERNAME
#   ADMIN1_PASSWORD_HASH   ← ولّدها بالأمر التالي
npm run hash-password -- "YourPassword123!" --env ADMIN1_PASSWORD_HASH
npm start
```

الموقع يُقدَّم على `http://localhost:3000` — افتح `http://localhost:3000/admin.html`.

### توليد مفتاح الجلسات

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

ضع الناتج في `SESSION_SECRET` داخل `.env`.

---

## 🔑 تخزين كلمة المرور

يدعم الخادم **الصيغتين** معاً (الهاش له الأولوية):

### 1. هاش Argon2id — الخيار الموصى به ✅

```bash
npm run hash-password -- "YourPassword123!" --env ADMIN1_PASSWORD_HASH
```

يطبع:
```
ADMIN1_PASSWORD_HASH=$argon2id$v=19$m=19456,t=2,p=1$...
```
انسخ السطر إلى `.env`. **كلمة المرور نفسها لا تُخزَّن إطلاقاً.**

### 2. نص صريح — بديل للاختبار السريع ⚠️

```bash
ADMIN1_PASSWORD=YourPassword123!
```

يعمل، لكن الخادم يطبع تحذيراً عند الإقلاع:
```
⚠️  Plaintext password used for: ADMIN1. Run "npm run hash-password -- <password>"...
```

**التحقق يتم في الحالتين** بمقارنة constant-time، فلا يمكن استنتاج طول كلمة المرور أو محتواها من زمن الاستجابة.

---

## ⚙️ الإعدادات (`server/.env`)

| المتغيّر | الوصف |
|---|---|
| `SESSION_SECRET` | مفتاح توقيع الجلسات — **إلزامي**، 32 حرفاً على الأقل |
| `SECURE_COOKIES` | `true` في الإنتاج (HTTPS) |
| `FRAME_ANCESTORS` | `'none'` افتراضياً · `'self'` للمعاينات داخل iframe |
| `ALLOWED_ORIGINS` | المصادر المسموح لها، مفصول بفواصل |
| `ADMIN<n>_USERNAME` | اسم الدخول |
| `ADMIN<n>_PASSWORD_HASH` | هاش Argon2id (مفضّل) |
| `ADMIN<n>_PASSWORD` | نص صريح (بديل) |
| `ADMIN<n>_NAME` / `_FULL_NAME` / `_ROLE` / `_AVATAR` | بيانات العرض في اللوحة |
| `ADMIN<n>_PERMISSIONS` | `all` أو `properties,clients` |
| `ADMIN<n>_BOT_TOKEN` / `_CHAT_ID` | **اختياري** — لتنبيهات الدخول فقط |
| `CLIENT<n>_USERNAME` / `_PASSWORD_HASH` | حسابات العملاء (اختيارية) |
| `ALERT_BOT_TOKEN` / `ALERT_CHAT_ID` | قناة التنبيهات الأمنية (اختيارية) |

### إضافة مسؤول ثالث

```bash
ADMIN3_USERNAME=saleem
ADMIN3_PASSWORD_HASH=$argon2id$v=19$...
ADMIN3_NAME=سالم
ADMIN3_FULL_NAME=سالم أحمد
ADMIN3_ROLE=مشرف
ADMIN3_AVATAR=س
ADMIN3_PERMISSIONS=properties
```

ثم أعد تشغيل الخادم. **لا حاجة لتعديل أي ملف HTML.**

---

## 🔌 الـ API

| الطريقة | المسار | الوصف |
|---|---|---|
| `POST` | `/api/admin/login` | `{ username, password }` → إصدار كوكي الجلسة |
| `GET` | `/api/admin/session` | التحقق من صلاحية الجلسة |
| `POST` | `/api/admin/logout` | إنهاء الجلسة |
| `GET` | `/api/admin/admins` | قائمة المسؤولين (بيانات عامة فقط) |
| `POST` | `/api/admin/notify` | تسجيل حدث أمني |
| `POST` | `/api/client/login` | `{ username, password }` → جلسة عميل |
| `GET` | `/api/client/session` | جلسة العميل |
| `POST` | `/api/client/logout` | خروج العميل |
| `GET` | `/api/health` | حالة الخادم |

---

## 🛡️ الضوابط المطبّقة

**المصادقة**
- تشفير Argon2id (m=19 MiB, t=2, p=1) لكلمة المرور
- مقارنة constant-time — لا تسريب عبر زمن الاستجابة
- **منع كشف الحسابات**: اسم مستخدم غير موجود وكلمة مرور خاطئة يعطيان **نفس الرسالة ونفس الزمن**
- `burnPasswordCheck` — عملية تحقق وهمية للحفاظ على ثبات الزمن عند اسم مستخدم مجهول

**الجلسات**
- كوكي `HttpOnly` + `SameSite=Lax` + `Secure` (في الإنتاج)
- رمز موقّع بـ HMAC-SHA256 — لا يمكن تزويره من DevTools
- مدة افتراضية 8 ساعات
- **عزل كامل**: كوكي العميل لا يفتح مسارات الأدمن والعكس

**الحدود**
- 5 محاولات لكل حساب ← حظر 15 دقيقة
- 20 محاولة لكل IP ← حظر 15 دقيقة (يمنع رشّ أسماء مستخدمين كثيرة)
- 10 طلبات دخول لكل IP كل 10 دقائق

**التدقيق**
- كل حدث يُسجَّل في `server/data/audit.log` (JSONL)
- الأحداث الحساسة تُرسل لـ `ALERT_CHAT_ID` إن كان مُعدّاً

**الأسرار**
- **صفر** أسرار في ملفات HTML
- `.env` مستثنى من Git

---

## 🧪 الاختبارات

```bash
npm test        # اختبارات الـ API (11 اختباراً)
npm run test:ui # اختبارات الواجهة (26 فحصاً عبر jsdom)
```

كلٌّ منهما يشغّل **خادم اختبار مخصصاً** (حدود مخفّفة) حتى تبقى الاختبارات حتمية ومتكررة.

`npm test` يغطي: صحة الخادم · رفض الجلسة غير المصادَقة · ** indistinguishability للأخطاء** ·
غياب الحقول · كوكي مزوّر · دورة الدخول · حساسية اسم المستخدم لحالة الأحرف ·
عزل جلسة العميل · عدم تسريب الأسرار · الخروج · نقطة الإشعار.

`npm run test:ui` يقود ملفات HTML الحقيقية (jsdom) ويتحقق من:
اختفاء اللوحة قبل المصادقة · نوع حقل كلمة المرور · حذف خطوة OTP ·
دورة الدخول · الضغط المطوّل · إدارة المسؤولين.

---

## 🚀 النشر

> ⚠️ **الموقع لم يعد ملفات ثابتة.** الدخول يعتمد على خادم Node يوفّر الـ API
> ويخدم الملفات معاً. على Vercel (أو أي منصة static) **لن يعمل الدخول** قبل
> ضبط إعدادات النشر أدناه.

### Vercel

الملف `vercel.json` في جذر المستودع يضبط المشروع كـ Node function:

```bash
# 1) أضف المتغيّرات في لوحة Vercel → Settings → Environment Variables
SESSION_SECRET=<hex 96 char>
ADMIN1_USERNAME=admin
ADMIN1_PASSWORD_HASH=$argon2id$v=19$...
SECURE_COOKIES=true
FRAME_ANCESTORS='none'
ALLOWED_ORIGINS=https://your-domain.com
NODE_ENV=production

# 2) اربط نطاقك
vercel --prod
```

> `vercel.json` يوجّه كل المسارات إلى `server/src/server.js`، الذي يقدّم
> الـ API **و** الملفات الثابتة من عملية واحدة.

### Docker (موصى به لخادم خاص)

```bash
docker build -t almaktab .
docker run -d --name almaktab \
  -p 3000:3000 \
  --env-file server/.env \
  -v almaktab-data:/app/server/data \
  almaktab
```

> `server/data` يجمع سجل التدقيق — استخدم volume ليبقى بعد إعادة التشغيل.

### Node + PM2 (موصى به)

```bash
npm ci --omit=dev
pm2 start src/server.js --name almaktab-auth --env production
pm2 save && pm2 startup
```

### Railway / Render / Fly.io

- **Build Command:** `npm ci --omit=dev`
- **Start Command:** `node src/server.js`
- أضف متغيّرات `.env` من لوحة التحكم
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
- [ ] **كلمات المرور مخزَّنة كهاش** (`*_PASSWORD_HASH`) — لا نص صريح
- [ ] `.env` غير مضاف إلى Git
- [ ] `ALERT_BOT_TOKEN` / `ALERT_CHAT_ID` مضبوطة (اختياري لكن مستحسن)
- [ ] تم عمل backup لمجلد `server/data/audit.log`

---

## 🗂️ بنية المشروع

```
server/
├── src/
│   ├── server.js              # Express + Helmet + CORS + static
│   ├── config.js              # قراءة .env وبناء قوائم المستخدمين
│   ├── session.js             # توقيع/تحقق الجلسات
│   ├── password.js            # Argon2id hash + verify + منع تسريب التوقيت
│   ├── login-store.js         # عدّادات المحاولات + الحظر
│   ├── telegram.js            # عميل Telegram Bot API (اختياري — تنبيهات فقط)
│   ├── audit.js               # سجل التدقيق JSONL
│   └── routes/
│       ├── admin-auth.js      # مسارات الأدمن
│       └── client-auth.js     # مسارات العملاء
├── scripts/
│   ├── hash-password.js       # أداة توليد هاش Argon2id
│   └── security-check.sh      # 21 فحصاً أمنياً
├── test/
│   ├── run-tests.js           # مُشغّل اختبارات API (خادم مخصص)
│   ├── run-ui-tests.js        # مُشغّل اختبارات الواجهة
│   ├── api.test.js            # اختبارات الـ API
│   ├── ui.test.js             # اختبارات الواجهة
│   └── helpers.js
├── data/audit.log             # سجل التدقيق (يُنشأ تلقائياً)
├── .env.example
└── README.md
```
