# تقرير الفحص — Agent #8: توافق السكيما مع لوحة التحكم (Dashboard + Accounting)

**التاريخ:** 2026-08-02
**النطاق:** `back-end schema/18_dashboard_views.sql` (كامل) + `back-end schema/19_accounting.sql` (كامل) + أجزاء من `15_rls_policies.sql` + `src/pages/admin/AdminDashboardPage.tsx` (كامل) + `src/services/accountingService.ts` (كامل) + أجزاء `adminService.ts` (getStats وما يستهلكه الداشبورد) + `src/types/index.ts`.
**الحالة:** فحص فقط — لم يتم تعديل أي ملف.

---

## 1. النطاق

- 10 عروض (views) + دالة `get_dashboard_data()` معرّفة في `18_dashboard_views.sql`.
- جدول `accounting_entries` + سياسات RLS + مؤشرات + تريغر في `19_accounting.sql`.
- الواجهة الفعلية: `AdminDashboardPage.tsx` تقرأ عبر `adminService.getOrders/getStats/getProducts/getCategories`، و`AdminAccountsPage.tsx` تقرأ عبر `accountingService`.
- المقارنة تشمل: أسماء العروض/الجداول/الدوال، الأعمدة، الأنواع النقدية، الأمان (security_barrier / RLS)، واعتماد الإنشاء (42P01).

---

## 2. خريطة التوافق

### 2.1 العروض المعرّفة في السكيما (`18_dashboard_views.sql`)

| # | العرض | الأعمدة | المصدر |
|---|-------|---------|--------|
| 1 | `dashboard_stats` | total_products, total_orders, total_revenue, total_users, total_brands, total_categories, total_coupons, pending_orders, low_stock_products, calculated_at | سطر 8 |
| 2 | `monthly_revenue` | month_date, month_key, orders_count, revenue | سطر 24 |
| 3 | `order_status_distribution` | status, count | سطر 38 |
| 4 | `category_distribution` | id, name, products_count | سطر 49 |
| 5 | `top_products` | id, name, slug, price, images, rating, reviews_count, stock, is_featured | سطر 62 |
| 6 | `recent_orders` | id, order_number, status, total, created_at, customer_name | سطر 80 |
| 7 | `low_stock_products` | id, name, slug, stock, price, primary_image | سطر 96 |
| 8 | `out_of_stock_products` | id, name, slug, stock, price, primary_image | سطر 111 |
| 9 | `brand_distribution` | id, name, products_count | سطر 126 |
| 10 | `user_sales_summary` | user_id, name, email, total_orders, total_spent, avg_order_value, last_order_date, first_order_date | سطر 139 |
| + | `get_dashboard_data()` | JSON: stats, monthly_revenue, order_statuses, top_products, recent_orders, low_stock_products | سطر 157 |

**ملاحظة نطاقية:** لا يوجد في السكيما عرضا `daily_sales` ولا `sales_by_category` (المذكوران في مهمة الفحص). البديلان المعرّفان هما `order_status_distribution` و`category_distribution`. لا يستخدمهما أي كود أمامي، لذا الغياب غير مسبب للأعطال حاليًا.

### 2.2 ما يقرأه `AdminDashboardPage` فعليًا مقابل السكيما

