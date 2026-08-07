# تقرير Agent #10 — "الضابط العام" — الفحص الشامل للتكامل بين الكود والسكيما

**التاريخ:** 2 أغسطس 2026
**النطاق:** src/services (كامل) + src/types + src/lib + src/contexts المرتبطة + src/pages + سكربتات السكيما في الجذر + مجلد "back-end schema" + ملفات البيئة
**الطبيعة:** فحص فقط — لم يُعدَّل أي ملف.

---

## 0) خلاصة تنفيذية

المشروع يحتوي **3 أجيال متضاربة من السكيما** وطبقة خدمات تخلط بينها:

1. **الجيل القديم** (`supabase-schema.sql` / `supabase-complete.sql` / `supabase-seed.sql`): مفاتيح نصية `TEXT PK`، أعمدة `category`/`brand` (بدون `_id`)، `profiles.auth_id`، جدول `order_emails`.
2. **الجيل الجديد** (`back-end schema/`): مفاتيح `UUID PK`، أعمدة `category_id`/`brand_id`، enums، 22 جدول + إصلاحات `fix_schema.sql` (يضيف `store_settings` و`announcements` و`orders.items` و`spin_prizes.coupon_code`).
3. **الجيل المدمج** (`_run_all_combined.sql`): نفس الجديد + فقرة "RLS مخففة للتطوير" خطيرة، لكنه **ينقصه `19_accounting.sql`** (جدول `accounting_entries` غير موجود فيه).

**أخطر اكتشاف:** كل دوال الإنشاء في `adminService` تولّد معرّفات نصية (`cat-xxxx`, `prod-xxxx`, `coupon-xxxx`, `notif-xxxx`, `spin-xxxx`) بينما السكيما الجديدة `UUID PK` → **كل عمليات INSERT للأدمن تفشل** (خطأ `invalid input syntax for type uuid`). السكيما القديمة (TEXT PK) هي الوحيدة المتوافقة مع صيغة المعرفات هذه.

---

## أ) الجدول الرئيسي — كل جدول يُستدعى في src مقابل السكيما

