# خطة إصلاح توافق الموبايل — مشروع ZAHIEG (React + Vite + Tailwind, Arabic RTL)

> **نوع المستند:** خطة تنفيذ فقط — لا تنفَّذ التعديلات من هذا الملف مباشرةً.
> **تاريخ الفحص المرجعي:** 2026-08-10 (تمت إعادة التحقق من كل خط by reading source files — الأرقام أدناه هي المؤكَّدة فعلياً).

---

## 0) نتيجة إعادة التحقق (تصحيحات على التقرير الأولي)

| البند | التقرير الأولي | الحقيقة المؤكَّدة بعد قراءة الكود |
|---|---|---|
| 1 | ProductGallery.tsx:90,101 — أسهم مخفية | **صحيح 100%** — الحاوية سطر 45-46 لا تحتوي `group`، والأسهم `opacity-0 group-hover:opacity-100` → غير مرئية على كل الأجهزة (حتى desktop) |
| 10 | Navbar.tsx:193 — offset 36px قد يتغيّر | **تصحيح:** ارتفاع `AnnouncementBar` ثابت `h-9` (36px) مع `overflow-hidden` (AnnouncementBar.tsx:51) — لا يتغيّر إذا التف النص. الـ offset متطابق سليماً. المشكلة الفعلية: النص الطويل يُقصّ/يتداخل مع زر X على 320px (لا truncate) |
| 8 | NotificationPopover.tsx:82 — يفيض على 320px | **تصحيح:** المكوّن مستخدم فقط داخل `hidden lg:flex` (Navbar.tsx:410) → desktop-only حالياً، لا يفيض فعلياً. لكن إضافة `max-w` حماية رخيصة لمستقبل الاستخدام |
| 11 | CartPreview.tsx:58 — w-80 يفيض | **صحيح فعلياً:** `CartPreview` ظاهر على كل الشاشات (Navbar.tsx:442)، و`w-80` (320px) مع `left-0` + padding `px-4` للـ header → يفيض على شاشات ≤336px |
| 3 | ComparePage.tsx:46-52 — سكرول 900px | **صحيح:** `min-w-[600px]` + `min-w-[180px]` لكل منتج + عمود أول `w-32 sm:w-40` (128px) → 4 منتجات = 848px سكرول إجباري |
| 5 | 7 صفحات أدمن بلا card layout | **صحيح 100%** — كل الخطوط مؤكَّدة، والنموذج الجيد موجود فعلاً في AdminOrdersPage.tsx:286 و AdminProductsPage.tsx:466 |
| 13 | LoginPage.tsx:272 — class مكسور | **صحيح:** `sm: sm:backdrop-blur-xl` و `sm: sm:rounded-3xl` و `lg: lg:shadow-none` — Tailwind يتجاهلها بصمت |
| 17 | tailwind.config.js بلا screens | **صحيح** — لا `screens` مخصصة، الاعتماد على افتراضيات Tailwind (sm=640, md=768, lg=1024, xl=1280) |

**خلاصة:** التقرير الأولي دقيق في 15/17 بنداً؛ البندان 8 و10 بحاجة لإعادة صياغة الأثر فقط (خطوطهما صحيحة لكن التأثير الموصوف مبالغ فيه).

---

## 1) البنود الحرجة (P0 — أولوية قصوى: تعطّل وظيفة)

### B1 — أسهم تنقل الصور في ProductGallery غير مرئية
- **الملف:** `src/components/features/ProductGallery.tsx`
- **الخطوط المؤكَّدة:** أسهم التنقل `90` و`101`؛ الحاوية الرئيسية `45-46`؛ أيقونة الزوم `66`؛ عدّاد الصور `110-114`.
- **المشكلة:** الأسهم تحمل `opacity-0 group-hover:opacity-100` لكن لا يوجد أي أب يحتوي `group` على طول المسار (الحاوية `45` + الـ `<div>` في ProductDetailsPage.tsx:251 لا شيء منهما `group`).
- **الإصلاح المقترح (دقيق):**
  1. أضف `group` إلى className الحاوية في سطر 46: `"group relative aspect-square rounded-2xl ..."`.
  2. غيّر على السهمين (90 و101) من `opacity-0 group-hover:opacity-100` إلى:
     `opacity-100 md:opacity-0 md:group-hover:opacity-100`
     → الأسهم ظاهرة دائماً على الموبايل (لا hover)، وتعود لسلوك الـ hover على ≥768px.
  3. (اختياري) أبقِ `pointer-events` طبيعياً — لا حاجة لفصل event.
