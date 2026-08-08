# تقرير مقارنة سكيما ZAHIEG بين `supabase-complete.sql` وملفات `back-end schema` المجزأة

**التاريخ:** 2026-08-07
**الأداة:** تحليل يدوي/برمجي لجميع ملفات SQL في المشروع

---

## 1) ملخص تنفيذي

1. **نموذجان مختلفان جذرياً:** `supabase-complete.sql` (والملفان المساعدان `supabase-schema.sql` و`supabase-seed.sql`) يمثّلان فكرة "النسخة القديمة/البسيطة" التي تحاكي بيانات الواجهة القديمة، بينما مجلد `back-end schema/` يمثّل **السكيما الكاملة الاحترافية** (25 جدولاً، 6 enums، RLS كامل، Indexes، Views، Accounting).
2. **الفجوة الأكبر:** يكاد لا يوجد أي **Function/Trigger/View/Index** في `supabase-complete.sql`؛ بينما المجزأ يحتوي 13 دالة و8 Triggers و10 Views و30+ Index والدالة المفتاحية `is_admin()` و`handle_new_user()`.
3. **غياب `is_admin()` و`handle_new_user()`** في `supabase-complete.sql` يعني أن: (أ) البروفايلات لن تُنشأ تلقائياً عند تسجيل مستخدم، (ب) حقل `role` غير موجود أساساً، (ج) كل سياسات RLS المعتمدة على `is_admin()` لن تعمل إن صُدّرت – فالتطبيق سيُرسل data مكشوفاً.
4. **تعارض صريح في الاسم:** `supabase-complete.sql` يستخدم `order_emails` بينما المجزأ يستخدم `order_email_logs` (جدولان بنفس الغرض بأسماء مختلفة) — من الممكن أن تُدَ البناء فيتطابق الجدولان فيها.
5. **انفجار نوع الهوية (ID):** المجزأ يعتمد `UUID` لجميع المفاتيح الرئيسية والأجنبية (بخلاف `TEXT` للـ foreign keys) بينما `supabase-complete` يستخدم `TEXT` للمفاتيح الأشهر (categories/products/brands/orders/reviews/addresses...). هذا يعني بيانات seed من `supabase-seed.sql` (مثل `'brand-1'`, `'addr-1'`, `'user-1'`) **لا يمكن إدراجها** في سكيما المجزأ (تعارض أنواع) والعكس صحيح.
6. **قيم Enums متضاربة بين الطرفين:** `freeShipping` vs `free_shipping` لـ coupons، `tryAgain` vs `try_again` للـ spin_prizes، `promo` vs `success/warning/error` للنوذيف — أي هجرة من طرف لآخر ستكسر الـ CHECK/Enum.
7. **أسلوب User Orders مختلف:** المجزّ يفصل `order_items` عن `orders` (مع `total = subtotal + shipping - discount` CHECK)، بينما `supabase-complete` يخزن `items JSONB` داخل `orders` مباشرة ولا يوجد `order_items`.
8. **ملفات التشغيل غير متسقة:** `_run_all_combined.sql` **لا يتضمّن موديول الـ Accounting** (`19_accounting.sql`)، بينما `_run_all.sql` يتضمنه — فلو تم تشغيل الـ combined لن يوجدا جدولاه `accounting_entries`. كذلك مجلد `_run_all_combined.sql` إن كان يحتوي على "FIXES" مضمنة مطابقة لـ `fix_schema.sql`.
9. **ثغرات أمنية في ملف الإصلاحات:** ملف `fix_schema.sql` (والقسم FIXES داخل الـ combined) يرافّ RLS لتصبح `profiles_select_own → true` و `addresses_select → true` و`coupons/…` علنية، و`products/categories/brands` قابلة للكتابة بأي معلّـ authenticated — وهي **خطيرة** ويجب إعادة تقييمها.
10. **شغّل تسلسلي معطّل في الـ Accounting:** `19_accounting.sql` يستخدم `uuid_generate_v4()` الذي يتطلب تزويد extension `uuid-ossp` (غير مُفعَّل افتراضياً في Supabase، الصحيح `gen_random_uuid()`) — سيفشل التنفيذ.

---

## 2) الجدول الرئيسي للمقارنة (كل الأصول)

### 2.1 حسابات حجم المعلومات

