# تقرير الفحص الشامل لموقع ZAHIEG — `fails.md`

> تاريخ الفحص: 2026-08-02 · الطريقة: فحص بأدوات آلية (`tsc`، `vite build`) + فريق من 5 Subagents متخصصين (React/Runtime، Supabase/Schema، Backend/SQL، البيانات/التعريب، الصفحات/SEO).
> عدد الأخطاء المكتشفة: **47 خطأ** (7 حرجة، 14 عالية، 16 متوسطة، 10 منخفضة).

---

## 🔴 حرجة (Critical) — تكسر الموقع أو تكشف بيانات حساسة

### C1. مخططان SQL متعارضان تماماً في المشروع
المشروع يحوي مجموعتين متناقضتين لنفس الجداول: `supabase-schema.sql` / `supabase-complete.sql` / `supabase-seed.sql` (مصفوفات `TEXT`، أعمدة `category`/`brand`، لا `role`، لا جداول `wishlist_items`/`cart_items`/`accounting_entries`) مقابل `back-end schema\*.sql` (معرّفات UUID، أعمدة `category_id`/`brand_id`، عمود `role`، جداول الـ wishlist والـ accounting).
- الكود يتوقع "هجين" من الاثنين فلا يعمل مع أيٍّ منهما وحده.
- تشغيل `supabase-seed.sql` على schema الـ back-end ينهار: `invalid input syntax for type uuid: "user-1"`.
- تشغيل `16_indexes.sql` على schema الجذر يفشل: `column products.category_id does not exist`.
- **الحل**: توحيد عائلة schema واحدة (المتوافقة مع الكود فعلياً هي `back-end schema\_run_all_combined.sql` + `fix_schema.sql`) وحذف ملفات الجذر القديمة.

### C2. RLS مكسور أو مفلتَ في كل المخططات — تسريب بيانات أو فشل كامل
| الملف:السطر | المشكلة |
|---|---|
| `supabase-schema.sql:192` | `auth.uid() = user_id` حيث `user_id TEXT` و`auth.uid()` UUID → `operator does not exist: uuid = text` → **لا أحد يقرأ الطلبات أبداً** |
| `supabase-schema.sql:201,204` | `addresses_read` / `notifications_read` بنفس مقارنة uuid=text → فشل دائم |
| `supabase-complete.sql:217,220,221` | `orders_read/addresses_read/notifications_read USING (true)` → **أي زائر يقرأ كل الطلبات والعناوين (هواتف، عناوين شحن، طرق دفع)** |
| `supabase-complete.sql:225,227` | `store_settings_write/announcements_write USING (true)` → أي anon يعدّل إعدادات المتجر |
| `back-end schema\fix_schema.sql:122,126` | `profiles_select_own USING (true)` و `addresses_select USING (true)` → تسريب كل البروفايلات والعناوين |
| `supabase-schema.sql` (كل الجداول) | لا توجد سياسات INSERT/UPDATE/DELETE أصلاً → كل عملية كتابة تفشل بـ `new row violates row-level security policy` |

### C3. تصعيد صلاحية: أي مستخدم يصبح Admin
`back-end schema\15_rls_policies.sql:98-100` — سياسة `profiles_update_own` بـ `USING` فقط **بدون `WITH CHECK`** → المستخدم يحدّث صفّه ويضع `role='admin'` بنفسه (USING يتحقق من الصف الجديد عند غياب WITH CHECK).

### C4. `serve.js` لا يعمل إطلاقاً على Windows + ثغرة Path Traversal
- `serve.js:6` — `new URL('./dist', import.meta.url).pathname` على Windows ينتج `/C:/Users/...` وهو مسار غير صالح → `existsSync` دائماً `false` → **كل الطلبات تعيد 500**. يجب `fileURLToPath` من `node:url`.
- `serve.js:22` — `join(dist, req.url)` بدون تطبيع → `GET /../.env` يقرأ أي ملف من القرص ويعرضه.
- `serve.js:21` — لا يعالج query string (`/assets/app.js?v=1`) → الملف لا يوجد → يُسلم `index.html` بمحتوى خاطئ (كل أصول cache-busting تنكسر).

### C5. قواعد Hooks منتهكة في LoginPage — crash بعد تسجيل الدخول
`src/pages/LoginPage.tsx:138` — `if (isAuthenticated) return null;` قبل استدعاء `useForm` (سطرا 140/145) → عند أول إعادة تصيير بعد نجاح الدخول يُرمى خطأ React *"Rendered fewer hooks than expected"* والصفحة تنكسر للمستخدم.

