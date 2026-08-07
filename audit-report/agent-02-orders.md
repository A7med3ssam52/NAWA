# تقرير فحص التوافق — وحدات الطلبات (Orders) — Agent #2

**المشروع:** متجر ZAHIEG (React + TypeScript + Supabase)
**التاريخ:** 2026-08-02
**النطاق:** لوحة تحكم الطلبات + طبقة الخدمات + سكيما الطلبات
**طبيعة الفحص:** فحص توافق فقط — بدون أي تعديل على الكود

---

## 1. النطاق

**الملفات المقروءة:**

| الجانب | الملف |
|---|---|
| السكيما | `back-end schema/06_orders.sql` (كامل) |
| السكيما | `back-end schema/15_rls_policies.sql` (أقسام orders / order_items) |
| السكيما | `back-end schema/17_functions_triggers.sql` (كامل) |
| السكيما | `back-end schema/18_dashboard_views.sql` (كامل) |
| السكيما | `back-end schema/16_indexes.sql` (فهارس orders/order_items) |
| السكيما | `back-end schema/03_profiles.sql` (دالة is_admin) |
| الواجهة | `src/pages/admin/AdminOrdersPage.tsx` (كامل) |
| الخدمات | `src/services/orderService.ts` (كامل) |
| الخدمات | `src/services/adminService.ts` (أجزاء orders) |
| الأنواع | `src/types/index.ts` (Order, OrderItem, OrderStatus, TrackingEvent) |
| مساند | `src/pages/CheckoutPage.tsx` (إنشاء الطلب) — `src/constants/index.ts` (getOrderStatusMap) — `src/utils/format.ts` (getPaymentMethodLabel) — `src/data/index.ts` + `orders.json` — `src/components/features/TrackingTimeline.tsx` |

---

## 2. خريطة التوافق

