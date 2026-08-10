# تقرير الفحص الشامل: توافق لوحة التحكم مع سكيما الباك إند — NAWA

> **التاريخ:** 2026-08-02 | **الحالة:** فحص قراءة فقط (لا تعديل على أي كود) | **الفريق:** 10 sub agents

---

## 1. ملخص تنفيذي (Executive Summary)

تم فحص التوافق بين **سكيما Supabase** (`back-end schema/` — 19 ملف SQL) و**لوحة التحكم** (`src/pages/admin/` — 13 صفحة) عبر طبقة الخدمات (`src/services/`). النتيجة الحاسمة:

> **لوحة التحكم لا تعمل حاليًا مع السكيما بشكل كامل. تقدير التوافق: ~60-70%.** أغلب عمليات **الإنشاء والإضافة والحفظ تفشل بصمت** (النجاح وهمي)، والسبب الجذري المشترك هو **تضارب معرّفات (UUID vs TEXT) + ابتلاع الأخطاء**.

### أبرز 10 مشاكل حرجة (تمنع العمل الفعلي)
| # | المشكلة | الموقع | الأثر |
|---|---------|--------|-------|
| 1 | `genId()` يولّد معرّفات نصية (`prod-xxx`) بينما كل جداول السكيما `id UUID PRIMARY KEY` | `src/services/adminService.ts:12-15,86,156,216,269,426,538` | **كل عمليات إضافة** (منتج/تصنيف/ماركة/كوبون/إشعار/جائزة) **تفشل في القاعدة** والأخطاء مُبتلعة → نجاح وهمي بلا حفظ |
| 2 | إنشاء الطلب يفشل: إدراج عمود `items` غير موجود في `orders` + تجاهل نتيجة الإدراج | `src/services/orderService.ts:37,50` | الطلبات الجديدة لا تُحفظ في DB |
| 3 | `payment_method` غير متطابق: الواجهة ترسل `vodafone-cash` والسكيما enum `vodafone_cash` | `src/pages/CheckoutPage.tsx:233` | رفض حفظ الطلبات بفودافون كاش |
| 4 | `orders.user_id NOT NULL` + RLS تشترط `user_id = auth.uid()` بينما الكود يدعم ضيوفًا | `fix_schema.sql:105-106`, `15_rls_policies.sql:162` | طلبات الضيوف مرفوضة |
| 5 | سياسات `fix_schema.sql:74-94` تمنح **أي مستخدم مسجّل** صلاحيات تعديل/حذف المنتجات والتصنيفات والماركات | `fix_schema.sql:74-94` | تخريب كامل للمتجر من أي عميل |
| 6 | `profiles_select` و `addresses_select` بـ `USING (true)` — قراءة بيانات كل العملاء (أسماء/إيميلات/هواتف/عناوين) للعامة | `fix_schema.sql:121-128` | تسريب PII حتى للأنونيم |
| 7 | سياسات `storage.objects` **غير منفذة نهائيًا** (كلها تعليقات) | `14_storage_buckets.sql:17-65`, `_run_all.sql` | رفع/حذف الصور من اللوحة يرفض بـ 403 |
| 8 | `store_settings` و `announcements` غير معرّفين في ملفات 01-19 — موجودان فقط في `fix_schema.sql` و`_run_all_combined.sql` | `fix_schema.sql:7-48` | `_run_all.sql` المسار الموثّق ينتج قاعدة بلا إعدادات → إعدادات اللوحة لا تُحفظ |
| 9 | التقييمات لا تُحفظ أبدًا: `id='review-<ts>'` و `user_id:'guest'` على أعمدة UUID | `src/pages/ProductDetailsPage.tsx:86-97` | تقييمات الزبائن لا تصل DB و`products.rating` لا يتحدث |
| 10 | إشعارات اللوحة تفشل دائمًا: `user_id: data.userId \|\| ''` على عمود `UUID NOT NULL` | `src/services/adminService.ts:429` | لا يُحفظ أي إشعار |

