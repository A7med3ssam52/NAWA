# تقرير Agent #5 — فحص التوافق: التقييمات (Reviews) والإشعارات (Notifications)

**التاريخ:** 2026-08-02
**النطاق:** لوحة التحكم + واجهة المتجر مقابل سكيما Supabase

---

## 1. النطاق

| الجهة | الملفات |
|---|---|
| السكيما | `back-end schema/07_reviews.sql`، `09_notifications.sql`، `15_rls_policies.sql`، `17_functions_triggers.sql`، `02_products.sql`، `16_indexes.sql` |
| لوحة التحكم | `src/pages/admin/AdminReviewsPage.tsx`، `src/pages/admin/AdminNotificationsPage.tsx` |
| طبقة الخدمات | `src/services/adminService.ts` (getReviews، deleteReview، getNotifications، createNotification، markNotificationRead، deleteNotification، mapReview، mapNotification) |
| الأنواع | `src/types/index.ts` (Review، Notification) |
| واجهة المتجر | `src/pages/ProductDetailsPage.tsx` (إرسال تقييم)، `src/pages/ProfilePage.tsx`، `src/pages/NotificationsPage.tsx`، `src/components/features/NotificationPopover.tsx`، `src/data/index.ts` (getUserNotifications) |

**ملاحظة مهمة:** المهمة افترضت أعمدة `is_approved` و`is_featured` في reviews وأعمدة `body` و`link/related_id` و`is_read` في notifications — **لا وجود لأي منها في السكيما الفعلية** (انظر خريطة التوافق). النتائج مبنية على السكيما الفعلية.

---

## 2. خريطة التوافق

### 2.1 Reviews

| عنصر الواجهة | الجدول.العمود | النوع | الحالة |
|---|---|---|---|
| `review.id` (AdminReviewsPage:37, adminService:712) | `reviews.id` | UUID PK | مطابق |
| `review.productId` (adminService:712) | `reviews.product_id` | UUID FK → products | مطابق |
| `review.userId` (types:44) | `reviews.user_id` | UUID FK → profiles (NULL للضيوف) | مطابق لكن النوع في الواجهة `string` إجباري (راجع المشكلة R-1) |
| `review.userName` (types:45, adminService:713) | `reviews.user_name` | TEXT NOT NULL | مطابق |
| `review.userAvatar` (types:46, adminService:713) | `reviews.user_avatar` | TEXT | مطابق |
| `review.rating` (AdminReviewsPage:123) | `reviews.rating` | INTEGER CHECK 1-5 | مطابق |
| `review.title` (types:48) | `reviews.title` | TEXT (nullable) | مختلف (صغبر: الواجهة تتوقع string) |
| `review.comment` (AdminReviewsPage:126) | `reviews.comment` | TEXT NOT NULL | مطابق |
| `review.likes` (types:51) | `reviews.likes` | INTEGER DEFAULT 0 | مطابق |
| `review.createdAt` (adminService:715) | `reviews.created_at` | TIMESTAMPTZ | مطابق |
| فلترة حسب المنتج (AdminReviewsPage:23) | `product_id` | eq | مطابق |
| حذف تقييم (AdminReviewsPage:37) | `reviews.delete` | RLS: admin فقط | مطابق |
| **الموافقة/الرفض approve/reject** | — | — | **غير موجود في الواجهة ولا في السكيما** (لا عمود is_approved) |
| **تمييز تقييم مميز is_featured** | — | — | **غير موجود** (لا عمود) |
| إرسال تقييم من المتجر (ProductDetailsPage:85-97) | `reviews.insert` | UUID/RLS | **مكسور تمامًا** (راجع P-1) |
| `Product.rating` (types:13) | `products.rating` | NUMERIC(2,1) | مطابق |
| `Product.reviewsCount` (types:14) | `products.reviews_count` | INTEGER | مطابق (لا يوجد أي `rating_count`) |

### 2.2 Notifications

