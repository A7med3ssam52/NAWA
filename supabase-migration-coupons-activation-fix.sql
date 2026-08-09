-- ============================================================================
-- ZAHIEG — COUPONS ACTIVATION FIX MIGRATION  (run in Supabase Dashboard → SQL Editor)
-- ----------------------------------------------------------------------------
-- Problem: "يحدث مشكلة عند تفعيل الكوبونات" — toggling / using coupons fails.
-- Fixes:
--  1. Ensures the coupons columns the app relies on exist (is_active,
--     created_at, min_order, max_discount) and normalizes data so no legacy
--     row can violate the constraints (0 → NULL for max_discount, NULL
--     usage counters backfilled, NULL usage_limit → 100).
--  2. Rebuilds the coupons type / max_discount / usage CHECK constraints in
--     the correct order (DROP → UPDATE data → ADD) so they can never fail.
--  3. Ensures profiles.role exists and installs a dual auth_id/id aware
--     is_admin() so admin-only coupon RLS works on both schema variants.
--  4. Replaces get_coupon() with a strict validation order (invalid code →
--     disabled → expired → usage limit reached) that returns max_discount RAW
--     (no coalesce) so the frontend reads data.max_discount directly.
--  5. Recreates increment_coupon_usage() (guarded: only when active, not
--     expired, within limit), the sequence-backed order number generator +
--     trigger, and the full server-side create_order() RPC.
--  6. Replaces the coupons RLS policies with admin-only ones (the old
--     public `coupons_read` leaked every coupon code to anon).
--  7. Promotes kiady@zahieg.com to admin (dual auth_id/id aware).
-- Everything is idempotent — safe to run repeatedly.
-- ============================================================================

-- ── 1. Coupons columns (idempotent) ────────────────────────────────────────
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS min_order NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS max_discount NUMERIC(10,2);
ALTER TABLE coupons ALTER COLUMN max_discount SET DEFAULT NULL;
UPDATE coupons SET max_discount = NULL WHERE max_discount = 0;
UPDATE coupons SET used_count = 0 WHERE used_count IS NULL;
UPDATE coupons SET usage_limit = 100 WHERE usage_limit IS NULL;
ALTER TABLE coupons ALTER COLUMN used_count SET NOT NULL;
ALTER TABLE coupons ALTER COLUMN usage_limit SET NOT NULL;

-- ── 2. Constraints (DROP first, then UPDATE data, then ADD) ────────────────
ALTER TABLE coupons DROP CONSTRAINT IF EXISTS coupons_type_check;
UPDATE coupons SET type = 'free_shipping' WHERE type = 'freeShipping';
ALTER TABLE coupons ADD CONSTRAINT coupons_type_check CHECK (type IN ('percentage','fixed','free_shipping'));

ALTER TABLE coupons DROP CONSTRAINT IF EXISTS coupons_max_discount_check;
ALTER TABLE coupons ADD CONSTRAINT coupons_max_discount_check CHECK (max_discount IS NULL OR max_discount >= 0);

ALTER TABLE coupons DROP CONSTRAINT IF EXISTS coupons_usage_limit_check;
ALTER TABLE coupons ADD CONSTRAINT coupons_usage_limit_check CHECK (usage_limit >= 0 AND used_count >= 0);

-- ── 3. profiles.role + is_admin() (dual auth_id/id aware) ─────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer','admin'));

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_has_auth_id BOOLEAN;
    v_admin BOOLEAN;
BEGIN
    IF v_uid IS NULL THEN RETURN FALSE; END IF;
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'auth_id'
    ) INTO v_has_auth_id;
    IF v_has_auth_id THEN
        SELECT EXISTS (SELECT 1 FROM profiles WHERE auth_id = v_uid AND role = 'admin') INTO v_admin;
    ELSE
        SELECT EXISTS (SELECT 1 FROM profiles WHERE id = v_uid AND role = 'admin') INTO v_admin;
    END IF;
    RETURN v_admin;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- ── 4. get_coupon replacement (strict validation order, raw max_discount) ─
CREATE OR REPLACE FUNCTION get_coupon(p_code TEXT)
RETURNS TABLE(valid BOOLEAN, code TEXT, discount_type TEXT, discount_value NUMERIC,
              max_discount NUMERIC, min_order NUMERIC, expires_at TIMESTAMPTZ, message TEXT) AS $$
DECLARE
    c coupons%ROWTYPE;