| ما تطلبه الواجهة (ملف:سطر) | العرض/الجدول في السكيما | الأعمدة المطلوبة | الحالة |
|---|---|---|---|
| `adminService.getOrders()` → `.from('orders')` (adminService.ts:310) | `orders` (06_orders.sql) | order_number, status, total, created_at, user_id | **مطابق** |
| `adminService.getStats()` → `.from('orders').select('total,status')` (adminService.ts:478) | `orders` | total, status | **مطابق** |
| `getStats` → عدّادات products/profiles/categories/brands/coupons (adminService.ts:479-483) | جداول 02/03/01/01/08 | — | **مطابق** |
| `adminService.getProducts()` → `.from('products')` (adminService.ts:33) | `products` (02_products.sql) | images[], price, rating, name | **مطابق** |
| `adminService.getCategories()` → `.from('categories')` (adminService.ts:131) | `categories` (01) | id, name, slug, image, icon | **مطابق** |
| مخطط الإيرادات الشهرية (AdminDashboardPage.tsx:85-103) | يُحسب محليًا من `orders.items` — لا يستخدم `monthly_revenue` | — | **مختلف** (غير مستخدم) |
| توزيع حالات الطلبات (AdminDashboardPage.tsx:138-141) | يُحسب محليًا — لا يستخدم `order_status_distribution` | — | **مختلف** (غير مستخدم) |
| أشرطة التصنيفات (AdminDashboardPage.tsx:173-187) | `getCategories` + عدّ محلي — لا يستخدم `category_distribution` | — | **مختلف** (غير مستخدم) |
| "أفضل المنتجات" (AdminDashboardPage.tsx:223-238) | `getProducts` — لا يستخدم `top_products` | — | **مختلف** (غير مستخدم) |
| "آخر الطلبات" (AdminDashboardPage.tsx:199-211) | `getOrders` — لا يستخدم `recent_orders` | — | **مختلف** (غير مستخدم) |
| `accountingService.getEntries` (accountingService.ts:31) | `accounting_entries` (19_accounting.sql:7) | id, type, category, amount, description, entry_date, created_at, updated_at | **مطابق** |
| `createEntry` (accountingService.ts:60) | `accounting_entries` | type CHECK('income','expense')، amount > 0 | **مطابق** |
| `updateEntry` (accountingService.ts:70) | `accounting_entries` | — | **مطابق** |
| `deleteEntry` (accountingService.ts:81) | `accounting_entries` | — | **مطابق** |
| `getSummary` select('type, amount') (accountingService.ts:88) | `accounting_entries` | type, amount | **مطابق** |
| نوع `AccountingEntry` (types/index.ts:223-232) | أعمدة `accounting_entries` | نفس الأسماء التسعة | **مطابق** |
| invoices / cash_register / expenses / transactions | **لا يوجد أي مرجع في src ولا في السكيما** | — | **مطابق** (غائب-غائب) |

**الخلاصة:** لا يوجد استدعاء واحد لأي عرض أو لـ `get_dashboard_data()` من أي مكان في `src/` (grep: صفر نتائج). الواجهة تقرأ الجداول مباشرة، وكل أسماء الجداول والأعمدة المستخدمة موجودة فعلًا في السكيما — لا توجد أسماء خاطئة تسبب أخطاء تشغيلية في مسار الداشبورد/المحاسبة الحالي.

### 2.3 الأنواع النقدية

| الحقل | السكيما | النوع | مطابقة مع الواجهة |
|---|---|---|---|
| `orders.total` | NUMERIC(10,2) (06_orders.sql:37) | decimal | نعم (`Number(o.total)`) |
| `dashboard_stats.total_revenue` / `monthly_revenue.revenue` | NUMERIC(12,2) | decimal | نعم |
| `accounting_entries.amount` | DECIMAL(12,2) (19_accounting.sql:11) | decimal | نعم (`Number(e.amount)`) |
| `user_sales_summary.total_spent/avg_order_value` | NUMERIC(12,2) / NUMERIC(10,2) | decimal | نعم |

لا يوجد أي استخدام لنوع `money` أو `float` في أي من الملفين — الأنواع النقدية **مطابقة**.

---

## 3. جدول المشاكل

