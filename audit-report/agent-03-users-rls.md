# تقرير Agent #3 — فحص التوافق: المستخدمون (Users/Profiles) و RLS

**المشروع:** ZAHIEG — متجر إلكتروني (React + TypeScript + Supabase)
**التاريخ:** 2026-08-02
**النطاق (الملفات المفحوصة):**
- `back-end schema/03_profiles.sql` — جدول `profiles` + `handle_new_user` trigger + `is_admin()`
- `back-end schema/15_rls_policies.sql` — سياسات RLS لكل الجداول
- `back-end schema/17_functions_triggers.sql` — دوال/Triggers عامة
- `back-end schema/19_accounting.sql` — جدول `accounting_entries` (لصفحة الحسابات)
- `back-end schema/fix_schema.sql` — سكربت إصلاحات يُشغَّل بعد الـ combined (يعدّل سياسات profiles!)
- `src/pages/admin/AdminUsersPage.tsx` — صفحة إدارة المستخدمين
- `src/pages/admin/AdminAccountsPage.tsx` — صفحة دفتر الحسابات (محاسبة، وليست مستخدمين)
- `src/services/adminService.ts` — طبقة خدمات الأدمن (getUsers, getStats, getOrders...)
- `src/services/accountingService.ts` — خدمات القيود المحاسبية
- `src/types/index.ts` — نوع `User`
- إضافات: `src/contexts/AuthContext.tsx` (تسجيل/تحديث بروفايل)، `src/data/index.ts` (loadAllData)

---

## 2. خريطة التوافق

| عنصر الواجهة | الجدول.العمود | النوع (DB) | مطابق/مختلف |
|---|---|---|---|
| `getUsers()` — adminService.ts:458 | `profiles.*` | جدول `profiles` موجود ✓ | مطابق |
| `user.id` (AdminUsersPage.tsx:69) | `profiles.id` (uuid FK → auth.users) | uuid | مطابق |
| `user.name` (AdminUsersPage.tsx:74,77) | `profiles.name` (TEXT NOT NULL) | text | مطابق |
| `user.email` (AdminUsersPage.tsx:78) | `profiles.email` (TEXT NOT NULL) | text | مطابق |
| `user.phone` (AdminUsersPage.tsx:79) | `profiles.phone` (TEXT, nullable) | text | مطابق (ويعرض Not Available عند null) |
| `user.avatar` (AdminUsersPage.tsx:74) | `profiles.avatar` (TEXT, nullable) | text | مطابق |
| `user.role` (نوع `User` في types/index.ts:127) | `profiles.role` (enum `user_role` = customer/admin) | enum | مطابق |
| `user.ordersCount` (AdminUsersPage.tsx:81) | محسوب من `orders.user_id` → عبر `orders.userId` | — | **مختلف** (انظر المشكلة 2) |
| `user.addresses.length` (AdminUsersPage.tsx:119) | غير موجود في `profiles` (لا يوجد عمود addresses) | — | **مفقود** (انظر المشكلة 1) |
| `user.wishlist.length` (AdminUsersPage.tsx:124) | غير موجود في `profiles` | — | **مفقود** (انظر المشكلة 1) |
| `user.orders[] / notifications[]` (نوع `User`) | غير موجودة في `profiles` | — | **مفقود** |
| `profiles.created_at` | يُستبعد؛ الواجهة لا تستخدمه | timestamptz | غير مستخدم |
| `updated_at` / `full_name` / `avatar_url` / `is_admin` / `is_banned` | **غير موجودة** في السكيما (السكيما تستخدم `name` و `avatar`) | — | حسب المواصفة المفترضة: **مختلف** — لكن الواجهة متوافقة مع السكيما الفعلية |
| `AdminAccountsPage` (accounting) | `accounting_entries` (19_accounting.sql) | جدول موجود ✓ | مطابق |