---

## 2. منهجية الفحص

- **10 agents** قسّموا السكيما (19 ملف SQL) ولوحة التحكم (13 صفحة + 5 خدمات + أنواع + أدوات رفع) إلى 10 قطاعات متقاطعة.
- كل agent قارن: أسماء الجداول والأعمدة والأنواع والقيم (enum/CHECK) والدوال (RPC) والـ Triggers والفهارس وسياسات RLS والأكوام (buckets) **بين** ما تستدعيه الواجهة وما تعرّفه السكيما.
- **لم يُعدَّل أي كود** — كل التقارير التفصيلية محفوظة في `audit-report/`:
  - `agent-01-products.md` — المنتجات/التصنيفات/الماركات/الرفع
  - `agent-02-orders.md` — الطلبات/أصناف الطلبات
  - `agent-03-users-rls.md` — المستخدمون/البروفايلات/RLS
  - `agent-04-coupons.md` — الكوبونات
  - `agent-05-reviews-notifications.md` — التقييمات/الإشعارات
  - `agent-06-settings-marketing.md` — الإعدادات/التسويق
  - `agent-07-spin-wheel.md` — عجلة الحظ
  - `agent-08-dashboard-accounting.md` — لوحة التحكم/الإحصائيات/المحاسبة
  - `agent-09-functions-indexes-storage.md` — الدوال/الفهارس/التخزين/أدوات النشر
  - `agent-10-master-integration.md` — التكامل الشامل/نسخ السكيما المتعارضة

---

## 3. جدول المشاكل الموحد (مرتبة بالخطورة)

### 🔴 حرجة — تمثل 100% ضرورة قبل التشغيل

| # | الموقع | المشكلة | لوحة التحكم المتأثرة |
|---|--------|---------|----------------------|
| C1 | `adminService.ts:12-15` + كل جداول السكيما (UUID) | معرّفات غير UUID في كل `create*` — مصدرها `supabase-schema.sql` القديم (TEXT) | كل صفحات الإضافة: منتجات، تصنيفات، ماركات، كوبونات، إشعارات، جوائز عجلة |
| C2 | `orderService.ts:37,50` | إدراج `items` في `orders` (غير موجود) + تجاهل الخطأ | إنشاء الطلبات من المتجر → لا تصل DB |
| C3 | `CheckoutPage.tsx:233` | `vodafone-cash` (واصلة) vs enum `vodafone_cash` | إتمام الطلبات بفودافون كاش |
| C4 | `15_rls_policies.sql:162-164` + `fix_schema.sql:105-106` | `orders_insert` يرفض الضيوف (`user_id` NULL) و cast `user_id::uuid` | طلبات الزوار (guest checkout) مرفوضة |
| C5 | `fix_schema.sql:74-94` | كتابة المنتجات/التصنيفات/الماركات لأي `authenticated` | **أمني**: أي عميل مسجّل يعدّل المتجر |
| C6 | `fix_schema.sql:121-128` | `profiles`/`addresses` `SELECT USING(true)` | تسريب بيانات العملاء للعامة |
| C7 | `14_storage_buckets.sql:17-65` (تعليقات) + `_run_all.sql` (خطوتا 14 و20 معلّقتان) | لا سياسات `storage.objects` منفذة | رفع/حذف صور المنتجات والماركات والتصنيفات → 403 |
| C8 | `fix_schema.sql:7-48` vs ملفات 01-19 | `store_settings` و `announcements` غائبان عن المسار الأساسي | صفحة الإعدادات وشريط الإعلانات (تظهر "تم الحفظ" وهمية) |
| C9 | `ProductDetailsPage.tsx:86-97` | إدراج تقييمات بمعرّف نصي و`user_id:'guest'` | تقييمات المتجر لا تُحفظ، متوسط التقييم لا يتحدث |
| C10 | `adminService.ts:426-430` | `createNotification` بـ `user_id: ''` على UUID NOT NULL | زر "إرسال إشعار" في اللوحة لا يحفظ شيئًا |
| C11 | `_run_all_combined.sql:1781+` / `fix_schema.sql:101-102` | `reviews_delete` لأي مستخدم مسجّل + `_run_all_combined` يتعارض مع 15_rls | حذف تعسفي للتقييمات + كارثة أمنية لو شُغّل |
| C12 | `AdminUsersPage.tsx:119,124` | `viewModal.addresses.length` على undefined (لا أعمدة addresses/wishlist في profiles) | **انهيار (TypeError)** نافذة المستخدم مع بيانات حقيقية |
| C13 | `SpinContext.tsx:190-203` | كوبونات عجلة الحظ: `type:'freeShipping'` (enum: `free_shipping`) + `discount:0` يخالف `CHECK>0` | جوائز العجلة لا تُحفظ إطلاقًا |
| C14 | `14_storage_buckets.sql` + `upload.ts` | لا policy لـ `brand-logos`/`category-images` DELETE حتى بعد التنفيذ اليدوي | حذف الشعارات/الصور |