BEGIN
    SELECT * INTO c FROM coupons WHERE upper(coupons.code) = upper(p_code) LIMIT 1;
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, coalesce(p_code, ''), NULL::TEXT, 0::NUMERIC, NULL::NUMERIC,
                            0::NUMERIC, NULL::TIMESTAMPTZ, 'invalid code'::TEXT; RETURN;
    END IF;
    IF NOT c.is_active THEN
        RETURN QUERY SELECT false, c.code, c.type, c.discount, c.max_discount,
                            c.min_order, c.expires_at, 'coupon disabled'::TEXT; RETURN;
    END IF;
    IF c.expires_at < now() THEN
        RETURN QUERY SELECT false, c.code, c.type, c.discount, c.max_discount,
                            c.min_order, c.expires_at, 'coupon expired'::TEXT; RETURN;
    END IF;
    IF c.usage_limit > 0 AND c.used_count >= c.usage_limit THEN
        RETURN QUERY SELECT false, c.code, c.type, c.discount, c.max_discount,
                            c.min_order, c.expires_at, 'usage limit reached'::TEXT; RETURN;
    END IF;
    RETURN QUERY SELECT true, c.code, c.type, c.discount, c.max_discount,
                        c.min_order, c.expires_at, 'valid'::TEXT;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION get_coupon(text) TO anon, authenticated;

-- ── 5. increment_coupon_usage + order number generator + create_order ─────
CREATE OR REPLACE FUNCTION increment_coupon_usage(p_code TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE coupons
    SET used_count = used_count + 1
    WHERE upper(coupons.code) = upper(p_code)
      AND is_active = true
      AND expires_at > now()
      AND (usage_limit = 0 OR used_count < usage_limit);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DO $$
BEGIN
    BEGIN EXECUTE 'REVOKE ALL ON FUNCTION increment_coupon_usage(text) FROM anon, authenticated';
    EXCEPTION WHEN undefined_function OR insufficient_privilege THEN RAISE NOTICE 'increment_coupon_usage revoke skipped: %', SQLERRM; END;
END $$;

CREATE SEQUENCE IF NOT EXISTS orders_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    year_part TEXT;
    seq_part TEXT;
BEGIN
    year_part := EXTRACT(YEAR FROM now())::TEXT;
    LOOP
        seq_part := LPAD(nextval('orders_number_seq')::TEXT, 6, '0');
        EXIT WHEN NOT EXISTS (SELECT 1 FROM orders WHERE order_number = 'MAT-' || year_part || '-' || seq_part);
    END LOOP;
    RETURN 'MAT-' || year_part || '-' || seq_part;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION orders_set_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL THEN
        NEW.order_number := generate_order_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_orders_order_number ON orders;
CREATE TRIGGER trg_orders_order_number
    BEFORE INSERT ON orders
    FOR EACH ROW EXECUTE FUNCTION orders_set_order_number();

DROP FUNCTION IF EXISTS create_order(text, jsonb, numeric, numeric, numeric, numeric, text, text, jsonb, text, text);

CREATE OR REPLACE FUNCTION create_order(
    p_user_id TEXT,
    p_items JSONB,
    p_subtotal NUMERIC,
    p_shipping NUMERIC,
    p_discount NUMERIC,
    p_total NUMERIC,
    p_coupon_code TEXT DEFAULT NULL,
    p_payment_method TEXT DEFAULT 'cod',
    p_shipping_address JSONB DEFAULT NULL,
    p_notes TEXT DEFAULT '',
    p_id TEXT DEFAULT NULL
)
RETURNS orders AS $$
DECLARE
    v_order orders;
BEGIN
    IF p_subtotal < 0 OR p_shipping < 0 OR p_discount < 0 OR p_total < 0 THEN
        RAISE EXCEPTION 'Order amounts must be non-negative';
    END IF;
    IF abs(p_total - (p_subtotal + p_shipping - p_discount)) > 0.01 THEN
        RAISE EXCEPTION 'Order total does not match its components';
    END IF;
    IF p_discount > p_subtotal + p_shipping THEN
        RAISE EXCEPTION 'Discount cannot exceed the order value';
    END IF;
    IF p_user_id IS DISTINCT FROM auth.uid()::text AND NOT is_admin() THEN
        RAISE EXCEPTION 'You may only create orders for your own account';
    END IF;
    INSERT INTO orders (id, user_id, order_number, status, items, subtotal, shipping,
                        discount, total, coupon_code, payment_method, shipping_address, notes)
    VALUES (COALESCE(p_id, gen_random_uuid()::text), p_user_id, NULL, 'pending',
            p_items, p_subtotal, p_shipping, p_discount, p_total,
            p_coupon_code, p_payment_method, p_shipping_address, p_notes)
    RETURNING * INTO v_order;
    IF p_coupon_code IS NOT NULL AND p_coupon_code <> '' THEN
        PERFORM increment_coupon_usage(p_coupon_code);
    END IF;
    RETURN v_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION create_order(text, jsonb, numeric, numeric, numeric, numeric,
    text, text, jsonb, text, text) TO anon, authenticated;

-- ── 6. Coupons RLS: replace legacy/public policies with admin-only ─────────
DROP POLICY IF EXISTS "coupons_read" ON coupons;
DROP POLICY IF EXISTS "coupons_select" ON coupons;
DROP POLICY IF EXISTS "coupons_insert" ON coupons;
DROP POLICY IF EXISTS "coupons_update" ON coupons;
DROP POLICY IF EXISTS "coupons_delete" ON coupons;

CREATE POLICY "coupons_select" ON coupons FOR SELECT USING (is_admin());
CREATE POLICY "coupons_insert" ON coupons FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "coupons_update" ON coupons FOR UPDATE USING (is_admin());
CREATE POLICY "coupons_delete" ON coupons FOR DELETE USING (is_admin());

-- ── 7. Promote owner account to admin (dual auth_id/id aware) ──────────────
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
        UPDATE profiles SET role = 'admin' WHERE email = 'kiady@zahieg.com';
        IF has_auth_id THEN
            INSERT INTO profiles (auth_id, name, email, avatar, role)
            SELECT id,
                   COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', ''),
                   email,
                   COALESCE(raw_user_meta_data->>'avatar_url', ''),
                   'admin'
            FROM auth.users
            WHERE email = 'kiady@zahieg.com'
            ON CONFLICT (auth_id) DO NOTHING;
        ELSE
            INSERT INTO profiles (id, name, email, avatar, role)
            SELECT id,
                   COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', ''),
                   email,
                   COALESCE(raw_user_meta_data->>'avatar_url', ''),
                   'admin'
            FROM auth.users
            WHERE email = 'kiady@zahieg.com'
            ON CONFLICT (id) DO NOTHING;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'admin upgrade skipped: %', SQLERRM;
    END;
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_protect_profile_role') THEN
        ALTER TABLE profiles ENABLE TRIGGER trg_protect_profile_role;
    END IF;
END $$;

-- ── 7b. Seed the 4 standard coupons + extend expired/expiring seeds ──────
DO $$
DECLARE
    id_is_uuid BOOLEAN;
    c RECORD;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'coupons' AND column_name = 'id'
          AND data_type = 'uuid'
    ) INTO id_is_uuid;

    FOR c IN SELECT * FROM (VALUES
        ('WELCOME10','percentage',10,0,100,'2027-12-31'::timestamptz,1000),
        ('ZAHI20','percentage',20,500,200,'2027-12-31'::timestamptz,500),
        ('SALE50','fixed',50,300,50,'2027-12-31'::timestamptz,200),
        ('FREESHIP','free_shipping',30,200,30,'2027-12-31'::timestamptz,300)
    ) AS t(code, type, discount, min_order, max_discount, expires_at, usage_limit)
    LOOP
        BEGIN
            IF id_is_uuid THEN
                INSERT INTO coupons (id, code, type, discount, min_order, max_discount,
                                     expires_at, usage_limit, used_count, is_active)
                VALUES (gen_random_uuid(), c.code, c.type, c.discount, c.min_order,
                        c.max_discount, c.expires_at, c.usage_limit, 0, true)
                ON CONFLICT (code) DO NOTHING;
            ELSE
                INSERT INTO coupons (id, code, type, discount, min_order, max_discount,
                                     expires_at, usage_limit, used_count, is_active)
                VALUES ('coup-' || lower(c.code), c.code, c.type, c.discount, c.min_order,
                        c.max_discount, c.expires_at, c.usage_limit, 0, true)
                ON CONFLICT (code) DO NOTHING;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'seed coupon % skipped: %', c.code, SQLERRM;
        END;
    END LOOP;
