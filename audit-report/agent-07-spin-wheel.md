# تقرير Agent #7 — فحص توافق عجلة الحظ (Spin Wheel)

**المشروع:** NAWA — متجر (React + TypeScript + Supabase)
**التاريخ:** 2026-08-02
**النطاق:** جداول `spin_prizes` و`spin_history` في السكيما، صفحة `AdminSpinPrizesPage`، طبقة `adminService`، سياق المتجر `SpinContext` ومكوّنات العجلة.
**الوضع:** فحص فقط — لم يتم تعديل أي كود.

---

## 1. النطاق

الملفات المفحوصة:

| الملف | الدور |
|---|---|
| `back-end schema/10_spin_wheel.sql` | سكيما الجوائز والتاريخ (كاملًا) |
| `back-end schema/15_rls_policies.sql` (سطر 255–284) | سياسات RLS للجداول |
| `back-end schema/08_coupons.sql` | جدول الكوبونات (لأن استلام الجائزة يعتمد عليه) |
| `back-end schema/fix_schema.sql` (سطر 50–57) | تعديلات بديلة لسكيما العجلة |
| `src/pages/admin/AdminSpinPrizesPage.tsx` | صفحة إدارة الجوائز (كاملًا) |
| `src/services/adminService.ts` | `SPIN_TYPE_MAP`/`SPIN_TYPE_REVERSE` ودوال العجلة |
| `src/types/index.ts` (سطر 191–214) | `SpinPrize`, `SpinPrizeType`, `SpinHistoryEntry` |
| `src/contexts/SpinContext.tsx` | منطق السحب والاحتمالات والحد اليومي |
| `src/components/features/SpinWheel.tsx`, `SpinEntryButton.tsx`, `SpinResultModal.tsx` | واجهة المتجر |

---

## 2. خريطة التوافق

| عنصر الواجهة | الجدول.العمود في السكيما | النوع (واجهة/سكيما) | الحالة |
|---|---|---|---|
| `adminService.getSpinPrizes()` → `from('spin_prizes')` | `spin_prizes` | — | ✅ مطابق (الاسم صحيح، لا يوجد `spin_wheel_prizes` ولا `prizes`) |
| `SpinPrize.label` | `spin_prizes.label` | TEXT / TEXT NOT NULL | ✅ مطابق |
| `SpinPrize.type` (camelCase) | `spin_prizes.type` (enum snake_case) | `SpinPrizeType` / `spin_prize_type` | ✅ مطابق **بشرط** المرور عبر `SPIN_TYPE_MAP`/`SPIN_TYPE_REVERSE` |
| `SpinPrize.value` (number?) | `spin_prizes.value` | number / INTEGER NULL | ✅ مطابق |
| `SpinPrize.color` | `spin_prizes.color` | string / TEXT | ✅ مطابق |
| `SpinPrize.weight` | `spin_prizes.weight` | number / INTEGER | ✅ مطابق |
| `SpinPrize.isActive` | `spin_prizes.is_active` | boolean / BOOLEAN | ✅ مطابق (تعيين `is_active` في insert/update) |
| `SpinPrize.couponCode` | `spin_prizes.coupon_code` | string? / TEXT | ⚠️ مختلف: العمود **غير موجود** في `10_spin_wheel.sql` نفسه؛ يُضاف فقط في `fix_schema.sql:51` و`_run_all_combined.sql:1776` |
| `SpinPrize.id` (من `genId('spin')`) | `spin_prizes.id` | `spin-xxxxxxxx` / UUID PK | ❌ **مختلف جذريًا** — id غير صالح لعمود UUID |
| — (لا يوجد `name`) | `spin_prizes.label` | — | ✅ مطابق (الواجهة تستخدم `label`) |
| — (لا يوجد icon/stock) | — | — | ✅ غير موجود في الطرفين (لا مشكلة) |
| `created_at` | `spin_prizes.created_at` | غير معرّف في TS | ⚠️ اختلاف طفيف (غير مستخدم في الواجهة) |
| `SpinHistoryEntry` (TS) | `spin_history` | — | ❌ **جدول كامل غير مستخدم** — لا أي `from('spin_history')` في كل `src` |
| سجل الدورات (التاريخ) | `spin_history` | localStorage فقط | ❌ مختلف — التخزين في `localStorage('spinState')` وليس في السكيما |
| `coupon.type='freeShipping'` (عند الاستلام) | `coupons.type` (enum: `'free_shipping'`) | — | ❌ مختلف — إرسال camelCase على enum snake_case |
| `coupon.id` من `genId('coupon')` | `coupons.id` | UUID PK | ❌ مختلف — نفس مشكلة الـ UUID |

