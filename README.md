# 🏢 المكتب العقاري | Al Maktab Al Aqari

واجهة عقارية فاخرة وعصرية مصممة بتقنيات Frontend حديثة لعرض العقارات الفاخرة في الإمارات العربية المتحدة، مع دعم كامل للغتين العربية والإنجليزية، ووضع Dark Mode، وتأثيرات Glassmorphism احترافية.

> 🔐 **نظام الدخول للوحة التحكم تم تحديثه بالكامل** — من تحقق في المتصفح إلى مصادقة كاملة على الخادم.
> راجع [`server/README.md`](server/README.md) للتفاصيل.

## ✨ المميزات الرئيسية

- 🎨 تصميم فاخر Modern Luxury UI
- 🌙 دعم الوضع الليلي Dark Mode
- 🌐 دعم اللغتين العربية والإنجليزية
- 📱 Responsive Design لجميع الأجهزة
- 🔍 نظام بحث متقدم عن العقارات
- 🏠 عرض عقارات احترافي مع تفاعلات مميزة
- 📊 عدادات وإحصائيات متحركة
- ✨ Animations & Glass Effects
- 🔐 **مصادقة باسم المستخدم + كلمة المرور (Argon2id)** — بدون أسرار في المتصفح
- 🛡️ **حماية من التخمين** + سجل تدقيق كامل
- ⚡ أداء سريع بدون أي Framework
- 🧠 Clean Vanilla JavaScript Architecture

---

## 🚀 التشغيل

### الطريقة الموصى بها (مع خادم المصادقة)

```bash
# 1) تشغيل الخادم
cd server
npm install
cp .env.example .env

# ولّد هاش كلمة مرور (Argon2id) ثم انسخه إلى .env
npm run hash-password -- "YourPassword123!" --env ADMIN1_PASSWORD_HASH

npm start

# 2) افتح الموقع
#    http://localhost:3000
#    http://localhost:3000/admin.html  ← لوحة التحكم
```

الموقع كامل (`index.html`, `login.html`, `admin.html`) يُقدَّم من نفس الخادم.

### بدون خادم (ملفات ثابتة فقط)

```bash
npx serve .
```

> ⚠️ **لن يعمل الدخول للوحة التحكم** — المصادقة تحتاج الخادم.
> هذه الطريقة للعرض فقط (واجهة العميل).

---

## 🔐 كيف يتم الدخول للوحة التحكم؟

```
index.html
   │  ضغط مطوّل (2 ثوانٍ) على الشعار  —  أو  Ctrl+Shift+A
   ▼
admin.html  ──►  بوابة الدخول
                     │
                     │ 1) اسم المستخدم + كلمة المرور
                     ▼
              الخادم (server/)
                     │  • يتحقق من الهاش بـ Argon2id
                     │  • يطبّق حدود المحاولات والحظر
                     │  • لا يكشف إن كان الحساب موجوداً
                     ▼
              الخادم يصدر كوكي HttpOnly موقّع
                     ▼
                 لوحة التحكم ✅
```

### ما الذي تغيّر؟

| قبل ❌ | بعد ✅ |
|---|---|
| توكنات Telegram داخل ملفات HTML | **أُزيلت** — لا حاجة إليها للمصادقة |
| كلمة مرور `Admin123` مكتوبة في الكود | **أُزيلت** — كلمة المرور في `server/.env` كـ hash |
| `adminToken` في `localStorage` (قابل للتزوير) | كوكي `HttpOnly` موقّع بـ HMAC |
| أسماء المسؤولين وChat ID معروضة | لا يُكشف وجود الحسابات مسبقاً |
| Dashboard يُرسم قبل التحقق | الواجهة مخفية حتى نجاح المصادقة |
| OTP يُولَّد ويُتحقق منه في المتصفح | **أُزيل** — التحقق من كلمة المرور على الخادم |
| لا حد لمحاولات | 5 محاولات ثم حظر 15 دقيقة |
| لا سجل تدقيق | `server/data/audit.log` + تنبيهات Telegram اختيارية |

📖 **[التفاصيل الكاملة والدليل والنشر → `server/README.md`](server/README.md)**

---

## 📁 بنية المشروع

```
.
├── index.html          # واجهة الموقع (عام)
├── login.html          # تسجيل دخول العملاء (عبر الخادم)
├── admin.html          # لوحة التحكم (عبر الخادم)
├── server/             # 🆕 خادم المصادقة
│   ├── src/            # Express + signed sessions + Argon2id + audit
│   ├── test/           # 8 اختبارات تلقائية
│   └── README.md       # دليل التشغيل والنشر
└── README.md
```

---

## 🧪 الاختبارات

```bash
cd server && npm test
```

---

## 🖼️ Preview

واجهة احترافية مناسبة لـ:
- شركات العقارات
- مكاتب التسويق العقاري
- مشاريع التطوير العقاري الفاخرة
- شركات الاستثمار العقاري
- Luxury Real Estate Agencies

## 🛠️ التقنيات المستخدمة

### Frontend
- HTML5
- CSS3
- Vanilla JavaScript

### Backend (اختياري لكنه مُوصى به)
- Node.js + Express
- HTTP-only signed session cookies (HMAC-SHA256)
- Argon2id (تشفير كلمات المرور)
- Helmet · express-rate-limit

### UI/UX
- Glassmorphism
- Responsive Layout
- CSS Variables
- Smooth Animations
- Dynamic Theme System

### External Libraries
- Font Awesome
- Google Fonts (Tajawal + Inter)
- Chart.js