### 🟠 عالية

| # | الموقع | المشكلة | الأثر |
|---|--------|---------|-------|
| H1 | `15_rls_policies.sql:98` | `profiles_update_own` بلا `WITH CHECK` | أي مستخدم يرفع نفسه لـ `role='admin'` |
| H2 | `adminService.ts:466` | `ordersCount` يستخدم `o.userId` بينما الصفوف `user_id` (snake_case) | عدّاد الطلبات في نافذة المستخدم = 0 دائمًا |
| H3 | `mapOrder` (`adminService.ts`) | يقرأ `data.items` (غير موجود) — لا جلب لـ `order_items` | أصناف الطلبات فارغة في اللوحة |
| H4 | `orderService` لا يستدعي `increment_coupon_usage` | لا استدعاء RPC إطلاقًا في src | `used_count` لا يزيد، `usage_limit` غير مفروض، `validate_coupon` ميتة |
| H5 | `adminService.ts:490` + `:136` | `lowStockProducts` و`productsCount` من بيانات محلية (mock) لا من DB | بطاقتا "مخزون منخفض" و"عدد المنتجات" غير دقيقتين |
| H6 | `AdminDashboardPage.tsx:79` | `getOrders()` بلا وسائط → 10 طلبات فقط تُبنى عليها المخططات | إحصاءات اللوحة مضللة |
| H7 | عروض 18_dashboard_views بدون `security_invoker` | تنفذ بصلاحيات المالك وتتجاوز RLS | أي زائر anon يقرأ أسماء/إيميلات/مبالغ العملاء عبر REST |
| H8 | `upload.ts:20-23` vs `uploadimages.sql:62-68` | مسار الرفع `avatars/<uuid>.ext` مقابل سياسة تتوقع `<user-uuid>/file` | رفع الصور الرمزية يفشل حتى للمالك |
| H9 | لا trigger ولا كود | لا تخفيض مخزون عند الطلب | بيع كمية أكبر من المتاح |
| H10 | `AuthContext.tsx:117,128` | id مستخدم وهمي `user-<ts>` + إدراج بروفايل مكرر يتعارض مع trigger `handle_new_user` | طلبات/مفضلة غير مرتبطة بالحساب + خطأ PK مكرر متجاهل |
| H11 | `productService`/`orderService` fallback صامت | أي خطأ Supabase يعرض بيانات محلية بدل الخطأ | الواجهة تبدو "تعمل" بينما DB فارغة — من الصعب اكتشاف الفشل |
| H12 | `cart`/`CheckoutPage.tsx:36` | قراءة الكوبونات من جدول عام + RLS `is_admin()` فقط (حسب ترتيب التنفيذ) | كوبونات لا تُطبق عند الدفع |
| H13 | `AdminReviewsPage`/`AdminNotificationsPage` | لا `is_approved` في السكيما ولا بث جماعي (user_id NOT NULL + RLS فردي) | كل التقييمات تنشر فورًا؛ إشعارات اللوحة لا تصل لأحد |
| H14 | ENUM `notification_type` (09:8) | لا يشمل `promo`/`system` المستخدمة في المتجر | إشعارات برومو مرفوضة |
| H15 | `AdminSpinPrizesPage` تبويب الإحصائيات | يحسب من `prizes` فقط — لا فائزين/دورات | إحصاءات وهمية؛ `spin_history` جدول ميت (لا استدعاء في src) |
| H16 | `SpinContext.tsx:13-22` | السحب بـ `Math.random()` في المتصفح + حد يومي localStorage | قابل للاختراق (مسح الـ storage يعيد الدورات) |

