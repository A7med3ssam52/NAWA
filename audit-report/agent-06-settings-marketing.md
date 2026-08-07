# تقرير Agent #6 — فحص توافق سكيما الإعدادات والتسويق مع لوحة التحكم (ZAHIEG)

## 1. النطاق

- **السكيما (قراءة فقط):**
  - `back-end schema/11_marketing.sql` (testimonials, newsletter_subscribers, contact_messages, back_in_stock_requests)
  - `back-end schema/12_settings.sql` (settings + البذور announcement/store_info/shipping)
  - `back-end schema/13_optional_features.sql` (recently_viewed, recent_searches)
  - `back-end schema/15_rls_policies.sql` (أقسام الجداول المذكورة + إجمالي تفعيل RLS)
  - إضافياً (لازم للاكتمال): `fix_schema.sql` و`_run_all_combined.sql` و`_run_all.sql` — لأن الجداول `store_settings` و`announcements` التي يعتمد عليها الكود معرّفة **خارج** الملفات 11–13.
- **الواجهة:** `src/pages/admin/AdminSettingsPage.tsx` (كامل) + `src/components/layout/AnnouncementBar.tsx` + `src/components/features/NewsletterSection.tsx`
- **الخدمات والأنواع:** `src/services/adminService.ts` (getStoreSettings/updateStoreSettings/getAnnouncement/updateAnnouncement)، `src/types/index.ts`، `src/data/index.ts`، `src/pages/ProductDetailsPage.tsx`، `src/constants/index.ts`
- **النتيجة الجوهرية:** الواجهة والخدمة تستخدمان جدولين **`store_settings` و`announcements` غير معرّفين في الملفات 11/12/13**، ولا يوجد في الكود أي استخدام لجدول `settings` (key/value) رغم وجوده كامل المواصفات. كما أن جدول `newsletter_subscribers` غير مستخدم من أي كود في الواجهة.

## 2. خريطة التوافق

| عنصر الواجهة | الجدول.العمود في السكيما | النوع | مطابق/مختلف |
|---|---|---|---|
| نص الإعلان `announcement.text` (AdminSettingsPage:16,93) | `announcements.text` (fix_schema.sql:33) | TEXT | مطابق (لكن الجدول ليس ضمن 11_marketing.sql) |
| تفعيل الإعلان `announcement.enabled` (سطر 16) | `announcements.enabled` | BOOLEAN | مطابق |
| قابلية الإغلاق `announcement.dismissible` (سطر 16) | `announcements.dismissible` | BOOLEAN | مطابق |
| `AnnouncementConfig` (types/index.ts:179-183): id/title/description/is_active/type/color/start_date/end_date | غير موجودة — التصميم الفعلي صف وحيد `id='default'` | TEXT/UUID | مختلف عن الافتراض المطروح لكن متوافق مع الواجهة الحالية |
| اسم المتجر `storeInfo.name` (سطر 65) | `store_settings.name` (fix_schema.sql:9) | TEXT | مطابق |
| وصف المتجر (سطر 66) | `store_settings.description` | TEXT | مطابق |
| تكلفة الشحن `shipping.cost` (سطر 79) | `store_settings.shipping_cost` | DECIMAL(10,2) | مطابق |
| حد الشحن المجاني (سطر 80) | `store_settings.free_shipping_threshold` | DECIMAL(10,2) | مطابق |
| الهاتف/البريد/العنوان (أسطر 151-153) | `store_settings.phone / email / address` | TEXT | مطابق |
| `getStoreSettings()` (adminService.ts:588) | `store_settings` بقراءة `.single()` | — | مطابق بشرط وجود الصف `'default'` (بذرة fix_schema) |
| `updateStoreSettings()` (adminService.ts:605) | upsert `{id:'default', ...}` | TEXT PK | مطابق مع fix_schema |
| `getAnnouncement()` (adminService.ts:636) | `announcements` بقراءة `.single()` | — | مطابق بشرط وجود الصف `'default'` |
| `updateAnnouncement()` (adminService.ts:645) | upsert `{id:'default', ...}` | TEXT PK | مطابق مع fix_schema |
| نسبة الضريبة `tax_rate` | `settings`(مفتاح `shipping` JSONB).tax_rate (12_settings.sql:37) | JSONB رقمية | **مختلف**: مخزّنة في جدول آخر غير مستخدم، ولا يوجد حقل تحرير لها في الواجهة |
| العملة/واتساب `currency/whatsapp` | `settings`(مفتاح `store_info` JSONB).currency/whatsapp (12_settings.sql:36) | JSONB | **مختلف**: غير مستخدمة من أي كود |
| شعار المتجر `logo_url` / `store_name` | غير معرّفة في السكيما نهائياً | — | مفقود (اسم المتجر ثابت من i18n عبر `SITE_NAME()` في constants/index.ts:3) |
| البريد `email` في النشرة | `newsletter_subscribers.email` (11_marketing.sql:25) | TEXT UNIQUE | مطابق لكن **غير مستخدم** (NewsletterSection يعتمد واتساب) |
| `created_at` للمشترك | العمود فعلياً `subscribed_at` (11_marketing.sql:26) | TIMESTAMPTZ | مختلف في الاسم |
| `is_subscribed` | غير موجودة | — | مفقود |
| إعدادات key/value عامة | `settings.key / settings.value` (12_settings.sql:6-10) | TEXT / JSONB | موجودة لكن **ميتة**: لا يقرؤها/يكتبها أي كود |
| `home_sections` / `banners` / `social_links` / `shipping_config` | غير معرّفة في السكيما كلها | — | الواجهة لا تستخدمها فعلياً (أقسام الرئيسية من استعلامات products + بيانات محلية؛ socialLinks ثوابت في ContactUsPage:25 وFooter:35) |
| طلب إشعار التوفر `product_id/email` (ProductDetailsPage.tsx:42-44) | `back_in_stock_requests.product_id/email/created_at` (11_marketing.sql:46-54) | UUID/TEXT | مطابق |

