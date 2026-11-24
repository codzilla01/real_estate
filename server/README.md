# 🔐 خادم المكتب العقاري — Al Maktab Server

خادم Node.js خفيف (Express) يقدّم **الموقع بالكامل** (`index.html`, `login.html`, `admin.html`)
**و** واجهة المصادقة الآمنة: لا  secrets في المتصفح، لا تحقق في الـ frontend.

---

## ✨ ما الذي يفعله الخادم؟

| القدرة | التفاصيل |
|---|---|
| 🔑 مصادقة | اسم مستخدم + كلمة مرور، تحقق بـ **Argon2id** |
| 🍪 جلسات | كوكي `HttpOnly` موقّع **HMAC-SHA256** (لا قابل للتزوير من المتصفح) |
| 🛡️ حماية التخمين | 5 محاولات فاشلة ← حظر IP لمدة 15 دقيقة |
| 📋 سجل تدقيق | كل حدث أمني يُلحَق بـ `server/data/audit.log` (JSON Lines) |
| 📲 إشعارات تيليجرام | اختيارية عند تسجيل الدخول ومحاولات الوصول |
| 🚫 لا كشف للحسابات | رسالة خطأ موحّدة + زمن استجابة موحّد للمستخدم المجهول |
| 🧹 إبطال الجلسة | تسجيل الخروج يبطل الجلسة فوراً (قائمة jti في الذاكرة) |
| 🖥️ تقديم الملفات | الصفحات الثلاث + `/login` و`/admin` بعناوين ودّية |

---

## 🚀 التشغيل السريع

```bash
cd server
npm install
cp .env.example .env

# 1) ولّد هاش كلمة مرور المسؤول
npm run hash-password -- "YourStrongPassword123!" --env ADMIN1_PASSWORD_HASH
#   انسخ الناتج إلى سطر ADMIN1_PASSWORD_HASH= داخل server/.env

npm start
```

- الموقع: <http://localhost:3000>
- لوحة التحكم: <http://localhost:3000/admin.html> (أو اضغط مطوّلاً على الشعار في الرئيسية)
- صفحة دخول العملاء: <http://localhost:3000/login.html>

> 💡 بدون `SESSION_SECRET` يعمل الخادم في وضع التطوير ويولّد سراً مؤقتاً
> (تُسجَّل الجلسات من جديد بعد كل إعادة تشغيل). في الإنتاج حدّده في `.env`:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

---

## ⚙️ متغيرات البيئة (`server/.env`)

### عام

| المتغير | الافتراضي | الوصف |
|---|---|---|
| `NODE_ENV` | `development` | `production` يفعّل كوكي `Secure` |
| `PORT` | `3000` | منفذ الخادم |
| `HOST` | `0.0.0.0` | عنوان الربط |
| `SESSION_SECRET` | *(يُولَّد مؤقتاً)* | سر توقيع الجلسات — **إلزامي في الإنتاج** |
| `SESSION_TTL_HOURS` | `8` | مدة الجلسة |
| `MAX_LOGIN_ATTEMPTS` | `5` | محاولات قبل الحظر |
| `LOCK_MINUTES` | `15` | مدة الحظر بالدقائق |
| `FRAME_ANCESTORS` | `'none'` | قيم `frame-ancestors` في CSP |
| `AUDIT_LOG_PATH` | `server/data/audit.log` | مسار سجل التدقيق |

### حسابات المسؤولين — `ADMIN{n}_*` (من 1 إلى 9)

| المتغير | إلزامي | الوصف |
|---|---|---|
| `ADMIN1_USERNAME` | ✅ | اسم الدخول |
| `ADMIN1_PASSWORD_HASH` | ✅ | هاش Argon2id (via `npm run hash-password`) |
| `ADMIN1_NAME` | | الاسم المعروض في الشريط العلوي |
| `ADMIN1_FULL_NAME` | | الاسم الكامل في الشريط الجانبي |
| `ADMIN1_ROLE` | | مثال: `مسؤول رئيسي` |
| `ADMIN1_PERMISSIONS` | | `all` أو `properties,clients,appointments` |
| `ADMIN1_AVATAR` | | إيموجي أو حرف (افتراضي: أول حرف من الاسم) |
| `ADMIN1_BOT_TOKEN` | | توكن بوت تيليجرام للإشعارات (اختياري) |
| `ADMIN1_CHAT_ID` | | معرّف المحادثة (اختياري) |

### حسابات العملاء — `CLIENT{n}_*` (اختيارية)

