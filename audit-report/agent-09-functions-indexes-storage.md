# تقرير Agent #9 — الدوال، الـ Triggers، الفهارس، التخزين (Compatibility Audit)

**النطاق:** `back-end schema/*.sql` (16_indexes، 17_functions_triggers، 14_storage_buckets، fix_schema، _run_all) مقابل `src/services/*` و `src/lib/*` و `src/pages/admin/*` الكاملة في مشروع NAWA.
**التاريخ:** 2026-08-02 — **نوع الفحص: قراءة فقط، بدون أي تعديل على الكود أو السكيما.**

---

## 1. النطاق

- قرئت بالكامل: `16_indexes.sql` (77 سطرًا)، `17_functions_triggers.sql` (54)، `14_storage_buckets.sql` (75)، `fix_schema.sql` (136)، `_run_all.sql` (71)، وكل ملفات السكيما المساندة: 01→13، 15_rls_policies (416)، 18_dashboard_views (195)، 19_accounting (71).
- قرئت بالكامل: `adminService.ts` (736)، `accountingService.ts`، `orderService.ts`، `productService.ts`، `supabase.ts`، `upload.ts`، وصفحات `src/pages/admin/` الـ 13.
- فحص إضافي سياقي: `supabase-schema.sql` (سكيما قديمة في جذر المشروع بمعرّفات TEXT)، `uploadimages.sql` (سكيما التخزين الفعلية)، `_run_all_combined.sql`، `ACTIONS_MAP.md`.
- تقارير الحلفاء القائمين رُوجعت للتوافق: agent-01 (منتجات/تخزين)، agent-02 (طلبات)، agent-03 (مستخدمون/RLS)، agent-04 (كوبونات)، agent-07 (عجلة الحظ)، agent-08 (داشبورد/محاسبة).

---

## 2. جدول الدوال (RPC / SQL Functions)

### 2.1 استدعاءات RPC من الواجهة
**نتيجة حاسمة:** البحث الشامل في `src` كاملًا عن `supabase.rpc(...)` أو `.rpc(` لم يُرجع **أي استدعاء واحد**. كل دوال السكيما لا تُستدعى من الواجهة إطلاقًا؛ الواجهة تعمل عبر استعلامات جداول مباشرة (PostgREST). وبالتالي: **لا يوجد أي تباين وسائط ممكن**، لكن بالمقابل:

| اسم الدالة | يُستدعى في (ملف:سطر) | معرّفة في السكيما | مطابقة الوسائط |
|---|---|---|---|
| `products_search_update()` | لا (دالة trigger) | نعم — 02_products.sql:56 | — |
| `handle_new_user()` | لا (دالة trigger) | نعم — 03_profiles.sql:35 | — |
| `is_admin()` | لا (مُستدعاة داخل سياسات RLS) | نعم — 03_profiles.sql:58 | — |
| `ensure_single_default_address()` | لا (trigger) | نعم — 04_addresses.sql:24 | — |
| `orders_set_updated_at()` | لا (trigger) | نعم — 06_orders.sql:79 | — |
| `generate_order_number()` | لا (تُستدعى من trigger) | نعم — 06_orders.sql:96 | — |
| `orders_set_order_number()` | لا (trigger) | نعم — 06_orders.sql:111 | — |
| `update_product_rating()` | لا (trigger) | نعم — 07_reviews.sql:28 | — |
| `validate_coupon(p_code, p_order_total)` | **لا يُستدعى** — التحقق من الكوبون يتم client-side بقراءة جدول `coupons` مباشرة | نعم — 08_coupons.sql:47 | لا استدعاء |
| `settings_set_updated_at()` | لا (trigger) | نعم — 12_settings.sql:17 | — |
| `increment_coupon_usage(p_code)` | **لا يُستدعى** | نعم — 17_functions_triggers.sql:19 | لا استدعاء |
| `get_user_order_count(p_user_id UUID)` | **لا يُستدعى** | نعم — 17:34 | لا استدعاء |
| `is_low_stock(p_product_id, p_threshold)` | **لا يُستدعى** | نعم — 17:44 | لا استدعاء |
| `get_dashboard_data()` | **لا يُستدعى** — الداشبورد يستخدم `adminService.getStats()` باستعلامات متعددة | نعم — 18_dashboard_views.sql:157 | لا استدعاء |
| `update_accounting_entries_updated_at()` | لا (trigger) | نعم — 19_accounting.sql:59 | — |
| `get_dashboard_stats` | لا يوجد أي استدعاء | **غير معرّفة بهذا الاسم** — يوجد `dashboard_stats` (VIEW) و `get_dashboard_data()` (دالة) فقط | — |
| `spin_wheel` | لا يوجد استدعاء | **غير معرّفة** | — |
| `send_notification` | لا يوجد استدعاء | **غير معرّفة** | — |
| `mark_all_read` | لا يوجد استدعاء | **غير معرّفة** | — |
| `update_quantity` | لا يوجد استدعاء | **غير معرّفة** | — |
| `secure_admin` | لا يوجد استدعاء | **غير معرّفة** | — |
| `increment_*` / `decrement_*` | لا يوجد استدعاء | **غير معرّفة** (لا `increment_stock` ولا `decrement_stock`) | — |

