-- ZAHIEG E-Commerce Database Schema
-- Run this in your Supabase SQL Editor

-- ─── Profiles (extends auth.users) ───
CREATE TABLE profiles (
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
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  image TEXT DEFAULT '',
  icon TEXT DEFAULT 'Folder',
  products_count INT DEFAULT 0
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- ─── Brands ───
CREATE TABLE brands (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo TEXT DEFAULT '',
  products_count INT DEFAULT 0
);

ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

-- ─── Products ───
CREATE TABLE products (
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
  colors TEXT[] DEFAULT '{}',
  sizes TEXT[] DEFAULT '{}',
  stock_by_color JSONB DEFAULT '{}',
  stock_by_size JSONB DEFAULT '{}',
  is_new BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Idempotent migration for existing databases (all optional columns)
ALTER TABLE products ADD COLUMN IF NOT EXISTS colors TEXT[] DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS sizes TEXT[] DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_by_color JSONB DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_by_size JSONB DEFAULT '{}';

-- ─── Reviews ───
CREATE TABLE reviews (
  id TEXT PRIMARY KEY,
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
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
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  user_id TEXT REFERENCES profiles(id),
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
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'info' CHECK (type IN ('order','promo','system','info')),
  title TEXT NOT NULL,
  message TEXT DEFAULT '',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ─── Coupons ───
CREATE TABLE coupons (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  discount INT NOT NULL DEFAULT 0,
  type TEXT DEFAULT 'percentage' CHECK (type IN ('percentage','fixed')),
  min_order DECIMAL(10,2) DEFAULT 0,
  max_discount DECIMAL(10,2) DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  usage_limit INT DEFAULT 100,
  used_count INT DEFAULT 0
);

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- ─── Addresses ───
CREATE TABLE addresses (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
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
CREATE TABLE testimonials (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  avatar TEXT DEFAULT '',
  rating INT DEFAULT 5,
  comment TEXT DEFAULT '',
  role TEXT DEFAULT ''
);

ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- ─── Spin Prizes ───
CREATE TABLE spin_prizes (
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

-- ─── RLS Policies (public read, authenticated write) ───

-- Products: anyone can read, only admins can write
CREATE POLICY "products_read" ON products FOR SELECT USING (true);

-- Categories: anyone can read
CREATE POLICY "categories_read" ON categories FOR SELECT USING (true);

-- Brands: anyone can read
CREATE POLICY "brands_read" ON brands FOR SELECT USING (true);

-- Reviews: anyone can read
CREATE POLICY "reviews_read" ON reviews FOR SELECT USING (true);

-- Orders: users read own orders
CREATE POLICY "orders_read" ON orders FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- Profiles: users read own profile
CREATE POLICY "profiles_read" ON profiles FOR SELECT USING (auth.uid() = auth_id);

-- Coupons: anyone can read (checking)
CREATE POLICY "coupons_read" ON coupons FOR SELECT USING (true);

-- Addresses: users read own
CREATE POLICY "addresses_read" ON addresses FOR SELECT USING (auth.uid() IN (SELECT auth_id FROM profiles WHERE id = user_id));

-- Notifications: users read own
CREATE POLICY "notifications_read" ON notifications FOR SELECT USING (auth.uid() IN (SELECT auth_id FROM profiles WHERE id = user_id));

-- Testimonials: public read
CREATE POLICY "testimonials_read" ON testimonials FOR SELECT USING (true);

-- Spin Prizes: public read
CREATE POLICY "spin_prizes_read" ON spin_prizes FOR SELECT USING (true);

-- ─── Store Settings ───
CREATE TABLE store_settings (
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
CREATE POLICY "store_settings_read" ON store_settings FOR SELECT USING (true);
CREATE POLICY "store_settings_write" ON store_settings FOR ALL USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');

INSERT INTO store_settings (id, name, description, phone, email, address) VALUES
('default', 'Zahi', 'أفضل متجر إلكتروني في مصر', '+201234567890', 'info@zahieg.com', 'القاهرة، مصر')
ON CONFLICT (id) DO NOTHING;

-- ─── Announcements ───
CREATE TABLE announcements (
  id TEXT PRIMARY KEY DEFAULT 'default',
  text TEXT DEFAULT '',
  enabled BOOLEAN DEFAULT false,
  dismissible BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "announcements_read" ON announcements FOR SELECT USING (true);
CREATE POLICY "announcements_write" ON announcements FOR ALL USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');

INSERT INTO announcements (id, text, enabled, dismissible) VALUES
('default', '', false, true)
ON CONFLICT (id) DO NOTHING;

-- ─── Back In Stock Requests ───
CREATE TABLE back_in_stock_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE back_in_stock_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "back_in_stock_insert" ON back_in_stock_requests FOR INSERT WITH CHECK (true);

-- ─── Order Emails ───
CREATE TABLE order_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT REFERENCES orders(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  total DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE order_emails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order_emails_insert" ON order_emails FOR INSERT WITH CHECK (true);

-- ─── Guest Checkout → Auto Account ───
-- After a guest places an order (user_id NULL) and the store creates an account
-- via auth.signUp, this RPC claims the order for the just-created account.
-- The temporary password is generated client-side and never stored in the DB.
CREATE OR REPLACE FUNCTION public.link_guest_order(p_order_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_uid TEXT := auth.uid()::text;
BEGIN
    IF v_uid IS NULL OR v_uid = '' THEN
        RETURN FALSE;
    END IF;
    UPDATE orders
       SET user_id = v_uid
     WHERE id = p_order_id
       AND user_id IS NULL;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
COMMENT ON FUNCTION public.link_guest_order IS
    'Claims a guest order (user_id IS NULL) for the freshly created account of the current user.';
REVOKE ALL ON FUNCTION public.link_guest_order(TEXT) FROM public;
GRANT EXECUTE ON FUNCTION public.link_guest_order(TEXT) TO anon, authenticated;