| # | الجدول المُستدعى في src | معرّف في "back-end schema"؟ | اسم الجدول الفعلي إن اختلف | الصفحات/السياقات المعتمدة | الحالة |
|---|---|---|---|---|---|
| 1 | `products` | ✅ نعم (02) | — | AdminProductsPage, AdminDashboardPage, AdminReviewsPage, ProductsPage (عبر productService), ProductDetailsPage, WishlistContext, AboutPage | ⚠️ **غير متوافق عمليًا** — استعلامات القراءة (category_id/brand_id) صحيحة، لكن INSERT/UPDATE/DELETE بالمعرّفات النصية تفشل مع UUID PK |
| 2 | `categories` | ✅ نعم (01) | — | AdminCategoriesPage, AdminProductsPage, AdminDashboardPage | ⚠️ قراءة متوافقة / كتابة غير متوافقة (id نصي vs UUID) |
| 3 | `brands` | ✅ نعم (01) | — | AdminBrandsPage, AdminProductsPage, AdminDashboardPage | ⚠️ نفس وضع categories |
| 4 | `coupons` | ✅ نعم (08) | — | AdminCouponsPage, AdminDashboardPage, (CartPage يقرأ محليًا) | ⚠️ قراءة متوافقة؛ الكتابة تفشل بالمعرّف النصي؛ RLS الصارم يمنع غير الأدمن (متوافق مع الأدمن) |
| 5 | `orders` | ✅ نعم (06) | — | AdminOrdersPage, AdminDashboardPage, CheckoutPage (عبر orderService), AboutPage | ❌ **حرجة** — عمود `items` موجود فقط بعد `fix_schema`؛ `user_id NOT NULL` يرفض طلبات الزوار؛ enum payment_method يرفض `vodafone-cash` |
| 6 | `reviews` | ✅ نعم (07) | — | AdminReviewsPage, ProductDetailsPage | ❌ **حرجة** — `id` نصي `review-<timestamp>` و`user_id: 'guest'` غير صالحين لـ UUID → التقييمات لا تُحفظ أبدًا |
| 7 | `notifications` | ✅ نعم (09) | — | AdminNotificationsPage, (NotificationPopover) | ❌ `user_id: ''` ينتهك `NOT NULL` → الإشعارات لا تُحفظ أبدًا |
| 8 | `profiles` | ✅ نعم (03) | — | AdminUsersPage, AuthContext, AboutPage | ⚠️ متوافقة (id=UUID الخاص بـ auth) — لكن `role` enum موجود بالجديد فقط؛ أعمدة `addresses/orders/wishlist/notifications` (مصفوفات) غير موجودة بالجديد → تقع في undefined (تأثير تجميلي) |
| 9 | `spin_prizes` | ✅ نعم (10) | — | AdminSpinPrizesPage, SpinContext | ⚠️ قراءة متوافقة + تحويل الأنواع جاهز (SPIN_TYPE_MAP)؛ الكتابة تفشل بالمعرّف النصي؛ `coupon_code` يحتاج fix_schema |
| 10 | `store_settings` | ⚠️ فقط في `fix_schema.sql` والمدمج | — (جدول مخصص أضافه fix) | AdminSettingsPage | ❌ **غائب عن المسار الموصّى** في README و `_run_all.sql` → إعدادات المتجر بلا حفظ فعلي |
| 11 | `announcements` | ⚠️ فقط في `fix_schema.sql` والمدمج | — | AdminSettingsPage, (AnnouncementBar) | ❌ نفس مشكلة store_settings |
| 12 | `order_email_logs` | ✅ نعم (17) | ❌ في القديم يسمى `order_emails` | CheckoutPage | ⚠️ الاسم مطابق للجديد فقط؛ RLS يمنع INSERT لغير الأدمن → السطر لا يُكتب (خطأ صامت) |
| 13 | `back_in_stock_requests` | ✅ نعم (11) | — | ProductDetailsPage | ⚠️ `product_id` نصي (من بيانات محلية) vs UUID → فشل FK للمنتجات المحلية |
| 14 | `wishlist_items` | ✅ نعم (05) | ❌ غير موجود في القديم إطلاقًا | WishlistContext | ⚠️ غير موجود في الجيل القديم؛ وفي الجديد `user_id`/`product_id` UUID بينما الكود يرسل معرّفات نصية/مزيفة |
| 15 | `accounting_entries` | ⚠️ فقط في `19_accounting.sql` | — | AdminAccountsPage | ❌ **غائب عن الملف المدمج** `_run_all_combined.sql`؛ و`19_accounting.sql` يستخدم `uuid_generate_v4()` بدون pgcrypto → يفشل على مشروع جديد |

---

## ب) الدوال (rpc) والأكوام (storage)

### الدوال RPC — تم البحث بـ `\.rpc\(` في كامل src: **صفر استدعاءات**

| الدالة في السكيما | الموقع في السكيما | مستخدمة؟ | ملاحظة |
|---|---|---|---|
| `get_dashboard_data()` | 18_dashboard_views.sql | ❌ غير مستخدمة | الأدمن يستخدم `adminService.getStats()` بـ 6 استعلامات منفصلة |
| `validate_coupon(code, total)` | 08_coupons.sql | ❌ غير مستخدمة | التحقق من الكوبون عميل-جانب من ملفات @/data المحلية |
| `increment_coupon_usage(code)` | 17_functions_triggers.sql | ❌ غير مستخدمة | |
| `is_admin()` | 03_profiles.sql | ✅ مستخدمة (داخل سياسات RLS فقط) | |
| `get_user_order_count` / `is_low_stock` | 17 | ❌ غير مستخدمتين | |

### أكوام Storage — كل الأكوام الأربعة مطابقة للأسماء المتوقعة