### C6. `localStorage.setItem` بدون try-catch — شاشة بيضاء عند امتلاء التخزين
8 مواضع تكتب في localStorage بلا حماية، وأي خطأ `QuotaExceededError` (وضع Safari الخاص / امتلاء التخزين) يقع فوق الـ Router **بلا أي ErrorBoundary** → تفكيك الشجرة كلها → شاشة بيضاء:
- `src/contexts/ThemeContext.tsx:23` (أول مزوّد في السلسلة — أخطرها)
- `src/contexts/AuthContext.tsx:93` · `src/contexts/CartContext.tsx:107` · `src/contexts/WishlistContext.tsx:78` · `src/contexts/CompareContext.tsx:29` · `src/contexts/SpinContext.tsx:152`
- `src/hooks/useLocalStorage.ts:17` · `src/hooks/useRecentlyViewed.ts:26`

### C7. `JSON.parse` بدون تحقق من الشكل — انهيار عند أول render ببيانات تخزين تالفة
| الملف:السطر | الخطر |
|---|---|
| `src/contexts/CompareContext.tsx:22-23` | بلا `Array.isArray` → `items.some`/`items.flatMap` (ComparePage:32) يرمي TypeError |
| `src/contexts/CartContext.tsx:97-103` | بلا تحقق `state.items` → `reduce` في subtotal/itemsCount يرمي في أول render لكل التطبيق |
| `src/contexts/WishlistContext.tsx:43-49` | بلا تحقق `state.items` → `find`/`map` يرمي |

---

## 🟠 عالية (High) — أخطاء وظيفية وأمنية مؤكدة

### H1. أعمدة غير موجودة في schema الجذر → استعلامات تفشل دائماً
- `category_id`/`brand_id` غير موجودتين (الصحيح في الجذر: `category`/`brand`): `src/services/productService.ts:38,39,98` · `src/services/adminService.ts:38,39,81-82,101-102,669` → فلترة المنتجات وإنشاؤها وتحديثها تفشل بصمت (fallback محلي يخفي الخطأ).
- `is_active` غير موجود في `coupons` (الجذر): `adminService.ts:273` → إنشاء كوبون يفشل.
- `role` غير موجود في `profiles` (الجذر): `src/contexts/AuthContext.tsx:128-131` → **تسجيل المستخدم الجديد لا يُحفظ أبداً في DB**.

### H2. جداول غير موجودة (حسب schema المطبَّق) → صفحات كاملة معطلة
- `wishlist_items` (غير موجودة في الجذر): `src/contexts/WishlistContext.tsx:59,69,72`.
- `order_email_logs` (الجذر يسميها `order_emails`): `src/pages/CheckoutPage.tsx:108`.
- `accounting_entries` (موجودة فقط في `back-end schema\19_accounting.sql`): `src/services/accountingService.ts:31,60,70,81,88` → **صفحة المحاسبة معطلة كلياً**.
- `store_settings`/`announcements` (غير موجودة في back-end بدون fix_schema): `adminService.ts:589,614,637,650`؛ و`back-end schema\_run_all.sql:63-71` **لا يتضمن `fix_schema.sql`** و`_run_all_combined` **لا يتضمن `19_accounting.sql`** → الإعدادات والطلبات تنهار في النشر الفعلي.

### H3. معرفات نصية في أعمدة UUID (عائلة back-end) → كل insert يفشل
- `src/services/adminService.ts:12-15,68,152,213,264,423,534` — `genId('prod')` ينتج `prod-xxxx` → `invalid input syntax for type uuid`.
- `src/pages/ProductDetailsPage.tsx:86-88` — `id: review-${Date.now()}` و `user_id: 'guest'` → فشل إدراج **كل** المراجعات (FK لـ profiles).
- `src/pages/ProfilePage.tsx:28-30` + `AuthContext.tsx:161,176,191,192` — معرفات `addr-1`/`1752…-abc` → نفس الخطأ على العناوين.
- `src/contexts/WishlistContext.tsx:71` — `user_id` قد يكون `user-1` (fallback من users.json).