### 🟡 متوسطة

| # | الموقع | المشكلة |
|---|--------|---------|
| M1 | `adminService.ts:36,312` + `productService.ts:36,45,90` | بحث ILIKE `%q%` بلا فهرس trigram؛ ترتيب rating/reviews_count بلا فهرس؛ `search_vector` (GIN) ميت — الواجهة لا تستخدم full-text |
| M2 | `fix_schema.sql:51-57` | تحويل `spin_prizes.type` إلى TEXT مع ابتلاع الأخطاء — انحراف عن enum في 10_spin_wheel |
| M3 | `upload.ts:48-59` + `ImageUpload.tsx:46` | `deleteImage` يضمّن اسم الـ bucket في المسار → الملفات لا تُحذف (يتيمة) |
| M4 | `fix_schema.sql` vs `15_rls_policies.sql` | نفس أسماء السياسات مع DROP/CREATE — إعادة تشغيل 15 بعد fix تلغي تعديلات fix (تعطل كاش أوت) |
| M5 | `createCoupon` (`adminService.ts:263-269`) | `maxDiscount: 0` يخالف `CHECK(max_discount IS NULL OR > 0)` → إنشاء/تعديل الكوبونات مرفوض |
| M6 | `AdminCouponsPage.tsx:15` + `adminService` | لا mapping snake_case→camelCase للكوبونات → `expiresAt.slice` قد يرمي خطأ |
| M7 | `adminService.ts` coupons | لا toggle `is_active`؛ `code` لا يُرفع UPPER بينما UNIQUE على `UPPER(code)` |
| M8 | `CartPage` تحقق client-side | يتجاهل `is_active`/`usage_limit`/`min_order` |
| M9 | `settings` جدول (12_settings) | ميت — لا يقرؤه أي كود؛ توجد مخازن إعدادات متوازية (`settings` vs `store_settings`) |
| M10 | `newsletter_subscribers` | غير مستخدم (NewsletterSection واتساب فقط) + أعمدة مختلفة (`subscribed_at` لا `created_at`) + لا سياسة UPDATE |
| M11 | `AdminSettingsPage.tsx:29-48` | ابتلاع أخطاء التحديث مع `toast.success` دائم — نجاح وهمي |
| M12 | `back_in_stock_requests` | `UNIQUE(product_id,email)` يفشل بصمت عند التكرار |
| M13 | `spin_prizes` RLS | `SELECT USING(true)` يكشف الجوائز المعطّلة والـ coupon_code والوزن |
| M14 | `spin_history` | سياسة إدراج ترفض الضيوف رغم دعم `guest_phone` |
| M15 | `03_profiles.sql` `is_admin()` | `SECURITY DEFINER` بلا `SET search_path` (ممارسة غير محصّنة) |