- **ما لا يجب فعله:** لا تحذف الأسهم من الموبايل (سطح اللمس الوحيد للتنقل عدا الثمبنيلز). لا تغيّر منطق `setSelectedIndex` أو أيقونات الأسهم (`ChevronRight`/`ChevronLeft` مرتبطة باتجاه RTL بصرياً — لا تقلبها). لا تلمس Swiper الثمبنيلز (152-193).

### B2 — زرار "أضف للمفضلة" في ProductCard غير مرئي على اللمس
- **الملف:** `src/components/features/ProductCard.tsx`
- **الخطوط المؤكَّدة:** زرار المفضلة `103-114` (الـ opacity على سطر `109`)؛ زرار المقارنة `116-127` (ظاهر دائماً — مصدر عدم التناسق)؛ شارة الفئة `99-101`؛ الحاوية `group` موجودة أصلاً على سطر `63`.
- **الإصلاح المقترح (دقيق):**
  - في سطر `109` (حالة "ليس في المفضلة") احذف `opacity-0 group-hover:opacity-100` واجعلها `opacity-100` دائماً، أو الأفضل المحافظة على السلوك الدقيق: `opacity-100 md:opacity-0 md:group-hover:opacity-100`.
  - **ملاحظة تناسق:** حالة `inWishlist` (سطر 108) ظاهرة دائماً أصلاً — بعد الإصلاح تصبح الحالتان متماثلتين مع زرار المقارنة (116-127).
- **ما لا يجب فعله:** لا تحذف `group` من الحاوية (63) — مستخدمة للصورة `group-hover:scale-110` (77) واسم المنتج (139). لا تُخفِ زرار المقارنة ليطابق المفضلة (الأفضل العكس). لا تغيّر `aria-label` أو handler `handleToggleWishlist`.

### B3 — جدول المقارنة يحتاج سكرول أفقي 800px+ على الموبايل
- **الملف:** `src/pages/ComparePage.tsx`
- **الخطوط المؤكَّدة:** `overflow-x-auto` سطر `46`؛ `table min-w-[600px]` سطر `47`؛ عمود المنتج `min-w-[180px]` سطر `52`؛ عمود الصفات الأول `w-32 sm:w-40` سطر `50`.
- **الإصلاح المقترح (الأبسط والأكثر أماناً — لا إعادة بناء):**
  1. غيّر `min-w-[600px]` على سطر 47 إلى `min-w-[540px]` وكل `min-w-[180px]` (سطر 52) إلى `min-w-[160px]` — يقلل السكرول لمعقولية دون كسر أي منطق.
  2. أضف على سطر 46: `overscroll-x-contain` لتجربة تمرير أنظف.
  3. **الأهم:** هذا هو الحل المؤقت المقبول لميزة ثانوية؛ الحل الكامل (card layout للمقارنة) في القسم 4 أدناه — يُنفَّذ لاحقاً.
- **ما لا يجب فعله:** لا تكسر `useCompare`/`useCart` أو بنية `allSpecs`/`allTags` (32-33). لا تحذف صف السعر/التقييم/التوفر. لا تغيّر `dir` المحسوب من i18n (سطر 37). لا تستخدم `w-full` للجدول نفسه (سيكسر الأعمدة المتساوية).

### B4 — زرار تغيير صورة البروفايل غير قابل للاستخدام على اللمس
- **الملف:** `src/pages/ProfilePage.tsx`
- **الخطوط المؤكَّدة:** الزر `487-492`؛ الحاوية `relative group` سطر `479`.
- **الإصلاح المقترح (دقيق):**
  - في سطر `488` استبدل `opacity-0 group-hover:opacity-100` بـ `opacity-100 md:opacity-0 md:group-hover:opacity-100`.
  - افحص ما إذا كان للزر `onClick` فعلي (قراءة الملف أظهرت الزر بلا handler في السطر 487-492 — الزر `button` بدون onClick؛ إن كان كذلك فهو **مشكلة منفصلة**: أضف الـ handler المفقود أو اربطه بآلية رفع الصورة الموجودة، أو أزله إن كانت الميزة معطّلة عمداً).
