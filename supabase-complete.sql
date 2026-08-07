-- ===========================================================
-- ZAHIEG E-Commerce — Full Schema + Seed (run once in SQL Editor)
-- ===========================================================

-- ─── Profiles (extends auth.users) ───
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT DEFAULT '',
  avatar TEXT DEFAULT '',
  addresses TEXT[] DEFAULT '{}',
  orders TEXT[] DEFAULT '{}',
  wishlist TEXT[] DEFAULT '{}',
  notifications TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ─── Categories ───
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  image TEXT DEFAULT '',
  icon TEXT DEFAULT 'Folder',
  products_count INT DEFAULT 0
);
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- ─── Brands ───
CREATE TABLE IF NOT EXISTS brands (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo TEXT DEFAULT '',
  products_count INT DEFAULT 0
);
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

-- ─── Products ───
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  short_description TEXT DEFAULT '',
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  old_price DECIMAL(10,2),
  discount INT,
  images TEXT[] DEFAULT '{}',
  category TEXT REFERENCES categories(id),
  brand TEXT REFERENCES brands(id),
  rating DECIMAL(2,1) DEFAULT 0,
  reviews_count INT DEFAULT 0,
  stock INT DEFAULT 0,
  sku TEXT DEFAULT '',
  specifications JSONB DEFAULT '[]',
  tags TEXT[] DEFAULT '{}',
  is_new BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- ─── Reviews ───
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
  user_id TEXT,
  user_name TEXT NOT NULL,
  user_avatar TEXT DEFAULT '',
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT DEFAULT '',
  comment TEXT DEFAULT '',
  likes INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- ─── Orders ───
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  user_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','confirmed','processing','shipped','delivered','cancelled')),
  items JSONB DEFAULT '[]',
  total DECIMAL(10,2) DEFAULT 0,
  subtotal DECIMAL(10,2) DEFAULT 0,
  shipping DECIMAL(10,2) DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  coupon_code TEXT,
  shipping_address JSONB,
  payment_method TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  tracking JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- ─── Notifications ───
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  type TEXT DEFAULT 'info' CHECK (type IN ('order','promo','system','info')),
  title TEXT NOT NULL,
  message TEXT DEFAULT '',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ─── Coupons ───
CREATE TABLE IF NOT EXISTS coupons (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  discount INT NOT NULL DEFAULT 0,
  type TEXT DEFAULT 'percentage' CHECK (type IN ('percentage','fixed','freeShipping')),
  min_order DECIMAL(10,2) DEFAULT 0,
  max_discount DECIMAL(10,2) DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  usage_limit INT DEFAULT 100,
  used_count INT DEFAULT 0
);
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- ─── Addresses ───
CREATE TABLE IF NOT EXISTS addresses (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  label TEXT DEFAULT 'Home',
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  street TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT DEFAULT '',
  is_default BOOLEAN DEFAULT false
);
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

-- ─── Testimonials ───
CREATE TABLE IF NOT EXISTS testimonials (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  avatar TEXT DEFAULT '',
  rating INT DEFAULT 5,
  comment TEXT DEFAULT '',
  role TEXT DEFAULT ''
);
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- ─── Spin Prizes ───
CREATE TABLE IF NOT EXISTS spin_prizes (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('percentage','fixed','freeShipping','tryAgain')),
  value DECIMAL(10,2),
  coupon_code TEXT,
  color TEXT DEFAULT '#2563EB',
  weight INT DEFAULT 1,
  is_active BOOLEAN DEFAULT true
);
ALTER TABLE spin_prizes ENABLE ROW LEVEL SECURITY;

-- ─── Store Settings ───
CREATE TABLE IF NOT EXISTS store_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  name TEXT DEFAULT '',
  description TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  address TEXT DEFAULT '',
  shipping_cost DECIMAL(10,2) DEFAULT 30,
  free_shipping_threshold DECIMAL(10,2) DEFAULT 500,
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

-- ─── Announcements ───
CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY DEFAULT 'default',
  text TEXT DEFAULT '',
  enabled BOOLEAN DEFAULT false,
  dismissible BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- ─── Back In Stock Requests ───
CREATE TABLE IF NOT EXISTS back_in_stock_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE back_in_stock_requests ENABLE ROW LEVEL SECURITY;

-- ─── Order Emails ───
CREATE TABLE IF NOT EXISTS order_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT,
  email TEXT NOT NULL,
  total DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE order_emails ENABLE ROW LEVEL SECURITY;