## 3. جدول المشاكل

| # | ما تستخدمه الواجهة (ملف:سطر) | الموجود في السكيما | نوع المشكلة | الأثر | الخطورة |
|---|---|---|---|---|---|
| 1 | `store_settings` و`announcements` (adminService.ts:589,614,637,650) | الجدولان معرّفان فقط في `fix_schema.sql:7-48` و`_run_all_combined.sql:1732-1773` — ومسار `_run_all.sql:13-67` لا يشمل fix_schema | جدول مفقود من مسار التنفيذ الأساسي | من نفّذ `_run_all.sql` فقط: قراءة تفشل صامتاً وتُستبدل بقيم افتراضية، وكل حفظ إعدادات في لوحة الإدارة لا يُكتب فعلياً لقاعدة البيانات | **حرجة** |
| 2 | نجاح زائف عند الحفظ: `updateStoreSettings`/`updateAnnouncement` (adminService.ts:605-627,645-657) لا تفحص `error` وتعود للحالة في الذاكرة، و`AdminSettingsPage.tsx:29-48` يعرض `toast.success` دائماً | الجداول موجودة لكن الفشل (RLS/جدول مفقود) غير مكتشف | ابتلاع الأخطاء | المشرف يظن أن الإعدادات حُفظت وهي غير محفوظة فعلياً | **حرجة** |
| 3 | شريط الإعلانات على المتجر `AnnouncementBar.tsx:17` يقرأ `announcements` | الجدول + سياسات RLS خارج `15_rls_policies.sql` (فقط داخل fix_schema/_run_all_combined) | عدم توحيد المصدر | عند وجود الجدول بدون سياسة SELECT يختفي الشريط بصمت (RLS يرفض)؛ اعتماد كامل على تطبيق fix يدوي | **عالية** |
| 4 | إعدادات المتجر (اسم/هاتف/بريد/عنوان/شحن) تُحفظ (AdminSettingsPage.tsx:36-46) | `store_settings` لا يُقرأ إلا من صفحة الإدارة نفسها — الواجهة الأمامية (Navbar/Footer/ContactUsPage:15) تستخدم ثوابت i18n وهاردكود `WHATSAPP_NUMBER` | مصدر بيانات مزدوج | تعديل المشرف للاسم/الهاتف/البريد لا يظهر للعملاء إطلاقاً — خاصية عديمة الفائدة وهمية | **عالية** |
| 5 | `settings` (key/value) (12_settings.sql:6-38) يخزّن tax_rate/currency/whatsapp/announcement | لا يوجد أي `.from('settings')` في src كله | جدول ميت + تخزين مكرر | مصدرا إعدادات متوازيان (settings + store_settings/announcements) بمفاتيح متداخلة (announcement موجود في الاثنين) — تعارض مستقبلي مضمون | **عالية** |
| 6 | النشرة البريدية `NewsletterSection.tsx:6,12` (واتساب فقط) | `newsletter_subscribers` (11_marketing.sql:23-27) بدون أي كاتب/قارئ في الواجهة | غير مستخدم + اختلاف أعمدة | الجدول ميت؛ عمود `subscribed_at` بدل `created_at` وغياب `is_subscribed` يخالف أي افتراض مستقبلي؛ لا توجد شاشة مشرف لعرض المشتركين | **متوسطة** |
| 7 | `tax_rate` — غير موجود في أي حقل بالواجهة | موجود فقط داخل JSONB `settings.shipping` (12_settings.sql:37) | إعداد غير قابل للإدارة | المشرف لا يستطيع تعديل ضريبة الشحن رغم وجودها بالسكيما | **متوسطة** |
| 8 | لا يوجد استخدام لـ `whatsapp_number`/`currency`/`logo_url` (لوحة تحكم ولا متجر) | مفتاح `store_info` يحوي currency/whatsapp (12_settings.sql:36) | إعدادات بدون واجهة | بيانات لن يقرأها أحد أبداً | **منخفضة** |
| 9 | `newsletter_subscribers` تحديث/إلغاء اشتراك (لا يوجد كود) | لا توجد سياسة UPDATE إطلاقاً (15_rls_policies.sql:308-318) | فجوة RLS | أي ميزة مستقبلية لتبديل الاشتراك ستُرفض | **منخفضة** |
| 10 | توثيق `ACTIONS_MAP.md:199` يقول READ/UPDATE على `settings` (announcement, store_info, shipping) | الكود الفعلي: `store_settings` + `announcements` | توثيق مخالف للكود | إرباك للمطورين؛ من سيتبع التوثيق لن يجد البيانات | **منخفضة** |
| 11 | إدراج طلب توفر (ProductDetailsPage.tsx:42) | قيد `UNIQUE (product_id, email)` (11_marketing.sql:53) | سلوك صامت | الإدراج المتكرر لنفس المنتج/البريد يفشل بلا رسالة للمستخدم (error مُتجاهل) | **منخفضة** |
| 12 | بطاقة «المظهر» (AdminSettingsPage.tsx:158-166) | لا يوجد شيء مقابلها | عنصر واجهة وهمي | زر/بطاقة بدون وظيفة | **منخفضة** |

