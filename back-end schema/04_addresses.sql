-- ============================================================================
-- ZAHIEG - User Addresses Schema
-- Depends on: profiles
-- ============================================================================

CREATE TABLE IF NOT EXISTS addresses (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    label       TEXT,
    full_name   TEXT NOT NULL,
    phone       TEXT NOT NULL,
    street      TEXT NOT NULL,
    city        TEXT NOT NULL,
    state       TEXT NOT NULL,
    is_default  BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  addresses        IS 'User shipping addresses';
COMMENT ON COLUMN addresses.label  IS 'Address label (e.g. "home", "work")';
COMMENT ON COLUMN addresses.is_default IS 'Only one address per user can be default at a time';

-- ── Ensure only one default address per user ──────────────────────────────
CREATE OR REPLACE FUNCTION ensure_single_default_address()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default THEN
        UPDATE addresses
        SET is_default = false
        WHERE user_id = NEW.user_id AND id <> NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_addresses_single_default ON addresses;
CREATE TRIGGER trg_addresses_single_default
    BEFORE INSERT OR UPDATE OF is_default ON addresses
    FOR EACH ROW
    WHEN (NEW.is_default = true)
    EXECUTE FUNCTION ensure_single_default_address();

COMMENT ON FUNCTION ensure_single_default_address IS 'Ensures only one address per user has is_default = true';

-- ============================================================================
-- NOTE: RLS policies defined in 15_rls_policies.sql
-- ============================================================================