END $$;

-- Extend only the 4 known seed codes (targeted — never resurrect arbitrary coupons):
UPDATE coupons SET expires_at = '2027-12-31'
    WHERE code IN ('WELCOME10','ZAHI20','SALE50','FREESHIP')
      AND (expires_at IS NULL OR expires_at < now() + interval '30 days');

-- ── 8. VERIFY (run afterwards) ─────────────────────────────────────────────
-- NOTE: get_coupon is RETURNS TABLE, so the RPC returns a JSON ARRAY. The
--       frontend (CartPage.handleApplyCoupon) must read row = data[0]
--       (see section A of the plan) — never treat the array itself as the row.
-- SELECT * FROM get_coupon('WELCOME10');
-- → expect: valid=true, discount_type=percentage, discount_value=10,
--           min_order=0, max_discount=100 (raw, no coalesce), message='valid'
-- SELECT id, code, is_active, usage_limit, used_count, max_discount FROM coupons;
-- → expect: is_active NOT NULL, max_discount NULL when uncapped
-- SELECT id, email, role FROM profiles WHERE email = 'kiady@zahieg.com';
-- → expect: role = 'admin'
-- SELECT polname, polcmd, pg_get_expr(polqual, polrelid)
--   FROM pg_policy WHERE polrelid = 'coupons'::regclass;
-- → expect: 4 policies (select/insert/update/delete) all referencing is_admin()
-- ============================================================================