## 4. فحص RLS

### سياسات موجودة (15_rls_policies.sql)
| الجدول | SELECT | INSERT | UPDATE | DELETE | الحكم |
|---|---|---|---|---|---|
| `settings` (أسطر 357-371) | عام ✓ | is_admin ✓ | is_admin ✓ | is_admin ✓ | متوافق لإدارة المشرف (لكن الجدول غير مستخدم) |
| `testimonials` (289-303) | عام ✓ | is_admin ✓ | is_admin ✓ | is_admin ✓ | متوافق؛ القراءة العامة تخدم `loadTable('testimonials')` في data/index.ts:41 |
| `newsletter_subscribers` (308-318) | is_admin فقط | عام ✓ | **لا سياسة** | is_admin | ناقص UPDATE فقط |
| `contact_messages` (323-337) | is_admin | عام ✓ | is_admin | is_admin | متوافق |
| `back_in_stock_requests` (342-352) | is_admin | عام ✓ | is_admin | **لا سياسة** | ناقص DELETE فقط (غير مطلوب حالياً) |
| `recently_viewed` / `recent_searches` (376-405) | المستخدم نفسه | المستخدم نفسه | المستخدم نفسه | المستخدم نفسه | متوافق |

### سياسات الجداول التي تستخدمها الواجهة فعلياً
- `announcements` و`store_settings`: **ليست في 15_rls_policies.sql إطلاقاً**. سياساتهما معرّفة فقط داخل fix_schema.sql:19-24,38-44 و_run_all_combined.sql:1743-1769 (SELECT عام + INSERT/UPDATE is_admin). أي مشرف يستطيع الكتابة ✓، والقراءة العامة تخدم AnnouncementBar ✓ — **بشرط تنفيذ fix_schema/_run_all_combined**. مع `_run_all.sql` وحده لا يوجد الجدولان أصلاً.
- `is_admin()` معرّفة (03_profiles.sql:58-67) وتعتمد على `profiles.role` ✓ — لا عائق على سياسات المشرف.