| # | ما تستخدمه الواجهة (ملف:سطر) | الموجود في السكيما | نوع المشكلة | الأثر | الخطورة |
|---|---|---|---|---|---|
| P1 | جميع العروض العشرة (18_dashboard_views.sql:8-152) و`get_dashboard_data()` (سطر 157) | العروض منشأة **بدون** `WITH (security_invoker)` أو `security_barrier` | أمن/RLS | تُنفَّذ العروض بصلاحيات المالك (postgres يملك BYPASSRLS) فتتجاوز RLS بالكامل. ومع امتيازات Supabase الافتراضية (GRANT على public للـ anon/authenticated) تصبح بيانات حساسة قابلة للقراءة عبر REST من **أي زائر غير مسجّل**: أسماء العملاء (`recent_orders.customer_name`)، الإيميلات والمبالغ (`user_sales_summary.email/total_spent`)، الإيرادات (`dashboard_stats.total_revenue`, `monthly_revenue`). المشرف سيقرأها (كما هو مطلوب)، لكنها سليمة لا أمنيًا | **حرجة** |
| P2 | `AdminDashboardPage.tsx:79` → `getOrders()` بلا وسائط؛ الرسم الشهري (85-103) وحالات الطلبات (138-141) و"آخر الطلبات" (199-211) مبنية على `orders.items` | `getOrders` يفتح الصفحة الأولى فقط `pageSize=10` (adminService.ts:309-318) | منطق/دقة بيانات | الداشبورد يبني الإحصائيات والمخططات من **10 طلبات فقط** (الأحدث) بدل كل الطلبات → أرقام الإيرادات الشهرية وحالات الطلبات ناقصة ومضللة مع نمو المتجر، وتتعارض داخليًا مع بطاقة "الإيرادات" (المحسوبة من getStats على كل الطلبات) | **عالية** |
| P3 | العروض العشرة + `get_dashboard_data()` — غير مستخدمة في `src/` نهائيًا | السكيما جاهزة (ACTIONS_MAP.md:187 يعد بـ "READ: dashboard_stats VIEW + get_dashboard_data()") | انحراف توافقي/هدر بنية | بنية عرض كاملة "ميتة": لا أداء مُستفاد منه (الداشبورد يعمل 5+ استعلامات متتالية بدل RPC واحد)، وتضليل أي مطوّر يعتمد على ACTIONS_MAP أو README (سطر 142, 172) | **عالية** |
| P4 | `getStats` (adminService.ts:490) | `low_stock_products` view موجود لكنه غير مستخدم | منطق | `lowStockProducts` محسوبة من مصفوفة `products` في الذاكرة (`@/data` — mock/قديمة) وليس من قاعدة البيانات → بطاقة "مخزون منخفض" تعرض رقمًا لا يعكس الواقع | **متوسطة** |
| P5 | `getStats` (adminService.ts:488): `totalRevenue = sum(total)` بلا فلتر حالة | `monthly_revenue` تستثني `cancelled` (18_dashboard_views.sql:31) | تناقض تعريف الإيرادات | الإيرادات في الخدمة تشمل الطلبات الملغاة بينما العرض يستثنيها → قيمتان متعارضتان لنفس المفهوم حسب المصدر (تفاقم فور ربط الواجهة بالعروض) | **متوسطة** |
| P6 | `getCategories`/`getBrands` (adminService.ts:136-137, 197-198) | `category_distribution`/`brand_distribution` غير مستخدمين | منطق/دقة | `productsCount` محسوب من مصفوفة `products` في الذاكرة وليس من DB → أشرطة التصنيفات في الداشبورد (سطر 173-187) تعرض أعدادًا قديمة/خاطئة | **متوسطة** |
| P7 | `getStoreSettings`/`getAnnouncement` (adminService.ts:589, 637) | `store_settings` و`announcements` **غير معرّفتين** في ملفات 01-19 (موجودتان فقط في fix_schema.sql و _run_all_combined.sql) | توافق إنشاء (42P01) | من نفّذ `_run_all.sql` (المسار الموثّق، السطر 13-67) دون fix_schema.sql: صفحة إعدادات المتجر وشريط الإعلان يفشلان بخطأ جدول غير موجود (خارج النطاق المباشر للداشبورد لكن داخل adminService الذي قرأته) | **عالية** |
| P8 | — (سكيما فقط) | `19_accounting.sql:8` تستخدم `uuid_generate_v4()` بينما كل الجداول الأخرى تستخدم `gen_random_uuid()`، ولا يوجد `CREATE EXTENSION pgcrypto` في أي ملف (grep: صفر نتائج) | اعتماد/إنشاء | يعمل على Supabase (pgcrypto مفعّل افتراضيًا)؛ لكن على أي Postgres خام يفشل الإنشاء بخطأ 42883 (function does not exist) | **منخفضة** |
| P9 | الداشبورد لا يعرض growth%/avg_order_value حاليًا (trendLabel ثابت = عدد الطلبات، AdminDashboardPage.tsx:119) | `dashboard_stats` بلا أعمدة نمو/نسبة تغير؛ `avg_order_value` موجود فقط في `user_sales_summary` | فجوة مستقبلية | متوافق حاليًا؛ أي خطة لإضافة "نسبة النمو" للبطاقات تتطلب تعديل العرض — يحتاج قرارًا واعيًا | **منخفضة** |
| P10 | — (سكيما فقط) | `dashboard_stats.total_revenue` (سطر 12) تشمل `cancelled` بينما `monthly_revenue` (سطر 31) تستثنيها | تناقض داخلي | رقم "الإيرادات الكلية" في العرض الرئيسي يختلف عن مجموع أعمدة الشهور عند أي مقارنة | **منخفضة** |

