-- ============================================================================
-- NAWA — UNIFIED PRODUCT SAVE FIX MIGRATION  (run in Supabase SQL Editor)
-- ----------------------------------------------------------------------------
-- Combines, in a single idempotent script:
--  1. Rename legacy products.category -> category_id and products.brand ->
--     brand_id when the old columns still exist (fixes "حدث خطأ أثناء حفظ
--     المنتج" in the admin panel).
--  2. Ensure the variant columns (colors / sizes / stock_by_color /
--     stock_by_size) exist with the same types as supabase-full-schema.sql.
--  3. (Re)create is_admin() used by every write policy.
--  4. Create the product_categories junction table (+ indexes + backfill),
--     enable RLS and add its policies.
--  5. Rebuild the products RLS policies (public read, admin write).
--  6. Promote admin@nawaeg.com to admin (auth_id/id aware).
-- Everything is idempotent — safe to run repeatedly.
-- ============================================================================

-- ── 1. Rename legacy category/brand columns if they still exist ─────────────
DO $$
DECLARE
    has_category_col BOOLEAN;
    has_category_id_col BOOLEAN;
    has_brand_col BOOLEAN;
    has_brand_id_col BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'category'
    ) INTO has_category_col;
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'category_id'
    ) INTO has_category_id_col;
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'brand'
    ) INTO has_brand_col;
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'brand_id'
    ) INTO has_brand_id_col;

    IF has_category_col AND NOT has_category_id_col THEN
        ALTER TABLE products RENAME COLUMN category TO category_id;
        RAISE NOTICE 'renamed products.category -> category_id';
    END IF;
    IF has_brand_col AND NOT has_brand_id_col THEN
        ALTER TABLE products RENAME COLUMN brand TO brand_id;
        RAISE NOTICE 'renamed products.brand -> brand_id';
    END IF;
END $$;

-- ── 2. Ensure variant columns exist (idempotent, types match full schema) ───
ALTER TABLE products ADD COLUMN IF NOT EXISTS colors TEXT[];
ALTER TABLE products ADD COLUMN IF NOT EXISTS sizes TEXT[];
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_by_color JSONB;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_by_size JSONB;

-- ── 3. Admin helper (used by every write policy) ─────────────────────────────
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
          AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;
COMMENT ON FUNCTION is_admin IS 'True if the current user has role=admin. Used in RLS.';

-- ── 4. product_categories junction table (multi-category support) ───────────
CREATE TABLE IF NOT EXISTS product_categories (
  product_id  TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_product_categories_product_id ON product_categories(product_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_category_id ON product_categories(category_id);

-- Backfill: link every existing product to its current primary category
INSERT INTO product_categories (product_id, category_id)
SELECT id, category_id FROM products WHERE category_id IS NOT NULL
ON CONFLICT (product_id, category_id) DO NOTHING;

-- RLS: public read, admin write
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_categories_select" ON product_categories;
CREATE POLICY "product_categories_select" ON product_categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "product_categories_insert" ON product_categories;
CREATE POLICY "product_categories_insert" ON product_categories FOR INSERT WITH CHECK (is_admin());
DROP POLICY IF EXISTS "product_categories_update" ON product_categories;
CREATE POLICY "product_categories_update" ON product_categories FOR UPDATE USING (is_admin());
DROP POLICY IF EXISTS "product_categories_delete" ON product_categories;
CREATE POLICY "product_categories_delete" ON product_categories FOR DELETE USING (is_admin());

-- ── 5. products RLS policies: public read, admin write ──────────────────────
DROP POLICY IF EXISTS "products_read" ON products;
DROP POLICY IF EXISTS "products_select" ON products;
DROP POLICY IF EXISTS "products_insert" ON products;
DROP POLICY IF EXISTS "products_update" ON products;
DROP POLICY IF EXISTS "products_delete" ON products;

CREATE POLICY "products_select" ON products FOR SELECT USING (true);
CREATE POLICY "products_insert" ON products FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "products_update" ON products FOR UPDATE USING (is_admin());
CREATE POLICY "products_delete" ON products FOR DELETE USING (is_admin());

-- ── 6. Promote owner account to admin (dual auth_id/id aware) ───────────────
DO $$
DECLARE
    has_auth_id BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'auth_id'
    ) INTO has_auth_id;

    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_protect_profile_role') THEN
        ALTER TABLE profiles DISABLE TRIGGER trg_protect_profile_role;
    END IF;
    BEGIN
        UPDATE profiles SET role = 'admin' WHERE email = 'admin@nawaeg.com';
        IF has_auth_id THEN
            INSERT INTO profiles (auth_id, name, email, avatar, role)
            SELECT id,
                   COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', ''),
                   email,
                   COALESCE(raw_user_meta_data->>'avatar_url', ''),
                   'admin'
            FROM auth.users
            WHERE email = 'admin@nawaeg.com'
            ON CONFLICT (auth_id) DO NOTHING;
        ELSE
            INSERT INTO profiles (id, name, email, avatar, role)
            SELECT id,
                   COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', ''),
                   email,
                   COALESCE(raw_user_meta_data->>'avatar_url', ''),
                   'admin'
            FROM auth.users
            WHERE email = 'admin@nawaeg.com'
            ON CONFLICT (id) DO NOTHING;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'admin upgrade skipped: %', SQLERRM;
    END;
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_protect_profile_role') THEN
        ALTER TABLE profiles ENABLE TRIGGER trg_protect_profile_role;
    END IF;
END $$;

-- ── 7. VERIFY (run afterwards) ──────────────────────────────────────────────
-- ── products columns (expect: category_id, brand_id, colors, sizes,
-- ──                     stock_by_color, stock_by_size):
-- SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_schema = 'public' AND table_name = 'products'
--   ORDER BY ordinal_position;
--
-- ── product_categories backfill:
-- SELECT count(*) AS linked FROM product_categories;
-- SELECT * FROM product_categories LIMIT 10;
--
-- ── RLS policies on products / product_categories (expect products_select
-- ── USING true; insert/update/delete use is_admin()):
-- SELECT tablename, policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'public' AND tablename IN ('products', 'product_categories')
-- ORDER BY tablename, cmd;
--
-- ── admin role (expect: role = 'admin'):
-- SELECT id, name, email, role FROM profiles WHERE email = 'admin@nawaeg.com';
-- ============================================================================