| الأصل | `supabase-complete.sql` | المجزّ (combined / bersama) |
|---|---|---|
| عدد الجداول (public) | **15** | **24** (combined)، أو **25** مع `19_accounting.sql` |
| عدد الـ Policies | 17 | 78 (أساسية) + 40 منها ~3-30 من صيغة FIXES/Fix schema، + ~4 accounting |
| عدد الدوال (Functions) | 0 | 13 |
| عدد الـ Triggers | 0 | 8 |
| عدد الـ Views | 0 | 10 |
| عدد الـ Indexes | 0 | 30+ |
| عدد الـ Enums | 0 (كل شيء TEXT + CHECK) | 6 |
| حصص Seed | 7 كتل (brands/coupons/addresses/spin_prizes/testimonials/store_settings/announcements) | Seed للإعدادات فقط (settings, store_settings, announcements) — بيانات المنتجات من "Supabase" خارجياً |

### 2.2 الجداول

| الأصل | في supabase-complete | في المجزأة | ملاحظات |
|---|---|---|---|
| `profiles` | ✅ (id=UUID منفصل + auth_id المرجع حقٍ من auth.users) | ✅ (id=UUID = auth.users.id) | **مختلف جذرياً**: complete يحوي auth_id + addresses/orders/wishlist/notifications إعداد صفاقات و لا `role`؛ المجزأ يحوي `role` و لا auth_id ولا هذه المصفوفات |
| `categories` | ✅ id TEXT | ✅ id UUID | تعارض النوع؛ complete فيه `products_count` تمد |
| `brands` | ✅ id TEXT | ✅ id UUID | نفس التعارض كالمقابل |
| `products` | ✅ id TEXT | ✅ id UUID | complete: category/brand TEXT FK + لا رفع search؛ المجزأ: category_id/brand_id UUID + search_vector/tsvector + قيود valid_price/valid_discount |
| `reviews` | ✅ | ✅ | complete: user_id TEXT; المجزأ: FK إلى profiles. complete: comment DEFAULT '' وlikes بلا قيد؛ المجزأ: comment NOT NULL + likes CHECK |
| `orders` | ✅ id TEXT | ✅ id UUID | **النموذج مختلف**: complete يحوي items JSONB وبدون friction؛ المجزأ تتطلب order_items، status/payment_method كـ enums، بلا `items` (يُضاف من fix) |
| `notifications` | ✅ | ✅ | نوع النوع *مختلف*: complete: ('order','promo','system','info')؛ المجزأ: ('info','success','warning','error','order') |
| `coupons` | ✅ | ✅ | *قيم type مختلفة*: complete: 'percentage','fixed','freeShipping'؛ المجزأ enum: 'percentage','fixed','free_shipping'. complete بلا is_active/created_at/validations |
| `addresses` | ✅ | ✅ | complete: user_id TEXT بلا FK صارم + label NOT NULL؛ المجزأ: user_id UUID NOT NULL FK + state NOT NULL + created_at |
| `testimonials` | ✅ | ✅ | complete: rating INT default 5، comment ''؛ المجزأ: CHECK 1-5، comment NOT NULL، created_at |
| `spin_prizes` | ✅ | ✅ | **قيم type مختلفة**: complete: 'percentage','fixed','freeShipping','tryAgain' (value DECIMAL + coupon_code)؛ المجزأ enum spin_prize_type: 'free_shipping','try_again' (value INTEGER، وcoupon_code يُضاف من fix) |
| `back_in_stock_requests` | ✅ | ✅ | complete: id UUID، product_id TEXT بدون FK؛ المجزأ: FK ON DELETE CASCADE + notified + UNIQUE(product_id,email) |
| `store_settings` | ✅ | ✅ (يُنشأ في FIXES داخل combined + من fix_schema) | مطابقة تماماً |
| `announcements` | ✅ | ✅ (يُنشأ في FIXES + fix_schema) | مطابقة تماماً |
| `order_emails` | ✅ | ❌ | **جدول اسم مختلف**؛ المقابل في المجزأ هو `order_email_logs` |
| `cart_items` | ❌ | ✅ | فقط المجزأ |
| `wishlist_items` | ❌ | ✅ | فقط المجزأ |
| `order_items` | ❌ | ✅ | فقط المجزأ (لا يوجد في complete) |
| `settings` | ❌ | ✅ | key-value store (في الجذر `settings`) |
| `spin_history` | ❌ | ✅ | سجلّ الدوران العجلة |
| `newsletter_subscribers` | ❌ | ✅ | اشتراكات النشرة |
| `contact_messages` | ❌ | ✅ | رسائل "اتصل بنا" |
| `recently_viewed` | ❌ | ✅ | -- |
| `recent_searches` | ❌ | ✅ | -- |
| `order_email_logs` | ❌ | ✅ | مقابل `order_emails` في الطرف الأخر |
| `accounting_entries` | ❌ | ✅ فقط عبر `_run_all.sql`/`19_accounting.sql` — **موجود في سكيما combined** | المشابه: الموديول الـ Accounting غائب تماماً من `supabase-complete.sql` ويفترق عنه في `_run_all_combined.sql` |