| الـ bucket في الكود | مرجع | معرّف في السكيما؟ | ملاحظة |
|---|---|---|---|
| `product-images` | src/lib/upload.ts:4 | ✅ (images.sql / uploadimages.sql) | RLS `is_admin()` — متوافق مع الأدمن |
| `brand-logos` | src/lib/upload.ts:5 | ✅ uploadimages.sql | RLS `is_admin()` — متوافق |
| `category-images` | src/lib/upload.ts:6 | ✅ uploadimages.sql | RLS `is_admin()` — متوافق |
| `avatars` | src/lib/upload.ts:7 | ✅ uploadimages.sql | ❌ **غير متوافق** — RLS يتطلب مسار `avatars/<user-uuid>/...` بينما الكود يرفع `avatars/<uuid عشوائي>.ext` → رفض الرفع |

---

## ج) قائمة المشاكل الكاملة (الموقع | الوصف | الخطورة | الحل المقترح)

| # | الموقع | الوصف | الخطورة | الحل المقترح |
|---|---|---|---|---|
| 1 | adminService.ts:86,156,216,269,426,538 (وكل `.eq('id', id)` مثل 108,121,60) | المعرّفات المولّدة نصية (`cat-xxx`, `prod-xxx`, `coupon-xxx`, `notif-xxx`, `spin-xxx`) بينما السكيما الجديدة `UUID PK` → كل عمليات الإنشاء/التحديث/الحذف تفشل (22P02) وتقع في "الـ fallback المحلي" بصمت | **حرجة** | اعتماد السكيما القديمة (TEXT PK) أو توليد UUID صحيح في الكود |
| 2 | orderService.ts:50 + CheckoutPage.tsx:87-107 | نتيجة `insert` الطلبات مهملة تمامًا → أي فشل (RLS للزوار، enum payment_method، NOT NULL user_id) يضيع الطلب بصمت مع رسالة نجاح كاذبة | **حرجة** | فحص `error` وإظهار رسالة فشل حقيقية؛ ربط userId حقيقي أو جدولة طلبات الزوار |
| 3 | CheckoutPage.tsx:233 + PaymentPage.tsx:10 + utils/format.ts:55 | `payment_method: 'vodafone-cash'` (واصلة) بينما enum السكيما `vodafone_cash` (underscore) → رفض الحفظ | **حرجة** | توحيد القيمة مع enum السكيما |
| 4 | back-end schema/15_rls_policies.sql مقابل fix_schema.sql:75-102 و _run_all_combined.sql:1781-1846 و supabase-complete.sql:217,225-227 | سياسات "مخففة": `profiles SELECT true` (تسريب أسماء/إيميلات/موبايلات كل العملاء)، `addresses SELECT true`، أي مستخدم مسجل يعدّل/يحذف المنتجات والتصنيفات والماركات، و`store_settings_write`/`announcements_write USING(true)` تسمح حتى للزائر المجهول بتعديل إعدادات المتجر | **حرجة (أمن)** | تشغيل `15_rls_policies.sql` الصارم وحذف فقرة التخفيف من المدمج والقديم |
| 5 | ProductDetailsPage.tsx:86-97 | `reviews.id = 'review-<timestamp>'` و `user_id: 'guest'` غير صالحين لـ UUID → إضافة التقييم تفشل دائمًا | **عالية** | حذف الـ id (اتركه للـ DEFAULT) وإرسال `user_id: null` للزوار |
| 6 | adminService.ts:426-430 | `createNotification` يرسل `user_id: data.userId \|\| ''` → انتهاك `NOT NULL` (UUID) → الإشعارات لا تُحفظ | **عالية** | إرسال `null` أو استخدام id مستخدم حقيقي |
| 7 | AuthContext.tsx:117 | عند التسجيل يُحفظ بروفايل بـ id حقيقي لكن حالة الذاكرة تحمل id وهمي `user-${Date.now()}` → طلبات/مفضلة المستخدم الجديد لا ترتبط بحسابه | **عالية** | استخدام `data.user.id` في حالة الذاكرة |
| 8 | WishlistContext.tsx:59,69-72 | `wishlist_items` بـ user_id/product_id من نوع UUID بينما الكود يرسل معرّفات نصية (منتجات محلية) أو id مزيف | **عالية** | إرسال قيم UUID فقط، وتعطيل المزامنة مع المنتجات المحلية |
| 9 | upload.ts:20-23 مقابل uploadimages.sql:64-68 | مسار رفع الـ avatars `avatars/<uuid>.ext` لا يطابق شرط RLS `avatars/<user-uuid>/...` → رفض الرفع | **عالية** | تعديل المسار ليشمل مجلد بمعرّف المستخدم |
| 10 | orders.items (orderService.ts:37) | عمود `items` غير موجود في السكيما الجديدة الأساسية؛ يُضاف فقط عبر `fix_schema.sql`/المدمج — اتباع README أو `_run_all.sql` حرفيًا يكسر إنشاء الطلبات ("column orders.items does not exist") | **عالية** | تضمين fix_schema في كل مسارات التشغيل أو دمج العمود في 06_orders.sql |
| 11 | back-end schema/19_accounting.sql:8 | `uuid_generate_v4()` بدون `CREATE EXTENSION IF NOT EXISTS pgcrypto` → يفشل على مشروع جديد | **عالية** | إضافة سطر إنشاء الامتداد |
| 12 | back-end schema/_run_all_combined.sql | **لا يتضمن `19_accounting.sql`** → صفحة AdminAccountsPage ستفشل (الخدمة ترمي error) لمن شغّل الملف المدمج | **عالية** | دمج 19 في الملف المدمج أو توثيق ضرورة تشغيله منفصلًا |
| 13 | store_settings / announcements | الجدولان غير موجودين في مسار README أو `_run_all.sql` → AdminSettingsPage تعمل بذاكرة محلية بلا حفظ | **عالية** | إضافة fix_schema.sql (أو الجدولين) إلى README و_run_all.sql |
| 14 | supabase-seed.sql (كامل) | seed مصمم للجيل القديم: `profiles.id='user-1'` (غير صالح لـ UUID)، أعمدة `products.category/brand` غير موجودة في الجديد، وأنواع `freeShipping`/`tryAgain` غير صالحة لـ enum الجديد → **لا يعمل مع أي من الجيلين** (حتى القديم يفشل في profiles) | **عالية** | إعادة كتابة seed بما يطابق السكيما المعتمدة |
| 15 | supabase-schema.sql / supabase-complete.sql (الجيل القديم) | أعمدة `category`/`brand` (بدون `_id`)، `profiles.auth_id`، `order_emails` بدل `order_email_logs`، نوع `notifications.type` بقيم مختلفة، و`coupons.type` بقيم camelCase — **متعارضة تمامًا مع الكود الحديث** | **عالية** | إهمال/حذف الجيل القديم بعد اعتماد الجديد |
| 16 | src/lib/supabase.ts:3-4 | `createClient` بلا تحقق من وجود المتغيرات → شاشة بيضاء لو البيئة ناقصة | **متوسطة** | تحقق + رسالة خطأ لطيفة |
| 17 | .env / .env.production | المفاتيح موجودة (VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY في كليهما) — لا توجد مفاتيح باسم SUPABASE_URL/SUPABASE_ANON_KEY أصلاً (الاسم الحقيقي VITE_)* | **متوسطة** | (لا حاجة لقيم — يكفي التوثيق) |
| 18 | CartPage.tsx:38-44 + coupons | التحقق من الكوبون يتم من بيانات @/data المحلية، فالكوبونات المضافة من الأدمن إلى DB لا تُستخدم أبدًا؛ `validate_coupon()` معطلة | **متوسطة** | استخدام جدول/دالة DB للتحقق |
| 19 | adminService.ts:96-107 (updateProduct) | قيد `valid_discount` (02_products.sql:30) يرفض discount بدون old_price → تحديث المنتجات بخصم يفشل بصمت | **متوسطة** | إرسال old_price مع الخصم أو تخفيف القيد |
| 20 | back-end schema/10_spin_wheel.sql:22,44 (value INTEGER) مقابل adminService.ts:534 | نوع القيمة INTEGER في السكيما بينما الكود قد يرسل قيم كسرية → قيود صحيحة لكن قد تُرفض أرقام عشرية | **منخفضة** | NUMERIC أو توثيق |
| 21 | AboutPage.tsx:13 | `profiles count` مع RLS الصارم يعرض عدد بروفايل المستخدم فقط (0 للزائر) → إحصائية خاطئة | **منخفضة** | استخدام view/dashboard function |
| 22 | adminService.getStats (477-513) | إعادة الاستعلامات مباشرة بدل `get_dashboard_data()` (غير مستخدمة) — ازدواجية أداء + كود ميت | **منخفضة** | توحيد عبر الدالة |
| 23 | adminService.createNotification type | enum الجديد `notification_type` = ('info','success','warning','error','order') بينما القديم = ('order','promo','system','info') — إرسال قيم غير مدرجة في أي منهما يفشل | **منخفضة** | توحيد قيم الأنواع |
| 24 | orders.valid_totals (06_orders.sql:46) | قيد مساواة صارم `total = subtotal + shipping - discount` — الحساب في CartContext.tsx:138 بنفس الصيغة فيمرّ عادةً، لكن أي اختلاف مستقبلي في حساب الخصم سيرفض الطلب | **منخفضة** | إبقاء القيد مع ضمان وحدة الحساب |