**نتيجة حاسمة:** الواجهة تقرأ من جدول `profiles` فقط (adminService.ts:458, 480 + data/index.ts:36 + AuthContext.tsx:99,128,151...). **لا يوجد أي استدعاء `.from('users')` أو قراءة لـ `auth.users`** — فلا يوجد خطر خطأ 42P01/404 من جدول `users` (جدول `users` غير موجود في السكيما أصلاً، لكن الواجهة لا تستخدمه).

---

## 3. جدول المشاكل

| # | ما تستخدمه الواجهة (ملف:سطر) | الموجود في السكيما | نوع المشكلة | الأثر | الخطورة |
|---|---|---|---|---|---|
| 1 | `viewModal.addresses.length` و `viewModal.wishlist.length` (AdminUsersPage.tsx:119,124) — بيانات تأتي من `profiles.*` (adminService.ts:458) | `profiles` لا يحتوي على عمودي addresses / wishlist | **انحراف النوع/الأعمدة** | عند فتح نافذة تفاصيل المستخدم مع بيانات قادمة من Supabase فإن `undefined.length` يرمي TypeError → **تعطل الصفحة** (المودال كامل). يعمل فقط مع بيانات mock المحلية | **عالية** |
| 2 | `ordersCount: orders.filter((o) => o.userId === u.id).length` (adminService.ts:466) | `orders.user_id` (snake_case)؛ مصفوفة `orders` تُحمَّل من DB كما هي (raw) عبر loadAllData (data/index.ts:37) بدون mapOrder | **انحراف أسماء الأعمدة** (camelCase vs snake_case) | `o.userId` دائماً `undefined` → **عدد الطلبات يعرض 0 دائماً** لكل المستخدمين عند تشغيل البيانات من Supabase | **متوسطة** |
| 3 | تحديث بروفايل المستخدم (AuthContext.tsx:151) — لا يمنع تغيير `role` | سياسة `profiles_update_own` (15_rls_policies.sql:98-100) بلا `WITH CHECK` | **تصعيد صلاحيات (RLS)** | لأن `WITH CHECK` محذوف يُستخدم تعبير `USING` (id = auth.uid() OR is_admin()) — أي مستخدم عادي يستطيع تحديث صفه وتعيين `role='admin'` لنفسه → يملك كل صلاحيات is_admin() في كل السياسات | **حرجة** |
| 4 | `fix_schema.sql:120-122` يفرض `profiles_select_own ... USING (true)` | كان أصلها `(id = auth.uid() OR is_admin())` | **ثغرة خصوصية** | **أي زائر (حتى anon)** يقرأ كل بروفايلات العملاء: الاسم/البريد/الهاتف/الأفاتار لكل المستخدمين | **عالية** |
| 5 | `fix_schema.sql:124-128` يفرض `addresses_select ... USING (true)` | كان أصلها `(user_id = auth.uid() OR is_admin())` | ثغرة خصوصية | تسريب عناوين الشحن الكاملة لجميع العملاء لأي متصل | **عالية** |
| 6 | `register()` (AuthContext.tsx:128-131) يُدرج صف بروفايل يدوياً | trigger `handle_new_user` (03_profiles.sql:35-53) يُنشئ البروفايل تلقائياً عند إدخال `auth.users` | **تعارض منطقي (duplicate)** | إدراج مكرر بنفس PK → خطأ `duplicate key ... profiles_pkey` يُتجاهل صامتاً (الخطأ غير مُفحوص)؛ يعمل بالصدفة فقط لأنه لا يُفحص | **متوسطة** |
| 7 | `getAccounts / updateUserRole / deleteUser / updateAccount` (مذكورة في المهمة) | غير موجودة في `adminService` نهائياً | **دوال مفقودة** | لا توجد أي إدارة أدوار/حذف مستخدم من الواجهة؛ صفحة AdminUsersPage للعرض فقط، و"الحسابات" (AdminAccountsPage) هي محاسبة وليست مستخدمين | **متوسطة** (فجوة ميزة) |
| 8 | لا يوجد عمود ban ولا تحقق منه في الواجهة | `is_banned` غير موجود في السكيما | فجوة ميزة | لا يمكن حظر مستخدمين من اللوحة، ولا يوجد أي منع على مستوى DB | **منخفضة** |
| 9 | `is_admin()` (03_profiles.sql:58-67) | بلا `SET search_path` ولا `REVOKE EXECUTE` من anon/authenticated | تحصين مفقود | قابلية استغلال مستقبلية عند التعديل؛ لا أثر أمني مباشر الآن | **منخفضة** |
| 10 | سياسات `accounting_entries` (19_accounting.sql:27-56) تستعلم عن `profiles` داخل السياسة مباشرة (بدون SECURITY DEFINER) | — | تعقيد/اعتماد متبادل | لا يسبب recursion (استعلام على جدول مختلف) ويعمل صحيحاً، لكنه يعتمد على سياسة SELECT الخاصة بالبروفايل؛ لو تغيّرت سياسة البروفايل ستنكسر صلاحيات المحاسبة | **منخفضة** |