---

## 4. فحص اعتماد العروض على الجداول (تسلسل الإنشاء)

### 4.1 اعتماد كل عرض على الجداول

| العرض | الجداول المعتمدة | ملف التعريف | موجود قبل 18؟ |
|---|---|---|---|
| `dashboard_stats` | products, orders, profiles, brands, categories, coupons | 02, 06, 03, 01, 01, 08 | نعم ✓ |
| `monthly_revenue` | orders | 06 | نعم ✓ |
| `order_status_distribution` | orders | 06 | نعم ✓ |
| `category_distribution` | categories, products | 01, 02 | نعم ✓ |
| `top_products` | products | 02 | نعم ✓ |
| `recent_orders` | orders, profiles | 06, 03 | نعم ✓ |
| `low_stock_products` | products | 02 | نعم ✓ |
| `out_of_stock_products` | products | 02 | نعم ✓ |
| `brand_distribution` | brands, products | 01, 02 | نعم ✓ |
| `user_sales_summary` | profiles, orders | 03, 06 | نعم ✓ |
| `get_dashboard_data()` | العروض أعلاه | 18 | نعم ✓ |

**الأعمدة المستخدمة موجودة فعلًا:** `orders.total/status/created_at/user_id/order_number` (06:32-43)، `products.images` (TEXT[]، 02:16)، `products.rating` (NUMERIC(2,1)، 02:19)، `reviews_count`، `stock`، `is_featured`، `price`، `name`، `slug`، `category_id`، `brand_id` — كلها معرّفة. `profiles.id/name/email` (03:17-19) معرّفة.

**الخلاصة:** لا يوجد اعتماد على جدول غير موجود → **لا خطأ 42P01 عند إنشاء العروض** طالما التزم الترتيب.

### 4.2 تسلسل `_run_all.sql` (الوثيقة الرسمية)

```
01-13 (جداول) → 17_functions_triggers → 16_indexes → 18_dashboard_views → 15_rls_policies → 19_accounting
```
- العروض بعد كل الجداول ✓ — RLS تُفعَّل بعد العروض ولا تؤثر على إنشائها ✓ — `is_admin()` معرّفة في 03 قبل 15 ✓ — المحاسبة في الأخير ✓.
- **ثغرة مسار الإنشاء:** `_run_all.sql` لا يتضمن `fix_schema.sql` (مصدر `store_settings` و`announcements`) ولا `14_storage_buckets` → مساران للنشر بمجموعة جداول مختلفة (انظر P7).
- `_run_all_combined.sql` (نسخة الملف الواحد) تتضمن كل شيء بما فيها العروض والمحاسبة وstore_settings/announcements — لكنها لا تحوي `CREATE EXTENSION pgcrypto` أيضًا.

---

## 5. ملاحظات إضافية

