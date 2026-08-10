-- ============================================================================
-- NAWA — COUPONS FIX MIGRATION  (run in Supabase Dashboard → SQL Editor)
-- ----------------------------------------------------------------------------
-- Fixes:
--  1. get_coupon() RPC crashed for EVERY call with Postgres error 42702
--     ("column reference \"code\" is ambiguous") — a PL/pgSQL OUT parameter
--     named `code` collided with the unqualified `coupons.code` reference in
--     the WHERE clause. Result: Cart page always showed "كوبون غير صالح".
--     Fix: qualify the table column (coupons.code). We also split the old
--     "coupon unavailable" message into "coupon disabled" / "coupon expired"
--     so the frontend can show a specific Arabic message.
--  2. Seeds the 4 standard coupons (WELCOME10, NAWA20, SALE50, FREESHIP) if the
--     live DB does not have them (verified: live DB did NOT — validate_coupon
--     returned 'invalid code'), and extends any seed row that is expiring
--     within 30 days out to 2027 so coupons never die unexpectedly.
--  3. Relaxes max_discount CHECK to allow 0 (admin default) and normalizes the
--     type CHECK to percentage/fixed/free_shipping.
--  4. Hardens function EXECUTE grants to match the golden schema
--     (validate_coupon / increment_coupon_usage are admin-only helpers).
-- Everything is idempotent — safe to run repeatedly.
-- ============================================================================

-- ── 1. FIX get_coupon (the critical fix) ────────────────────────────────────
CREATE OR REPLACE FUNCTION get_coupon(p_code TEXT)
RETURNS TABLE(valid BOOLEAN, code TEXT, discount_type TEXT, discount_value NUMERIC,
              max_discount NUMERIC, min_order NUMERIC, expires_at TIMESTAMPTZ, message TEXT) AS $$
DECLARE
    c coupons%ROWTYPE;
BEGIN
    SELECT * INTO c FROM coupons WHERE upper(coupons.code) = upper(p_code) LIMIT 1;
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, coalesce(p_code, ''), NULL::TEXT, 0::NUMERIC, 0::NUMERIC,
                            0::NUMERIC, NULL::TIMESTAMPTZ, 'invalid code'::TEXT; RETURN;
    END IF;
    IF NOT c.is_active THEN
        RETURN QUERY SELECT false, c.code, c.type, c.discount, coalesce(c.max_discount, c.discount),
                            c.min_order, c.expires_at, 'coupon disabled'::TEXT; RETURN;
    END IF;
    IF c.expires_at < now() THEN
        RETURN QUERY SELECT false, c.code, c.type, c.discount, coalesce(c.max_discount, c.discount),
                            c.min_order, c.expires_at, 'coupon expired'::TEXT; RETURN;
    END IF;
    RETURN QUERY SELECT true, c.code, c.type, c.discount, coalesce(c.max_discount, c.discount),
                        c.min_order, c.expires_at, 'valid'::TEXT;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION get_coupon(text) TO anon, authenticated;

-- ── 2. Normalize constraints (idempotent) ───────────────────────────────────
-- Normalize legacy type aliases first, then re-add the strict CHECK
UPDATE coupons SET type = 'free_shipping' WHERE type = 'freeShipping';
ALTER TABLE coupons DROP CONSTRAINT IF EXISTS coupons_type_check;
ALTER TABLE coupons ADD CONSTRAINT coupons_type_check
    CHECK (type IN ('percentage','fixed','free_shipping'));

-- max_discount: NULL == "no cap"; 0 is the legacy admin default and must pass.
ALTER TABLE coupons DROP CONSTRAINT IF EXISTS coupons_max_discount_check;
ALTER TABLE coupons ADD CONSTRAINT coupons_max_discount_check
    CHECK (max_discount IS NULL OR max_discount >= 0);
UPDATE coupons SET max_discount = NULL WHERE max_discount = 0;

-- ── 3. Seed missing standard coupons (works for TEXT or UUID ids) ───────────
DO $$
DECLARE
    id_is_uuid BOOLEAN;
    seed_codes text[] := ARRAY['WELCOME10','NAWA20','SALE50','FREESHIP'];
    c RECORD;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'coupons' AND column_name = 'id'
          AND data_type = 'uuid'
    ) INTO id_is_uuid;

    FOR c IN SELECT * FROM (VALUES
        ('WELCOME10','percentage',10,0,100,'2027-12-31'::timestamptz,1000),
        ('NAWA20','percentage',20,500,200,'2027-06-30'::timestamptz,500),
        ('SALE50','fixed',50,300,50,'2027-03-31'::timestamptz,200),
        ('FREESHIP','free_shipping',30,200,30,'2027-09-30'::timestamptz,300)
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

-- Seed coupons must never die: any seed row expiring within 30 days → extended.
UPDATE coupons SET expires_at = '2027-12-31'
    WHERE code IN ('WELCOME10','NAWA20','SALE50','FREESHIP')
      AND expires_at < now() + interval '30 days';

-- ── 4. Function EXECUTE hardening (matches golden schema) ───────────────────
DO $$
BEGIN
    BEGIN EXECUTE 'REVOKE ALL ON FUNCTION validate_coupon(text, numeric) FROM anon, authenticated';
    EXCEPTION WHEN undefined_function OR insufficient_privilege THEN RAISE NOTICE 'validate_coupon: %', SQLERRM; END;
    BEGIN EXECUTE 'REVOKE ALL ON FUNCTION increment_coupon_usage(text) FROM anon, authenticated';
    EXCEPTION WHEN undefined_function OR insufficient_privilege THEN RAISE NOTICE 'increment_coupon_usage: %', SQLERRM; END;
END $$;

-- ── 5. VERIFY (run afterwards) ───────────────────────────────────────────────
-- SELECT * FROM get_coupon('WELCOME10');
-- → expect: valid=true, discount_type=percentage, discount_value=10,
--           min_order=0, max_discount=100, message='valid'
-- ============================================================================