---

## 4. فحص RLS بالتفصيل

### 4.1 هل يقرأ المشرف كل البروفايلات؟
- السياسة الأصلية `profiles_select_own` (15_rls_policies.sql:90-92): `USING (id = auth.uid() OR is_admin())` → نعم، المشرف يقرأ كل الصفوف ✓
- **لكن** `fix_schema.sql:120-122` يستبدلها بـ `USING (true)` → الجميع (بما فيهم غير المسجلين) يقرؤون كل البروفايلات — إزالة كاملة للتحكم بدل «إصلاح» وصول المشرف.

### 4.2 هل تسمح بتحديث role؟
- `profiles_update_own` (15_rls_policies.sql:98-100): `FOR UPDATE USING (id = auth.uid() OR is_admin())` **بدون `WITH CHECK`** → PostgreSQL يستخدم تعبير `USING` نفسه كـ WITH CHECK → أي مستخدم يحدّث صفه بشرط بقاء `id` كما هو (وهو الحال) → **يستطيع تعيين `role='admin'` لنفسه بحرية**. لا يوجد فصل بين «تحديث بياناتي» و«تغيير الدور».

### 4.3 سياسات على auth.users؟
- **لا توجد أي سياسة على `auth.users`** في كل ملفات السكيما، والواجهة لا تقرأ `auth.users` إطلاقاً (لا `.from('auth.users')` ولا `admin.listUsers`) → لا يوجد خرق لقاعدة «لا تُقرأ auth.users إلا عبر SECURITY DEFINER» ✓ (الأدمن لا يرى بريد المستخدم المُسجَّل من auth بل من profiles).

### 4.4 trigger الإنشاء التلقائي؟
- يوجد: `handle_new_user()` (03_profiles.sql:35-53) مع `trg_on_auth_user_created AFTER INSERT ON auth.users` لغة `SECURITY DEFINER` → يُنشئ البروفايل تلقائياً ✓ — **لكنه يتعارض مع الإدراج اليدوي في `register()`** (المشكلة 6).

### 4.5 فحص الدور في السياسات و recursion؟
- السياسات تستخدم دالة `is_admin()` المحمية بـ **SECURITY DEFINER** (03_profiles.sql:58-67). بما أن الدالة تعمل بصلاحيات المالك (postgres في Supabase، يتجاوز RLS) → **لا يوجد recursion** عند استدعائها من سياسات `profiles` نفسها. هذا التصميم صحيح في الملفين الأساسيين ✓
- **تحذير:** لو أُزيل `SECURITY DEFINER` من `is_admin()` ستنفجر حلقة recursion لا نهائية (خطأ 42P17) على كل الجداول المعتمدة عليها — حساسية تصميم يجب الحفاظ عليها.
- سياسات `accounting_entries` (19_accounting.sql) تستعلم عن `profiles` **بشكل مباشر** في السياسة (ليس عبر دالة SECURITY DEFINER): هذا لا يسبب recursion لأن الجدولين مختلفان، ويعمل بفضل `profiles_select_own` الحالية — لكنه قابل للكسر إذا غُيّرت سياسة البروفايل.