- **ما لا يجب فعله:** لا تحذف `group` من الحاوية 479. لا تغيّر تموضع الزر (`-bottom-1 -left-1`) — في RTL سينكسر (left/right مقصودة هنا بالنسبة للحاوية المربعة، اتركها). لا تغيّر `Camera` icon.

---

## 2) البنود المتوسطة (P1 — تحسينات توافق مهمة)

### B5 — 7 صفحات أدمن بجداول overflow-x-auto فقط (بدون mobile cards)
- **الملفات والخطوط المؤكَّدة:**
  - `src/pages/admin/AdminUsersPage.tsx:55`
  - `src/pages/admin/AdminReviewsPage.tsx:86`
  - `src/pages/admin/AdminSpinPrizesPage.tsx:153`
  - `src/pages/admin/AdminCouponsPage.tsx:121`
  - `src/pages/admin/AdminBrandsPage.tsx:138`
  - `src/pages/admin/AdminCategoriesPage.tsx:138`
  - `src/pages/admin/AdminAccountsPage.tsx:255`
  - **النماذج الجيدة الموجودة:** `AdminOrdersPage.tsx:286` (`<div className="lg:hidden space-y-3">` + `Card`) و `AdminProductsPage.tsx:466`.
- **الإصلاح المقترح (نسخ النمط الموجود — متوافق مع Mobile-First pattern للمشروع):**
  1. لكل صفحة: لفّ الجدول الحالي بـ `<div className="hidden lg:block overflow-x-auto">` بدل `overflow-x-auto` المباشر.
  2. أضف بعدها `<div className="lg:hidden space-y-3">` يكرر كل صف كـ `Card` (padding="md") مع نفس الحقول بترتيب منطقي (الاسم/الصورة → البيانات الثانوية → الأزرار).
  3. انسخ بنية `motion.div` + `AnimatePresence` من AdminOrdersPage.tsx:288-294 إن رغبت بتطابق بصري (اختياري).
- **الأولوية داخل البند:** ابدأ بـ AdminCategoriesPage وAdminBrandsPage (عندهما grid view جاهز أصلاً — انظر أدناه B6) ثم الباقي.
- **ما لا يجب فعله:** لا تحذف الجداول (desktop يحتاجها). لا تغيّر أي `useQuery`/`useMutation` أو handlers. لا تُدخل مكتبات جديدة. لا تلمس الترجمة `t('admin.*')`.

### B6 — أزرار إجراءات الصفوف في AdminCategories/AdminBrands مخفية (opacity-0)
- **الملفان والخطوط:** `AdminCategoriesPage.tsx:127` و `AdminBrandsPage.tsx:127` — `<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">`
- **سياق مهم:** `AdminCategoriesPage` لديها مبدّل عرض grid/table (سطر 97-104) والـ grid هو الشبكة الافتراضية على الموبايل — نفس المشكلة في كلا العرضين لأن الـ `opacity-0` داخل صفوف الجدول (view=table) وفي بطاقات الـ grid (سطر 127 هو في الـ grid view — تأكد: قراءة الملف أظهرت 127 داخل بطاقة grid سطر 114-133).
- **الإصلاح المقترح (دقيق):** في كلا الملفين استبدل بـ `opacity-100 md:opacity-0 md:group-hover:opacity-100`.
- **ما لا يجب فعله:** لا تحذف `group` من البطاقة/الـ tr. لا تنقل الأزرار خارج الصف. لا تخفِ الأزرار (Edit/Delete) من الموبايل — المسؤول يحتاجها هناك.

### B7 — زرار حذف سريع في CartPreview مخفي على اللمس
- **الملف:** `src/components/layout/CartPreview.tsx`
- **الخطوط المؤكَّدة:** الزر `128-137` (الـ opacity على سطر `133`)؛ الحاوية `group` سطر `79`.
- **الإصلاح المقترح (دقيق):** في سطر `133` استبدل `opacity-0 group-hover:opacity-100` بـ `opacity-100 md:opacity-0 md:group-hover:opacity-100`.
- **ما لا يجب فعله:** لا تغيّر `removeItem`/`updateQuantity` logic. لا تحذف `aria-label` (سطر 134).

