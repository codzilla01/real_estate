#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════
#  فحص أمني شامل — Al Maktab Admin Auth (اسم مستخدم + كلمة مرور)
#
#  الاستخدام:
#    cd server && npm start          # (في نافذة أخرى)
#    bash scripts/security-check.sh
#
#  ⚠️  يتطلب خادماً يعمل على http://localhost:3000
# ════════════════════════════════════════════════════════════════
set -u

BASE="${BASE_URL:-http://localhost:3000}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PASS=0; FAIL=0

ok(){ echo "  ✅ $1"; PASS=$((PASS+1)); }
no(){ echo "  ❌ $1"; FAIL=$((FAIL+1)); }

cd "$ROOT"

echo ""
echo "═══ 1. غياب الأسرار عن ملفات الواجهة ═══"
if grep -qE "AA[A-Za-z0-9_-]{30,}" ../*.html 2>/dev/null; then
  no "يوجد توكن بوت Telegram في ملفات HTML"
else
  ok "لا يوجد توكن بوت Telegram في أي ملف HTML"
fi

if grep -q "Admin123" ../*.html 2>/dev/null; then
  no "توجد كلمة مرور مكتوبة في الكود"
else
  ok "لا توجد كلمة مرور مكتوبة في الكود"
fi

if grep -q "api.telegram.org" ../*.html 2>/dev/null; then
  no "يوجد اتصال مباشر بـ Telegram من المتصفح"
else
  ok "لا يوجد اتصال مباشر بـ Telegram من المتصفح"
fi

if grep -qE "setItem\(['\"]adminToken" ../*.html 2>/dev/null; then
  no "adminToken يُكتب في localStorage"
else
  ok "adminToken لا يُكتب في localStorage (المتصفح لا يستطيع تزوير الجلسة)"
fi

if grep -qE "setItem\(['\"]admin_verified" ../*.html 2>/dev/null; then
  no "admin_verified يُكتب في sessionStorage"
else
  ok "admin_verified لا يُكتب في sessionStorage"
fi

# No credential may be compared in the browser.
if grep -qiE "password\s*===|password\s*==\s*['\"]" ../*.html 2>/dev/null; then
  no "يوجد مقارنة كلمة مرور داخل المتصفح"
else
  ok "لا توجد مقارنة كلمة مرور داخل المتصفح (التحقق في الخادم فقط)"
fi

echo ""
echo "═══ 2. الأسرار على الخادم فقط ═══"
if git check-ignore -q .env 2>/dev/null || git check-ignore -q server/.env 2>/dev/null; then
  ok ".env ضمن .gitignore"
else
  no ".env غير مُتجاهَل"
fi
if git ls-files --error-unmatch .env >/dev/null 2>&1 || git ls-files --error-unmatch server/.env >/dev/null 2>&1; then
  no ".env متتبَّع في git"
else
  ok ".env غير متتبَّع في git"
fi
if grep -q "SESSION_SECRET" .env.example 2>/dev/null; then ok ".env.example يوثّق SESSION_SECRET"; else no ".env.example ينقصه SESSION_SECRET"; fi
if grep -q "PASSWORD_HASH" .env.example 2>/dev/null; then ok ".env.example يوثّق *_PASSWORD_HASH"; else no ".env.example ينقصه *_PASSWORD_HASH"; fi

echo ""
echo "═══ 3. منع كشف الحسابات (Account Enumeration) ═══"
UNKNOWN="nosuchuser$(date +%s | tail -c 8)"
WRONG=$(curl -s -X POST "$BASE/api/admin/login" -H 'Content-Type: application/json' \
        -d "{\"username\":\"$UNKNOWN\",\"password\":\"definitely-wrong\"}" 2>/dev/null)
REAL_USER=$(curl -s -X POST "$BASE/api/admin/login" -H 'Content-Type: application/json' \
        -d '{"username":"admin","password":"definitely-wrong"}' 2>/dev/null)
if [ -n "$WRONG" ] && [ "$WRONG" = "$REAL_USER" ]; then
  ok "اسم مستخدم غير موجود وكلمة مرور خاطئة يعطيان رداً متطابقاً"
else
  no "الردود مختلفة وتسمح بكشف الحسابات: '$WRONG' vs '$REAL_USER'"
fi

echo ""
echo "═══ 4. مقاومة تزوير الجلسة ═══"
FORGED='eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOjF9.forged'
CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/admin/session" -H "Cookie: almaktab_admin_session=$FORGED")
[ "$CODE" = "401" ] && ok "كوكي مزوّر مرفوض على /api/admin/session (401)" || no "كوكي مزوّر أعاد $CODE"

CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/client/session" -H "Cookie: almaktab_admin_session=$FORGED")
[ "$CODE" = "401" ] && ok "كوكي مزوّر مرفوض على /api/client/session (401)" || no "كوكي مزوّر أعاد $CODE"

echo ""
echo "═══ 5. ترويسات الأمان ═══"
HEAD=$(curl -sI "$BASE/admin.html")
echo "$HEAD" | grep -qi "cache-control: no-cache" && ok "admin.html بدون تخزين مؤقت" || no "admin.html ينقصه no-cache"
echo "$HEAD" | grep -qi "x-frame-options" && ok "X-Frame-Options موجود" || no "X-Frame-Options مفقود"
echo "$HEAD" | grep -qi "content-security-policy" && ok "Content-Security-Policy موجود" || no "CSP مفقود"

echo ""
echo "═══ 6. سجل التدقيق ═══"
if [ -f data/audit.log ]; then
  ok "audit.log موجود ($(wc -l < data/audit.log) قيد)"
  grep -q "login.success" data/audit.log 2>/dev/null && ok "الدخول الناجح مسجّل" || no "لا يوجد login.success"
  grep -q "login.failed"  data/audit.log 2>/dev/null && ok "الدخول الفاشل مسجّل" || no "لا يوجد login.failed"
else
  no "audit.log غير موجود"
fi

echo ""
echo "═══ 7. قائمة المسؤولين لا تحوي أسراراً ═══"
ROSTER=$(curl -s "$BASE/api/admin/admins")
if echo "$ROSTER" | grep -qE "credential|password|botToken|chatId|AA[A-Za-z0-9_-]{30,}"; then
  no "قائمة المسؤولين تسرّب أسراراً"
else
  ok "قائمة المسؤولين تعرض الحقول العامة فقط"
fi

echo ""
echo "═══ 8. حالة الخادم ═══"
H=$(curl -s "$BASE/api/health")
echo "     $H"
echo "$H" | grep -q '"ok":true' && ok "الخادم يعمل" || no "الخادم لا يعمل على $BASE"

echo ""
echo "═══════════════════════════════════════════"
echo "  النتيجة: $PASS نجح، $FAIL فشل"
echo "═══════════════════════════════════════════"
exit $FAIL