### الخلاصة
- سياسات المشرف للجداول (12/11) سليمة؛ لكن الجدولين الفعليين المستخدمين خارج نظام السياسات الموحد، وأي بيئة بدون fix_schema ستفشل كل عمليات الإعدادات.

## 5. ملاحظات إضافية

1. يوجد الآن **ثلاثة مخازن إعدادات** غير متزامنة: (أ) `settings` JSONB (12)، (ب) `store_settings`/`announcements` (fix)، (ج) ثوابت i18n في الواجهة (`SITE_NAME()`، `WHATSAPP_NUMBER` الهاردكود في أكثر من ملف). مفتاح `announcement` مكرر بين (أ) و(ب).
2. `getStoreSettings()`/`getAnnouncement()` تستخدمان `.single()`: إن كانت الجداول فارغة أو تعددت الصفوف يعودان افتراضيات بصمت — تصميم هش يعتمد على صف وحيد `'default'` موجود فقط عبر البذرة في fix_schema.
3. `_run_all.sql` (المسار الموثّق) لا يشمل `fix_schema.sql`، بينما `_run_all_combined.sql` يشملها → مساران للتنفيذ ينتجان سكيما مختلفة جذرياً من ناحية الإعدادات.
4. صفحة الرئيسية لا تعتمد على جداول إعلانية (home_sections/banners غير موجودة)، بل استعلامات products — لا يوجد تعارض فعلي، فقط عدم وجود بنية قابلة للإدارة.
5. `AnnouncementBar` يستمع لحدث `announcement-update` (AnnouncementBar.tsx:21-24) — آلية تحديث سليمة محلياً.

## 6. توصيات

1. **دمج `store_settings` و`announcements` في المسار الأساسي**: إضافتهما إلى `12_settings.sql` (أو إضافة ملف `12b`) وسياساتهما إلى `15_rls_policies.sql`، وإدراج fix_schema داخل `_run_all.sql`، أو توثيق تنفيذ `_run_all_combined.sql` كخيار وحيد.
2. **توحيد مخزن الإعدادات**: اختيار نمط واحد (جداول مخصصة أو `settings` JSONB) وإلغاء الآخر، مع تحديث ACTIONS_MAP.md ليطابق الكود الفعلي.
3. **إزالة ابتلاع الأخطاء**: جعل updateStoreSettings/updateAnnouncement تعيد الخطأ وفحصه في AdminSettingsPage قبل إظهار رسالة النجاح، وإظهار `toast.error` عند الفشل.
4. **ربط الواجهة الأمامية بالمخزن**: جعل Navbar/Footer/ContactUsPage تقرأ `store_settings` (اسم/هاتف/بريد/واتساب) بدل الثوابت، أو إزالة هذه الحقول من لوحة الإدارة إذا لم يُقصد دعمها.
5. **قرار صريح بشأن النشرة البريدية**: إما ربط NewsletterSection بجدول `newsletter_subscribers` (وإضافة `is_subscribed`/`created_at` وسياسة UPDATE وإضافة عرض مشتركين للمشرف)، أو حذف الجدول نهائياً.
6. **معالجة `tax_rate`**: إضافة عمود `tax_rate` إلى `store_settings` وحقل في الواجهة، أو حذفه من بذرة settings.
7. **معالجة أخطاء UNIQUE لـ back_in_stock_requests** (رسالة «تم الاشتراك مسبقاً») ومعالجة تعارض الإدراج المكرر.

---

**ملخص للفريق:** المشاكل الحرجة: (1) جدولا `store_settings`/`announcements` خارج مسار `_run_all.sql` فيفشل الحفظ في البيئات المثبتة بالمسار الأساسي، (2) الابتلاع الصامت للأخطاء مع إظهار نجاح كاذب. العالية: (3) شريط الإعلانات يعتمد على تطبيق fix اليدوي، (4) إعدادات المتجر لا تصل أبداً للواجهة الأمامية، (5) ازدواجية مخازن الإعدادات (`settings` ميت).