### 🟢 منخفضة
- `19_accounting.sql:8` — `uuid_generate_v4()` بلا `CREATE EXTENSION pgcrypto` (يفشل على Postgres غير Supabase).
- `06_orders.sql:96-106` — `order_number` عشوائي `random()*9999` (احتمال تصادم؛ قد يدخل trigger في حلقة إعادة محاولة).
- `Notification.userId?` اختياري يخفي NOT NULL؛ `handleMarkAllRead` دالة فارغة؛ `order` غير مغطى في typeConfig.
- `profiles.is_new` ثابت `true` بلا تحكم؛ `product_image` NULL-able بينما نوع TS إلزامي.
- `.env.production` متتبع في git + `createClient` بلا حماية من البيئة الناقصة → شاشة بيضاء.
- `coupon_code`/`orders.items` تعتمد على fix_schema → سلوك يعتمد على سكربت التنصيب.

---

## 4. أبرز ما هو سليم ومتوافق (لكي لا نعيد بناءه)

- **أسماء الأعمدة وأنواعها** في عمليات القراءة (SELECT) للمنتجات والتصنيفات والماركات والطلبات: متطابقة تقريبًا 100%.
- **حالات الطلبات** الست (pending/confirmed/shipped/delivered/cancelled/returned) متطابقة مع enum السكيما.
- **أعمدة التمويل** (subtotal/shipping/discount/total) و tracking JSONB متوافقة.
- **المحاسبة**: `accountingService` متطابق تمامًا مع `accounting_entries` (أسماء، أنواع DECIMAL(12,2)، CHECK، RLS للمشرف).
- **Triggers** (8/8): إنشاء البروفايل عند التسجيل، تحديث التقييم، order_number، updated_at، البحث النصي — كلها سليمة داخليًا ومترابطة.
- **`SPIN_TYPE_MAP`/`SPIN_TYPE_REVERSE`** متطابقة حرفًا بحرف مع enum عجلة الحظ (percentage/fixed/free_shipping/try_again).
- **فهارس الفلاتر الأساسية** (category_id, brand_id, status, created_at DESC, is_featured, is_new, discount) مغطاة.
- **`AnnouncementConfig`** وحقول AdminSettingsPage مطابقة تمامًا لأعمدة `store_settings`/`announcements` — التوافق الطبقي سليم، المشكلة في مسار النشر فقط.
- **لا خطأ 42P01** في إنشاء العروض (كل الاعتماديات معرّفة في 01-13 قبل 18).
- الواجهة تقرأ من `profiles` فقط (لا `users`/`auth.users`) → لا خطأ جدول غير موجود، و`is_admin()` مصممة بـ SECURITY DEFINER → **لا recursion**.

---

## 5. القضايا البنيوية الكبرى (الجذور)

1. **تعارض سكيمتين**: `supabase-schema.sql`/`supabase-complete.sql`/`supabase-seed.sql` (قديمة: TEXT IDs، `category` نصية، `order_emails`) مقابل `back-end schema/` (جديدة: UUID، `category_id` FK، `order_email_logs`). الكود الحالي مبني على الجيل القديم (genId نصية) — **الحل الجذري: اعتماد `back-end schema` + fix_schema + 19_accounting كمرجع وحيد، وتوليد UUID صحيح في الكود، وحذف الملفات القديمة من التوثيق**.
2. **مسارا نشر متعارضان**: `_run_all.sql` (ناقص: بلا fix_schema/تخزين) و `_run_all_combined.sql` (كامل لكن بسياسات خطرة). **يجب توحيد المسار وحذف الناقص.**
3. **ابتلاع الأخطاء معمم**: كل `create*`/`update*` في adminService تتجاهل الخطأ وتكمل بـ toast نجاح → المستخدم يظن أن كل شيء يعمل. **يجب إزالة الفولباك المحلي الصامت وإظهار الأخطاء.**
4. **مخزونان للإعدادات**: `settings` (ميت) vs `store_settings` (مستعمل) — والمتجر الأمامي لا يقرأ أيًا منهما (ثوابت i18n هاردكود).
5. **لا استدعاء RPC نهائيًا** في src: كل دوال السكيما (validate_coupon, increment_coupon_usage, get_dashboard_data, is_low_stock, get_user_order_count) **كود ميت**.
6. **fix_schema.sql يحوي تنزيلات أمنية حرجة** (كتابة للعموم، تسريب PII) — يجب تعديله عند العمل عليه لاحقًا.

