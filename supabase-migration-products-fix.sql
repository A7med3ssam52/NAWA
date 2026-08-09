-- ============================================================================
-- ZAHIEG — PRODUCTS FIX MIGRATION  (run in Supabase Dashboard → SQL Editor)
-- ----------------------------------------------------------------------------
-- Fixes:
--  1. Products table used legacy TEXT columns `category` / `brand` while the
--     app queries `category_id` / `brand_id` (FK to categories/brands).
--     If the old columns still exist, they are renamed to the new names so the
--     admin panel can save products again ("حدث خطأ أثناء حفظ المنتج").
--  2. Ensures the variant columns (colors / sizes / stock_by_color /
--     stock_by_size) exist with safe defaults for products that have no variants.
--  3. Promotes kiady@zahieg.com to admin (or inserts his profile row) so the
--     admin panel is reachable for the owner account.
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

-- ── 2. Ensure variant columns exist (idempotent) ─────────────────────────────
ALTER TABLE products ADD COLUMN IF NOT EXISTS colors TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS sizes TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_by_color JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_by_size JSONB NOT NULL DEFAULT '{}'::jsonb;

-- ── 3. Promote owner account to admin ────────────────────────────────────────
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_protect_profile_role') THEN
        ALTER TABLE profiles DISABLE TRIGGER trg_protect_profile_role;
    END IF;
    BEGIN
        UPDATE profiles SET role = 'admin' WHERE email = 'kiady@zahieg.com';
        INSERT INTO profiles (id, name, email, avatar, role)
        SELECT id,
               COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', ''),
               email,
               COALESCE(raw_user_meta_data->>'avatar_url', ''),
               'admin'
        FROM auth.users
        WHERE email = 'kiady@zahieg.com'
        ON CONFLICT (id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'admin upgrade skipped: %', SQLERRM;
    END;
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_protect_profile_role') THEN
        ALTER TABLE profiles ENABLE TRIGGER trg_protect_profile_role;
    END IF;
END $$;

-- ── 4. VERIFY (run afterwards) ───────────────────────────────────────────────
-- SELECT id, name, email, role FROM profiles WHERE email = 'kiady@zahieg.com';
-- → expect: role = 'admin'
-- SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_schema = 'public' AND table_name = 'products'
--   ORDER BY ordinal_position;
-- → expect: category_id, brand_id, colors, sizes, stock_by_color, stock_by_size
-- ============================================================================