نفس الحقول بلا `ROLE/PERMISSIONS`. **إذا لم تُعرّف أي حساب عميل، تعمل صفحة دخول العملاء
بحسابات المسؤولين نفسها.**

---

## 📡 نقاط النهاية (API)

| الطريقة | المسار | الوصف |
|---|---|---|
| GET | `/api/health` | فحص الصحة (يستخدمه Docker healthcheck) |
| POST | `/api/admin/login` | `{username, password}` → يصدر الكوكي |
| GET | `/api/admin/session` | الملف الحالي أو 401 |
| POST | `/api/admin/logout` | يبطل الجلسة ويمسح الكوكي |
| GET | `/api/admin/admins` | الملفات العامة للمسؤولين (بلا أسرار) |
| POST | `/api/admin/notify` | تدقيق أحداث الواجهة (+ تيليجرام اختياري) |
| POST | `/api/client/login` | دخول العملاء |
| GET | `/api/client/session` | جلسة العميل الحالية |
| POST | `/api/client/logout` | خروج العميل |
| GET | `/` `/login` `/admin` | الصفحات |

---

## 🧪 الاختبارات

```bash
npm test          # 11 اختبار API (خادم حقيقي على منفذ عشوائي)
npm run test:ui   # 26 فحص واجهة (لا أسرار، عقود المصادقة سليمة)
npm run security-check   # يفحص تسريب الأسرار في الملفات المقدَّمة للمتصفح
```

---

## 📤 النشر

### Vercel (الأسهل)

جاهز عبر `vercel.json` — الخادم هو دالة Node وتُضمَّن الصفحات:

```bash
npm i -g vercel
vercel --prod
```

حدّد متغيرات البيئة من لوحة Vercel (نفسها الموجودة في `.env.example`).
ملاحظة: الجلسات المعتمدة على الذاكرة والإبطال يعملان ضمن النسخة الواحدة؛ للإبطال الفوري
عبر نسخ متعددة استخدم مخزن مشترك أو قلّص TTL.

### Docker

```bash
docker build -t almaktab .
docker run -d -p 3000:3000 \
  -e SESSION_SECRET=$(openssl rand -hex 32) \
  -e ADMIN1_USERNAME=admin \
  -e ADMIN1_PASSWORD_HASH='$argon2id$...' \
  -v almaktab-data:/app/server/data \
  almaktab
```

`Dockerfile` يشغّل `node server/src/server.js` على المنفذ 3000 مع healthcheck على `/api/health`.

### PM2 + Nginx

```bash
cd server && npm ci --omit=dev
pm2 start src/server.js --name almaktab --env production
pm2 save
```

ثم وجّه Nginx كل شيء إلى `localhost:3000` وفعّل HTTPS (الكوكي تصبح `Secure` تلقائياً
عند `NODE_ENV=production`). مثال جاهز:

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.ae;
    # ... certificates ...
    location / { proxy_pass http://127.0.0.1:3000; proxy_set_header Host $host;
                 proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                 proxy_set_header X-Forwarded-Proto $scheme; }
}
```

> ⚠️ احتفظ بنسخة احتياطية من `server/.env` و `server/data/audit.log`.

---

## 🛡️ الأمان — مبادئ مهمة

- **لا تضع أي سر في ملفات HTML/JS** — التحقق كله في الخادم.
- `.env` مستثنى في `.gitignore` — لا ترفعه إلى Git أبداً.
- كلمات المرور تُخزَّن كهاش Argon2id فقط (`m=64MiB, t=3, p=1`).
- الجلسة كوكي `HttpOnly` موقّعة؛ أي تعديل من المتصفح يبطلها.
- رسائل الخطأ موحّدة ولا تكشف وجود الحسابات.
- `npm run security-check` يتأكد أن الأسرار لا تتسرب لملفات الواجهة (يُشغَّل في CI).

---

## 📁 البنية

```
server/
├── src/
│   ├── server.js    #  Express app + المسارات + الحماية
│   ├── config.js    # قراءة .env وبناء قائمة المسؤولين/العملاء
│   ├── auth.js      #  Argon2id + جلسات HMAC موقّعة + الكوكيز
│   ├── audit.js     #  سجل التدقيق
│   └── telegram.js  #  إشعارات تيليجرام (best-effort)
├── scripts/
│   ├── hash-password.js    # توليد هاش Argon2id
│   └── security-check.js   # فحص تسريب الأسرار
├── test/
│   ├── api.test.js         # 11 اختبار API
│   └── ui.test.js          # 26 فحص واجهة
├── data/audit.log          # يُنشأ تلقائياً (مجلد data مرفق كـ volume)
├── .env.example
└── package.json
```