### B8 — NotificationPopover بعرض ثابت 360px
- **الملف:** `src/components/features/NotificationPopover.tsx:82`
- **الحقيقة المؤكَّدة:** `w-[360px] sm:w-96` — المكوّن desktop-only حالياً (Navbar.tsx:410 `hidden lg:flex`)، لكن الحماية مطلوبة.
- **الإصلاح المقترح (دقيق):** أضف `max-w-[calc(100vw-2rem)]` للـ className في سطر 82. (إن أردت دعم شاشة 320px لاحقاً ستجدها مضمونة).
- **ما لا يجب فعله:** لا تغيّر `dir="rtl"` (سطر 83) — البوب أوفر نصي عربي ثابت. لا تغيّر `max-h-[360px]` (108) أو منطق markAllRead.

### B9 — body overflow-x: hidden يخفي المشاكل الحقيقية
- **الملف:** `src/styles/globals.css:36`
- **الإصلاح المقترح:** **لا تلمسه في هذه الجولة.** الحفاظ عليه مؤقتاً مقبول (يمنع سكرول أفقي مفاجئ أثناء التنفيذ التدريجي). **بعد** تنفيذ B1-B8: اختبر كل صفحة مع تعطيله مؤقتاً (احذف السطر في build محلي) وكشّف أي overflow متبقٍّ من الأعمدة/النصوص الطويلة وأصلحه، ثم أعد تفعيله أو احذفه نهائياً.
- **ما لا يجب فعله:** لا تحذفه قبل انتهاء باقي البنود (سترى overflow قبيحاً من البنود غير المصلَّحة بعد). لا تستبدله بـ `overflow-x: clip` قبل التأكد (قد يكسر sticky/fixed elements في بعض المتصفحات القديمة).

### B10 — offset ثابت 36px لشريط الإعلانات
- **الملفان:** `src/components/layout/Navbar.tsx:193` (`top: announcementVisible ? '36px' : '0'`) و `src/components/layout/AnnouncementBar.tsx:51` (`h-9`).
- **التحقق:** ارتفاع الشريط ثابت `h-9` (36px) مع `overflow-hidden` — الـ offset مطابق فعلياً ولا "يتغيّر إذا التف النص".
- **الإصلاح المقترح (الوحيد المطلوب فعلاً):** في AnnouncementBar.tsx:54 أضف `truncate` + `max-w-[calc(100vw-6rem)]` على `<span>{config.text}</span>` لمنع تداخل النص الطويل مع زر X على 320px. (لا حاجة لتغيير Navbar:193 إطلاقاً).
- **ما لا يجب فعله:** لا تغيّر `top` في Navbar (متطابق مع h-9). لا تزيل `overflow-hidden` من الشريط (سيكسر التصميم). لا تغيّر زر الإغلاق `absolute left-2` (متعمد في RTL).

### B11 — القوائم المنسدلة بعرض ثابت قد تفيض
- **الملفات والخطوط المؤكَّدة:**
  - `src/components/layout/CartPreview.tsx:58` — `w-80` (فعلي على الموبايل، يفيض ≤336px)
  - `src/components/layout/Navbar.tsx:472` — `w-56` (قائمة المستخدم، desktop-only فعلياً لكن الحماية مطلوبة)
  - `src/components/features/NotificationPopover.tsx:82` — `w-[360px]` (انظر B8)
  - أيضاً (خارج التقرير لكن من نفس العائلة): `Navbar.tsx:295` — `w-72` قائمة الفئات (desktop-only)
- **الإصلاح المقترح (دقيق):** أضف `max-w-[calc(100vw-2rem)]` لكل الثلاثة (و`w-72` في 295 اختيارياً).
- **ما لا يجب فعله:** لا تغيّر `left-0`/`right-0` الموقع — هذا مرتبط بـ RTL عمداً. لا تحذف `absolute top-full mt-2` positioning.