### 2.2 ملاحظات على الدوال
- **كود ميت وظيفيًا:** `validate_coupon` و `increment_coupon_usage` و `get_dashboard_data` و `get_user_order_count` و `is_low_stock` غير مستخدمة. الأثر العملي: **`coupons.used_count` لا يزيد أبدًا** (لا أحد يستدعي `increment_coupon_usage`) → حد الاستخدام `usage_limit` **لا يُفرض إطلاقًا**، والتحقق من الكوبونات يتم بالكامل في المتصفح على جدول عام.
- `is_admin()` دالة `SECURITY DEFINER` بدون تثبيت `search_path` — ممارسة غير محصّنة (ثغرة محتملة في مشاريع متعددة الـ schema).
- الدوال المؤقتة كلها مطابقة لأنواع أعمدة جداولها (تحقق في §3).

---

## 3. جدول الـ Triggers

| # | الـ Trigger | الدالة | الجدول/الحدث | العمود/الجدول المستهدف | الحالة |
|---|---|---|---|---|---|
| 1 | `trg_on_auth_user_created` (03_profiles.sql:50) | `handle_new_user` | AFTER INSERT ON auth.users | `profiles` — أعمدة id/name/email/avatar موجودة ومطابقة (role افتراضي customer) | ✅ سليم |
| 2 | `trg_products_search` (02_products.sql:69) | `products_search_update` | BEFORE INSERT OR UPDATE ON products | `products.search_vector` — يُضاف بالملف نفسه (02:54) وفهرسه GIN موجود (16_indexes.sql:20) | ✅ سليم |
| 3 | `trg_addresses_single_default` (04_addresses.sql:37) | `ensure_single_default_address` | BEFORE INSERT OR UPDATE OF is_default | `addresses.is_default` موجود | ✅ سليم |
| 4 | `trg_orders_updated_at` (06_orders.sql:88) | `orders_set_updated_at` | BEFORE UPDATE ON orders | `orders.updated_at` موجود | ✅ سليم |
| 5 | `trg_orders_order_number` (06_orders.sql:129) | `orders_set_order_number` | BEFORE INSERT ON orders | `orders.order_number` NOT NULL UNIQUE موجود | ⚠️ أرقام عشوائية `random()*9999` قد تدخل في حلقة إعادة محاولة عند التصادم (نادر) |
| 6 | `trg_reviews_update_product` (07_reviews.sql:52) | `update_product_rating` | AFTER INSERT OR DELETE OR UPDATE OF rating ON reviews | `products.rating` NUMERIC(2,1) / `reviews_count` INT — القيم المحسوبة (5.0، count) تنسجم مع الـ constraints | ✅ سليم |
| 7 | `trg_settings_updated_at` (12_settings.sql:26) | `settings_set_updated_at` | BEFORE UPDATE ON settings | `settings.updated_at` موجود | ✅ سليم |
| 8 | `trg_accounting_entries_updated_at` (19_accounting.sql:68) | `update_accounting_entries_updated_at` | BEFORE UPDATE ON accounting_entries | `accounting_entries.updated_at` موجود | ✅ سليم |
| — | **لا يوجد trigger لتخفيض المخزون عند الطلب** (decrement stock) | — | — | لا trigger ولا استدعاء في الكود | ❌ فجوة: المخزون لا ينقص أبدًا عند إنشاء طلب |

**خلاصة Triggers:** كل triggers السكيما مترابطة وسليمة داخليًا. **الفجوة الوحيدة:** لا يوجد `decrement stock on order` رغم أن المهمة تطرحه — ولا يُعوّضه أي كود في الواجهة.