---

## 5. ملاحظات إضافية

1. **لا يوجد جدول `users` إطلاقاً** في السكيما، والواجهة لا تطلبه → لا يوجد خطأ 42P01 من هذا النوع (المخاوف المذكورة في المهمة حول `users` غير واردة هنا).
2. أعمدة المواصفة المفترضة (`full_name`, `avatar_url`, `is_admin`, `is_banned`, `updated_at`) **لا تطابق السكيما الفعلية** (`name`, `avatar`, ولا أعمدة إضافية) — الواجهة مبنية على الفعلية، لذا لا انحراف من هذا الجانب، لكن لا توجد إمكانية ban/فلترة بحالة الأدمن.
3. `AdminUsersPage` يعتمد على وضع «fallback» في adminService: عند فشل الاستعلام يعرض بيانات المصفوفات المحلية (أو فارغة). وهذا يخفي أخطاء RLS بصمت (لا يظهر خطأ للمستخدم) — قد يوحي بأن المستخدمين «لا وجود لهم».
4. `getStats` (adminService.ts:480) يحسب عدد المستخدمين من `profiles` — متوافق ✓ (مع تحفظ خصوصية المشكلة 4).
5. `orders.user_id` أُضيف في `fix_schema.sql:67` كنوع TEXT بينما `profiles.id` من نوع uuid — مطابقة النصوص تعمل عملياً لكن بدون قيد FK وبنوع متساهل.
6. `AdminAccountsPage` صفحة محاسبة كاملة (`accounting_entries`) لا علاقة لها بالمستخدمين — التسمية «accounts» مضللة قليلاً لكنها ليست خللاً.

---

## 6. توصيات

1. **(حرجة)** إضافة `WITH CHECK` صريحة لسياسة تحديث البروفايل تمنع تغيير `role` من المستخدم العادي، أو فصل السياسات: «تحديث بياناتي» (`id = auth.uid()` مع منع تعديل `role`) و«تحديث الدور» بشرط `is_admin()` فقط.
2. **(عالية)** التراجع عن تعديل `fix_schema.sql:120-122` و `124-128` (الـ USING(true)) وإبقاء `(id = auth.uid() OR is_admin())`؛ أو استبدالها بسياسات دقيقة تسمح فقط للمشرف بقراءة الكل.
3. **(عالية)** تعبئة `addresses`/`wishlist` في `getUsers` (adminService.ts:458-466) بجلب فعلي (مثلاً من `addresses` و `wishlist_items`) أو إضافة أعمدة، وتجهيز القيم الافتراضية `[]` قبل العرض في AdminUsersPage.tsx:119,124 لمنع الانهيار.
4. **(متوسطة)** إزالة الإدراج اليدوي من `register()` (AuthContext.tsx:128) والاعتماد على trigger `handle_new_user`، أو استخدام `.upsert(..., { onConflict: 'id' })` لتفادي خطأ المفتاح المكرر.
5. **(متوسطة)** إصلاح حساب `ordersCount` باستخدام `mapOrder` أو قراءة `user_id` (snake_case) بدل `userId` عند العدّ.
6. **(منخفضة)** تحصين `is_admin()` بإضافة `SET search_path = public` و `REVOKE EXECUTE ... FROM anon, authenticated`؛ والتحقق مستقبلاً من بقاء `SECURITY DEFINER` لمنع recursion.
7. **(اختياري)** إضافة عمود `is_banned` وسياسة حظر، ودوال `updateUserRole/deleteUser` عبر RPC بأسلوب SECURITY DEFINER إذا أُريد إدارة أدوار من اللوحة.