### B12 — أزرار text-nowrap كاملة العرض قد تقطع النص
- **الملف:** `src/pages/LoginPage.tsx` — سطر `344` (زر تسجيل الدخول) و `429` (زر التسجيل) — كلاهما `text-nowrap` مع `overflow-hidden` و `h-12`.
- **الحالة الفعلية:** النصوص الحالية قصيرة (تسجيل الدخول/إنشاء حساب) — المخاطرة تظهر فقط مع ترجمات أطول.
- **الإصلاح المقترح (دقيق):** احذف `text-nowrap` وأبقِ `overflow-hidden` كشبكة أمان، أو احذف كليهما وأضف `whitespace-normal leading-tight` + `px-4`. الخيار الأبسط: حذف `text-nowrap` فقط.
- **ما لا يجب فعله:** لا تقلّل `h-12` (منطقة لمس 48px — معيار إمكانية وصول). لا تغيّر `loading` spinner logic (351-376).

---

## 3) البنود التجميلية (P2 — لاحقاً)

### B13 — class مكسور في LoginPage
- **الملف:** `src/pages/LoginPage.tsx:272` — `sm: sm:backdrop-blur-xl` و `sm: sm:rounded-3xl` و `lg: lg:shadow-none` (بالإضافة للـ sm: المكررة الأخرى في نفس السطر).
- **الإصلاح المقترح (دقيق):** أعد كتابة السطر بمسافة واحدة صحيحة:
  `sm:bg-white/80 sm:backdrop-blur-xl sm:border sm:border-gray-100 sm:rounded-3xl sm:shadow-soft-lg sm:p-6 lg:p-8 lg:border-0 lg:bg-transparent lg:shadow-none lg:backdrop-blur-none lg:p-0`
- **الأثر الفعلي للإصلاح:** الـ card سيحصل على الخلفية/الظل المقصودة على sm..lg (تحسين بصري فقط، لا كسر).
- **ما لا يجب فعله:** لا تحذف `sm:p-6 lg:p-0` (الحشوة المقصودة). لا تغيّر هيكل `motion.div` (273).

### B14 — شارة الفئة في ProductCard مخفية على الموبايل
- **الملف:** `src/components/features/ProductCard.tsx:99-101`
- **الإصلاح المقترح (دقيق):** استبدل `opacity-0 group-hover:opacity-100` بـ `opacity-100 md:opacity-0 md:group-hover:opacity-100` — أو احذف الـ opacity نهائياً (شارة معلومات مفيدة دائماً).
- **ما لا يجب فعله:** لا تغيّر موقعها (`top-3 left-3` — متعاكسة مع شارات الخصم في `top-3 right-3` عمداً). لا تزيل `categories?.find(...)` logic.

### B15 — جدول الفاتورة بلا overflow guard
- **الملف:** `src/pages/InvoicePage.tsx:64` — `<table className="w-full text-sm mb-4">`.
- **الإصلاح المقترح (دقيق):** لفّ الجدول بـ `<div className="overflow-x-auto">` — أو أضف `min-w-0` للأعمدة النصية (`td` اسم المنتج) + `break-words`/`break-all` لاسم المنتج الطويل. الأبسط: الـ overflow-x-auto.
- **ما لا يجب فعله:** لا تغيّر بنية الجدول أو منطق `formatPrice`. لا تكسر تخطيط الطباعة (`#invoice` div سطر 40 — احرص ألا يضيف overflow container أثراً على الطباعة).

### B16 — overlay حذف الصور في ImageUpload hover-only
- **الملف:** `src/components/ui/ImageUpload.tsx:58` — `opacity-0 group-hover:opacity-100`.
- **الإصلاح المقترح (دقيق):** استبدلها بـ `opacity-100 md:opacity-0 md:group-hover:opacity-100`. (أو الأفضل UX: اترك الحذف دائماً ظاهراً — الصور 16x16 صغيرة والحذف شائع في الإدارة).
- **ما لا يجب فعله:** لا تغيّر `uploadImage`/`deleteImage`/`max` logic. لا تحذف `group` (سطر 53).