---

## 4. جدول تغطية الفهارس (16_indexes.sql مقابل استعلامات اللوحة)

| الاستعلام الشائع (المكان) | الفلترة/الترتيب | الفهرس المطلوب | الموجود | التغطية |
|---|---|---|---|---|
| `getProducts` (adminService.ts:32-41) | `category_id` eq | idx_products_category_id | ✅ | مغطاة |
| `getProducts` | `brand_id` eq | idx_products_brand_id | ✅ | مغطاة |
| `getProducts` | order `created_at desc` | idx_products_created_at (DESC) | ✅ | مغطاة |
| `getProducts` count exact | مع الفلاتر | يستخدم فهارس الفلاتر | ✅ | مغطاة |
| **`getProducts` بحث `name.ilike.%q% , sku.ilike.%q%`** (adminService.ts:36) و `productService.getAll` (productService.ts:36 name/description) | **ILIKE بمعامل بادئ** | **يحتاج GIN trigram (pg_trgm)** | **لا يوجد** — `idx_products_search` على `search_vector` غير صالح لـ ILIKE | ❌ **غير مغطاة** (فحص تسلسلي) |
| `getOrders` (adminService.ts:309-314) | `status` eq | idx_orders_status | ✅ | مغطاة |
| `getOrders` | order `created_at desc` | idx_orders_created_at | ✅ | مغطاة |
| **`getOrders` بحث `order_number ilike %q%`** (adminService.ts:312) | ILIKE بمعامل بادئ | **trigram** | `idx_orders_number` (UNIQUE btree) لا يساعد | ❌ **غير مغطاة** |
| `getReviews` (adminService.ts:377-381) | `product_id` + order `created_at desc` | فهرسان منفصلان موجودان؛ يُفضل مركّب | ✅/🟡 جزئية | مقبولة |
| `getNotifications` (405-407) | order `created_at desc` | idx_notifications_created_at | ✅ | مغطاة |
| `accountingService.getEntries/Summary` | `entry_date` range + `type`/`category` + order | idx_accounting_entries_date/type/category | ✅ (19_accounting.sql:19-21) | مغطاة |
| `productService.getAll` sort `price` (43-44) | range/order price | idx_products_price | ✅ | مغطاة |
| **`productService.getAll` sort `rating`** (45) | order rating desc | **لا يوجد فهرس rating** | ❌ | غير مغطاة (نادر الاستخدام) |
| **`getBestSelling` (productService.ts:90)** | order `reviews_count desc` | **لا يوجد فهرس reviews_count** | ❌ | غير مغطاة |
| `getFeatured`/`getNew`/`getDiscounted` (72-87) | is_featured/is_new/discount>0 | فهارس جزئية على `(id)` فقط | 🟡 partial على id — يعمل فلترة + heap fetch | مقبولة |
| `getStats` (adminService.ts:478-483) | counts + `total,status` | فحص كامل مقبول لصغر البيانات / عدادات على PK | ✅ | مقبولة |
| Views 18_dashboard_views | joins/group by على category_id/brand_id/user_id/created_at | كلها مفهرسة | ✅ | مغطاة |

**خلاصة:** أهم استعلام مكشوف هو **بحث ILIKE على name/sku/order_number** (لا GIN trigram ولا فهارس btree تساعد مع `%…%` البادئ)، وفهرس `search_vector` الموجود **ميت** لأن الواجهة لا تستخدم `to_tsquery`/`websearch_to_tsquery` أصلًا. ترتيب `rating` و `reviews_count` غير مفهرس.

---

## 5. جدول الأكوام والتخزين والسياسات

### 5.1 المطابقة بين buckets والكود

| الـ Bucket | معرّف في 14_storage_buckets.sql | يُستخدم في الكود | المطابقة |
|---|---|---|---|
| `product-images` | ✅ (سطر 9) | `upload.ts:4` + ImageUpload في AdminProductsPage.tsx:532 | ✅ |
| `brand-logos` | ✅ (سطر 11) | `upload.ts:5` + AdminBrandsPage.tsx:182-187 | ✅ |
| `category-images` | ✅ (سطر 12) | `upload.ts:6` + AdminCategoriesPage.tsx:182-187 | ✅ |
| `avatars` | ✅ (سطر 10) | `upload.ts:7` | ✅ |
| `banners` | **غير موجود في أي ملف** | غير مستخدم في أي كود (AdminSettingsPage لا يرفع صورًا أصلًا) | — لا مشكلة |

