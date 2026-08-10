-- ============================================================================
-- NAWA - Spin Wheel Schema
-- Depends on: profiles
-- ============================================================================

-- ── Spin Prize Type Enum ──────────────────────────────────────────────────
DO $$ BEGIN
    CREATE TYPE spin_prize_type AS ENUM (
        'percentage', 'fixed', 'free_shipping', 'try_again'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TYPE spin_prize_type IS 'Types of spin wheel prizes';

-- ── Spin Prizes ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS spin_prizes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label       TEXT NOT NULL,
    type        spin_prize_type NOT NULL,
    value       INTEGER CHECK (value IS NULL OR value > 0),
    color       TEXT NOT NULL DEFAULT '#2563EB',
    weight      INTEGER NOT NULL DEFAULT 1 CHECK (weight >= 1),
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  spin_prizes IS 'Configurable spin wheel prizes';
COMMENT ON COLUMN spin_prizes.label IS 'Display label (e.g. "10% off")';
COMMENT ON COLUMN spin_prizes.type IS 'Prize type determines how value is applied';
COMMENT ON COLUMN spin_prizes.value IS 'Discount value (percentage or fixed amount)';
COMMENT ON COLUMN spin_prizes.color IS 'Hex color for the prize segment';
COMMENT ON COLUMN spin_prizes.weight IS 'Probability weight (higher = more likely)';
COMMENT ON COLUMN spin_prizes.is_active IS 'Enable/disable without deleting';

-- ── Spin History ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS spin_history (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID REFERENCES profiles(id) ON DELETE SET NULL,
    guest_phone   TEXT,
    prize_id      UUID REFERENCES spin_prizes(id) ON DELETE SET NULL,
    prize_label   TEXT NOT NULL,
    type          spin_prize_type NOT NULL,
    value         INTEGER,
    coupon_code   TEXT,
    claimed       BOOLEAN NOT NULL DEFAULT false,
    spun_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT at_least_one_identifier CHECK (
        user_id IS NOT NULL OR guest_phone IS NOT NULL
    )
);

COMMENT ON TABLE  spin_history IS 'History of all spin wheel spins';
COMMENT ON COLUMN spin_history.user_id IS 'Authenticated user (NULL for guests)';
COMMENT ON COLUMN spin_history.guest_phone IS 'Phone number for guest users (NULL for authenticated)';
COMMENT ON COLUMN spin_history.prize_id IS 'FK to the prize won (NULL if prize was deleted)';
COMMENT ON COLUMN spin_history.prize_label IS 'Snapshot of the prize label';
COMMENT ON COLUMN spin_history.coupon_code IS 'Generated coupon code from the spin';
COMMENT ON COLUMN spin_history.claimed IS 'Whether the prize was claimed';

-- ============================================================================
-- NOTE: RLS policies defined in 15_rls_policies.sql
-- ============================================================================