### B17 — لا screens مخصصة في tailwind.config.js
- **الملف:** `tailwind.config.js` (سطر 5-6 `theme.extend` — لا `screens`).
- **الإصلاح المقترح:** لا حاجة فعلية — المشروع يستخدم breakpoints الافتراضية (sm=640/md=768/lg=1024) بشكل متناسق في كل الملفات المفحوصة. **قرار مقترح:** لا تضيف screens مخصصة الآن؛ لو أُضيفت لاحقاً يجب إعادة فحص كل `sm:`/`md:`/`lg:` في المشروع (متعلق بـ 100+ ملف).
- **ما لا يجب فعله:** لا تُضف `screens` جديدة لمجرد التوحيد مع تصميم "iOS" — قد تكسر الحالات الوسيطة (مثل 768-1024) التي تعتمد حالياً على lg كفاصل mobile/desktop في Navbar (isMobile = max-width:1023px, Navbar.tsx:60).

---

## 4) البنود التي تتطلب التزاماً أكبر — وأبسط طريقة آمنة لكل منها

### A) إعادة بناء ComparePage (B3 كامل)
- **الوضع الحالي:** جدول `min-w-[600px]` (ComparePage.tsx:46-122) بسكرول أفقي إجباري.
- **أبسط طريقة آمنة متوافقة مع النمط:** **إبقاء الجدول** للـ desktop (مغلف بـ `hidden lg:block overflow-x-auto`)، وإضافة **شبكة بطاقات للـ mobile**:
  - `<div className="lg:hidden grid grid-cols-1 gap-4">` — لكل منتج بطاقة تعرض: صورة، اسم، تقييم، سعر، زرا إضافة للسلة/إزالة من المقارنة.
  - تحتها جدول صفوف-عمود واحد ("صفوف منتشرة") لمقارنة المواصفات: لكل spec صف `flex justify-between` بين label وكل قيمة — أو الأبسط: تجاهل مقارنة المواصفات على الموبايل في v1 وأبقِ رابط "عرض التفاصيل" لكل منتج.
  - **الالتزام:** ~1-2 ساعة. لا يمس `useCompare` إطلاقاً (البيانات تُقرأ فقط — `items`, `removeItem`, `clearAll`).
  - **ما لا يجب فعله:** لا تكتب مكتبة مقارنة جديدة، لا تعدّل `CompareContext.tsx`، لا تغيّر `dir` الحسابي.

### B) بطاقات الموبايل في صفحات الأدمن (B5)
- **الوضع الحالي:** 7 جداول `overflow-x-auto`.
- **أبسط طريقة آمنة:** نسخ حرفي للنمط الموجود في `AdminOrdersPage.tsx:286-327` و `AdminProductsPage.tsx:466`:
  - جدول desktop → `hidden lg:block overflow-x-auto` (بمعنى: الـ div المحيط يحصل على hidden lg:block).
  - كتل mobile → `lg:hidden space-y-3` مع `Card padding="md"`، حقول `flex justify-between`، وأزرار الإجراءات بنفس الـ handlers.
  - **الالتزام:** ~20-30 دقيقة لكل صفحة × 7 صفحات. يعاد استخدام نفس `t('admin.*')` المفاتيح.
  - **نصيحة ترتيب:** AdminCategoriesPage وAdminBrandsPage أولاً (B6 مربوط بها)، ثم AdminCouponsPage وAdminSpinPrizesPage (جداول صغيرة)، ثم AdminUsersPage وAdminReviewsPage وAdminAccountsPage.

---

## 5) ترتيب التنفيذ (Priority Order)

| المرحلة | البنود | المبرر |
|---|---|---|
| **المرحلة 1 (P0)** | B1 → B2 → B4 → B7 | كلها نفس النمط (opacity-0 group-hover) — تنفيذ متشابه وسريع، أثر وظيفي مباشر على الموبايل |
| **المرحلة 2 (P0-P1)** | B6 → B3 (الجزء المؤقت) → B14 → B16 | تكمّل ما سبق، خطوط مؤكدة وأثر فوري |
| **المرحلة 3 (P1)** | B11 → B12 → B13 | حماية overflow + إصلاح النصوص (أمان سريع) |
| **المرحلة 4 (P1)** | B9 (الاختبار مع تعطيل مؤقت ثم القرار) → B10 → B8 | مرتبط بجولة الاختبار — بعد إصلاح القائمة المنسدلة يُعاد فحص overflow |
| **المرحلة 5 (P2)** | B15 → B17 (قراري) | تجميلي |
| **المرحلة 6 (أكبر التزامات)** | A (ComparePage) → B (صفحات الأدمن) | أعلى جهد — تُنفَّذ بعد استقرار التصميم البصري |

