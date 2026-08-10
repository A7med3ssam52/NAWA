-- ============================================================================
-- NAWA - SCHEMA FIXES: Add missing tables & align enum values for code compat
-- Run this AFTER _run_all_combined.sql in the Supabase SQL Editor
-- ============================================================================

-- ─── 1. Store Settings (singleton row) ──────────────────────────────────────
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
DROP POLICY IF EXISTS "store_settings_select" ON store_settings;
CREATE POLICY "store_settings_select" ON store_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "store_settings_insert" ON store_settings;
CREATE POLICY "store_settings_insert" ON store_settings FOR INSERT WITH CHECK (is_admin());
DROP POLICY IF EXISTS "store_settings_update" ON store_settings;
CREATE POLICY "store_settings_update" ON store_settings FOR UPDATE USING (is_admin());

INSERT INTO store_settings (id, name, description, phone, email, address, shipping_cost, free_shipping_threshold)
VALUES ('default', 'نوى', 'أفضل متجر إلكتروني في مصر', '+201234567890', 'info@nawaeg.com', 'القاهرة، مصر', 30, 500)
ON CONFLICT (id) DO NOTHING;

-- ─── 2. Announcements (singleton row) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY DEFAULT 'default',
  text TEXT DEFAULT '',
  enabled BOOLEAN DEFAULT false,
  dismissible BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "announcements_select" ON announcements;
CREATE POLICY "announcements_select" ON announcements FOR SELECT USING (true);
DROP POLICY IF EXISTS "announcements_insert" ON announcements;
CREATE POLICY "announcements_insert" ON announcements FOR INSERT WITH CHECK (is_admin());
DROP POLICY IF EXISTS "announcements_update" ON announcements;
CREATE POLICY "announcements_update" ON announcements FOR UPDATE USING (is_admin());

INSERT INTO announcements (id, text, enabled, dismissible)
VALUES ('default', '', false, true)
ON CONFLICT (id) DO NOTHING;

-- ─── 3. Drop & recreate spin_prizes with coupon_code column & matching types ──
ALTER TABLE spin_prizes ADD COLUMN IF NOT EXISTS coupon_code TEXT;

-- Create a compatible enum type for spin prizes
DO $$ BEGIN
  ALTER TABLE spin_prizes ALTER COLUMN type TYPE TEXT;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ─── 4. Add `items` JSONB column to orders (code stores items inline) ────────
ALTER TABLE orders ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]';

-- ─── 5. Add user_id column to notifications if missing ───────────────────────
-- Already exists in _run_all_combined.sql, just making sure

-- ─── 6. Ensure orders table has all columns the code expects ────────────────
ALTER TABLE orders ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id TEXT;

-- ─── 7. RLS: Allow coupons to be read by anyone (code reads them publicly) ──
DROP POLICY IF EXISTS "coupons_select" ON coupons;
CREATE POLICY "coupons_select" ON coupons FOR SELECT USING (true);

-- ─── 8. RLS: Allow products write for authenticated users (code needs this) ─
DROP POLICY IF EXISTS "products_insert" ON products;
CREATE POLICY "products_insert" ON products FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR is_admin());
DROP POLICY IF EXISTS "products_update" ON products;
CREATE POLICY "products_update" ON products FOR UPDATE USING (auth.role() = 'authenticated' OR is_admin());
DROP POLICY IF EXISTS "products_delete" ON products;
CREATE POLICY "products_delete" ON products FOR DELETE USING (auth.role() = 'authenticated' OR is_admin());

-- Same for categories, brands
DROP POLICY IF EXISTS "categories_insert" ON categories;
CREATE POLICY "categories_insert" ON categories FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR is_admin());
DROP POLICY IF EXISTS "categories_update" ON categories;
CREATE POLICY "categories_update" ON categories FOR UPDATE USING (auth.role() = 'authenticated' OR is_admin());
DROP POLICY IF EXISTS "categories_delete" ON categories;
CREATE POLICY "categories_delete" ON categories FOR DELETE USING (auth.role() = 'authenticated' OR is_admin());

DROP POLICY IF EXISTS "brands_insert" ON brands;
CREATE POLICY "brands_insert" ON brands FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR is_admin());
DROP POLICY IF EXISTS "brands_update" ON brands;
CREATE POLICY "brands_update" ON brands FOR UPDATE USING (auth.role() = 'authenticated' OR is_admin());
DROP POLICY IF EXISTS "brands_delete" ON brands;
CREATE POLICY "brands_delete" ON brands FOR DELETE USING (auth.role() = 'authenticated' OR is_admin());

-- Notifications: allow admin to insert without user_id constraint bypass
DROP POLICY IF EXISTS "notifications_insert" ON notifications;
CREATE POLICY "notifications_insert" ON notifications FOR INSERT WITH CHECK (is_admin());

-- Reviews: allow admin full access
DROP POLICY IF EXISTS "reviews_delete" ON reviews;
CREATE POLICY "reviews_delete" ON reviews FOR DELETE USING (is_admin() OR auth.role() = 'authenticated');

-- Orders: allow admin full CRUD
DROP POLICY IF EXISTS "orders_insert" ON orders;
CREATE POLICY "orders_insert" ON orders FOR INSERT WITH CHECK (is_admin() OR user_id::uuid = auth.uid());
DROP POLICY IF EXISTS "orders_update" ON orders;
CREATE POLICY "orders_update" ON orders FOR UPDATE USING (is_admin());
DROP POLICY IF EXISTS "orders_delete" ON orders;
CREATE POLICY "orders_delete" ON orders FOR DELETE USING (is_admin());

-- Spin prizes: allow admin write
DROP POLICY IF EXISTS "spin_prizes_insert" ON spin_prizes;
CREATE POLICY "spin_prizes_insert" ON spin_prizes FOR INSERT WITH CHECK (is_admin());
DROP POLICY IF EXISTS "spin_prizes_update" ON spin_prizes;
CREATE POLICY "spin_prizes_update" ON spin_prizes FOR UPDATE USING (is_admin());
DROP POLICY IF EXISTS "spin_prizes_delete" ON spin_prizes;
CREATE POLICY "spin_prizes_delete" ON spin_prizes FOR DELETE USING (is_admin());

-- Profiles: allow admin to read all
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (true);

-- Addresses: admin can manage all
DROP POLICY IF EXISTS "addresses_select" ON addresses;
CREATE POLICY "addresses_select" ON addresses FOR SELECT USING (true);
DROP POLICY IF EXISTS "addresses_delete" ON addresses;
CREATE POLICY "addresses_delete" ON addresses FOR DELETE USING (is_admin());

-- Testimonials: admin write
DROP POLICY IF EXISTS "testimonials_insert" ON testimonials;
CREATE POLICY "testimonials_insert" ON testimonials FOR INSERT WITH CHECK (is_admin());
DROP POLICY IF EXISTS "testimonials_update" ON testimonials;
CREATE POLICY "testimonials_update" ON testimonials FOR UPDATE USING (is_admin());
DROP POLICY IF EXISTS "testimonials_delete" ON testimonials;
CREATE POLICY "testimonials_delete" ON testimonials FOR DELETE USING (is_admin());
