# تقرير Agent #4 — فحص توافق الكوبونات (coupons)

**المشروع:** متجر ZAHIEG (React + TypeScript + Supabase)
**التاريخ:** 2026-08-02
**النطاق:** جدول `coupons`، دالتا `validate_coupon` / `increment_coupon_usage`، سياسات RLS، واجهة `AdminCouponsPage`، طبقة `adminService`، استخدام الكوبون في السلة/الدفع.
**الملفات المرجعية:**
- `back-end schema/08_coupons.sql`
- `back-end schema/15_rls_policies.sql` (سطور 214-231)
- `back-end schema/17_functions_triggers.sql` (سطور 18-31)
- `back-end schema/16_indexes.sql` (سطر 77)
- `back-end schema/fix_schema.sql` (سطور 69-71)
- `src/pages/admin/AdminCouponsPage.tsx`
- `src/services/adminService.ts` (سطور 249-306)
- `src/pages/CartPage.tsx` (سطور 33-50)
- `src/contexts/SpinContext.tsx` (سطور 182-206)
- `src/types/index.ts` (سطر 144-154)
- `src/services/orderService.ts`

---

## 1. النطاق

- **السكيما (DB):** جدول `coupons` يحتوي على: `id (UUID PK)`, `code (TEXT NOT NULL UNIQUE)`, `type (ENUM coupon_type)`, `discount NUMERIC(10,2)`, `min_order NUMERIC(10,2)`, `max_discount NUMERIC(10,2) NULL`, `expires_at TIMESTAMPTZ NOT NULL`, `usage_limit INTEGER`, `used_count INTEGER`, `is_active BOOLEAN`, `created_at TIMESTAMPTZ`. + قيدان CHECK (`valid_usage`, `valid_discount_type`).
- **ملاحظة مهمة:** الأعمدة المذكورة في طلب الفحص (`description`, `discount_type`, `discount_value`, `min_order_amount`, `per_user_limit`, `valid_from`, `valid_to`) **لا وجود لها في السكيما الفعلية** — الأسماء الفعلية هي `type/discount/min_order/expires_at`. تم الفحص بناءً على السكيما الفعلية.
- **الواجهة:** لا توجد صفحة toggle للتفعيل/التعطيل؛ العملية الوحيدة للحالة هي `is_active: true` الثابتة عند الإنشاء، وعرض "الحالة" مشتق فقط من انتهاء الصلاحية.
- **التحقق في السلة:** لا يُستخدم `validate_coupon` إطلاقًا في الكود الأمامي — التحقق يتم Client-side عبر `adminService.getCoupons()`.

---

## 2. خريطة التوافق

| عنصر الواجهة (camelCase) | الجدول.العمود | النوع في السكيما | مطابق/مختلف |
|---|---|---|---|
| `Coupon.id` (يُرسل عند insert) | `coupons.id` | `UUID PRIMARY KEY` | **مختلف** — الواجهة تولّد `coupon-xxxxxxxx` (ليس UUID صالحًا) |
| `Coupon.code` | `coupons.code` | `TEXT NOT NULL UNIQUE` + فهرس UNIQUE على `UPPER(code)` | مختلف جزئيًا — لا يتم UPPER-case قبل الإدراج |
| `Coupon.type` ('percentage'/'fixed') | `coupons.type` | `ENUM ('percentage','fixed','free_shipping')` | مطابق في صفحة الأدمن؛ **مختلف** في SpinContext (`freeShipping`) |
| `Coupon.discount` | `coupons.discount` | `NUMERIC(10,2) CHECK (discount > 0)` | مطابق (مع قيد ناقص للـ percentage > 100) |
| `Coupon.minOrder` | `coupons.min_order` | `NUMERIC(10,2) NOT NULL DEFAULT 0` | مطابق في الكتابة؛ **مختلف في القراءة** (لا map للصفوف) |
| `Coupon.maxDiscount` | `coupons.max_discount` | `NUMERIC(10,2) CHECK (NULL أو > 0)` | **مختلف** — الافتراضي 0 يخالف CHECK |
| `Coupon.expiresAt` | `coupons.expires_at` | `TIMESTAMPTZ NOT NULL` | مطابق في الكتابة؛ مختلف في القراءة (unmapped) |
| `Coupon.usageLimit` | `coupons.usage_limit` | `INTEGER NOT NULL DEFAULT 0` | **مختلف** — `data.usageLimit \|\| 100` يحوّل 0 إلى 100 (يستحيل عمل unlimited) |
| `Coupon.usedCount` | `coupons.used_count` | `INTEGER NOT NULL DEFAULT 0 CHECK (>=0)` | مطابق في الكتابة؛ **مختلف في القراءة**؛ ولا يُحدَّث أبدًا بعد الطلبات |
| (لا يوجد في الواجهة) | `coupons.is_active` | `BOOLEAN NOT NULL DEFAULT true` | **مختلف** — لا يوجد toggle في الواجهة/الخدمة |
| (لا يوجد في الواجهة) | `coupons.created_at` | `TIMESTAMPTZ NOT NULL DEFAULT now()` | متوافق (تلقائي) |
| (لا يوجد في الواجهة) | `description / per_user_limit / valid_from / valid_to` | غير موجودة في السكيما | — (غير موجودة أصلًا) |
| `validate_coupon(p_code, p_order_total)` | دالة DB: `validate_coupon(p_code TEXT, p_order_total NUMERIC)` | موجودة | **مطابقة الاسم والوسيطات** لكنها **غير مستدعاة نهائيًا** من src |
| `increment_coupon_usage(p_code)` | دالة DB | موجودة | **غير مستدعاة** من src |
| `getCouponByCode(code)` | — | — | دالة محلية على `src/data` (مصفوفة فارغة غالبًا) وغير مستخدمة في السلة |

