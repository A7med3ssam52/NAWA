-- ============================================================================
-- NAWA - Products Schema
-- Depends on: categories, brands
-- ============================================================================

-- ── Products ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name               TEXT NOT NULL,
    slug               TEXT NOT NULL UNIQUE,
    description        TEXT,
    short_description  TEXT,
    price              NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    old_price          NUMERIC(10,2) CHECK (old_price IS NULL OR old_price >= 0),
    discount           INTEGER CHECK (discount IS NULL OR (discount >= 0 AND discount <= 100)),
    images             TEXT[] NOT NULL DEFAULT '{}',
    category_id        UUID REFERENCES categories(id) ON DELETE SET NULL,
    brand_id           UUID REFERENCES brands(id) ON DELETE SET NULL,
    rating             NUMERIC(2,1) NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    reviews_count      INTEGER NOT NULL DEFAULT 0 CHECK (reviews_count >= 0),
    stock              INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    sku                TEXT,
    specifications     JSONB NOT NULL DEFAULT '[]'::jsonb,
    tags               TEXT[] NOT NULL DEFAULT '{}',
    is_new             BOOLEAN NOT NULL DEFAULT false,
    is_featured        BOOLEAN NOT NULL DEFAULT false,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT valid_price CHECK (old_price IS NULL OR old_price >= price),
    CONSTRAINT valid_discount CHECK (discount IS NULL OR (old_price IS NOT NULL AND discount > 0))
);

COMMENT ON TABLE  products                IS 'Products catalog';
COMMENT ON COLUMN products.name           IS 'Product display name';
COMMENT ON COLUMN products.slug           IS 'URL-friendly unique identifier';
COMMENT ON COLUMN products.description    IS 'Full product description';
COMMENT ON COLUMN products.short_description IS 'Brief product description for cards';
COMMENT ON COLUMN products.price          IS 'Current sale price';
COMMENT ON COLUMN products.old_price      IS 'Original price before discount';
COMMENT ON COLUMN products.discount       IS 'Discount percentage (0-100)';
COMMENT ON COLUMN products.images         IS 'Array of image URLs (Supabase Storage)';
COMMENT ON COLUMN products.category_id    IS 'FK to categories table';
COMMENT ON COLUMN products.brand_id       IS 'FK to brands table';
COMMENT ON COLUMN products.rating         IS 'Average rating (0.0-5.0)';
COMMENT ON COLUMN products.reviews_count  IS 'Total number of reviews';
COMMENT ON COLUMN products.stock          IS 'Available inventory count';
COMMENT ON COLUMN products.sku            IS 'Stock Keeping Unit code';
COMMENT ON COLUMN products.specifications IS 'Array of {label, value} objects';
COMMENT ON COLUMN products.tags           IS 'Searchable tags';
COMMENT ON COLUMN products.is_new         IS 'Flag for "new arrival" badge';
COMMENT ON COLUMN products.is_featured    IS 'Flag for featured/hero products';

-- ── Full-Text Search Support ──────────────────────────────────────────────
ALTER TABLE products ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;

CREATE OR REPLACE FUNCTION products_search_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('simple',
        COALESCE(NEW.name, '') || ' ' ||
        COALESCE(NEW.description, '') || ' ' ||
        COALESCE(array_to_string(NEW.tags, ' '), '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_search ON products;
CREATE TRIGGER trg_products_search
    BEFORE INSERT OR UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION products_search_update();

COMMENT ON COLUMN products.search_vector IS 'Pre-computed full-text search vector';

-- ============================================================================
-- NOTE: RLS policies defined in 15_rls_policies.sql
-- Indexes defined in 16_indexes.sql
-- ============================================================================