### 2.3 أنظمة RLS، Functions/تriggers، Views، Indexes، Accounting

لمزيد التفاصيل انظر القائمة دوترالق 3.

**في `supabase-complete.sql`:** 17 سياسة جميعها `FOR SELECT USING (true)` تقريباً + سياسات write `ALL` على store_settings/announcements بشكل مفتوح — **لا Functions ولا triggers ولا views ولا فهارس، لا enums، لا accounting**.

**في المجزّ:** 6 أنواع enum، النظام الكامل من الـ RLS المتدرجة (qصير / admin / owner)، 13 دالة، 8 trigger، 10 view (لوحة القيادة)، فهرس 30+، وموديل Accounting منفصل (19).

---

## 3) الاختلافات الكاملة حسب الفئة

### 3.1 الجداول
- **موجود فقط في المجزّ (11):** `cart_items`, `wishlist_items`, `order_items`, `settings`, `spin_history`, `newsletter_subscribers`, `contact_messages`, `recently_viewed`, `recent_searches`, `order_email_logs`, `accounting_entries` (الأخير فقط عبر \_run_all/19).
- **موجود فقط في complete (1):** `order_emails` (يتوازى مع `order_email_logs` المجزيئ تحته اسم مختلف).
- **مشترك لكن بتعريف مخ***: كل جدول مشترك تقريباً.

### 3.2 الأعمدة
| الجدول | عمود في complete | عمود في المجزّ | ملاحظة |
|---|---|---|---|
| `profiles` | `auth_id UUID UNIQUE REFERENCES auth.users` | `id UUID REFERENCES auth.users(id)` (id=uid) | complete فاصل هوية، المجزأ هو الـ pk نفسه |
| `profiles` | `addresses/orders/wishlist/notifications TEXT[]` | — (حذف) | بيانات دُفعت إلى جداول منفصلة في المجزأ |
| `profiles` | — | `role user_role NOT NULL DEFAULT 'customer'` | **الجذر لكل الـ Admin RLS** |
| `categories` | `products_count INT` | — | فقط في complete |
| `products` | `category TEXT REFERENCES categories(id)` / `brand TEXT` | `category_id UUID` / `brand_id UUID` | أسماء أعمدة مختلفة + أنواع مختلفة |
| `products` | — | `search_vector TSVECTOR` (GIN) + trigger | **غير موجود في complete** — لا بحث FTS فيه |
| `orders` | `items JSONB` (default) | — (يضاف فقط من fix) | نموذج التطبيق الجديد يقرأ `items` |
| `orders` | `status TEXT CHECK(...)`, `payment_method TEXT` | `status order_status`, `payment_method` (enum) | |
| `orders` | `user_id TEXT` | `user_id UUID NOT NULL REFERENCES profiles` | |
| `reviews` | `user_id TEXT` | `user_id UUID REFERENCES profiles ON DELETE SET NULL` | |
| `coupons` | `is_active` غير موجود، `max_discount DECIMAL` إلزامي | `is_active BOOLEAN DEFAULT true`، `created_at`، قيود valid_usage | |
| `spin_prizes` | `coupon_code TEXT` (موجود أصلاً) | `coupon_code` يُضاف فقط من fix | |
| `spin_prizes` | `value DECIMAL(10,2)` | `value INTEGER` | نوع مختلف |
| `back_in_stock_requests` | `notified` لا توجد | `notified BOOLEAN DEFAULT false`، `UNIQUE(product,email)` | |
| `addresses` | `state TEXT` (non-NOT NULL) | `state TEXT NOT NULL` + `created_at` | |