**قاعدة عامة:** أي بند يحمل `opacity-100 md:opacity-0 md:group-hover:opacity-100` هو نفس الإصلاح — نفّذه دفعة واحدة عبر جميع الملفات ثم اختبر معاً.

---

## 6) قائمة التحقق النهائية للاختبار (Checklist)

### أ) على شاشة 360px (موبايل — Chrome DevTools أو جهاز حقيقي)
- [ ] **ProductDetailsPage:** الأسهم ظاهرة على الصورة الرئيسية وتُبدّل الصور باللمس؛ الثمبنيلز السفلي Swiper يعمل؛ الزوم لا يُفعَّل باللمس
- [ ] **ProductCard (في Home/Products/Search):** زرا المفضلة والمقارنة ظاهران وقابلان للنقر معاً؛ شارة الفئة ظاهرة؛ إضافة للسلة تعمل
- [ ] **ComparePage:** لا سكرول أفقي قسري؛ الأزرار داخل بطاقات الموبايل (إن نُفّذت) أو الجدول المصغَّر قابل للتمرير بإصبع واحد
- [ ] **ProfilePage:** زر تغيير الصورة ظاهر وقابل للضغط
- [ ] **CartPreview (أيقونة السلة في الـ Navbar):** البوب أوفر لا يتجاوز عرض الشاشة (max-w يعمل)؛ زر الحذف ظاهر لكل عنصر
- [ ] **LoginPage:** الأزرار لا تقطع النص؛ الـ card له خلفية/ظل صحيحان (بعد B13)
- [ ] **Navbar:** لا overflow أفقي؛ شريط الإعلانات (إن ظهر) نصه مقتطع بـ truncate ولا يتداخل مع X
- [ ] **Admin (أي صفحة):** تظهر بطاقات بدل الجدول؛ كل الأزرار ظاهرة وقابلة للنقر
- [ ] **عام:** لا سكرول أفقي خفي (افحص بـ document.documentElement.scrollWidth > innerWidth)

### ب) على شاشة 768px (تابلت)
- [ ] الثمبنيلز desktop (md:flex في ProductGallery.tsx:119) تظهر بدل الموبايل
- [ ] الأسهم تعود لسلوك hover (opacity-0 إلا مع hover) — تحقّق أن التبديل عند 768 بالضبط سليم
- [ ] البطاقات lg:hidden ما تزال ظاهرة (لم تختفِ قبل 1024) — الـ boundary صحيح
- [ ] ضبط iOS Safe Area (ios-safe-area-inset) في Navbar السفلي — لا شيء يُقصّ

### ج) على شاشة 1024px+ (Desktop)
- [ ] الجداول (admin + compare) تظهر كاملة بلا أثر من بطاقات الموبايل
- [ ] الـ hover effects تعمل كما كانت (تأكد أن B1-B2 لم تغيّر سلوك hover على desktop)
- [ ] القوائم المنسدلة (user menu, notifications, categories) بمقاسها الأصلي ولم تُجبر على max-w
- [ ] شريط الإعلانات: offset 36px سليم، الـ header لا يغطي المحتوى (spacer h-[100px] lg:h-[116px] متطابق)

### د) RTL + لغات
- [ ] التبديل EN/AR: في AR كل الاتجاهات تبقى صحيحة (أسهم الجاليري، شارات ProductCard، أزرار المقارنة، تموضع زر صورة البروفايل)
- [ ] في EN (LTR): الـ dir المُدار عبر i18n لم يتغيّر — النصوص العربية/الإنجليزية لا تنكسر
- [ ] الخط Cairo/Tajawal يُطبَّق عبر font-cairo على العناصر الجديدة
- [ ] الصفحات المطبوعة (Invoice) غير متأثرة بالـ overflow wrappers

### هـ) تقني (اختبار سريع في كل جولة)
- [ ] `npm run build` (أو `npx tsc --noEmit` + `vite build`) بدون أخطاء بعد كل مرحلة
- [ ] f12 → Audit → Lighthouse Mobile Pass يخلو من عناصر أوسع من viewport (إن أمكن)
- [ ] touch simulation في DevTools (toggle device toolbar) على 320 / 360 / 768 / 1024