-- ===========================================================
-- RLS Policies
-- ===========================================================
DROP POLICY IF EXISTS "products_read" ON products; CREATE POLICY "products_read" ON products FOR SELECT USING (true);
DROP POLICY IF EXISTS "categories_read" ON categories; CREATE POLICY "categories_read" ON categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "brands_read" ON brands; CREATE POLICY "brands_read" ON brands FOR SELECT USING (true);
DROP POLICY IF EXISTS "reviews_read" ON reviews; CREATE POLICY "reviews_read" ON reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "orders_read" ON orders; CREATE POLICY "orders_read" ON orders FOR SELECT USING (true);
DROP POLICY IF EXISTS "profiles_read" ON profiles; CREATE POLICY "profiles_read" ON profiles FOR SELECT USING (auth.uid() = auth_id);
DROP POLICY IF EXISTS "coupons_read" ON coupons; CREATE POLICY "coupons_read" ON coupons FOR SELECT USING (true);
DROP POLICY IF EXISTS "addresses_read" ON addresses; CREATE POLICY "addresses_read" ON addresses FOR SELECT USING (true);
DROP POLICY IF EXISTS "notifications_read" ON notifications; CREATE POLICY "notifications_read" ON notifications FOR SELECT USING (true);
DROP POLICY IF EXISTS "testimonials_read" ON testimonials; CREATE POLICY "testimonials_read" ON testimonials FOR SELECT USING (true);
DROP POLICY IF EXISTS "spin_prizes_read" ON spin_prizes; CREATE POLICY "spin_prizes_read" ON spin_prizes FOR SELECT USING (true);
DROP POLICY IF EXISTS "store_settings_read" ON store_settings; CREATE POLICY "store_settings_read" ON store_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "store_settings_write" ON store_settings; CREATE POLICY "store_settings_write" ON store_settings FOR ALL USING (true);
DROP POLICY IF EXISTS "announcements_read" ON announcements; CREATE POLICY "announcements_read" ON announcements FOR SELECT USING (true);
DROP POLICY IF EXISTS "announcements_write" ON announcements; CREATE POLICY "announcements_write" ON announcements FOR ALL USING (true);
DROP POLICY IF EXISTS "back_in_stock_insert" ON back_in_stock_requests; CREATE POLICY "back_in_stock_insert" ON back_in_stock_requests FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "order_emails_insert" ON order_emails; CREATE POLICY "order_emails_insert" ON order_emails FOR INSERT WITH CHECK (true);

-- ===========================================================
-- Seed Data
-- ===========================================================

-- ─── Categories ───
-- (Mock categories removed — real categories come from Supabase)

-- ─── Brands ───
INSERT INTO brands (id, name, slug, logo, products_count) VALUES
('brand-1', 'ZARA', 'zara', 'https://picsum.photos/seed/zara/200/100', 1),
('brand-2', 'H&M', 'hm', 'https://picsum.photos/seed/hm/200/100', 0),
('brand-3', 'Nike', 'nike', 'https://picsum.photos/seed/nike/200/100', 0),
('brand-4', 'Adidas', 'adidas', 'https://picsum.photos/seed/adidas/200/100', 0),
('brand-5', 'Gucci', 'gucci', 'https://picsum.photos/seed/gucci/200/100', 0),
('brand-6', 'Puma', 'puma', 'https://picsum.photos/seed/puma/200/100', 0),
('brand-7', 'Samsung', 'samsung', 'https://picsum.photos/seed/samsung/200/100', 0),
('brand-8', 'Apple', 'apple', 'https://picsum.photos/seed/apple/200/100', 0)
ON CONFLICT (id) DO NOTHING;

-- ─── Sample Products ───
-- (Mock products removed — real products come from Supabase)

-- ─── Coupons ───
INSERT INTO coupons (id, code, discount, type, min_order, max_discount, expires_at, usage_limit, used_count) VALUES
('coup-1', 'WELCOME10', 10, 'percentage', 0, 100, '2026-12-31T00:00:00Z', 1000, 45),
('coup-2', 'ZAHI20', 20, 'percentage', 500, 200, '2026-06-30T00:00:00Z', 500, 128),
('coup-3', 'SALE50', 50, 'fixed', 300, 50, '2026-03-31T00:00:00Z', 200, 67),
('coup-4', 'FREESHIP', 100, 'percentage', 200, 30, '2026-09-30T00:00:00Z', 300, 89)
ON CONFLICT (id) DO NOTHING;

