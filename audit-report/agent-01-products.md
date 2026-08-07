# تقرير فحص التوافق — Agent #1: المنتجات / التصنيفات / الماركات

**التاريخ:** 2026-08-02
**الحالة:** فحص فقط — لم يتم تعديل أي ملف في `src` أو `back-end schema`.

---

## 1. النطاق (الملفات المفحوصة)

| الجهة | الملفات |
|---|---|
| السكيما | `back-end schema/01_categories_brands.sql`، `02_products.sql`، `14_storage_buckets.sql`، `15_rls_policies.sql`، `16_indexes.sql`، إضافةً: `03_profiles.sql` (دالة `is_admin`)، `17_functions_triggers.sql`، `18_dashboard_views.sql`، `fix_schema.sql` |
| الواجهة | `src/pages/admin/AdminProductsPage.tsx`، `AdminCategoriesPage.tsx`، `AdminBrandsPage.tsx`، `src/components/ui/ImageUpload.tsx` |
| الخدمات | `src/services/adminService.ts`، `src/services/productService.ts`، `src/lib/upload.ts`، `src/types/index.ts`، `src/data/index.ts` |

---

## 2. خريطة التوافق

| عنصر الواجهة (نوع TS) | الجدول.العمود في السكيما | نوع السكيما | الحالة |
|---|---|---|---|
| `Product.id` (string) | products.id | UUID PK | **مطابق (شكلاً)** — لكن القيم المولّدة من الواجهة غير صالحة UUID (انظر المشكلة #1) |
| `Product.name` | products.name | TEXT NOT NULL | مطابق |
| `Product.slug` | products.slug | TEXT NOT NULL UNIQUE | مطابق |
| `Product.description` | products.description | TEXT | مطابق |
| `Product.shortDescription` | products.short_description | TEXT | مطابق (تحويل snake_case في mapper) |
| `Product.price` | products.price | NUMERIC(10,2) | مطابق |
| `Product.oldPrice` (number\|null) | products.old_price | NUMERIC(10,2) | مطابق |
| `Product.discount` (number\|null) | products.discount | INTEGER (0-100) | مطابق — لكن CHECK يمنع الخصم بلا `old_price` (مشكلة #4) |
| `Product.images` (string[]) | products.images | TEXT[] | مطابق |
| `Product.category` (string) | products.category_id | UUID FK → categories (ON DELETE SET NULL) | **مختلف**: السلسلة الفارغة `''` ليست UUID صالحًا (مشكلة #5) |
| `Product.brand` (string) | products.brand_id | UUID FK → brands (ON DELETE SET NULL) | **مختلف**: نفس المشكلة (مشكلة #5) |
| `Product.rating` | products.rating | NUMERIC(2,1) | مطابق (قراءة فقط) |
| `Product.reviewsCount` | products.reviews_count | INTEGER | مطابق (قراءة فقط) |
| `Product.stock` | products.stock | INTEGER (>=0) | مطابق |
| `Product.sku` | products.sku | TEXT (nullable) | مطابق — الواجهة تفرضه إلزاميًا بينما السكيما يجيزه فارغًا (ملاحظة) |
| `Product.specifications` | products.specifications | JSONB | مطابق (JSONB يقبل مصفوفة `{label,value}`) |
| `Product.tags` | products.tags | TEXT[] | مطابق |
| `Product.isNew` | products.is_new | BOOLEAN | مطابق — لكن الواجهة تُرسله `true` دائمًا بلا تحكم (مشكلة #10) |
| `Product.isFeatured` | products.is_featured | BOOLEAN | مطابق |
| `Product.createdAt` | products.created_at | TIMESTAMPTZ | مطابق |
| — | products.search_vector | TSVECTOR | مطابق (ترايجره يحافظ عليه، لا تلمسه الواجهة) |
| `Category.id/name/slug` | categories.id/name/slug | UUID / TEXT / TEXT UNIQUE | مطابق (لكن id المولّد غير صالح — #1) |
| `Category.image` | categories.image | TEXT | مطابق |
| `Category.icon` | categories.icon | TEXT | مطابق |
| `Category.productsCount` | **لا يوجد عمود** | — | **مختلف**: يُحسب من بيانات محلية (مشكلة #6) |
| `Brand.id/name/slug` | brands.id/name/slug | UUID / TEXT / TEXT UNIQUE | مطابق (لكن id المولّد غير صالح — #1) |
| `Brand.logo` | brands.logo | TEXT | مطابق |
| `Brand.productsCount` | **لا يوجد عمود** | — | **مختلف**: يُحسب من بيانات محلية (مشكلة #6) |

**ملاحظات إضافية على القراءة:** أعمدة مثل `is_featured`، `is_new`، `discount`، `stock`، `sku`، `slug`، `images`، `category_id`، `brand_id`، `search_vector` كلها موجودة في السكيما بأسماء صحيحة. لا توجد أعمدة `status` أو `is_active` أو `stock_quantity` أو `image_url` أو `discount_price` في جداول المنتجات/التصنيفات/الماركات — ولا تستخدمها هذه الصفحات، فلا توجد فجوة هنا.

---

## 3. جدول المشاكل

| # | ما تستخدمه الواجهة (ملف:سطر) | الموجود في السكيما | نوع المشكلة | الأثر | الخطورة |
|---|---|---|---|---|---|
| 1 | `genId()` يولّد `prod-…/cat-…/brand-…` ثم `insert` بها — `adminService.ts:12-15, 86, 156, 216` | `products.id / categories.id / brands.id` من نوع `UUID` | **عدم تطابق نوع**: السلسلة `prod-xxxx` ليست UUID صالحًا | **كل عمليات الإنشاء من لوحة التحكم تفشل دائمًا** برفض Postgres؛ والخطأ غير مفحوص (`await insert` بلا فحص `error`)، فتظهر رسالة نجاح كاذبة ولا يُحفظ شيء في قاعدة البيانات | **حرجة** |
| 2 | `ImageUpload` ترفع الصور — `AdminProductsPage.tsx:532`، `AdminCategoriesPage.tsx:185`، `AdminBrandsPage.tsx:185`، `upload.ts:32` | سياسات `storage.objects` في `14_storage_buckets.sql:17-65` **كلها معلّقة كتعليقات** ("informational only") ولا يُنشئها أي سكربت | غياب سياسات RLS للتخزين | بلا إنشاء يدوي للسياسات، رفع الصور من اللوحة يُرفض (403) لجميع المستخدمين بما فيهم المشرف؛ ونفس الشيء للحذف | **حرجة** |
| 3 | `fix_schema.sql:73-94` يستبدل سياسات الكتابة | سياسات `15_rls_policies.sql:37-47, 56-66, 75-85` (كتابة للمشرف فقط) | **ثغرة تفويض**: `auth.role()='authenticated' OR is_admin()` | **أي مستخدم مسجّل** (عميل عادي) يستطيع إنشاء/تعديل/حذف المنتجات والتصنيفات والماركات | **عالية** |
| 4 | `handleSave` يرسل `discount` بلا `oldPrice` — `AdminProductsPage.tsx:484-485, 151-152`؛ `adminService.ts:98-99` | CHECK `valid_discount`: `discount IS NULL OR (old_price IS NOT NULL AND discount > 0)` — `02_products.sql:30` | تعارض منطق عمل | إدخال خصم بدون سعر قديم (أو `old_price < price` مع CHECK `valid_price`) يفشل الإدراج/التحديث **بصمت** | **عالية** |
| 5 | `category_id`/`brand_id` تُرسل `''` عند عدم الاختيار — `adminService.ts:81, 101-102` | أعمدة من نوع `UUID` | عدم تطابق نوع (سلسلة فارغة ≠ UUID) | إنشاء منتج دون اختيار تصنيف/ماركة يفشل بصمت (متداخل مع #1) | **عالية** |
| 6 | `productsCount` يُحسب من `products` المحلية — `adminService.ts:136-137, 197-198` | لا عمود في السكيما؛ الـ View `category_distribution/brand_distribution` موجود (18) لكن غير مستخدم | مصدر بيانات خاطئ | الأرقام محسوبة من بيانات `src/data/products.json` التجريبية (التي لا تُحدَّث إلا بعد استدعاء `getProducts`) → **عدّادات غير صحيحة** في صفحات التصنيفات والماركات | **متوسطة** |
| 7 | `deleteImage` — `upload.ts:55-56`: `parts.slice(bucketIdx)` يشمل اسم الـ bucket | مسار الكائن في التخزين لا يبدأ باسم الـ bucket | خلل منطقي | مسار الحذف المرسل `product-images/products/x.jpg` غير موجود فعليًا → **الملفات لا تُحذف أبدًا** (الأخطاء متجاهلة في `ImageUpload.tsx:46`) → تراكم ملفات يتيمة | **متوسطة** |
| 8 | `deleteImage` من لوحة الماركات/التصنيفات | سياسات الحذف في `14_storage_buckets.sql:53-64` للـ `brand-logos` و `category-images` **غير موجودة** (إدراج فقط) | غياب سياسة | حتى لو نُفّذت السياسات المعلّقة، حذف الشعارات وصور التصنيفات سيُرفض دائمًا | **متوسطة** |
| 9 | fallback للبيانات المحلية — `adminService.ts:47, 139, 200` | — | إخفاء الأخطاء | أي خطأ Supabase (RLS/شبكة) يعرض بيانات تجريبية محلية بدل إظهار الخطأ → تشخيص مضلل في اللوحة | **متوسطة** |
| 10 | `is_new: true` ثابت — `adminService.ts:75, 84` | products.is_new موجود | نقص تحكم | لا يوجد مفتاح لـ «جديد» في النموذج؛ كل منتج يُنشأ يبقى «جديدًا» للأبد ويملأ قسم «وصل حديثًا» | **منخفضة** |
| 11 | بحث `name.ilike.%q%` و`sku.ilike.%q%` — `adminService.ts:36`؛ و`description.ilike` — `productService.ts:36` | فهارس `16_indexes.sql:7-20` لا تغطي `ilike '%…%'`؛ `idx_products_search` (GIN) غير مستخدم لأن التطبيق لا يستخدم FTS | أداء | مسح كامل للجدول عند البحث — مقبول في الحجم الصغير، يتدهور مع النمو | **منخفضة** |
| 12 | `order('rating')` — `productService.ts:45` | لا فهرس على rating | أداء | فرز بمسح كامل | **منخفضة** |

---

## 4. فحص RLS

- **`is_admin()` معرّفة** في `03_profiles.sql:58-69` (تفحص `profiles.role = 'admin'`) — والملاحظة في `README.md:144` تنص أن أول مشرف **يجب تعيينه يدويًا** بعد أول تسجيل؛ قبل ذلك `is_admin()` تعيد `false` دائمًا وكل الكتابة من اللوحة مرفوضة.
- **السياسات الأصلية (`15_rls_policies.sql`)** صحيحة وكاملة للمشرف على الجداول الثلاثة:
  - `categories` / `brands` / `products`: SELECT للعموم + INSERT/UPDATE/DELETE بـ `is_admin()` (الأسطر 33-85).
  - **الحذف والتحرير من اللوحة سيعملان** إذا كان المستخدم `admin` في `profiles` (FKs كلها `ON DELETE CASCADE/SET NULL`، فلا عوائق حذف).
- **لكن `fix_schema.sql:73-94` يُضعف السياسات** إلى `auth.role()='authenticated'` لأي مستخدم مسجّل — وهذا التصحيح مطلوب تطبيقه حسب رأس الملف، أي أن النسخة المنشورة غالبًا أضعف أمنيًا (مشكلة #3).
- **التخزين:** لا توجد سياسة `storage.objects` منشأة في أي ملف من ملفات السكيما (كلها معلّقة في `14_storage_buckets.sql`) — رفع/حذف الصور يعتمد على تنفيذ يدوي خارج السكربت (مشكلة #2).
- `is_admin()` داخل سياسات التخزين المعلّقة تستدعي دالة على `public.profiles` — سليمة لو نُفّذت.

## 5. فحص الفهارس (16_indexes.sql)

| استعلام اللوحة/الخدمة | الفهرس المغطي | الحالة |
|---|---|---|
| `order('created_at', desc)` — `adminService.ts:41`, `productService.ts:46` | `idx_products_created_at (created_at DESC)` | ✓ |
| `eq('is_featured', true)` — `productService.ts:72` | `idx_products_featured` (جزئي) | ✓ |
| `eq('is_new', true)` — `productService.ts:78` | `idx_products_new` (جزئي) | ✓ |
| `gt('discount', 0)` — `productService.ts:84` | `idx_products_discounted` (جزئي) | ✓ |
| `eq('category_id')` / `eq('brand_id')` — `adminService.ts:38-39` | `idx_products_category_id` / `idx_products_brand_id` | ✓ |
| `eq('slug')` — `productService.ts:60` | `idx_products_slug` (UNIQUE) | ✓ |
| `count: 'exact'` + range | لا يحتاج فهرسًا خاصًا | ✓ |
| `ilike '%…%'` على name/sku/description | لا يوجد (GIN search_vector لا يساعد ilike) | ✗ منخفضة |
| `order('rating')` | لا يوجد | ✗ منخفضة |

الخلاصة: التغطية جيدة للاستعلامات الأساسية؛ الفجوات في البحث الجزئي وفرز التقييم فقط.

## 6. ملاحظات إضافية

1. **أخطاء الكتابة غير مفحوصة:** في `createProduct/createCategory/createBrand` (الأسطر 86/156/216) يُتجاهل `error` الناتج عن الإدراج — نتيجة كل مشاكل #1/#4/#5 تظهر كـ«نجاح» كاذب في الواجهة مع بقاء قاعدة البيانات دون تغيير.
2. `mapProduct` يحوّل `discount = 0` إلى `null` (`adminService.ts:667`) — تباين عرض بسيط.
3. حقل SKU إلزامي في الواجهة (`AdminProductsPage.tsx:140-143`) بينما السكيما يسمح بـ NULL — صرامة غير ضارة.
4. سياسة `profiles_select_own` في `fix_schema.sql:121-122` تجعل قراءة كل الملفات الشخصية عامة — خارج نطاق هذه الصفحات لكنها ثغرة خصوصية تستحق المراجعة.
5. سلوك الفولباك المحلي (#9) يجعل اللوحة تبدو «عاملة» حتى مع قاعدة بيانات فارغة — يضلل الاختبار اليدوي.

## 7. توصيات

1. **حرجة:** في `adminService` اترك `id` بدون قيمة عند الإدراج (السكيما يولّده عبر `gen_random_uuid()`)، أو استخدم `crypto.randomUUID()` الحقيقي بدل `genId()`.
2. **حرجة:** فعّل سياسات `storage.objects` (SELECT/INSERT/DELETE) بإنشاء ملف SQL حقيقي غير معلّق، وعدّل `upload.ts` لقص اسم الـ bucket من المسار قبل `remove()`، وأضف سياسات DELETE للـ `brand-logos` و`category-images`.
3. **عالية:** عوّد سياسات `fix_schema.sql:73-94` إلى قيد `is_admin()` فقط (أو دور `admin` صريح) — لا تسمح لأي `authenticated` بتعديل الكتالوج.
4. **عالية:** افحص `error` لكل insert/update/delete وأظهره في الـ toast بدل النجاح الكاذب، وافحص قيود `valid_price`/`valid_discount` في الواجهة قبل الإرسال.
5. **متوسطة:** احسب `productsCount` عبر استعلام count حقيقي (أو استخدم `category_distribution`/`brand_distribution` من 18_dashboard_views.sql).
6. **منخفضة:** أضف مفتاح `isNew` في نموذج المنتج، وأزل الفولباك المحلي الصامت أو أضف تسجيل خطأ واضح.
7. **عملية:** وثّق خطوة إنشاء أول حساب admin يدويًا في `profiles.role` وإلا لن تعمل أي كتابة من اللوحة حتى بعد إصلاح #1.