### H4. قيم enum خاطئة → كتابة تفشل بـ CHECK constraint
- `src/contexts/SpinContext.tsx:194` — كوبون `type: 'freeShipping'` يخالف CHECK الجذر `('percentage','fixed')` وenum الـ back-end `('percentage','fixed','free_shipping')` → **جائزة العجلة لا تتحول كوبون أبداً**.
- `src/pages/CheckoutPage.tsx:233` — `paymentMethod: 'vodafone-cash'` (بشرطة) مقابل enum `vodafone_cash` → فشل إدراج الطلب في back-end.
- `src/services/adminService.ts:17-22` — يحوّل `freeShipping → 'free_shipping'` (يطابق back-end) لكنه يخالف CHECK الجذر `'freeShipping'/'tryAgain'` (وبالعكس في `supabase-complete.sql:120,158`).
- `AdminNotificationsPage.tsx:14` + `NotificationPopover.tsx:24-28` — `promo`/`system` يخالفان enum back-end `('info','success','warning','error','order')`.

### H5. Storage Buckets — الرفع معطل جزئياً أو كلياً
- `images.sql:9-17` ينشئ bucket `product-images` فقط بينما `src/lib/upload.ts:4-7` يحتاج 4 buckets (`product-images`, `brand-logos`, `category-images`, `avatars`) → رفع الشعارات/الأقسام/الأفاتار يفشل بـ `The resource was not found`.
- `images.sql:29,33` و`uploadimages.sql:25,38,51,64` تستدعي `is_admin()` وهي **غير معرّفة في ملفات الجذر** (فقط في `back-end schema\03_profiles.sql:58`) → فشل إنشاء السياسات نفسها.
- `uploadimages.sql:64,68` — `avatars_owner_insert/delete` تحوّل أول عنصر من `storage.foldername(name)` (وهو `'avatars'`) إلى UUID → `invalid input syntax for type uuid` في كل رفع أفاتار.

### H6. `orders.tracking` قد يكون null → crash في تفاصيل الطلب
`src/services/orderService.ts` (mapOrder) يحمي بـ `tracking: data.tracking || []` أي أن العمود nullable فعلاً، لكن `src/pages/OrderDetailsPage.tsx:57` يمرر `order.tracking` مباشرة إلى `TrackingTimeline.tsx:28` (`events.map`) — صفوف خام من `loadAllData` (data/index.ts:37,47) → أي طلب بـ `tracking: null` يرمي TypeError.

### H7. `getOrderStatusMap()[order.status]` بدون حماية — crash مع حالات غير معروفة
`src/components/features/OrderCard.tsx:26,60` · `src/pages/OrderDetailsPage.tsx:25,49` · `src/pages/ProfilePage.tsx:705,743` — صف خام من DB بحالة ليست ضمن الست في `src/constants/index.ts:40-49` → `statusInfo` undefined → TypeError في قوائم الطلبات.

### H8. بيانات محلية تُفقد نهائياً عند فشل Supabase
`src/data/index.ts:21-29` — `loaded=true` يُضبط قبل `await`؛ وإذا فشل أي استعلام تعيد `loadTable` صفيفة فارغة → تُستبدل `localProducts`/`localCategories` (الكتالوج المحلي) بـ `[]` **إلى الأبد بلا إعادة محاولة** → الموقع يظهر فارغاً حتى لو عاد الإنترنت.

### H9. الأدمين محبوس عن لوحة التحكم
- `src/data/users.json:25-35` — `user-3` (kiady@zahieg.com) **بلا حقل `role`** → `AdminLayout.tsx:139` (`user.role !== 'admin'`) يردّه للرئيسية.
- `User.role` غير موجود في schema الجذر → `mapProfile` (AuthContext.tsx:227) يعيد `'customer'` دائماً → الأدمين لا يُعرف أبداً في مسار DB.
- `supabase-complete.sql:307-313` — تعليمات إنشاء الأدمين تفترض عمود `role` غير الموجود في الجذر (مستحيلة التنفيذ).

### H10. كلمة مرور نصية صريحة في الريبو
`src/data/users.json:28` — `"password": "123456"` بلا تشفير في ملف مصدَّر على git (خطر تسريب بيانات اعتماد).

### H11. ثغرات أمان في SQL إضافية
- `supabase-schema.sql:227,244` — `store_settings_write`/`announcements_write`: `auth.role()='authenticated'` → **أي مستخدم مسجّل يعدّل إعدادات المتجر والإعلانات**.
- `supabase-schema.sql:198` — `coupons_read` للعموم → كشف أكواد الخصم لكل anon.
- `back-end schema\fix_schema.sql:55-57` — `EXCEPTION WHEN OTHERS THEN NULL` يبتلع كل الأخطاء بصمت.
- `back-end schema\19_accounting.sql:8` — `uuid_generate_v4()` بلا `CREATE EXTENSION "uuid-ossp"` → يفشل على مشروع Supabase جديد.