---

## 3. جدول المشاكل

| # | ما تستخدمه الواجهة (ملف:سطر) | الموجود في السكيما | نوع المشكلة | الأثر | الخطورة |
|---|---|---|---|---|---|
| 1 | `createCoupon` يرسل `id: genId('coupon')` = نص غير UUID (`adminService.ts:263-264,269`) | `id UUID PRIMARY KEY` | **عدم تطابق نوع** — إدراج نص غير صالح في عمود UUID | فشل INSERT كليًا؛ والخطأ غير معالج (`adminService.ts:269-274` بلا فحص `error`) → يظهر النجاح وهميًا في الواجهة والكوبون لا يُحفظ إطلاقًا | **حرجة** |
| 2 | `maxDiscount: 0` افتراضيًا في النموذج والخدمة (`AdminCouponsPage.tsx:15,207`, `adminService.ts:265,285`) | `CHECK (max_discount IS NULL OR max_discount > 0)` | انتهاك CHECK — 0 غير مقبول | كل إنشاء/تعديل بـ maxDiscount=0 يُرفض من DB بصمت → الكوبون لا يُنشأ ولا يُحدَّث (نفس فشل #1 في الإنشاء، وأيضًا في التعديل) | **حرجة** |
| 3 | قراءة بدون تعيين: `select('*')` ثم `as unknown as Coupon[]` (`adminService.ts:251-252,257,288-291`) | أعمدة snake_case (`min_order, max_discount, expires_at, usage_limit, used_count`) | غياب mapping snake_case→camelCase | صفحة الأدمن تعرض `undefined` لكل الحقول غير `code/discount/type` (الاستخدام، الانتهاء، الحد الأدنى) — و`isExpired(NaN)` دائمًا false، وعند التعديل `coupon.expiresAt.slice` يرمي خطأ على قيمة undefined | **عالية** |
| 4 | `CartPage.tsx:36` أي زائر يستدعي `adminService.getCoupons()` | RLS: `coupons_select ... USING (is_admin())` (`15_rls_policies.sql:218-219`) | تعارض RLS مع الاستخدام العام | الزبائن العاديون لا يرون أي كوبون → الكوبونات لا تُطبق أبدًا عند الدفع؛ وفي حال الخطأ يسقط الكود للمصفوفة المحلية الفارغة → دائمًا "couponInvalid". (ملاحظة: `fix_schema.sql:70-71` يصلح ذلك بـ `USING (true)` لكنه يتعارض مع الملف الأساسي حسب ترتيب التنفيذ) | **عالية** |
| 5 | `SpinContext.tsx:190-202` `type: 'freeShipping'` + `id: genId()` (spin-…) | `type ENUM` لا يقبل `freeShipping`، و`id UUID` | عدم تطابق ENUM + UUID | كوبونات العجلة الدوّارة لا تُحفظ في DB أبدًا (فشل INSERT)، وبدون `.catch` ينتج Promise مرفوض غير معالج؛ المستخدم "يكسب" كوبونًا غير موجود | **عالية** |
| 6 | `updateCoupon` (`adminService.ts:279-297`) يرسل كل الحقول بما فيها maxDiscount=0 | CHECK أعلاه | انتهاك CHECK عند التعديل | أي تعديل لكوبون كانت فيه `max_discount` غير معبأة يفشل بصمت ويقع الكود في الـ fallback المحلي | **عالية** |
| 7 | `used_count` لا يُحدَّث: `orderService.create` يخزن `coupon_code` فقط (`orderService.ts:42,50`) ولا يستدعي `increment_coupon_usage` | دالة `increment_coupon_usage` موجودة (`17:19`) | وظيفة مهجورة | حدود الاستخدام `usage_limit` لا تُفرض أبدًا؛ قيد DB `valid_usage` لن يُفعَّل؛ العداد يبقى صفرًا في لوحة الأدمن | **متوسطة** |
| 8 | التحقق في السلة لا يفحص `is_active` ولا `usage_limit/used_count` ولا `min_order` (`CartPage.tsx:37-43`) | `validate_coupon` تفحصها كلها (`08:62-88`) | تحقق Client-side ناقص + الدالة الرسمية غير مستخدمة | تطبيق كوبونات معطّلة/منتهية الاستخدام أو دون حد أدنى، وحساب خصم `maxDiscount=undefined` في `Math.min` يعطي NaN محتمل | **متوسطة** |
| 9 | لا يوجد `toggleCoupon` / `is_active` في الواجهة والخدمة؛ شارة الحالة تعتمد الانتهاء فقط (`AdminCouponsPage.tsx:171-173`) | `is_active BOOLEAN` | غياب ميزة + عرض مضلل | لا يمكن تفعيل/تعطيل كوبون من الأدمن؛ كوبون `is_active=false` يظهر كـ "نشط" في الجدول | **متوسطة** |
| 10 | إدراج `code` بدون تطبيع UPPER (`adminService.ts:270`)، والمطابقة `c.code === input.toUpperCase()` (`CartPage.tsx:38`) | فهرس `UNIQUE (UPPER(code))` (`16_indexes.sql:77`) | حساسية حالة أحرف | إنشاء `summer20` ثم `SUMMER20` يفشل (تصادم فهرس)، وكوبون مُنشأ بحروف صغيرة لا يُطابَق عند التطبيق → كوبون صالح يُرفض | **متوسطة** |
| 11 | `usageLimit: data.usageLimit \|\| 100` (`adminService.ts:267`) مع افتراض النموذج 100 | DB default 0 = غير محدود | دلالات متضاربة | المستخدم لا يستطيع إدخال 0 للحد غير المحدود (يتحول إلى 100) | **منخفضة** |
| 12 | `handleSave` يتحقق `discount > 0` فقط (`AdminCouponsPage.tsx:68`) | `CHECK: type='percentage' → discount <= 100` (`08:30-31`) | نقص تحقق Client-side | نسبة خصم > 100 تُرفض من DB بصمت دون رسالة للمستخدم | **منخفضة** |
| 13 | نوع `Coupon` لا يشمل `is_active/created_at` (`types/index.ts:144-154`) | أعمدة إضافية في الصف المسترجع | توثيق ناقص | فقدان بيانات الحالة عند المعالجة بالـ fallback المحلي | **منخفضة** |
| 14 | `getCouponByCode` (`data/index.ts:129-132`) يقرأ `c.expiresAt` من مصفوفة تمتلئ بصفوف DB غير المعيّنة | — | وهمية/غير مستخدمة (ACTIONS_MAP.md:68 يدّعي استخدامها في Cart/Checkout) | إن اُستخدمت، ستفشل دائمًا لأن `expiresAt` غير موجودة في الصفوف القادمة من DB | **منخفضة** |

---

## 4. فحص RLS (`15_rls_policies.sql:214-231`)

- الجدول: `ALTER TABLE coupons ENABLE ROW LEVEL SECURITY` (سطر 17).
- السياسات الأربع كلها مشروطة بـ `is_admin()` (دالة `SECURITY DEFINER` تتحقق من `profiles.role` — `03_profiles.sql:58-67`):
  - `coupons_select` → `USING (is_admin())`
  - `coupons_insert` → `WITH CHECK (is_admin())`
  - `coupons_update` → `USING (is_admin())`
  - `coupons_delete` → `USING (is_admin())`
- **نعم:** عمليات CRUD للمشرف مدعومة (بشرط أن يكون المشرف Authenticated ومسجّلًا بدور admin).
- **مشكلة معمارية:** كل مسارات القراءة في الواجهة (لوحة الأدمن والسلة) تستخدم نفس `supabase.from('coupons').select('*')`. بما أن السلة يستدعيها مستخدم عادي → الـ SELECT محجوب → الكوبون لا يُطبَّق. التعارض مع `fix_schema.sql:70-71` (يجعل select عامًا بـ `USING (true)`) يعني أن السلوك النهائي يعتمد على ترتيب تنفيذ ملفات السكيما — خلل في التوثيق/الترتيب.
- **دوال غير قابلة للاستخدام العام:** `validate_coupon` و `increment_coupon_usage` تُنفَّذان بصلاحيات المستدعي (وليست SECURITY DEFINER) → أي استدعاء من زبون عادي سيخضع لـ RLS ويُحجب.
- **أمان:** إدراج غير مرشّح لحقول غير المتوقعة ممنوع بسبب CHECKs؛ لا توجد مشكلة أمان حرجة في سياسات الكوبونات ذاتها.

---

## 5. ملاحظات إضافية

- كل استدعاءات Supabase في خدمات الكوبونات **لا تفحص `error`** (إلا `getCoupons`): `createCoupon` (269)، `updateCoupon` (288)، `deleteCoupon` (300) — الفشل يصمت وتظهر رسائل النجاح للمستخدم.
- `deleteCoupon` لا يملك قيد FK خارجي (`orders.coupon_code` TEXT بدون مرجع) → الحذف المادي آمن DB-wise لكنه يقطع أرشيف الطلبات التي استخدمت الكوبون (لا يحدث أثر جانبي مرئي، لكن لا يوجد Soft delete).
- تعديل كوبون عن طريق العجلة الدوّارة (`SpinContext`) لن يعمل حتى بعد إصلاح الـ UUID لأن ENUM `freeShipping` غير موجود.
- الأعمدة المذكورة في طلب الفحص (`discount_type`, `discount_value`, `min_order_amount`, `per_user_limit`, `valid_from`, `valid_to`) غير موجودة في السكيما — لا توجد خريطة لها، ويُفضَّل توحيد الأسماء في السكيما أو طلب الفحص.

---

## 6. توصيات

1. **حرجة:** إيقاف توليد id في الواجهة والاعتماد على `gen_random_uuid()` في DB (حذف `id` من insert) أو توليد UUID صالح (`crypto.randomUUID()`).
2. **حرجة:** معالجة `max_discount=0`: إما إرسال `null` عندما يكون 0، أو تعديل CHECK ليقبل 0 كمعنى "بدون حد"، مع تطبيع القيم قبل الإرسال.
3. **عالية:** إضافة map للصفوف: `min_order→minOrder`, `max_discount→maxDiscount`, `expires_at→expiresAt`, `usage_limit→usageLimit`, `used_count→usedCount`, `is_active→isActive`, `created_at→createdAt` في `getCoupons/getCoupon/updateCoupon`.
4. **عالية:** حل تعارض RLS — إما سياسة عامة للقراءة (`USING (true)` كالمتوافق مع `fix_schema.sql`) مع تحقق الخادم عبر `validate_coupon` (مستدعىً عبر RPC)، أو إعادة هيكلة السلة لاستدعاء `validate_coupon` بدلًا من قراءة الجدول كاملًا.
5. **عالية:** تصحيح `SpinContext`: خريطة `freeShipping→free_shipping` (بنفس نمط `SPIN_TYPE_MAP` في `adminService.ts:17-20`) و`crypto.randomUUID()` للـ id، وإضافة معالجة أخطاء.
6. **متوسطة:** ربط `increment_coupon_usage` بعد إنشاء الطلب في `orderService.create`.
7. **متوسطة:** إضافة ميزة toggle لـ `is_active` (زر في `AdminCouponsPage` + `toggleCoupon` في الخدمة) وجعل شارة الحالة تدمج `isActive` و الانتهاء.
8. **متوسطة:** فرض `UPPER(code)` قبل الإدراج والمقارنة في كل مكان.
9. **منخفضة:** فحص `discount <= 100` للـ percentage في الواجهة، وإصلاح `data.usageLimit || 100` ليسمح بـ 0.
10. **التوثيق:** تحديث `ACTIONS_MAP.md` (سطر 68) لأن `getCouponByCode`/`validate_coupon` غير مستخدمين فعليًا، وتوحيد أسماء الأعمدة مع الواجهة.