### فحص قيم `type` حرفًا بحرف

قيم enum السكيما (`10_spin_wheel.sql:8-10`): `'percentage'`, `'fixed'`, `'free_shipping'`, `'try_again'`

قيم `SPIN_TYPE_MAP` (`adminService.ts:17-22`) و`SPIN_TYPE_REVERSE` (`23-28`):

| واجهة (camelCase) | → السكيما (map) | عكس (reverse) | التطابق |
|---|---|---|---|
| `percentage` | `percentage` | ✅ | ✅ |
| `fixed` | `fixed` | ✅ | ✅ |
| `freeShipping` | `free_shipping` | ✅ | ✅ |
| `tryAgain` | `try_again` | ✅ | ✅ |

**الخلاصة:** الخرائط سليمة وتطابق enum السكيما حرفًا بحرف عند التطبيق الصحيح. المخاطرة الوحيدة أن السكيما «الفعّالة» غير موحّدة: `fix_schema.sql:55` يحوّل عمود `type` إلى `TEXT` (إسقاط قيد enum)، بينما `10_spin_wheel.sql` يعرّفه كـ enum — النتيجة تعتمد على أي سكربت شُغّل في قاعدة البيانات الفعلية.

---

## 3. جدول المشاكل

| # | ما تستخدمه الواجهة (ملف:سطر) | الموجود في السكيما | نوع المشكلة | الأثر | الخطورة |
|---|---|---|---|---|---|
| 1 | `createSpinPrize` يولّد `id: genId('spin')` (`adminService.ts:534`) ويدرج `id` صراحة (`538-542`) | `spin_prizes.id UUID PRIMARY KEY` (`10_spin_wheel.sql:19`) | عدم تطابق نوع معرف — `"spin-xxxx"` ليس UUID | أي إضافة جائزة جديدة تفشل في قاعدة البيانات (خطأ `invalid input syntax for type uuid`)، والخطأ **مُبتلع** (لا يوجد فحص `error`) ثم تُحدَّث القائمة في الذاكرة فقط → الجائزة تختفي عند إعادة التحميل | 🔴 حرجة |
| 2 | `SpinContext.claimPrize` (سطر 190–203) → `adminService.createCoupon` (`262-277`) يرسل `type: 'freeShipping'` (سطر 194) و`discount: value || 0` (سطر 193) و`id: genId('coupon')` (سطر 264) | `coupons.type coupon_type ENUM ('percentage','fixed','free_shipping')` (`08_coupons.sql:8,18`) + `id UUID` + `CHECK (discount > 0)` | ثلاث مخالفات معًا: enum camelCase على snake_case، id غير UUID، `discount=0` لجوائز الشحن المجاني | كل كوبونات العجلة تفشل في الإدراج بالكامل؛ وبخاصة جوائز `freeShipping` (قيمة فارغة → discount=0 → مخالفة CHECK). لا أثر للفشل على الواجهة: تظهر رسالة «تم الاستلام» وكأنها نجحت | 🔴 حرجة |
| 3 | `spin_history` غير مستخدم إطلاقًا: لا `from('spin_history')` في أي ملف بـ `src`؛ السجل كله في `localStorage('spinState')` (`SpinContext.tsx:89-117`) | جدول `spin_history` كامل في السكيما (`10_spin_wheel.sql:38-53`) مع فهارس (`16_indexes.sql:55-56`) | جدول ميت / انقطاع كامل | لا تسجيل فعلي للدورات، لا تدقيق، لا إحصائيات فائزين، والبيانات تختفي مع حذف localStorage | 🟠 عالية |
| 4 | تبويب «الإحصائيات» في `AdminSpinPrizesPage.tsx:249-292` يحسب من `prizes` فقط (عدد الجوائز، الأوزان، المفعّلة) | `spin_history` (مع `claimed`, `prize_id`, `spun_at`) | غياب ميزة | لا تعرض اللوحة عدد الدورات/الفائزين/نسبة الاستلام رغم وجود الجدول والمؤشرات — الفائزون غير قابلين للتتبع أو المحاسبة | 🟠 عالية |
| 5 | الحد اليومي وعدد الدورات مخزّنان في `localStorage` (`SpinContext.tsx:91-117, 145-166`) | `spin_history` (مصمّم للفحص/المنع) | تحقق أمني كامل في الواجهة | مسح `localStorage` أو تغيير `spinState` يعيد الدورات بلا نهاية؛ لا قيد سيرفر للحد اليومي رغم وجود الجدول | 🟠 عالية |
| 6 | اختيار الجائزة بالكامل في الواجهة: `pickPrize` بوزن عشوائي `Math.random()` (`SpinContext.tsx:13-22`)؛ دوران العجلة تجميلي لا يرتبط بالنتيجة (`SpinWheel.tsx:66-77`) | لا دالة `spin_wheel` ولا RPC في `17_functions_triggers.sql` | منطق سحب في العميل فقط | لا تحقق سيرفر من النتيجة: يمكن للمستخدم قراءة الأوزان والتنبؤ/التلاعب، وأي إدراج مستقبلي في `spin_history` سيحمل أي `prize_id` دون مصادقة من الخادم | 🟠 عالية |
| 7 | إدراج ضيف (زائر): `SpinEntryButton.tsx:80-89` يخزّن الرقم في `localStorage('spin_guest_phone')` فقط | `spin_history.guest_phone TEXT` + `at_least_one_identifier` (`10_spin_wheel.sql:41,50-52`) | انقطاع | عمود `guest_phone` مصمم للزوار لكن سياسة RLS للإدراج (`user_id = auth.uid() OR is_admin()`) ترفض إدراج الزوار (`auth.uid()` = NULL) — أي محاولة لتفعيل المسار مستقبلًا ستفشل | 🟠 عالية |
| 8 | `createSpinPrize`/`updateSpinPrize` يرسلان `coupon_code` دائمًا (`adminService.ts:541,555`) | `coupon_code` غير موجود في `10_spin_wheel.sql`؛ يُضاف فقط في `fix_schema.sql:51`/`_run_all_combined.sql:1776` | انحراف نسختين من السكيما | إذا شُغّل `_run_all.sql` (بدون ALTER) فكل إدراج/تحديث للجوائز يفشل بعمود غير موجود — سلوك يعتمد على سكربت التنصيب | 🟡 متوسطة |
| 9 | `spin_prizes_select ... USING (true)` (`15_rls_policies.sql:255-257`) — قراءة عامة للجميع | التصفية حسب `is_active` تتم في الواجهة (`SpinContext.tsx:14`) وليس السيرفر | سياسة فضفاضة | يكشف أي زائر الجوائز المعطّلة و`coupon_code` (إن وُجدت) وعوامل الترجيح — معلومات حساسة للتسويق والحماية من التلاعب | 🟡 متوسطة |
| 10 | `getSpinPrizes` عند فشل الشبكة يرجع بيانات تجريبية بمعرّفات `"spin-1"` (`spin-prizes.json`) | `id UUID` | خلط معرّفات | التعديل/الحذف على معرّفات تجريبية «ينجح» بصمت في الذاكرة ثم تظهر الجوائز الحقيقية بعد التحديث — تحقق وهمي | 🟡 متوسطة |
| 11 | `mapSpinPrize` لا يصفّي `is_active` (`adminService.ts:727-735`) | `is_active` موجودة | اختلاف سلوك | صفحة المتجر تُظهر الكل ثم تفلتر محليًا — مكرر وغير محمي (نفس مشكلة #9) | 🟢 منخفضة |
| 12 | `created_at` غير معرّف في `SpinPrize` | `spin_prizes.created_at TIMESTAMPTZ` | اختلاف طفيف | غير مستخدم — لا أثر عملي | 🟢 منخفضة |

---

## 4. فحص RLS (`15_rls_policies.sql:252-284`)

### `spin_prizes`
| عملية | السياسة | التقييم |
|---|---|---|
| SELECT | `USING (true)` | ⚠️ عام للجميع — يفضح الجوائز المعطّلة والـ `coupon_code` والوزن (مشكلة #9) |
| INSERT | `WITH CHECK (is_admin())` | ✅ صحيحة للوحة التحكم |
| UPDATE | `USING (is_admin())` | ✅ صحيحة |
| DELETE | `USING (is_admin())` | ✅ صحيحة |

### `spin_history`
| عملية | السياسة | التقييم |
|---|---|---|
| SELECT | `user_id = auth.uid() OR is_admin()` | ✅ صحيحة (المشرف يرى الكل — لكن لا يوجد أي كود يستفيد منها) |
| INSERT | `user_id = auth.uid() OR is_admin()` | ⚠️ تمنع إدراج الزوار (NULL uid) رغم أن السكيما تسمح بـ `guest_phone` — لا يمكن تفعيل مسار الضيوف دون تعديل السياسة |
| UPDATE | `user_id = auth.uid() OR is_admin()` | ⚠️ يسمح لأي مستخدم بتحرير سجله الحر (تمييز `claimed=true` مثلاً) دون تحقق سيرفر من الكوبون |
| DELETE | **غير موجودة** | ✅ مقبولة (لا حذف للزبناء) |

ملاحظة: كل السياسات على `spin_history` معلّقة عمليًا لأن الواجهة لا تكتب/تقرأ الجدول إطلاقًا (مشكلة #3).

---

## 5. ملاحظات إضافية

1. **لا توجد دالة `spin_wheel`** في `17_functions_triggers.sql` ولا أي RPC — كل منطق السحب في `SpinContext.pickPrize` (وزن ترجيحي بمؤشر تراكمي، `SpinContext.tsx:13-22`).
2. **تضارب نسختي السكيما:** `10_spin_wheel.sql` (enum + بدون `coupon_code`) مقابل `fix_schema.sql:55` (`type` → TEXT) و`_run_all_combined.sql:1776` (إضافة `coupon_code`). أي إصلاح مستقبلي يجب أن يوحّد النسختين.
3. **الخطأ مُبتلع في كل مكان:** `createSpinPrize` و`createCoupon` لا يفحصان `error` من Supabase، فيعرض الـ UI نجاحًا (toast «تمت الإضافة»/«تم الاستلام») بينما لا يُكتب شيء في القاعدة — أبرز سبب لـ«يبدو يعمل لكن لا يعمل».
4. **رسم جائزة `freeShipping`:** القالب في `AdminSpinPrizesPage.tsx:194` يعرض «—» و`value` فارغ، و`value` العمود INTEGER لا يسمح بالكسور — لا مشكلة في التعريف، لكن سلسلة إنشاء الكوبون تتعطل عندها (مشكلة #2).
5. `mapSpinPrize` يمرر `data.type` كما هو عند غياب التطابق في `SPIN_TYPE_REVERSE` — أي قيمة snake_case غير متوقعة ستسرب للواجهة وتفسد المقارنات في الصفحة (`AdminSpinPrizesPage.tsx:184-187`).

---

## 6. توصيات

1. **فوري:** إيقاف توليد المعرفات اليدوية لجداول UUID — حذف `id` من insert والاعتماد على `DEFAULT gen_random_uuid()`، أو توليد UUID حقيقي؛ وإظهار `error` من Supabase للواجهة بدل بلعه.
2. **فوري:** إصلاح سلسلة الكوبون في `claimPrize`/`createCoupon` — إرسال `type` عبر خريطة (freeShipping → `free_shipping`) و`discount` إجباري > 0 (قيمة افتراضية ثابتة للشحن المجاني أو تعيين حد أقصى للخصم)، ورفض الإنشاء عند خطأ.
3. **عالية:** كتابة/قراءة `spin_history` فعليًا: إدراج سجل عند `completeSpin` (بـ `user_id` أو `guest_phone`)، وقراءته للحد اليومي بدل `localStorage`، وإضافة سياسة إدراج للزوار باسم `guest_phone`.
4. **عالية:** نقل السحب إلى سيرفر: دالة `spin_wheel()`/RPC في `17_functions_triggers.sql` تُدخل في `spin_history` وتُعيد الجائزة — حتى لو كانت العجلة تجميلية في الواجهة.
5. **متوسطة:** تقييد `spin_prizes_select` (إخفاء `is_active=false` و`coupon_code` عن غير المشرفين) أو إرجاع عمود `is_active` فقط للمخزن.
6. **متوسطة:** توحيد سكربت السكيما: تحديد ملف واحد مرجعي يشمل `coupon_code` ونوع عمود `type` (enum محدد أو TEXT) ليستقر سلوك الإدراج.
7. **منخفضة:** إضافة تبويب تاريخ/فائزين في `AdminSpinPrizesPage` يقرأ `spin_history` (الجدول والفهارس جاهزة) لحساب عدد الدورات والاستلامات.

---

*انتهى التقرير — Agent #7 (فحص توافق عجلة الحظ).*
