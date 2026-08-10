-- ============================================================================
-- NAWA - Categories & Brands Schema
-- Base tables with no dependencies on other tables
-- ============================================================================

-- ── Categories ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    slug        TEXT NOT NULL UNIQUE,
    image       TEXT,
    icon        TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  categories      IS 'Product categories';
COMMENT ON COLUMN categories.name IS 'Category display name (e.g. "electronics")';
COMMENT ON COLUMN categories.slug IS 'URL-friendly identifier (e.g. "electronics")';
COMMENT ON COLUMN categories.image IS 'Category image URL (Supabase Storage)';
COMMENT ON COLUMN categories.icon  IS 'Lucide icon name for UI rendering';

-- ── Brands ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS brands (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    slug        TEXT NOT NULL UNIQUE,
    logo        TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  brands      IS 'Product brands / manufacturers';
COMMENT ON COLUMN brands.name IS 'Brand display name (e.g. "Samsung")';
COMMENT ON COLUMN brands.slug IS 'URL-friendly identifier';
COMMENT ON COLUMN brands.logo IS 'Brand logo image URL (Supabase Storage)';

-- ============================================================================
-- NOTE: RLS policies for these tables are defined in 15_rls_policies.sql
-- Indexes are defined in 16_indexes.sql
-- ============================================================================