| عنصر الواجهة | الجدول.العمود | النوع | الحالة |
|---|---|---|---|
| `notif.id` (adminService:720) | `notifications.id` | UUID PK | مطابق |
| `notif.userId?` (types:136) | `notifications.user_id` | UUID **NOT NULL** FK → profiles | **مختلف**: الواجهة تسمح بأخذه اختياريًا (إشعار عام)، السكيما تمنع NULL |
| `notif.type` (AdminNotificationsPage:16) | `notifications.type` | ENUM (info, success, warning, error, **order**) | مختلف جزئيًا: المتجر يستخدم `promo` و`system` غير موجودة في الـ ENUM (P-5) |
| `notif.title` | `notifications.title` | TEXT NOT NULL | مطابق |
| `notif.message` (types:139, adminService:722) | `notifications.message` | TEXT NOT NULL | مطابق (الافتراض `body` غير صحيح) |
| `notif.read` (types:140, adminService:436) | `notifications.read` | BOOLEAN DEFAULT false | مطابق (الافتراض `is_read` غير صحيح) |
| `notif.createdAt` (adminService:723) | `notifications.created_at` | TIMESTAMPTZ | مطابق |
| إرسال إشعار من الأدمن (AdminNotificationsPage:55) | `notifications.insert` | RLS: admin فقط | **مكسور**: user_id='' → فشل UUID (P-2) |
| إشعار لكل المستخدمين (user_id NULL) | — | — | **مستحيل**: NOT NULL + سياسة SELECT لا تمرر NULL (P-3) |
| تحديد كمقروء (adminService:436) | `notifications.read = true` | UPDATE | مطابق (RLS يسمح لصاحب الإشعار) |
| قراءة إشعارات المتجر | `notifications` | SELECT | **لا تُستخدم أبدًا من المتجر** — المتجر على بيانات mock (P-4) |

---

## 3. جدول المشاكل

| # | ما تستخدمه الواجهة (ملف:سطر) | الموجود في السكيما | نوع المشكلة | الأثر | الخطورة |
|---|---|---|---|---|---|
| P-1 | إدراج تقييم: `id: review-${Date.now()}` و `user_id: user?.id \|\| 'guest'` (ProductDetailsPage.tsx:86,88,97) بدون فحص `error` | `reviews.id` UUID PK، `reviews.user_id` UUID | عدم تطابق نوع (سلسلة غير UUID) + إهمال الأخطاء | **كل تقييم من المتجر يفشل إدراجه في DB**؛ يظهر نجاح مضلل؛ لا يُحدَّث `products.rating` أبدًا | **حرجة** |
| P-2 | `createNotification` ترسل `user_id: data.userId \|\| ''` (adminService.ts:429) ونموذج الأدمن بلا حقل مستلم (AdminNotificationsPage.tsx:153-165) | `notifications.user_id` UUID **NOT NULL** | قيمة فارغة في عمود UUID إجباري + لا معالجة error في insert (adminService.ts:426-430) | **زر "إرسال إشعار" في لوحة التحكم يفشل دائمًا**؛ الإشعار لا يُحفظ في DB أبدًا (يُضاف للـ mock محليًا فقط) | **حرجة** |
| P-3 | إرسال إشعار "لكل المستخدمين" — لا يوجد خيار في الواجهة | `user_id` NOT NULL (09:19) + سياسة `notifications_select` تشترط `user_id = auth.uid()` (15:238) | قيد NOT NULL + RLS لا يعالج NULL | حتى لو أُزيل NOT NULL، الإشعار العام (NULL) **غير مرئي لأي مستخدم** لأن `NULL = auth.uid()` دائمًا false | **عالية** |
| P-4 | المتجر يقرأ الإشعارات من mock: `getUserNotifications` (data/index.ts:134-140)؛ لا يوجد أي `from('notifications')` في كود المتجر | جدول `notifications` مع سياسات RLS جاهزة | انقطاع كامل بين طبقة المتجر وDB | الإشعارات التي يرسلها الأدمن (حتى لو نجحت) **لا تصل أبدًا للمستخدمين**؛ مؤشرات "غير مقروء" كلها من بيانات وهمية | **عالية** |
| P-5 | أيقونات/أنواع المتجر: `order/promo/system` (NotificationPopover.tsx:18-28) | ENUM: `info/success/warning/error/order` (09:8-10) | نوع enum لا يقبل promo/system | إدراج إشعار من نوع promo/system (لو كتب) يفشل بالـ CHECK؛ لوحة الأدمن لا تتيح إنشاء نوع `order` رغم وجوده | **متوسطة** |
| P-6 | لا يوجد أي زر موافقة/رفض على التقييمات (AdminReviewsPage.tsx:134 فقط حذف) | لا يوجد عمود `is_approved` في reviews (07:6-17) | غياب ميزة تعديل متكامل (لا عمود ولا UI) | لا يمكن للوحة التحكم إدارة المحتوى: كل تقييم يظهر فورًا للجمهور بما فيها تقييمات الضيوف | **عالية** |
| P-7 | سياسة `reviews_insert` تسمح بـ `user_id IS NULL` (15:202) | `reviews.user_id` قابل NULL فعلاً | ثغرة RLS: أي زائر مجهول (حتى بدون تسجيل دخول) يستطيع إدراج تقييم مع `user_id = NULL` | **إساءة استخدام/سبام**: يمكن ملء المنتجات بتقييمات مزيفة وتلاعب بمتوسط `products.rating` | **عالية** |
| P-8 | `_run_all_combined.sql` (سكيما مجمعة قديمة) فيه سياسات مختلفة وخطرة | 15_rls_policies.sql (الرسمية) | **نسختان متعارضتان من السكيما** | لو شُغّل الملف المجمع: أي مستخدم مسجَّل يملك صلاحية حذف reviews (سطر 1826) وكتابة/تعديل/حذف products وcategories وbrands (1788-1808) — انهيار أمني كامل | **عالية** |
| P-9 | `handleMarkAllRead` فارغ تمامًا (NotificationPopover.tsx:57) | — | دالة ميتة | زر "تحديد الكل مقروء" في المتجر لا يفعل شيئًا | **منخفضة** |
| P-10 | `Notification.userId?` اختياري (types:136) | `notifications.user_id` NOT NULL | النوع يخفي القيد الفعلي | يسمح بكتابة كود يرسل إشعارًا عامًا سيفشل وقت التشغيل (مرتبط بـ P-2/P-3) | **متوسطة** |
| P-11 | نوع `order` في ENUM لكن شكل صفحة الأدمن `typeConfig` لا يحتوي عليه (AdminNotificationsPage.tsx:16-21) | ENUM فيه order | نقص تنسيق | إشعارات من نوع order تظهر بأيقونة info الافتراضية | **منخفضة** |

