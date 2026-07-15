-- ============================================================================
-- ZAHIEG - Coupons Schema
-- Standalone table for discount coupons
-- ============================================================================

-- ── Coupon Type Enum ──────────────────────────────────────────────────────
DO $$ BEGIN
    CREATE TYPE coupon_type AS ENUM ('percentage', 'fixed', 'free_shipping');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TYPE coupon_type IS 'Coupon discount type: percentage off, fixed amount, or free shipping';

CREATE TABLE IF NOT EXISTS coupons (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code          TEXT NOT NULL UNIQUE,
    type          coupon_type NOT NULL,
    discount      NUMERIC(10,2) NOT NULL CHECK (discount > 0),
    min_order     NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (min_order >= 0),
    max_discount  NUMERIC(10,2) CHECK (max_discount IS NULL OR max_discount > 0),
    expires_at    TIMESTAMPTZ NOT NULL,
    usage_limit   INTEGER NOT NULL DEFAULT 0 CHECK (usage_limit >= 0),
    used_count    INTEGER NOT NULL DEFAULT 0 CHECK (used_count >= 0),
    is_active     BOOLEAN NOT NULL DEFAULT true,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT valid_usage CHECK (usage_limit = 0 OR used_count <= usage_limit),
    CONSTRAINT valid_discount_type CHECK (
        (type = 'percentage' AND discount <= 100) OR
        (type <> 'percentage')
    )
);

COMMENT ON TABLE  coupons IS 'Discount coupon codes';
COMMENT ON COLUMN coupons.code IS 'Coupon code (uppercase, e.g. "SAVE20")';
COMMENT ON COLUMN coupons.type IS 'Discount type: percentage, fixed amount, or free shipping';
COMMENT ON COLUMN coupons.discount IS 'Discount value (percentage amount or fixed amount)';
COMMENT ON COLUMN coupons.min_order IS 'Minimum order amount to apply coupon';
COMMENT ON COLUMN coupons.max_discount IS 'Maximum discount allowed (for percentage coupons)';
COMMENT ON COLUMN coupons.expires_at IS 'Coupon expiration date/time';
COMMENT ON COLUMN coupons.usage_limit IS 'Maximum number of uses (0 = unlimited)';
COMMENT ON COLUMN coupons.used_count IS 'Number of times coupon has been used';
COMMENT ON COLUMN coupons.is_active IS 'Manually disable coupon without deleting';

-- ── Validate coupon function (for backend use) ────────────────────────────
CREATE OR REPLACE FUNCTION validate_coupon(p_code TEXT, p_order_total NUMERIC)
RETURNS TABLE(
    valid BOOLEAN,
    discount_type coupon_type,
    discount_value NUMERIC,
    max_discount_value NUMERIC,
    message TEXT
) AS $$
DECLARE
    c coupons%ROWTYPE;
BEGIN
    SELECT * INTO c FROM coupons
    WHERE code = UPPER(p_code)
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN QUERY SELECT false, NULL::coupon_type, 0::NUMERIC, 0::NUMERIC, 'invalid code'::TEXT;
        RETURN;
    END IF;

    IF NOT c.is_active THEN
        RETURN QUERY SELECT false, NULL::coupon_type, 0::NUMERIC, 0::NUMERIC, 'coupon is disabled'::TEXT;
        RETURN;
    END IF;

    IF c.expires_at < now() THEN
        RETURN QUERY SELECT false, NULL::coupon_type, 0::NUMERIC, 0::NUMERIC, 'coupon has expired'::TEXT;
        RETURN;
    END IF;

    IF c.usage_limit > 0 AND c.used_count >= c.usage_limit THEN
        RETURN QUERY SELECT false, NULL::coupon_type, 0::NUMERIC, 0::NUMERIC, 'usage limit reached'::TEXT;
        RETURN;
    END IF;

    IF p_order_total < c.min_order THEN
        RETURN QUERY SELECT false, NULL::coupon_type, 0::NUMERIC, 0::NUMERIC,
            'minimum order of ' || c.min_order || ' required'::TEXT;
        RETURN;
    END IF;

    RETURN QUERY SELECT true, c.type, c.discount, c.max_discount, 'valid'::TEXT;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION validate_coupon IS 'Validates a coupon code for a given order total. Returns validity status and discount info.';

-- ============================================================================
-- NOTE: RLS policies defined in 15_rls_policies.sql
-- ============================================================================
