-- ============================================================================
-- NAWA - Cross-Cutting Functions & Triggers
-- Functions that span multiple tables or are used by the application layer
-- NOTE: Table-specific triggers are in their respective files
-- ============================================================================

-- ── Log order email notification ──────────────────────────────────────────
-- Called by the application when an order confirmation email is sent
CREATE TABLE IF NOT EXISTS order_email_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id    UUID REFERENCES orders(id) ON DELETE CASCADE,
    email       TEXT NOT NULL,
    sent_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  order_email_logs IS 'Log of order confirmation emails sent';

-- ── Increment coupon usage count ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_coupon_usage(p_code TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE coupons
    SET used_count = used_count + 1
    WHERE code = UPPER(p_code)
    AND is_active = true
    AND expires_at > now()
    AND (usage_limit = 0 OR used_count < usage_limit);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION increment_coupon_usage IS 'Increment the usage count for a coupon code';

-- ── Get total order count for a user ──────────────────────────────────────
CREATE OR REPLACE FUNCTION get_user_order_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM orders WHERE user_id = p_user_id);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_user_order_count IS 'Returns total number of orders for a given user';

-- ── Check if product is low in stock ─────────────────────────────────────
CREATE OR REPLACE FUNCTION is_low_stock(p_product_id UUID, p_threshold INTEGER DEFAULT 10)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM products
        WHERE id = p_product_id AND stock < p_threshold
    );
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION is_low_stock IS 'Returns true if product stock is below the threshold';