> ملف `uploadimages.sql` (جذر المشروع) ينشئ نفس الأكوام الأربعة فعليًا — مطابق تمامًا للكود.

### 5.2 سياسات storage.objects — هل تسمح بقراءة عامة ورفع مشرف؟

| المصدر | السياسات | الحالة |
|---|---|---|
| 14_storage_buckets.sql:17-65 | **كل السياسات معلّقة كتعليقات** ("informational only") | ❌ غير منفذة |
| 15_rls_policies.sql | **لا يحتوي أي سياسة على storage.objects** | ❌ غير منفذة |
| _run_all.sql (خطوة 14 معلّقة، خطوة 20 `../uploadimages.sql` معلّقة) | لا شيء يُنفذ تلقائيًا | ❌ |
| uploadimages.sql:19-68 | سياسات فعلية: SELECT عام للأكوام الأربعة، INSERT/DELETE للمشرف على 3 أكوام صور | 🟠 منفذة يدويًا فقط (خارج مسار _run_all) |
| سياسة avatars (uploadimages.sql:62-68) | `auth.uid() = (storage.foldername(name))[1]::uuid` — تتوقع مسارًا أول مقطع فيه هو **معرّف المستخدم** `<uuid>/file` | ❌ **تباين حاسم:** `upload.ts:20-23` يرفع إلى `avatars/<uuid>.ext` (اسم الـ bucket هو أول مقطع) → `'avatars'::uuid` يرمي خطأ إدخال → رفع الصور الرمزية **يفشل دائمًا** حتى للمالك |