---

## 🟡 متوسطة (Medium)

| # | الملف:السطر | الخطأ |
|---|---|---|
| M1 | `serve.js:23-26` | كل ملف ناقص يُسلم `index.html` بكود 200 (لا 404)؛ و`readFileSync` على مجلد يرمي 500 عام |
| M2 | `serve.js:30` | `max-age=31536000, immutable` على `favicon.svg`/`icons.svg` غير المجزّأة → لا تتحدّث بعد النشر |
| M3 | `serve.js:35-43` | gzip يُخزَّن كاملاً بالذاكرة + لا `error` handler → استجابة معلقة عند فشل الضغط |
| M4 | `vercel.json:2` | `rewrite /(.*) → /index.html` بلا استثناء assets → 404 الحقيقية تختفي (تُسلَّم HTML دائماً) |
| M5 | `start-server.ps1:5` | `FilePath "node_modules\.bin\vite.cmd"` نسبي يُحلّ بالنسبة لـ cwd المتصل لا لـ `$workDir` → يفشل من مجلد آخر |
| M6 | `.env.production` | **متتبع في git** (`.gitignore` يستثني `.env` فقط) — المفتاح `sb_publishable_...` مكشوف في الريبو؛ أضف `.env.*` |
| M7 | `supabase-schema.sql:180-210` | سياسات بلا `DROP POLICY IF EXISTS` → إعادة تشغيل الملف تفشل بـ "policy already exists" |
| M8 | `supabase-schema.sql:12` + `supabase-seed.sql:11-13` | seed بـ `id='user-1'` على عمود UUID → `invalid input syntax`؛ ومراجع `{prod-5,prod-14,prod-22}`/`{ord-1,ord-3}` لمنتجات غير موجودة في seed |
| M9 | `supabase-seed.sql:11-68` | بلا `ON CONFLICT` → إعادة التشغيل = duplicate primary key |
| M10 | `src/pages/CheckoutPage.tsx:125-141,304-395` | نموذج إنشاء الحساب في السلة عربي hard-coded كاملاً (رسائل تحقق + labels) — مستخدم إنجليزي يرى نموذجاً عربياً في خطوة الدفع |
| M11 | `src/styles/globals.css:35` | `direction: rtl` مثبت على `body` بدون override للوضع الإنجليزي → عناصر خارج Layout تبقى RTL |
| M12 | `AddressesPage.tsx:20` · `OrderDetailsPage.tsx:19` · `MyOrdersPage.tsx:27` · `InvoicePage.tsx:16` | `dir="rtl"` مثبت على غلاف صفحات كاملة → المستخدم الإنجليزي يراها RTL |
| M13 | `src/utils/seo.ts:15` | `og:image → https://zahieg.com/og-image.jpg` والملف غير موجود في `public/` → 404 في كل مشاركة اجتماعية |
| M14 | `src/constants/index.ts:5` | `SITE_URL='https://zahieg.com'` مقابل `robots.txt:3`/`sitemap.xml` → `https://zahi.store` — دومينان متعارضان |
| M15 | `src/data/users.json` | اسم مكرر "محمد الكيادي" لنفس النقش (user-1, user-2) — خطأ نسخ؛ وكل المستخدمين بلا `role` (إجباري في `User` بمنسق `as User[]` في data/index.ts:7-17) |
| M16 | `src/data/orders.json` + `reviews.json` | بيانات متداعية: `orders.json:47,54` أصناف لمنتجات غير موجودة (prod-5/6)؛ `orders.json:93,100,107` (prod-3/8/4)؛ `reviews.json` 9 من 12 تقييماً لمنتجات غير موجودة (prod-3..21)؛ `reviews.json:41,65,88,101,113` لـ userId غير موجود (user-4..8)؛ `orders.json:115` subtotal=8094 بينما مجموع الأصناف 7094 (فرق 1000) |

---

## 🔵 منخفضة (Low) — تحسينات وملاحظات

