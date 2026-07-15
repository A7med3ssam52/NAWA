-- ============================================================================
-- ZAHIEG - Reviews Schema
-- Depends on: profiles, products
-- ============================================================================

CREATE TABLE IF NOT EXISTS reviews (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id       UUID REFERENCES profiles(id) ON DELETE SET NULL,
    user_name     TEXT NOT NULL,
    user_avatar   TEXT,
    rating        INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title         TEXT,
    comment       TEXT NOT NULL,
    likes         INTEGER NOT NULL DEFAULT 0 CHECK (likes >= 0),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  reviews IS 'Product reviews and ratings';
COMMENT ON COLUMN reviews.product_id IS 'FK to the reviewed product';
COMMENT ON COLUMN reviews.user_id IS 'FK to the reviewer (NULL for guest reviews)';
COMMENT ON COLUMN reviews.user_name IS 'Reviewer display name (snapshot for guests)';
COMMENT ON COLUMN reviews.user_avatar IS 'Reviewer avatar URL (snapshot for guests)';
COMMENT ON COLUMN reviews.rating IS 'Rating 1-5';
COMMENT ON COLUMN reviews.likes IS 'Number of likes on this review';

-- ── Update product rating when a review is added/deleted ──────────────────
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
DECLARE
    avg_rating NUMERIC(2,1);
    cnt INTEGER;
BEGIN
    SELECT
        COALESCE(ROUND(AVG(rating)::numeric, 1), 0),
        COUNT(*)
    INTO avg_rating, cnt
    FROM reviews
    WHERE product_id = COALESCE(NEW.product_id, OLD.product_id);

    UPDATE products
    SET
        rating = avg_rating,
        reviews_count = cnt
    WHERE id = COALESCE(NEW.product_id, OLD.product_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_reviews_update_product ON reviews;
CREATE TRIGGER trg_reviews_update_product
    AFTER INSERT OR DELETE OR UPDATE OF rating ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_product_rating();

COMMENT ON FUNCTION update_product_rating IS 'Recalculates products.rating and products.reviews_count after review changes';

-- ============================================================================
-- NOTE: RLS policies defined in 15_rls_policies.sql
-- Indexes defined in 16_indexes.sql
-- ============================================================================
