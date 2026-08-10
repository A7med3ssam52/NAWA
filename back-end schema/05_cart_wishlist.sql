-- ============================================================================
-- NAWA - Cart & Wishlist Schema
-- Depends on: profiles, products
-- ============================================================================

-- ── Cart Items ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cart_items (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity    INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (user_id, product_id)
);

COMMENT ON TABLE  cart_items IS 'Active shopping cart items per user';
COMMENT ON COLUMN cart_items.quantity IS 'Quantity of this product in cart (minimum 1)';

-- ── Wishlist Items ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wishlist_items (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    added_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (user_id, product_id)
);

COMMENT ON TABLE  wishlist_items   IS 'User wishlist / favorites';
COMMENT ON COLUMN wishlist_items.added_at IS 'When the product was added to wishlist';

-- ============================================================================
-- NOTE: RLS policies defined in 15_rls_policies.sql
-- Indexes defined in 16_indexes.sql
-- ============================================================================