---

## د) مقارنة ملفات الجذر (supabase-schema / supabase-complete / supabase-seed) مع "back-end schema"

| البند | supabase-schema.sql | supabase-complete.sql | supabase-seed.sql | back-end schema/ (الجديد) |
|---|---|---|---|---|
| المفاتيح | `TEXT PK` | `TEXT PK` | نصية ('user-1','cat-1'...) | `UUID PK` |
| ربط المنتج بالتصنيف/الماركة | `category`/`brand` TEXT | `category`/`brand` TEXT | `category`/`brand` | `category_id`/`brand_id` UUID |
| profiles | `id` مستقل + `auth_id` + مصفوفات (addresses/orders/wishlist/notifications) — **بدون role** | نفس الشيء | `id='user-1'` نصي | `id` = auth.users.id + `role` enum |
| orders | بلا `items`، payment_method TEXT | نفس الشيء | — | بلا `items` (يُضاف بـ fix) + `payment_method` enum |
| order_email_logs | باسم **`order_emails`** | باسم `order_emails` | — | `order_email_logs` ✅ |
| coupons.type | TEXT CHECK ('percentage','fixed') | TEXT CHECK (يضيف 'freeShipping') | 'percentage','fixed' | enum ('percentage','fixed','free_shipping') |
| spin_prizes.type | TEXT CHECK ('...freeShipping...tryAgain') | نفسه | camelCase (freeShipping/tryAgain) | enum underscores |
| store_settings / announcements | ✅ موجودان | ✅ موجودان | ❌ | ✅ فقط عبر fix_schema |
| cart/wishlist/settings/spin_history/... | ❌ غائبة | ❌ غائبة | ❌ | ✅ كاملة |
| RLS | صارمة نسبيًا | **مخففة** (orders_read USING(true)، write باستخدام true) | — | صارمة + فقرة تخفيف في المدمج |
| المحاسبة | ❌ | ❌ | ❌ | ✅ في 19 فقط (خارج المدمج!) |

