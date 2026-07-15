# ZAHIEG Back-End Schema — دليل استخدام Supabase

## 🚀 طريقة التنفيذ في Supabase

### الطريقة الأولى: SQL Editor (الأسهل للبداية)

1. ادخل على **Supabase Dashboard** → مشروعك
2. اذهب إلى **SQL Editor**
3. افتح كل ملف من `back-end schema/` بالترتيب المحدد في `_run_all.sql`
4. **Copy-Paste** محتوى كل ملف وشغله

**الترتيب الصحيح:**
```
01 → 02 → 03 → 04 → 05 → 06 → 07 → 08 → 09 → 10
→ 11 → 12 → 13 → 17 → 16 → 18 → 15
```

### الطريقة الثانية: psql CLI (للمطورين)

```bash
# الاتصال بقاعدة البيانات
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-ID].supabase.co:5432/postgres"

# تشغيل كل الملفات بالترتيب
\i 'back-end schema/01_categories_brands.sql'
\i 'back-end schema/02_products.sql'
# ... وهكذا
```

### الطريقة الثالثة: Supabase CLI (لـ CI/CD)

```bash
# تسجيل الدخول
supabase login

# ربط المشروع
supabase link --project-ref [PROJECT-ID]

# تشغيل الـ migration
supabase db push
```

---

## 🔑 إعداد Supabase Auth (مهم جداً)

بعد تنفيذ `03_profiles.sql`:

1. اذهب إلى **Authentication → Settings**
2. تحت **User Signups** تأكد من تفعيل الأيقونة
3. تحت **Services → Default `handle_new_user()` trigger** هيشتغل تلقائياً

### لو عايز تعمل أول Admin:

```sql
-- في SQL Editor
UPDATE profiles
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

---

## 📦 إعداد Storage Buckets

`14_storage_buckets.sql` عبارة عن توثيق فقط. عشان تنشئ الـ buckets فعلياً:

### من Dashboard:
1. اذهب إلى **Storage**
2. أنشئ 4 buckets:
   - `product-images` (Public)
   - `avatars` (Public)
   - `brand-logos` (Public)
   - `category-images` (Public)

### من SQL Editor (لو عايز بالكود — محتاج service_role key):

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('product-images', 'product-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('brand-logos', 'brand-logos', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']),
  ('category-images', 'category-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']);
```

### إضافة Storage RLS Policies:

```sql
-- Product images (Public read, Admin write)
CREATE POLICY "product_images_public_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "product_images_admin_insert"
  ON storage.objects FOR INSERT
  USING (bucket_id = 'product-images' AND is_admin());

CREATE POLICY "product_images_admin_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images' AND is_admin());

-- Avatars (Public read, Owner write - user puts in folder with their UUID)
CREATE POLICY "avatars_public_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_owner_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars');
```

---

## 🔐 RLS — تأكيد إعدادات Authentication

`15_rls_policies.sql` بيستخدم `auth.uid()` و `is_admin()` — دول شغالين فقط لو:

1. ✅ **Enable Row Level Security** مفعل على كل جدول (الملف بيعمل كده)
2. ✅ **anon key** مش ليه صلاحية bypass RLS
3. ✅ **service_role key** بيستخدام فقط من server-side

### لو عايز تختبر RLS:

```sql
-- جرب كـ anon user (مفروض يجيب public data بس)
SELECT * FROM products; -- ينفع
SELECT * FROM profiles; -- مينفعش (غير مسموح)

-- جرب كـ authenticated user
SELECT * FROM profiles WHERE id = auth.uid(); -- ينفع (بياناته بس)
```

---

## ⚠️ ملاحظات مهمة

| الملاحظة | التفاصيل |
|----------|---------|
| **`auth.users` trigger** | `03_profiles.sql` بيضيف trigger على `auth.users` — لازم يكون اللي شغّل السكريبت عنده صلاحية create trigger في `auth` schema |
| **Order Number** | `06_orders.sql` بيستخدم random + loop — لو فيه performance issue، ممكن نستبدله بـ sequence |
| **Dashboard Function** | `get_dashboard_data()` في `18_dashboard_views.sql` — بيرجع JSON واحد كبير. أحسن للـ frontend من 6 queries منفصلين |
| **Seed Data** | `12_settings.sql` عنده seed data للـ announcement و shipping configs. باقي الجداول محتاجة seed data منفصلة |
| **ایمن Admin** | `is_admin()` بتشيك على `profiles.role` — أول Admin لازم يتعمل يدوي بعد first signup |

---

## 🧪 اختبار التثبيت

شغل الكود ده في SQL Editor عشان تتأكد إن كل حاجة تمام:

```sql
-- 1. هل الجداول موجودة؟
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. هل الـ enums موجودة؟
SELECT typname FROM pg_type
WHERE typname IN ('user_role', 'order_status', 'payment_method', 'coupon_type', 'notification_type', 'spin_prize_type');

-- 3. هل الـ triggers موجودة؟
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public';

-- 4. هل الـ views موجودة؟
SELECT table_name FROM information_schema.views
WHERE table_schema = 'public';

-- 5. جرب الـ dashboard function
SELECT get_dashboard_data();
```

---

## 🔄 لو عايز ترجع أي تغيير

```sql
-- Drop كل حاجة (بل次序 عشان الـ dependencies)
-- 1. Views
DROP VIEW IF EXISTS user_sales_summary, brand_distribution,
  out_of_stock_products, low_stock_products, recent_orders,
  top_products, category_distribution, order_status_distribution,
  monthly_revenue, dashboard_stats CASCADE;

-- 2. Tables (عكس ترتيب الإنشاء)
DROP TABLE IF EXISTS order_email_logs, recent_searches, recently_viewed,
  settings, back_in_stock_requests, contact_messages,
  newsletter_subscribers, testimonials, spin_history, spin_prizes,
  notifications, coupons, reviews, order_items, orders,
  wishlist_items, cart_items, addresses, products, profiles,
  categories, brands CASCADE;

-- 3. Enums
DROP TYPE IF EXISTS spin_prize_type, notification_type, coupon_type,
  payment_method, order_status, user_role;
```