---

## 4. فحص RLS

### reviews (15:194-212)
| العملية | السياسة | التقييم |
|---|---|---|
| SELECT | `USING (true)` | مطابق لحاجة العرض العام، لكنها تعرض كل شيء (لا مفهوم موافقة مسبقة) |
| INSERT | `user_id = auth.uid() OR user_id IS NULL OR is_admin()` | ⚠️ الخطأ: الفرع `user_id IS NULL` يفتح الباب لأي زائر مجهول (سبام). لو كان المقصود السماح بالتقييم بدون حساب فالأفضل فرض `user_id` عبر auth أو إضافة أعمدة تحقق |
| UPDATE | `user_id = auth.uid() OR is_admin()` | سليم (للتقييمات الخاصة) — لكن لا يُستخدم في الواجهة |
| DELETE | `is_admin()` | سليم — حذف الأدمن في لوحة التحكم يعمل |
| **نقطة حساسة:** إدراج المتجر يرسل `user_id='guest'` (غير UUID) وid غير UUID → الـ RLS ليس سبب الفشل بل تنسيق القيم (P-1) |

### notifications (15:236-250)
| العملية | السياسة | التقييم |
|---|---|---|
| SELECT | `user_id = auth.uid() OR is_admin()` | سليم للمستخدم الفردي؛ **لا يغطي البث العام (NULL)** → P-3 |
| UPDATE | `user_id = auth.uid() OR is_admin()` | سليم: المستخدم يستطيع تمييز إشعاره كمقروء، والأدمن لكل الصفوف |
| INSERT | `is_admin()` | سليم من ناحية الصلاحية — لكن الاستخدام الفعلي يفشل لقيمة UUID غير صالحة (P-2) |
| DELETE | `is_admin()` | سليم |

**الخلاصة:** RLS الإشعارات مصمَّم بشكل صحيح للمستخدم الفردي، لكنه يمنع نظام البث الجماعي نهائيًا، وRLS التقييمات به ثغرة زوار + لا يدعم مفهوم "الموافقة".

---

## 5. فحص الـ triggers

### `update_product_rating` (07_reviews.sql:28-55)
- **الأعمدة المحدَّثة:** `products.rating = avg_rating` و `products.reviews_count = cnt`.
- **مطابقة الأسماء:** ✅ `products.rating` موجود (02:19) و`products.reviews_count` موجود (02:20). لا يوجد أي عمود باسم `rating_count` في المشروع.
- **مطابقة الواجهة:** ✅ خريطة المنتج تحوّل `reviews_count → reviewsCount` (productService.ts:21) وتستخدم في المتجر والأدمن.
- **المنطق:** ✅ `COALESCE(NEW.product_id, OLD.product_id)` يغطي INSERT (OLD=NULL) وDELETE (NEW=NULL) وUPDATE بشكل صحيح.
- **متى يعمل:** ✅ `AFTER INSERT OR DELETE OR UPDATE OF rating` — لا يُعاد الحساب عند تغيير `likes` (جيد).
- **القيد الوحيد (مؤثر):** التحديث يدويًا يغير `likes` بدون إعادة حساب — سلوك مقصود، لا مشكلة.
- **ملاحظة بسيطة:** الـ trigger معرّف داخل 07_reviews.sql وليس في 17_functions_triggers.sql (ملف 17 لا يحتوي أصلاً على trigger reviews — توثيق فقط، لا مشكلة وظيفية).
- **مشكلة حرجة غير مباشرة:** بسبب P-1، الـ trigger **لا يُشغَّل أبدًا من مسار المتجر** لأن الإدراج يفشل قبل وصوله. حذف تقييم من لوحة التحكم يعمل ويحدّث التقييم بشكل صحيح.