---

## 6. تقييم كل صفحة من لوحة التحكم (جاهزية)

| الصفحة | الحالة | السبب الجذري |
|--------|--------|--------------|
| AdminProductsPage | ⚠️ قراءة تعمل / إضافة وتعديل وصور معطلة | C1, C7, C14 |
| AdminCategoriesPage | ⚠️ قراءة تعمل / إضافة وصور معطلة | C1, C7 |
| AdminBrandsPage | ⚠️ قراءة تعمل / إضافة وصور معطلة | C1, C7 |
| AdminOrdersPage | ⚠️ عرض جزئي (أصناف فارغة) | H3, C2 |
| AdminUsersPage | ❌ تنهار عند فتح نافذة مستخدم | C12, H2 |
| AdminAccountsPage | ⚠️ محاسبة متوافقة لكن لا إدارة حسابات (getAccounts غير موجودة) | — |
| AdminCouponsPage | ⚠️ إنشاء/تعديل مرفوضان + عرض camelCase مكسور | M5, M6, C1 |
| AdminReviewsPage | ⚠️ قراءة/حذف تعمل — لا موافقة نشر | H13 |
| AdminNotificationsPage | ❌ الإرسال يفشل دائمًا | C10, H13 |
| AdminSettingsPage | ❌ الحفظ لا يصل DB (مسار النشر) + نجاح وهمي | C8, M11 |
| AdminSpinPrizesPage | ⚠️ إضافة جوائز مرفوضة + إحصائيات وهمية | C1, C13, H15 |
| AdminDashboardPage | ⚠️ أرقام ناقصة/مضللة + العروض غير مستخدمة | H6, H7, P3 |

---

## 7. خارطة طريق الإصلاح المقترحة (للعمل عليها لاحقًا)

**المرحلة 1 — جعل الأرقام تصل DB (حرجة):**
1. توليد UUID صحيح (`crypto.randomUUID()`) في كل `genId` واستبدال كل إنشاءات النصوص.
2. إزالة الفولباك المحلي الصامت وإظهار أخطاء Supabase في adminService/orderService.
3. توحيد المسار: `_run_all_combined.sql` + `fix_schema.sql` كمرجع وحيد، حذف `_run_all.sql` الناقص.
4. إصلاح إنشاء الطلب (`orderService`): الأعمدة الصحيحة، جلب `order_items`، معالجة أخطاء RLS.

**المرحلة 2 — تصحيح الأمن (حرجة):**
5. سياسات fix_schema تعود لـ `is_admin()` فقط (products/categories/brands/reviews) + `WITH CHECK` لـ profiles_update_own + قراءة profiles/addresses للذات/المشرف فقط.
6. تفعيل سياسات `storage.objects` من ملف حقيقي غير معلّق + تصحيح مسار `deleteImage` وسياسة avatars.

**المرحلة 3 — إكمال الوظائف (عالية):**
7. trigger تخفيض المخزون + استدعاء `increment_coupon_usage`/`validate_coupon` بعد الطلب.
8. تعبئة addresses/wishlist في نافذة المستخدم؛ إصلاح ordersCount (snake_case).
9. إشعارات جماعية (user_id NULL) + قراءة الإشعارات في المتجر من Supabase (حاليًا mock).
10. ربط إعدادات المتجر بالواجهة الأمامية فعليًا.

**المرحلة 4 — الأداء والنظافة (متوسطة):**
11. فهارس trigram على name/sku/order_number أو استخدام search_vector فعليًا.
12. حسم مخزون الإعدادات المزدوج (settings vs store_settings)، وحذف النسخ القديمة من السكيما من الجذر.

---

*كل التقارير التفصيلية (بالجداول الكاملة وأرقام الأسطر) متاحة في مجلد `audit-report/` — يوصى بفتحها عند بدء التنفيذ.*