**خلاصة المقارنة:**
- `supabase-seed.sql` **لا يطابق أعمدة أي من الجيلين**: يفشل مع الجديد (UUID/أعمدة) ومع القديم (id 'user-1' غير صالح لـ UUID حتى هناك). أُعيدت كتابته على افتراضات مختلطة.
- جداول موجودة في القديم وليست في الجديد: **لا يوجد** (الجديد يشمل القديم تقريبًا) — بالعكس، القديم ناقص (لا cart_items، wishlist_items، settings، spin_history، order_items، newsletter_subscribers، contact_messages، recently_viewed، recent_searches، accounting_entries).
- **أيٌّ يُعتمد؟** يجب اعتماد **"back-end schema" (الجديد)** لأنه الأقرب لاستعلامات الكود (category_id/brand_id، order_email_logs) — مع الشرطين الحاسمين: (1) `fix_schema.sql` إلزامي (فيه store_settings/announcements/orders.items)، (2) `19_accounting.sql` لا بد أن يُشغَّل (غير موجود بالمدمج)، (3) حذف فقرة RLS المخففة من المدمج، و(4) **إصلاح توليد المعرّفات في الكود ليطابق UUID** وإلا تبقى الكتابة معطلة كليًا.

---

## هـ) تقييم دقة ACTIONS_MAP.md