---

## 6. ملاحظات إضافية

1. **مطابقات سليمة:** أسماء أعمدة `message`/`read` في notifications والواجهة متطابقة تمامًا، وكذلك `user_name`/`user_avatar` في reviews — لا حاجة للتعديل.
2. **الفهارس:** 16_indexes.sql يغطي reviews (product_id, user_id, created_at, rating) وnotifications (user_id, partial unread, created_at) — جيد.
3. **انقطاع mock:** لوحة الأدمن تعمل على "fallback" للـ mock عند أي خطأ (adminService.ts:387-392 مثلاً) — هذا يخفي فشل DB ويعطي واجهة "تبدو عاملة" بينما لا شيء يُحفظ.
4. **`createNotification` بلا فحص خطأ:** adminService.ts:426-430 يرمي نتيجة `insert` بدون فحص `error`، والـ catch في AdminNotificationsPage.tsx:60 لا يلتقطه لأن الدالة لا ترمي استثناءً.
5. **نسخة السكيما المجمعة `_run_all_combined.sql`** تتعارض مع `15_rls_policies.sql` (P-8) — يجب توحيد مصدر واحد.
6. **تقييمات الضيوف:** السكيما تدعمها (user_id NULL + user_name snapshot) لكن المتجر يرسل `'guest'` كنص وليس NULL (جزء من P-1).
7. **الترجمة:** لوحة الأدمن تعتمد i18n للمفاتيح العربية — لا علاقة لها بالتوافق.
8. `NotificationPopover.tsx:35` — بدون مستخدم مسجّل لا يظهر أي إشعار حتى لو كان بثًا عامًا (متصل بـ P-3).

---

## 7. التوصيات

| الأولوية | الإجراء | يحل |
|---|---|---|
| حرجة | إصلاح إدراج التقييم في المتجر: إزالة توليد `id` اليدوي (اتركه للـ DB) وعدم إرسال `user_id` للضيوف (NULL) أو إنشاؤه من `user.id` الحقيقي فقط، مع فحص `error` وعرض رسالة حقيقية | P-1 |
| حرجة | إصلاح `createNotification`: إما إضافة حقل "المستلم" في نموذج الأدمن (اختيار مستخدم أو كل المستخدمين) مع إرسال UUID صالح أو NULL، وفحص `error` | P-2, P-10 |
| عالية | دعم البث الجماعي في السكيما: جعل `user_id` nullable (NULL = الجميع) + تعديل سياسات RLS لتمرير `user_id IS NULL` في SELECT وUPDATE | P-3 |
| عالية | ربط واجهة المتجر بجدول notifications (خدمة جديدة تقرأ من supabase وتستخدم سياسات RLS الموجودة) بدل mock | P-4 |
| عالية | إضافة إدارة موافقة: عمود `is_approved` في reviews + زرا الموافقة/الرفض في لوحة التحكم، وتقييد سياسة SELECT للعامة على المقبول فقط | P-6 |
| عالية | سد ثغرة إدراج الضيوف في RLS: فرض أن `user_id` إما `auth.uid()` أو NULL مع اسم زائر مؤكد (أو إلغاء الفرع NULL) | P-7 |
| عالية | حذف/أرشفة `_run_all_combined.sql` وتوحيد مصدر السكيما الوحيد | P-8 |
| متوسطة | توحيد أنواع الإشعارات: إضافة `promo` و`system` للـ ENUM أو تغيير mock؛ إضافة `order` لنموذج الأدمن وtypeConfig | P-5, P-11 |
| منخفضة | تنفيذ `handleMarkAllRead` أو إخفاء الزر | P-9 |

---

*أُعد بواسطة Agent #5 — فحص فقط، لم يُعدَّل أي ملف في src أو back-end schema.*