| # | الملف:السطر | الملاحظة |
|---|---|---|
| L1 | `src/pages/ProductsPage.tsx:88-89` · `CategoryProductsPage.tsx:36` | نصوص "حريمى/قريباً.. عالم الأنوثة" عربية hard-coded |
| L2 | `ProductCard.tsx:44,52,94,131,169` · `CartItem.tsx:64-77` · `BrandCard.tsx:49` · `CategoryCard.tsx:41` | toasts وبطاقات عربية للإنجليزي |
| L3 | `NotificationPopover.tsx:64-172` · `TrackingTimeline.tsx:13-18` · `SpinResultModal.tsx:17-247` · `SpinWheel.tsx:204` · `SearchSuggestions.tsx:15-19,114-232` | واجهات كاملة عربية ثابتة |
| L4 | `AdminDashboardPage.tsx:98-219` | لوحة التحكم عربية كاملة بينما `AdminAccountsPage` يستخدم `lang==='ar'` — تناقض i18n في admin |
| L5 | `ui/Input.tsx:14` · `Textarea.tsx:11` · `Select.tsx:19` · `CartPage.tsx:137` · `ProductDetailsPage.tsx:62,115,117` | `dir='rtl'` افتراضي في حقول إنجليزية |
| L6 | `ProductGallery.tsx:55-178` · `Rating.tsx:25` · `QuantitySelector.tsx:50-72` · `Spinner.tsx:21` · `AnnouncementBar.tsx:60` · `ReviewCard.tsx:72` | aria-labels عربية |
| L7 | `public/manifest.json` | `dir: "auto"` مع `lang: "ar"` — يجب `dir: "rtl"` |
| L8 | `src/i18n/ar.json:86-88,266` | لا صيغ جمع عربية (`_one/_other`) — نفس النص لكل الأعداد |
| L9 | `back-end schema\02:30` | `valid_discount CHECK` يرفض منتجاً بخصم بلا old_price — والخطأ غير مفحوص في `adminService.ts:86` |
| L10 | أدوات الفحص | `.eslintrc.cjs` قديم غير مدعوم في ESLint 9+؛ `eslint` غير مثبت في `package.json` (script `lint:eslint` يثبّت نسخة 10 تلقائياً وتفشل)؛ chunk الرئيسي `index-*.js` = **559 KB** بعد التصغير (تحذير build) |

---

## ✅ سليم (تم التحقق منه ولا يوجد خطأ)

- `tsc --noEmit` **نظيف 100%** — لا أخطاء أنواع.
- `npm run build` ينجح (تحذير حجم chunk فقط).
- i18n: ملفا `ar.json`/`en.json` متطابقان تماماً (1153 مفتاحاً لكل منهما)، لا مفاتيح ناقصة ولا placeholders مخالفة، والإعداد سليم (`fallbackLng: 'ar'`).
- لا روابط Router مكسورة، ولا imports لملفات غير موجودة، ولا مكونات غير معرّفة، وكل الصفحات الـ 12 في admin مسجلة.
- لا انتهاكات قواعد Hooks خارج `LoginPage.tsx:138`، ولا تبعيات useEffect خاطئة بأثر وظيفي، ولا race conditions في react-query.
- لا ملفات JSON تالفة البنية، ولا معرفات مكررة، ولا روابط صور مكسورة.

---

## 🎯 أولويات الإصلاح (ترتيب مقترح)

1. **توحيد مخطط SQL واحد** (C1) — يستحيل إصلاح أي شيء آخر فوقها قبل هذا.
2. **إصلاح RLS** (C2, C3, H11) — تسريب بيانات كامل حالياً.
3. **إصلاح `serve.js`** (C4) — Path traversal + لا يعمل على Windows أصلاً.
4. **حماية localStorage** (C6, C7) — 8 مواضع كتابة + 3 قراءات + إضافة ErrorBoundary.
5. **إصلاح LoginPage** (C5) — نقل `useForm` قبل الـ return الشرطي.
6. **مطابقة أعمدة/جداول/enums/معرّفات** بين الكود وschema (H1-H5).
7. **إصلاح الرفع** (H5) — إنشاء الـ 4 buckets + `is_admin()` + سياسة avatars.
8. **حماية البيانات** (H6, H7, H8) — optional chaining + إعادة محاولة loadAllData.
9. **إصلاح الوصول للأدمين** (H9, H10) — إضافة `role` + حذف كلمة المرور النصية.
10. **تنظيف البيانات** (M15, M16) — إصلاح مراجع المنتجات/المستخدمين في JSON.