### 3.3 الأنواع / الـ Enums
- **فقط في المجدا (6):** `user_role('customer','admin')`, `order_status(6)`, `payment_method('cod','card','vodafone_cash','fawry','instapay')`, `coupon_type('percentage','fixed','free_shipping')`, `notification_type('info','success','warning','error','order')`, `spin_prize_type('percentage','fixed','free_shipping','try_again')`.
- في complete كل شيء يُصرَّح بـ `TEXT + CHECK`.
- **تعارضات قيّ في حال الهجرة:**
  - Coupon: `'freeShipping'` → `'free_shipping'`
  - Spin: `'freeShipping'/'tryAgain'` → `'free_shipping'/'try_again'`
  - Notification: `'promo'/'system'` → `'success'/'warning'/'error'`
- لاحظ أن الـ complete's `coupons.type CHECK` في `supabase-schema.sql` الرسمي هو `('percentage','fixed')` فقط — أي حتى بين ملفيّ الجذر يوجد اختلاف وقار.

### 3.4 RLS

**سياسة الأساس في المجزأ (الملف 15):** نمط مكاتيسير:
- جداول مرجعية (categories/brands/products/spin_prizes/testimonials): `SELECT USING (true)` + الكتابة بالـ `is_admin()`.
- الجداول الخاصة (cart/wishlist/recently_viewed/recent_searches/spin_history/addresses/orders/order_items/notifications): `auth.uid()` وشرط owner.
- رأي (reviews): عامة للـ SELECT، الـ INSERT بـ user match أو guest، الكتابة/حذف بالـ is_admin.
- النطاقات (coupons/contact_settings/settings/order_email_logs/accounting): `is_admin()` للقراءة/الكتابة بشكل صارم.
- الملفة العامة (newsletter_subscribers/contact_messages/back_in_stock): INSERT متاح للجميع، القراءة الوحيدة للـ admin.

**سياسة الـ complete:** كل شيء `FOR SELECT USING (true)` (بما فيه `orders_read`، `addresses_read`، `notifications_read`); `store_settings_write` و`announcements_write` بـ `FOR ALL USING (true)` (مفتوح لأي شخص!) — وأي سياسة select للـ admin التغيب تامة.

**ملف `fix_schema.sql` / قسم FIXES في الـ combined — تلات سياسات (يزعزها RLS):**
- `coupons_select → true` (كان Admin-only)
- `products/categories/brands insert/update/delete → auth.role()='authenticated' OR is_admin()` (فتح الكتابة لكل مسدّق)
- `profiles_select_own → true` (قراءة كل البروفيلات علنياً!) ⚠️
- `addresses_select → true` (قراءة كل العناوين!) ⚠️
- `reviews_delete → is_admin() OR authenticated`
- `orders_insert → is_admin() OR user_id::uuid = auth.uid()` (لاحظ: في أن -completion orders.user_id من نوع TEXT، فـ cast `user_id::uuid` قد يفشل على قيم غير صالحة)

**⚠️ تنبيه:** لتطبيق `fix_schema.sql` على سفيما الـ complete (حيث `orders.user_id` هو TEXT بدون اتفاق النوع)، سيفشـ`is_admin()` ودوال الـ auth ذات الصلة.

### 3.5 Functions & Triggers

| الدالة / الـ trigger | complete | المجزّ | ملاحظات |
|---|---|---|---|
| `handle_new_user()` + trigger `trg_on_auth_user_created` | ❌ | ✅ | **auto-create profile on signup** — غائب في complete (دليل إنشاء الـ profile يديو للتطبيق مع `insert` منفصل) |
| `is_admin()` | ❌ | ✅ | **قلب RLS في المجزأ** |
| `products_search_update()` + `trg_products_search` | ❌ | ✅ | بحث FTS |
| `ensure_single_default_address()` + trigger | ❌ | ✅ | العناوين |
| `orders_set_updated_at()` / `trg_orders_updated_at` | ❌ | ✅ |
| `generate_order_number()` + `orders_set_order_number()` | ❌ | ✅ | يصف رقم طلب MAT-YYYY-NNNN |
| `update_product_rating()` + `trg_reviews_update_product` | ❌ | ✅ | تحديث rating/reviews_count |
| `validate_coupon()` | ❌ | ✅ | |
| `settings_set_updated_at()` / trigger | ❌ | ✅ |
| `increment_coupon_usage()`, `get_user_order_count()`, `is_low_stock()` | ❌ | ✅ |
| `get_dashboard_data()` | ❌ | ✅ | |
| `update_accounting_entries_updated_at()` / trigger | ❌ | ✅ عبر 19 |

