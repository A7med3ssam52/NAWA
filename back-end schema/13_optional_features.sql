-- ============================================================================
-- NAWA - Optional Features Schema
-- Depends on: profiles, products
-- These are non-critical features that enhance UX
-- ============================================================================

-- ── Recently Viewed Products ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recently_viewed (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    viewed_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (user_id, product_id)
);

COMMENT ON TABLE  recently_viewed IS 'Track recently viewed products per user for personalized recommendations';

-- ── Recent Searches ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recent_searches (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    query       TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  recent_searches IS 'Track recent search queries per user for quick search suggestions';

-- ============================================================================
-- NOTE: RLS policies defined in 15_rls_policies.sql
-- Indexes defined in 16_indexes.sql
-- ============================================================================