### 5.3 ملاحظات رفع/حذف الصور
- `deleteImage` (upload.ts:48-59): يشمل اسم الـ bucket ضمن المسار المُرسل إلى `remove()` (`parts.slice(bucketIdx)` يبدأ من `product-images` بينما مسار الكائن لا يبدأ به) → **الملفات لا تُحذف أبدًا**، و`ImageUpload.tsx:46` يتجاهل الأخطاء → تراكم ملفات يتيمة (مطابق لتقرير agent-01 #7).
- بدون تنفيذ يدوي لـ `uploadimages.sql`: **رفع أي صورة من اللوحة يُرفض 403** (لا توجد سياسة INSERT على storage.objects) — كل صفحات المنتجات/الماركات/التصنيفات تتأثر.

---

## 6. تحليل fix_schema.sql و _run_all.sql

### 6.1 ماذا يفعل fix_schema.sql؟
1. ينشئ `store_settings` + RLS + seed (سطر 7-28) — **الجدول الذي يعتمد عليه `adminService.getStoreSettings/updateStoreSettings` (588-627) و AdminSettingsPage** ولا يوجد في أي ملف 01-19.
2. ينشئ `announcements` + RLS + seed (31-48) — يعتمد عليه `getAnnouncement/updateAnnouncement` (636-657).
3. `spin_prizes.coupon_code` (51) — العمود الذي يدرجه `adminService.createSpinPrize` (541) وغير موجود في 10_spin_wheel.sql.
4. `orders.items JSONB` (60، 66) — العمود الذي يعتمد عليه `orderService.create:37` و `mapOrder:697` وغير موجود في 06_orders.sql.
5. `orders.user_id TEXT` إن غاب (67) — تعارض تصميمي مع 06_orders (UUID NOT NULL FK): إن شُغّل `_run_all` أولًا فلا أثر؛ وإن شُغّل على سكيما أقدم بأعمدة TEXT فلا مشكلة؛ لكن إن وُجدت قيمة غير UUID في العمود فستفشل سياسة `user_id::uuid = auth.uid()`.
6. سياسات RLS: coupons عامة (70-71) — مقصودة لأن الواجهة تقرأ الكوبونات علنًا للتحقق؛ products/categories/brands **كتابة لأي مستخدم authenticated** (74-94)؛ notifications insert للمشرف (97-98)؛ reviews_delete لأي authenticated (101-102)؛ orders للوحة/المالك (105-110)؛ spin_prizes للمشرف (113-118)؛ **profiles قراءة للجميع SELECT USING(true)** (121-122)؛ **addresses قراءة للجميع** (125-128)؛ testimonials للمشرف (131-136).

### 6.2 خطر fix_schema — تنزيلات أمنية حرجة
- **أي عميل مسجّل (auth.role()='authenticated') يمكنه إدراج/تعديل/حذف المنتجات والتصنيفات والماركات** (74-94) بدل «مشرف فقط» في 15_rls_policies — تخريب كامل للمتجر.
- **أي مستخدم يمكنه حذف أي مراجعة** (101-102).
- **قراءة كل ملفات المستخدمين (أسماء، إيميلات، هواتف) لعموم الناس حتى بدون تسجيل** `SELECT USING (true)` على profiles (121-122) — تسريب بيانات شخصية.
- **قراءة كل عناوين الشحن (اسم كامل، تليفون، عنوان) للجميع** (125-126).
- سياسة `orders_insert` (106): `is_admin() OR user_id::uuid = auth.uid()` → طلبات الضيوف (user_id NULL) **تُرفض**؛ والـ cast يرمي خطأ إن كانت القيمة نصًا غير UUID.
- `DO $$ … EXCEPTION WHEN OTHERS THEN NULL` (54-57) يبتلع الأخطاء بصمت — يخفي فشل التحويلات.
- اعتماد ترتيب: السياسات تحمل نفس أسماء سياسات 15_rls_policies (تستخدم DROP IF EXISTS) → **لا يُنفَّذ إلا بترتيب «بعد» الملفات الأخرى**؛ أي تشغيل لاحق لـ 15_rls يلغي تعديلات fix (مثل قراءة الكوبونات العامة → يعطّل الكاش أوت).

### 6.3 هل يُشغَّل fix_schema في _run_all.sql؟
**لا.** `_run_all.sql` (خطوات 1→20) لا يتضمن `fix_schema.sql` نهائيًا. الترتيب الفعلي: 01-13 → 17_functions_triggers (15) → 16_indexes (16) → 18_dashboard_views (17) → 15_rls_policies (18) → 19_accounting (19)، وخطوتا 14_storage_buckets و ../uploadimages.sql معلّقتان.
- **نتيجة:** مسار النشر عبر `_run_all.sql` وحده يُنتج قاعدة **ناقصة** (لا store_settings، لا announcements، لا orders.items، لا spin_prizes.coupon_code) وغير متوافقة مع كود اللوحة.
- المسار الكامل الصحيح: `_run_all_combined.sql` (يتضمن محتوى fix_schema ضمنيًا في أسفله: سطور 1732+) ثم `fix_schema.sql` (كما يذكر ترويسة fix_schema: «Run AFTER _run_all_combined.sql»).
- **تعارض بين المسارين:** ملفان للنشر (`_run_all.sql` و `_run_all_combined.sql`) يولّدان بنية مختلفة — خطر تشغيل خاطئ.
- **19_accounting.sql:8** يستخدم `uuid_generate_v4()` دون `CREATE EXTENSION pgcrypto` — يعمل في Supabase (مثبّتة افتراضيًا) لكنه يفشل على Postgres عادي.
- ترقيم التعليقات في _run_all لا يطابق أرقام الملفات (خطوة «15» تشغّل 17_functions_triggers وهكذا) — تجميلي.
- الترتيب نفسه منطقي: جداول → دوال/Triggers (17) → فهارس (16) → Views (18) → RLS (15) → محاسبة (19). الملفات 17/16/18 لا تعتمد على RLS، و`is_admin()` (03) تُعرّف قبل سياسات 15. لا مشكلة ترتيبية فعلية داخله سوى غياب fix_schema وملفات التخزين.

---

## 7. جدول المشاكل الموحد

| # | الموقع | المشكلة | الأثر | الخطورة |
|---|---|---|---|---|
| 1 | adminService.ts:12-15,86,156,216,269,426,538 | `genId()` يولّد `prod-xxx`/`cat-xxx`/... **غير UUID** بينما كل جداول back-end schema بمعرّفات `id UUID PRIMARY KEY` | كل إضافة (منتج/تصنيف/ماركة/كوبون/إشعار/جائزة) تفشل بـ `invalid input syntax for type uuid`، والأخطاء **مُبتلعة** → نجاح وهمي ولا شيء يُحفظ. (ملاحظة: `supabase-schema.sql` القديم بمعرّفات TEXT يطابق الكود — تعارض بين سكيمتين) | 🔴 حرجة |
| 2 | adminService.ts:426-430 | `createNotification` يُدخل `user_id: data.userId \|\| ''` على عمود `user_id UUID NOT NULL REFERENCES profiles` | إرسال إشعار من اللوحة يفشل دائمًا ('' ليست UUID) بصمت | 🔴 حرجة |
| 3 | fix_schema.sql:74-94 | سياسات products/categories/brands تسمح بأي `auth.role()='authenticated'` بالإدراج/التعديل/الحذف | أي عميل مسجّل يخرب المنتجات والتصنيفات والماركات | 🔴 حرجة |
| 4 | fix_schema.sql:121-128 | `profiles_select_own` و `addresses_select` بـ `USING (true)` | تسريب أسماء/إيميلات/هواتف/عناوين كل المستخدمين لأي شخص (حتى أنونيم) — مخالفة خصوصية | 🔴 حرجة |
| 5 | 14_storage_buckets.sql:17-65 + 15_rls_policies + _run_all (الخطوتان 14 و20 معلّقتان) | لا سياسات storage.objects مُنفَّذة بأي ملف أوتوماتيكي | رفع/حذف صور المنتجات والماركات والتصنيفات يُرفض 403 ما لم يُشغَّل `uploadimages.sql` يدويًا | 🔴 حرجة |
| 6 | upload.ts:20-23 مقابل uploadimages.sql:62-68 | مسار الرفع `avatars/<uuid>.ext` مقابل سياسة تتوقع `(foldername(name))[1]::uuid = auth.uid()` (أول مقطع = معرّف المستخدم) | `'avatars'::uuid` يرمي خطأ — رفع الصور الرمزية يفشل حتى للمالك | 🟠 عالية |
| 7 | _run_all.sql (لا يتضمن fix_schema) مقابل adminService.ts:588-657 و orderService.ts:37 | `store_settings`/`announcements`/`orders.items`/`spin_prizes.coupon_code` غير موجودة بمسار _run_all | إعدادات المتجر لا تُحفظ، إنشاء الطلبات يفشل (عمود items)، جوائز العجلة بـ coupon_code تفشل | 🟠 عالية |
| 8 | adminService.ts:36,312 + productService.ts:36,45,90 مقابل 16_indexes.sql | بحث ILIKE `%q%` على name/sku/order_number بلا فهرس trigram؛ sort rating وreviews_count بلا فهرس؛ `idx_products_search` (GIN على search_vector) **ميت** لأن الكود لا يستخدم full-text | فحص تسلسلي مع نمو الكتالوج؛ فهرس مُهدر | 🟡 متوسطة |
| 9 | fix_schema.sql:105-106 + 15_rls_policies.sql:162-164 | `orders_insert` يتطلب `user_id = auth.uid()` (أو is_admin) | **طلبات الضيوف (بدون تسجيل) مرفوضة** بسياسات RLS، والـ cast `user_id::uuid` قد يرمي خطأ | 🟠 عالية |
| 10 | لا trigger ولا كود | لا يوجد تخفيض مخزون عند إنشاء الطلب (لا decrement_stock ولا trigger) | المخزون لا ينقص أبدًا → بيع كمية أكبر من المتاح | 🟠 عالية |
| 11 | لا استدعاءات RPC (17_functions_triggers.sql:19، 08_coupons.sql:47) | `increment_coupon_usage`/`validate_coupon` غير مستخدمة | `used_count` يبقى صفرًا و `usage_limit` لا يُفرض أبدًا؛ التحقق من الكوبونات client-side على جدول عام | 🟡 متوسطة |
| 12 | adminService.ts:458-466 مقابل 03_profiles.sql:16-24 | `getUsers` يعيد صفوف profiles مباشرة بلا أعمدة `addresses`/`wishlist` بينما `User` تتوقعها | انهيار `AdminUsersPage.tsx:119,124` (`viewModal.addresses.length` على undefined) عند فتح نافذة المستخدم | 🟠 عالية |
| 13 | fix_schema.sql:51-57 | `ALTER TABLE spin_prizes ALTER COLUMN type TYPE TEXT` مع `EXCEPTION WHEN OTHERS THEN NULL` | ابتلاع فشل التحويل بصمت؛ فقدان معنى الـ ENUM — انحراف مع 10_spin_wheel.sql (نوع enum) | 🟡 متوسطة |
| 14 | upload.ts:48-59 + ImageUpload.tsx:43-47 | `deleteImage` يضمّن اسم الـ bucket في مسار `remove()` | الملفات لا تُحذف من التخزين أبدًا (تراكم ملفات يتيمة) | 🟡 متوسطة |
| 15 | 19_accounting.sql:8 | `uuid_generate_v4()` دون `CREATE EXTENSION pgcrypto` | فشل إنشاء الجدول على Postgres غير Supabase | 🟢 منخفضة |
| 16 | 17_functions_triggers.sql:96-106 (generate_order_number) | رقم عشوائي `random()*9999` فقط | احتمال تصادم order_number مرتفع نسبيًا في الأسرع من 9999 طلب؛ حلقة إعادة محاولة نظرية | 🟢 منخفضة |
| 17 | fix_schema.sql مقابل 15_rls_policies.sql | نفس أسماء السياسات مع DROP/CREATE بلا فرض ترتيب | أي إعادة تشغيل لـ 15_rls بعد fix تلغي قراءة الكوبونات العامة وتُعيد سياسات صارمة (تعطل الكاش أوت) | 🟡 متوسطة |
| 18 | 03_profiles.sql:58-67 | `is_admin()` SECURITY DEFINER دون تثبيت search_path | ممارسة غير محصّنة (نظرية في بيئة Supabase) | 🟢 منخفضة |
| 19 | adminService.ts:490 (getStats) | `lowStockProducts` يُحسب من بيانات `products` المحلية (global state) التي قد لا تكون محمّلة بعد | بطاقة «مخزون منخفض» تعرض 0 خطأ عند أول تحميل | 🟢 منخفضة |
| 20 | 15_rls_policies.sql:217-219 مقابل fix_schema.sql:70-71 | سياسة coupons: مشرف فقط مقابل عام | يعتمد كاش أوت على fix؛ في سكيما 15 وحدها يرى العملاء صفر كوبونات | 🟡 متوسطة |

---

## 8. توصيات (للتنفيذ لاحقًا — خارج نطاق هذا الفحص)

1. **توحيد السكيما:** حسم التناقض بين `back-end schema` (UUID) و `supabase-schema.sql` القديم (TEXT) — الكود الحالي (genId) مبني على TEXT؛ إما تحويل الكود لـ UUID صحيح (`crypto.randomUUID()`) أو إبقاء TEXT، وإزالة الملف القديم من التوثيق.
2. **إدراج fix_schema.sql داخل _run_all.sql** كخطوة أخيرة (أو توثيق أن المسار المعتمد هو `_run_all_combined.sql` فقط) وإزالة المسار الناقص.
3. **ردع التنزيلات الأمنية في fix_schema:** سياسات products/categories/brands/reviews تعود إلى `is_admin()` فقط، و`profiles_select_own`/`addresses_select` إلى `id = auth.uid() OR is_admin()`.
4. **تفعيل سياسات storage.objects** في ملف حقيقي غير معلّق (نقل uploadimages.sql داخل خطوة 20 غير المعلّقة)، وتصحيح مسار `deleteImage`، وتعديل سياسة avatars أو مسار الرفع ليتطابقا (`avatars/<uuid>/<file>` أو سياسة `starts_with(name, 'avatars/')`).
5. **فهارس:** إضافة `CREATE EXTENSION pg_trgm` + فهارس GIN على name/sku/order_number، وفهارس على rating و reviews_count، أو استخدام `search_vector` فعليًا عبر `websearch_to_tsquery`.
6. **منطق الأعمال:** إضافة trigger لتخفيض المخزون عند تأكيد الطلب، واستدعاء `increment_coupon_usage`/`validate_coupon` بعد إنشاء الطلب لتفعيل `usage_limit`.
7. **إصلاح إنشاء الإشعارات** (user_id NOT NULL) إما بجعله اختياريًا (user_id UUID NULL) أو إلزام اللوحة باختيار مستلم.
8. **منع انهيار AdminUsersPage:** تعبئة `addresses`/`wishlist` ([] على الأقل) عند جلب المستخدمين.
9. فحص `orders_insert` لسماح طلبات الضيوف (user_id NULL) مع سياسة تعالج NULL.

---

### مرجع سريع للخطورة
- **🔴 حرجة (6):** #1، #2، #3، #4، #5، #7 (نشر ناقص).
- **🟠 عالية (4):** #6، #9، #10، #12.
- **🟡 متوسطة (6):** #8، #11، #13، #14، #17، #20.
- **🟢 منخفضة (4):** #15، #16، #18، #19.