**الخلاصة:** كامل طبقة الوظائف في المشروع غائبة عن `supabase-complete.sql`.

### 3.6 Views
- **فقط في المجزأ (10):** `dashboard_stats`, `monthly_revenue`, `order_status_distribution`, `category_distribution`, `top_products`, `recent_orders`, `low_stock_products`, `out_of_stock_products`, `brand_distribution`, `user_sales_summary`.
- **في complete: لا توجد Views إطلاقاً.**

### 3.7 Indexes
- **فقط في المجزأ (30+):** ترتيب على products (category_id, brand_id, slug, created_at, price, partials feature/new/discounted/low_stock, GIN search), orders, order_items, cart, wishlist, reviews, notifications, addresses, spin_history, back_in_stock, recently_viewed, recent_searches, contact_messages, coupons (UPPER(code)), accounting_entries.
- **في complete: لا ٍفهرس إطلاقاً** (فقط PK/إنشاء).

### 3.8 Accounting
- **فقط في المجزأ** عبر `19_accounting.sql`: جدول `accounting_entries (type income/expense, category, amount, description, entry_date, timestamps)` + 3 indexes + 4 سياسات RLS Admin + trigger updated_at.
- **غير موجود في `_run_all_combined.sql`** — فقط في `_run_all.sql`.
- **خطأ تشغيلي محتمل:** استخدام `uuid_generate_v4()` يستلزم extension `uuid-ossp` (غير مفعّلة بافتراء Supabase). كما أن سياساته تكرار لمنطق `is_admin()` بدل استخدام الـ function الجاهزة.

### 3.9 Seed Data
**في `supabase-complete.sql` (متضمن):**
- 8 brands (`'brand-1'..'brand-8'`), 4 coupons (`'coup-1..4'`), 3 addresses (`'addr-1..3'`), 10 spin_prizes (`'spin-1..10'`), 5 testimonials, store_settings(`default`), announcements(`default`).
- Categories خالية ("تأتي من Supabase") و Products غير موجودة، لا Profiles.

**في الجذر `supabase-seed.sql` (مساعد):** نفس Seed + بيانات 2 profiles (`'user-1','user-2'` بمعرفّات TEXT) — من **يجب ألا يُشغَّل** فوق سكيما المجزأ (FN_ref `user-1` لن يطابق أي chore من ك ، وظهورs لن يمر من `type/CHECK` ... إلخ).

**في المجزأ:** seed ضمني فقط: `12_settings.sql` (announcement/store_info/shipping)، store_settings و announcements من fix. **لا يوجد seed لبيانات المنتج**: المنتجات فعلياً تأخذ من Supabase Dashboard.

---

## 4) ما نقص فقط في أحد الطرفين — ومدى ضرره

| التنقص/الفرق | في الطرف الناقص | الأثر |
|---|---|---|
| حقل `profiles.role` + `is_admin()` | ❌ في complete | **حرج — حرج**: يمنع كل RLS القائم على الدور، وتوزيل المقال في المجا يعتمد عليه |
| Auto profile (déclencheur handle_new_user) | ❌ في complete | **حرج**: ملفّا لا يُنشاء تلقائي عند التسجيل — يتطلب أدوات يدوية |
| الجداول الإمعافية (cart/wishlist/order_items/settings...) | ❌ في complete | **عالي**: ميزات العروة والمفضلة والمقارنة والرسائل والنشرة ستفشل بدونها |
| RLS صارمة (امتلاك + admin) | ❌ في complete (open-read عد عموم select + write متاح لخدمة) | **أمني**: بيانات المستخدمين (orders/addresses/notifications/profiles) قابلة للقراءة للجميع |
| Views + Indexes + Search | ❌ في complete | **أداء**: تباطؤ الاستعلامات ولوحة القيادة، لا بحث FTS |
| Accounting module | ❌ في complete و**ليس في combined** | **متوسط**: موجود فقط عبر `_run_all.sql` — سكك stipulations ناقصعة أيضاً |
| التقييد الـ enum constraints | المجموع deprecated في المجزأ (free_shipping/try_again) | **متوسط**: بيانات seed لـ complete (freeShipping/tryAgain) ستُرفض في المجزأ |
| نظام معرفة TEXT vs UUID | تعارض بين الطرفين | **عالي**: هجرة البيانات تحتاج تحويل id/foreign keys كاملة |