| البند في ACTIONS_MAP | الحكم |
|---|---|
| `products.category_id/brand_id`، `orders.shipping_address` JSONB، `tracking` JSONB، `order_items`، `recently_viewed`، `recent_searches`، `contact_messages`، `back_in_stock_requests`، `spin_history.guest_phone`، `user_sales_summary` | ✅ **مطابق للجديد** |
| قائمة "22 جدول" في الجدول الختامي | ✅ تتطابق مع 22 جدول الجديد (بدون store_settings/announcements/accounting_entries — ناقصة) |
| إدارة الإعدادات: "READ/UPDATE: `settings` (announcement, store_info, shipping)" | ❌ **غير دقيق** — الكود يستخدم جدولين مخصصين `store_settings` و`announcements` (من fix_schema)، لا جدول `settings` key-value |
| الداشبورد: "READ: `dashboard_stats` VIEW + `get_dashboard_data()`" | ⚠️ الجدول/الدالة موجودان لكن **الكود لا يستدعيهما** — الخريطة تصف المستقبل لا الواقع |
| الكوبون: "READ: `validate_coupon(code, total)` function" | ⚠️ الدالة موجودة لكن غير مستخدمة — التحقق محلي |
| `order_email_logs` (قسم Checkout) | ✅ الاسم مطابق للجديد (والقديم `order_emails` خاطئ) |
| `payment_method` | ✅ enum مطابق (لكن لا يذكر شرط underscore، والكود يخالفه فعليًا) |
| `reviews` — "UPDATE: likes" | ⚠️ لا توجد سياسة UPDATE للزوار في الجديد (فقط المالك/الأدمن) — ثانوية |

**التقييم العام:** دقة ≈ **85%** — دقيقة جدًا مع السكيما الجديدة في أسماء الجداول والأعمدة، لكنها متخلفة عن الواقع الفعلي للكود في ثلاث نقاط جوهرية: (settings مقابل store_settings/announcements، dashboard function غير مستخدمة، validate_coupon غير مستخدم).

---

## و) خلاصة "production report.md"

الملف موجود ويحتوي **26 مشكلة معروفة مسبقًا** بتقسيم مراحل (قبل الإطلاق / أسبوع أول / أسبوعان+). أهم ما ورد ويتقاطع مع هذا الفحص:

1. `.env.production` متتبع في git (بيانات Supabase حية) — منع تسجيله.
2. خلط دومينين `zahieg.com`/`zahi.store` في sitemap/robots/JSON-LD — يضر SEO.
3. بناء `dist/` قديم (15 يوليو) — صفحة `/contacts` غير موجودة فيه.
4. **RLS متساهل** (نفس ما رصده هذا التقرير في الفقرة "المخففة").
5. الدفع "باي موب" غير مفعل؛ والطلبات قد تضيع بصمت (نفس المشكلة الحرجة #2 عندي).
6. خلل enum `payment_method` (vodafone-cash vs vodafone_cash) — نفس المشكلة الحرجة #3.
7. نماذج وهمية (اتصل بنا، نيوزليتر، إيميلات الطلبات، سبين الحظ).
8. مسار avatars لا يطابق RLS — نفس مشكلتي #9.
9. تضارب `order_emails`/`order_email_logs` بين الأجيال — يؤكد استنتاجي.
10. `19_accounting.sql:8` بلا pgcrypto — يؤكد مشكلتي #11.

**الخلاصة:** التقرير السابق متوافق بنسبة عالية مع اكتشافاتي، وأضيف إليه الآن أبعادًا جديدة لم يذكرها: **عدم توافق UUID للمعرّفات المولّدة في adminService (مشكلة #1)، غياب store_settings/announcements عن مسار README، غياب 19_accounting عن الملف المدمج، عدم صلاحية seed مع أي جيل، وامتناع حفظ التقييمات/الإشعارات لوجود قيم غير صالحة.**

---

## ز) قائمة أولويات الإصلاح النهائية (لتشغيل لوحة التحكم 100%)

### المرحلة 0 — قرار معماري (قبل أي شيء)
1. **اعتماد جيل واحد من السكيما**: "back-end schema" (الجديد) وحذف/أرشفة `supabase-schema.sql`/`supabase-complete.sql`/`supabase-seed.sql` من جذر المشروع (أو نقلها إلى `legacy/`) لمنع تشغيلها بالخطأ.

### المرحلة 1 — حرجة (لوحة التحكم لا تعمل بدونها)
2. **توليد UUID صالح في adminService** (و ProductDetailsPage، WishlistContext، AuthContext) بدل المعرّفات النصية — أو العودة إلى TEXT PK. هذا يفتح كل عمليات CRUD.
3. **تضمين `fix_schema.sql` في كل مسارات التشغيل** (README + _run_all.sql) حتى يوجد `store_settings`، `announcements`، `orders.items`، `spin_prizes.coupon_code`.
4. **دمج `19_accounting.sql` في `_run_all_combined.sql`** + إضافة `CREATE EXTENSION IF NOT EXISTS pgcrypto` في أعلى الملف.
5. **حذف فقرة RLS المخففة** من `_run_all_combined.sql` و`fix_schema.sql` وتفعيل سياسات `15_rls_policies.sql` الصارمة (مع الاحتفاظ باستثناءات مبررة كقراءة الكوبونات العامة أو عمل الأدمن).
6. **إصلاح `payment_method`**: توحيد `vodafone-cash` → `vodafone_cash` في CheckoutPage/PaymentPage/format.ts.
7. **معالجة أخطاء insert الطلبات** في orderService (فحص error وإبلاغ المستخدم بدل النجاح الكاذب) + قرار لطلبات الزوار.

### المرحلة 2 — عالية (الوظائف الأساسية للمتجر)
8. إصلاح حفظ التقييمات (id/user_id) والإشعارات (user_id) وback-in-stock (product_id).
9. إصلاح id المستخدم الوهمي في AuthContext بعد التسجيل + مزامنة WishlistContext بالمعرّفات الحقيقية.
10. إصلاح مسار رفع avatars ليطابق سياسة RLS.
11. إعادة كتابة `supabase-seed.sql` ليطابق السكيما الجديدة (أو إلغاؤه والاعتماد على seed كامل داخل الجديد).

### المرحلة 3 — متوسطة/تحسينات
12. ربط الكوبونات بالتحقق من DB (`validate_coupon`) بدل البيانات المحلية.
13. استخدام `get_dashboard_data()` في إحصائيات الأدمن.
14. حماية `createClient` من المتغيرات الناقصة + منع تتبع `.env.production` في git.
15. إزالة كل أثر `zahi.store` وتوحيد بيانات التواصل في constant واحد.

---

## ملاحظة على ملفات البيئة (بدون قيم)

- `.env` ✅ موجود — يحتوي `VITE_SUPABASE_URL` و `VITE_SUPABASE_PUBLISHABLE_KEY` (القيمتان موجودتان وغير فارغتين).
- `.env.production` ✅ موجود — يحتوي نفس المفتاحين بقيم حاضرة.
- لا يوجد أي مفتاح باسم `SUPABASE_URL`/`SUPABASE_ANON_KEY` — الأسماء الفعلية المستخدمة في الكود (src/lib/supabase.ts) هي `VITE_SUPABASE_URL`/`VITE_SUPABASE_PUBLISHABLE_KEY` وهي موجودة في كلا الملفين.
- تحذير: `.env.production` كان متتبعًا في git حسب التقرير السابق — يجب منعه.