| عنصر الواجهة | الجدول.العمود | النوع في السكيما | الحالة |
|---|---|---|---|
| `order.id` | `orders.id` | UUID PK | مطابق |
| `order.userId` | `orders.user_id` | UUID NOT NULL FK→profiles | مطابق (مع مشاكل إنشاء، انظر #3) |
| `order.orderNumber` | `orders.order_number` | TEXT NOT NULL UNIQUE | مطابق |
| `order.status` | `orders.status` | `order_status` ENUM | مطابق |
| `order.items` (OrderItem[]) | `order_items` (id, order_id, product_id, product_name, product_image, quantity, price) | جدول منفصل | **مختلف** — لا يوجد عمود `items` في جدول `orders` إطلاقًا، بينما `mapOrder` و`orderService.create` يتعاملان معه |
| `item.productId` | `order_items.product_id` | UUID FK→products (SET NULL) | مطابق |
| `item.productName` | `order_items.product_name` | TEXT NOT NULL (snapshot) | مطابق |
| `item.productImage` | `order_items.product_image` | TEXT (NULL-able) | مطابق (نوع TS إلزامي غير nullable — خطر صورة مكسورة) |
| `item.quantity` | `order_items.quantity` | INTEGER CHECK ≥ 1 | مطابق |
| `item.price` | `order_items.price` | NUMERIC(10,2) | مطابق |
| `order.total` | `orders.total` | NUMERIC(10,2) + CHECK (valid_totals) | مطابق |
| `order.subtotal` | `orders.subtotal` | NUMERIC(10,2) CHECK ≥ 0 | مطابق |
| `order.shipping` | `orders.shipping` | NUMERIC(10,2) DEFAULT 0 | مطابق |
| `order.discount` | `orders.discount` | NUMERIC(10,2) DEFAULT 0 | مطابق |
| `order.couponCode` | `orders.coupon_code` | TEXT (NULL) | مطابق |
| `order.shippingAddress.fullName/phone/street/city/state` | `orders.shipping_address` | JSONB NOT NULL (snapshot) | مطابق (مضمّنة داخل JSONB) |
| `order.paymentMethod` | `orders.payment_method` | `payment_method` ENUM | **مختلف جزئيًا** — قيمة `vodafone-cash` غير موجودة في الـ enum (الموجود `vodafone_cash`) |
| `order.notes` | `orders.notes` | TEXT (NULL) | مطابق |
| `order.createdAt / updatedAt` | `orders.created_at / updated_at` | TIMESTAMPTZ + trigger auto-update | مطابق |
| `order.tracking[]` {status,date,description,completed} | `orders.tracking` | JSONB DEFAULT '[]' | مطابق (نفس الشكل الموصّى به في COMMENT) |
| `customer_name / customer_phone / customer_email` | غير موجودة كأعمدة | — | غير مستخدمة في الواجهة (الاسم/الهاتف من `shipping_address` JSONB) — لا تعارض فعلي |
| `items_total / tax / payment_status` | غير موجودة | — | غير مستخدمة في الواجهة (تُحسب من subtotal/shipping/discount/total) — لا تعارض فعلي |
| قيم الحالة في `STATUS_TABS` و`statusFlow` (pending…cancelled) | `order_status` ENUM (pending, confirmed, processing, shipped, delivered, cancelled) | ENUM | **مطابق تمامًا** (6/6). لا يوجد استخدام لـ `returned`/`refunded` في أي من الطرفين |
| فلترة `status` (eq) و `search` (ilike order_number) و `order(created_at, desc)` | `orders.status`, `orders.order_number`, `orders.created_at` | فهارس جاهزة | مطابق (فهارس موجودة) |
| دالة `get_dashboard_data()` / عرض `dashboard_stats` / `recent_orders` | معرّفة في `18_dashboard_views.sql` | VIEW + FUNCTION | معرّفة لكن **غير مستخدمة** من الواجهة (getStats تستعلم يدويًا) |
| `daily_sales` | غير معرّفة في أي ملف سكيما | — | غير موجودة (وغير مطلوبة من الواجهة) |

---

## 3. جدول المشاكل

| # | ما تستخدمه الواجهة (ملف:سطر) | الموجود في السكيما | نوع المشكلة | الأثر | الخطورة |
|---|---|---|---|---|---|
| 1 | `orderService.create` يُدخل عمود `items` ضمن insert (src/services/orderService.ts:37) | `orders` لا يحتوي أي عمود `items`؛ البنود في جدول `order_items` | عمود غير موجود | **فشل كامل لإنشاء أي طلب** (PostgREST يرفض العمود المجهول). الكود لا يفحص `error` بعد insert، فيُظهر للعميل نجاحًا وهميًا والطلب لا يُحفظ فعليًا | حرجة |
| 2 | قيمة `vodafone-cash` (src/pages/CheckoutPage.tsx:233 → orderService.ts:44) ونفس المفتاح في getPaymentMethodLabel (src/utils/format.ts:55) | ENUM `payment_method` = (cod, card, **vodafone_cash**, fawry, instapay) — 06_orders.sql:19-21 | قيمة enum غير صالحة | فشل insert عند اختيار "فودافون كاش" (خطأ 22P02), وعرض القيمة الخام بدل الترجمة عند وجود بيانات قديمة | حرجة |
| 3 | `userId: user?.id` من سياق auth المحلي (CheckoutPage.tsx:88) و`user_id` قد يكون undefined للضيوف (orderService.ts:34) | `user_id` NOT NULL REFERENCES profiles — 06_orders.sql:31 + سياسة `orders_insert` تشترط `user_id = auth.uid()` — 15_rls_policies.sql:162-164 | قيد NOT NULL + سياسة RLS | شراء الضيف يفشل دائمًا (user_id مفقود)، وأي مستخدم بياناته المحلية لا تطابق `auth.uid()` سيُرفض إدراجه | حرجة |
| 4 | نافذة التفاصيل تعرض `order.items.map(...)` (src/pages/admin/AdminOrdersPage.tsx:465-480) | `mapOrder` يقرأ `data.items` (adminService.ts:697) من جدول `orders` الذي لا يحتوي العمود | عمود غير موجود + عدم جلب `order_items` | **قائمة أصناف الطلب فارغة دائمًا** في لوحة التحكم؛ لا يُجلب `order_items` نهائيًا في `getOrders`/`getOrder` | عالية |
| 5 | إدراج سجل إيميل التأكيد (CheckoutPage.tsx:108-110) | سياسة `order_email_logs_insert` تشترط `is_admin()` — 15_rls_policies.sql:414-416 | RLS يمنع المستخدم العادي | فشل صامت (بدون فحص error) — سجلات الإيميلات لن تُكتب أبدًا للعملاء | عالية |
| 6 | `AdminDashboardPage` يستخدم `adminService.getStats()` (AdminDashboardPage.tsx:80) بجمل يدوية | العروض `dashboard_stats`/`monthly_revenue`/`recent_orders` ودالة `get_dashboard_data()` معرّفة وجاهزة — 18_dashboard_views.sql | تكرار/إهمال — لا توافق فعلي لكن وظيفة زائدة | حمل يدوي مكرر وغير متسق (getStats يحسب الإيراد دون استثناء `cancelled` بينما `monthly_revenue` يستثنيه)؛ `daily_sales` غير معرّفة إطلاقًا | متوسطة |
| 7 | — | العروض (views) مُنشأة دون `security_invoker` فتُنفَّذ بصلاحيات المالك | أمن RLS | أي مستخدم يستطيع استدعاء `dashboard_stats`/`recent_orders` وقراءة كل الطلبات/الإيرادات خارج سياسات RLS (نظرًا لأن الواجهة لا تستدعيها حاليًا فالأثر مؤجل) | متوسطة |
| 8 | تحديث الحالة يكتب `updated_at` يدويًا (adminService.ts:351) | Trigger `trg_orders_updated_at` يضبطه تلقائيًا — 06_orders.sql:79-91 | تكرار غير ضار | لا أثر وظيفي — مجرد ازدواجية صيانة | منخفضة |
| 9 | البحث `ilike '%…%'` على order_number (adminService.ts:312) | فهرس B-tree `idx_orders_number` غير مناسب لنمط `%..%` — 16_indexes.sql:26 | أداء | مسح تسلسلي عند البحث؛ لا بحث بالاسم/الهاتف (بيانات jsonb) | منخفضة |
| 10 | `OrderItem.productImage: string` (src/types/index.ts:107) | `order_items.product_image` NULL-able — 06_orders.sql:68 | توافق أنواع | عرض صورة مكسورة عند قيم NULL | منخفضة |
| 11 | — | لا توجد سياسات UPDATE/DELETE على `order_items` — 15_rls_policies.sql:177-189 | غياب سياسات | لا يمكن تعديل/حذف بنود مباشرة (غير مستخدمة حاليًا — إن استُخدمت لاحقًا ستفشل) | منخفضة |

---

## 4. فحص RLS

- دالة `is_admin()` معرّفة في `03_profiles.sql:58-67` (SECURITY DEFINER) وتعتمد على `profiles.role = 'admin'` — صحيحة.
- `orders_select`: `user_id = auth.uid() OR is_admin()` ✅ — المشرف يقرأ كل الطلبات.
- `orders_update`: `is_admin()` ✅ — المشرف يحدّث الحالة (كل الأعمدة).
- `orders_delete`: `is_admin()` ✅ — الحذف متاح ويشمل cascade إلى order_items.
- `orders_insert`: `user_id = auth.uid()` فقط — يمنع الضيوف وإنشاء طلبات باسم مشرف (لا سياسة للمشرف أو للضيوف). **تعارض مباشر مع دفق إنشاء الطلب في الواجهة** (مشكلة #3).
- `order_items_select/insert`: `EXISTS(... orders.user_id = auth.uid()) OR is_admin()` ✅ — المشرف يقرأ/يُدرج البنود؛ لكن لا UPDATE/DELETE.
- إدراج `order_email_logs` محصور بالمشرف بينما يُستدعى من شاشة العميل ❌ (مشكلة #5).
- **الخلاصة:** جانب القراءة/التحديث/الحذف للمشرف سليم. الجانب المكسور هو **الإدراج** (orders + order_email_logs) من واجهة العميل.

---

## 5. فحص الفهارس والترقيم

- `idx_orders_created_at (DESC)` ✅ يخدم `order('created_at', { ascending: false })` في getOrders.
- `idx_orders_status` ✅ يخدم فلترة `eq('status', …)`.
- `idx_orders_user_id` + `idx_orders_number (UNIQUE)` ✅ (خدمة حساب العميل والبحث بالرقم الدقيق).
- `idx_order_items_order_id / product_id` ✅.
- **ترقيم الطلب:** `order_number` يُنشأ من الواجهة بـ `MAT-YYYY-NNNN` عشوائي (orderService.ts:15) وتوجد دالة `generate_order_number()` + trigger في السكيما لا يعملان لأن الواجهة ترسل القيمة دائمًا (الشرط `IF NEW.order_number IS NULL`)؛ العشوائية تسمح بتكرارات نادرة تُرفض بسبب UNIQUE دون retry من الواجهة (الـ trigger وحده يعيد المحاولة). ملاحظة متوسطة/منخفضة.
- **ترتيب القوائم:** الترتيب تنازلي حسب created_at ✅ مطابق في كلا المسارين (DB والـ fallback المحلي).

---

## 6. ملاحظات إضافية

1. حالة `valid_totals` (total = subtotal + shipping − discount) قد ترفض طلبات واجهة الحساب: الواجهة تحسب `total` من `subtotal + shippingCost - discount` (CheckoutPage) — متوافق، لكن أي انحراف مستقبلي سيفشل مع رسالة غامضة (الواجهة لا تفحص أخطاء insert).
2. `order_status` والواجهة متطابقان 6/6 — لا `returned`/`refunded` في أي طرف حاليًا.
3. مسار الـ fallback المحلي (mock) في `adminService.getOrders` يعتمد على `orders.json` ويبدو متسقًا مع نفس القيم.
4. سياسة `orders_select` للمستخدم تشمل طلباته فقط ✅، و`getOrder(id)` للمشرف لا يفحص انتماء الطلب — مقبول لأن RLS يحمي على مستوى الصف.
5. `order_items` لا تُدرج إطلاقًا من الواجهة (لا في create ولا في مكان آخر) — حتى بعد إصلاح #1 يلزم إدراج البنود في `order_items` وإلا تبقى فارغة.

---

## 7. توصيات

1. **حرجة:** إزالة عمود `items` من insert في `orderService.create` وإدراج البنود في جدول `order_items` (بعد insert الطلب) بدلًا من جدول `orders`.
2. **حرجة:** توحيد قيمة فودافون كاش إلى `vodafone_cash` (CheckoutPage + getPaymentMethodLabel) أو تعديل الـ enum — ويُفضَّل الاتجاه إلى السكيما.
3. **حرجة:** معالجة إنشاء الطلب للضيوف: إما سياسة `orders_insert` تسمح بـ `user_id IS NULL` مع جعل `user_id` nullable وإضافة عمود/حقل ضيف، أو إنشاء طلب عبر `security definer` RPC، مع إلزام تمرير `auth.uid()` للمستخدمين المسجلين.
4. **عالية:** تعديل `adminService.getOrders/getOrder` ليجلب `order_items` بالعلاقة (e.g. `select('*, order_items(*)')`) كي تظهر أصناف الطلب في نافذة التفاصيل.
5. **عالية:** فحص أخطاء `supabase.insert` في كل مسارات إنشاء الطلب وعرض فشل حقيقي بدل النجاح الوهمي؛ وتعديل سياسة `order_email_logs_insert` لتسمح للمستخدم أو تحويلها إلى استدعاء edge function.
6. **متوسطة:** استدعاء `get_dashboard_data()`/`dashboard_stats` من اللوحة لتوحيد الحسابات، وتوحيد معالجة الطلبات الملغاة في الإيراد.
7. **متوسطة:** إعادة إنشاء العروض بـ `security_invoker = true` أو تقييدها بسياسات RLS.
8. **منخفضة:** إضافة فهرس `pg_trgm` على order_number للبحث بـ ilike، أو جعل `product_image` غير nullable في النوع (أو التعامل مع null).