1. **الفشل الصامت:** معظم دوال `adminService` ترجع إلى بيانات mock في الذاكرة عند أي خطأ DB (مثال adminService.ts:47-56, 320-326) — يخفي أخطاء التوافق الحقيقية ويجعل اختبار المشكلة صعبًا (يبدو "شغالًا" بالبيانات الوهمية).
2. **RLS المحاسبة سليمة وظيفيًا:** سياسات `accounting_entries` (19:27-56) تقيّد القراءة/الكتابة بالمشرف فقط، وتنفيذها الداخلي بـ `EXISTS (SELECT 1 FROM profiles...)` يعمل لأن سياسات RLS تُنفَّذ بصلاحيات المالك. لا مشكلة في وصول المشرف.
3. **`get_dashboard_data()` تُرجع مفاتيح camelCase**: `monthly_revenue`, `order_statuses` — أي اعتماد مستقبلي من الواجهة يحتاج mapping قبل الاستخدام.
4. **واجهة المستخدم العادية كذلك**: `DashboardPage.tsx:176` يستخدم `getDashboardStats()` من `@/data` (mock) وليس `get_dashboard_data()` — نفس نمط "عروض غير مستخدمة" في جهة المستخدم (خارج نطاق هذه المهمة).
5. **لا يوجد نوع `DashboardStats` في `types/index.ts`** — المعرّف في `data/index.ts:222` (mock-only)، والداشبورد يعرّف شكل الحالة داخليًا (AdminDashboardPage.tsx:74).
6. `AdminDashboardPage.tsx:74` يخزّن totalCategories/totalBrands/totalCoupons دون عرضها — غير ضار.
7. `top_products` و`recent_orders` يحويان `LIMIT 10` داخل العرض — منطقي للغرض، لكنه يقصّر الاستخدامات المستقبلية (صفحات/توزيع).
8. حالة `monthly_revenue` تُرتب بـ `month_date DESC` بينما `get_dashboard_data` يعيد ترتيبها تنازليًا أيضًا (سطر 169) — ثابت.
9. `15_rls_policies.sql` لا يتضمن سياسات للعروض (السياسات خاصة بالجداول فقط) ولا GRANT صريحة — تاركًا العروض للامتيازات الافتراضية (أساس P1).

---

## 6. توصيات

1. **(حرجة — أمن):** إعادة إنشاء العروض العشرة بـ `CREATE VIEW ... WITH (security_invoker = true)` (أو `security_barrier` مع إبقاء المالك غير bypassrls)، ثم `REVOKE SELECT` عن anon/authenticated ومنحها للمشرفين فقط (سياسة SELECT على كل عرض بـ `is_admin()` أو `auth.role()`). وبديل أسرع إن كانت العروض ستبقى غير مستخدمة: إزالتها مؤقتًا لحين الاستخدام مع تصحيح عند التفعيل.
2. **(عالية — دقة الداشبورد):** إما ربط `AdminDashboardPage` بـ `get_dashboard_data()`/العروض (حل ACTIONS_MAP المعلن)، أو على الأقل استدعاء `getOrders()` بترقيم صفحات كامل (pageSize كبير أو fetch-all) لتكون الرسوم الشهرية وحالات الطلبات مبنية على كل الطلبات.
3. **(عالية — إنشاء):** إضافة `store_settings` و`announcements` إلى ملف مرقّم (مثلًا ضمن `12_settings.sql` أو `11_marketing.sql`) وإدراجهما في `_run_all.sql`، أو تضمين `fix_schema.sql` في المسار الموثّق.
4. **(متوسطة):** تصحيح `getStats` ليقرأ `low_stock_products`/`dashboard_stats` من DB بدل `@/data`، وتوحيد تعريف الإيرادات باستثناء `cancelled` في كل مكان (P5/P10).
5. **(متوسطة):** حساب `productsCount` في `getCategories/getBrands` من DB (عبر `category_distribution`/`brand_distribution`) بدل مصفوفة الذاكرة.
6. **(منخفضة):** استبدال `uuid_generate_v4()` بـ `gen_random_uuid()` في `19_accounting.sql` وإضافة `CREATE EXTENSION IF NOT EXISTS pgcrypto` في بداية الملف.
7. **(توثيق):** تحديث `ACTIONS_MAP.md` و`README.md` ليعكس التنفيذ الفعلي بعد قرار الربط بالعروض أو إزالتها، وإضافة عمودي growth/avg_order_value إلى `dashboard_stats` عند إدخال ميزة النمو.
8. إزالة سلوك "الرجوع الصامت للـ mock" في adminService (الملاحظة 5.1) حتى تظهر أخطاء التوافق بوضوح في بيئة الاختبار.