-- ─── Addresses ───
INSERT INTO addresses (id, user_id, label, full_name, phone, street, city, state, is_default) VALUES
('addr-1', 'user-1', 'المنزل', 'أحمد محمد', '+201234567890', 'شارع النيل', 'القاهرة', 'القاهرة', true),
('addr-2', 'user-1', 'العمل', 'أحمد محمد', '+201234567890', 'شارع التحرير', 'الجيزة', 'الجيزة', false),
('addr-3', 'user-2', 'المنزل', 'سارة أحمد', '+201098765432', 'شارع البحر', 'الإسكندرية', 'الإسكندرية', true)
ON CONFLICT (id) DO NOTHING;

-- ─── Spin Prizes ───
INSERT INTO spin_prizes (id, label, type, value, coupon_code, color, weight, is_active) VALUES
('spin-1', 'خصم 10%', 'percentage', 10, NULL, '#22C55E', 20, true),
('spin-2', 'خصم 20%', 'percentage', 20, NULL, '#3B82F6', 15, true),
('spin-3', 'خصم 30%', 'percentage', 30, NULL, '#8B5CF6', 10, true),
('spin-4', 'خصم 50%', 'percentage', 50, NULL, '#F59E0B', 5, true),
('spin-5', 'خصم 70%', 'percentage', 70, NULL, '#EF4444', 3, true),
('spin-6', 'شحن مجاني', 'freeShipping', NULL, NULL, '#06B6D4', 12, true),
('spin-7', '50 جنيه كاش', 'fixed', 50, NULL, '#EC4899', 8, true),
('spin-8', '100 جنيه كاش', 'fixed', 100, NULL, '#F97316', 5, true),
('spin-9', 'حظ أوفر', 'tryAgain', NULL, NULL, '#6B7280', 17, true),
('spin-10', '200 جنيه كاش', 'fixed', 200, NULL, '#E11D48', 5, true)
ON CONFLICT (id) DO NOTHING;

-- ─── Testimonials ───
INSERT INTO testimonials (id, name, avatar, rating, comment, role) VALUES
('test-1', 'أحمد علي', 'https://picsum.photos/seed/t1/200/200', 5, 'منتجات رائعة وجودة ممتازة. أنصح الجميع بالتسوق من هنا!', 'عميل مميز'),
('test-2', 'سارة محمد', 'https://picsum.photos/seed/t2/200/200', 5, 'التوصيل سريع جداً والتغليف جميل. تجربة تسوق رائعة.', 'عميلة'),
('test-3', 'محمد حسن', 'https://picsum.photos/seed/t3/200/200', 4, 'جودة المنتجات ممتازة والاسعار مناسبة. سعيد بالتجربة.', 'عميل'),
('test-4', 'نورا أحمد', 'https://picsum.photos/seed/t4/200/200', 5, 'أفضل متجر إلكتروني في مصر. تشكيلة واسعة وجودة عالية.', 'عميلة مميزة'),
('test-5', 'خالد يوسف', 'https://picsum.photos/seed/t5/200/200', 5, 'خدمة عملاء ممتازة ومنتجات أصلية. تجربة شراء لا تنسى.', 'عميل')
ON CONFLICT (id) DO NOTHING;

-- ─── Store Settings ───
INSERT INTO store_settings (id, name, description, phone, email, address, shipping_cost, free_shipping_threshold) VALUES
('default', 'Zahi', 'أفضل متجر إلكتروني في مصر', '+201234567890', 'info@zahieg.com', 'القاهرة، مصر', 30, 500)
ON CONFLICT (id) DO NOTHING;

-- ─── Announcements ───
INSERT INTO announcements (id, text, enabled, dismissible) VALUES
('default', '', false, true)
ON CONFLICT (id) DO NOTHING;

-- ===========================================================
-- How to create the kiady@zahieg.com auth user:
-- 1. Go to Supabase Dashboard > Authentication > Add User
-- 2. Email: kiady@zahieg.com, Password: 123456
-- 3. Then run:
--    INSERT INTO profiles (auth_id, name, email, phone, avatar)
--    VALUES ('THE-UUID-FROM-AUTH', 'Kiady Zahi', 'kiady@zahieg.com',
--            '+201000000000', 'https://ui-avatars.com/api/?name=Kiady+Zahi&background=2563EB&color=fff');
-- ===========================================================