---

## 5) التوصيات (مرتبة بالأولوية)

1. **اعتمد المجلد `back-end schema/` كسكيما مرجعية** (الأكمل والأكثر أماناً). تجاهل `supabase-complete.sql` كابنائي لتوليد؛ أو اجعل `supabase-complete.sql` مجرد غلاف يدوّد الملفات (مثل `_run_all_combined.sql`).
2. **نبذة بشدة على أولوية:** اجعل الحالة الرئيسية "أحدث" تكون **`_run_all_combined.sql` + `19_accounting.sql`** وثبّت في README أأن `_run_all_combined.sql` لا يتضمّن الـ Accounting (أضفه يدويأو دمج الملف في الـ combined).
3. **أصلح `fix_schema.sql` / قسم Fixes القائم في combined على نطاق واسع:** أعد سياسات `profiles_select_own`, `addresses_select` إلى القاعدة (verifier `id = auth.uid() OR is_admin()` و `user_id = auth.uid() OR is_admin()`)، وأصلح `products/categories/brands write` لتكون `is_admin()` فقط ما لم يكن هناك سبب أمنيو — الحالة الحالية "أي authenticated" يُعدّ انتهاك أمني.
4. **اصطلح انقسام الهوية (ID):** قرر نموذجاً واحداً (يُفضّل UUID ج). أو أعد نقل `supabase-complete.sql`/`supabase-seed.sql` ليعيبن به UUID (مع بناء قيم لكستوم مشابهة للموجود في الأيزا في `id` السابق نص).
5. **وحّد أسماء الجداول المتضاربة:** `order_emails` vs `order_email_logs` — اعتَمد ضد الـ complete واجعل الجدول `order_email_logs` أو عكسياً. وتوحيد `numbers` enum values لمواجهة الـ 'freeShipping/free_shipping'.
6. **توحيد الطرق:** اعمل : Mig1 معطى `handle_new_user() + is_admin()` وما enums إلى `supabase-complete.sql`، أو الأفضلفاستبدله بالكامل بالمجزئ.
7. **إصلاح `19_accounting.sql`:** استبدل `uuid_generate_v4()` بـ `gen_random_uuid()` وأنتقل في سياساته ليستخدم `is_admin()` بدلاً من ذاكر `EXISTS`.
8. **فرض Seed:** ضع Seed بيانات المنتجات بوض الواقعية (الأمثلة من `supabase-seed.sql` غيب) مع مراعات قيم الـ enum في الطرفين (خاصة `freeShipping` vs `free_shipping`، `tryAgain` vs `try_again`) حتى لا ينجح.
9. **خطوات مناسك/الاقتران:** أقم إطار عمل مبنو (do آخر في مصنعة: schema_201.sql القاعدة، ثم fixes، ثم accounting) وقارنه للـ RLS/trigger/policies بفاصل CI، بدلا من تعال مللاتي دلبيق محا.

---

**ملاحظات ملفات إضافية:**
- `uploadimages.sql` (في الجذر): ينشئ 4 buckets + سياسات Storage RLS (product-images/brand-logos/category-images/avatars) — مذكور في `_run_all.sql` تحت اسم `../uploadimages.sql` وهو موجود بالمسار الصحيح، لكنه في ملف `_run_all` **معطَّل بالكومنت** (يُشغَّل يدوياً بسبب حاجة الخدمة).
- `images.sql` (الجذر): نسخة مبسطة تنشئ bucket واحد فقط (product-images) مع slices — تنوع إضافي.
- `14_storage_buckets.sql` في المجزأ: توثيقي فقط (بلا إنشاء فعلي).

**تناقضات جوهرية يجب إبلاغ صاحب المشروع بها أولاً:** الـ "FIXES" في ملف الإصلاحات يكسر الصلاحية الأمانية; غياب `is_admin` عن `complete` سلّب أي قاعدة RLS قائمة على الدور; واختلاف ID-TEXT/UUID يمنع دمج البيانات بين الطرفين دون تحويل شامل.