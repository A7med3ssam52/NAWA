-- ============================================================================
-- ZAHIEG - User Profiles Schema
-- Linked to Supabase Auth (auth.users) via foreign key
-- ============================================================================

-- ── User Role Enum ────────────────────────────────────────────────────────
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('customer', 'admin');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TYPE user_role IS 'User role: customer (default) or admin';

-- ── Profiles ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    email       TEXT NOT NULL,
    phone       TEXT,
    avatar      TEXT,
    role        user_role NOT NULL DEFAULT 'customer',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  profiles       IS 'User profiles extending Supabase Auth';
COMMENT ON COLUMN profiles.id    IS 'Maps to auth.users.id (same UUID)';
COMMENT ON COLUMN profiles.name  IS 'User display name';
COMMENT ON COLUMN profiles.email IS 'User email address';
COMMENT ON COLUMN profiles.phone IS 'User phone number';
COMMENT ON COLUMN profiles.avatar IS 'Avatar image URL (Supabase Storage)';
COMMENT ON COLUMN profiles.role  IS 'User role for authorization';

-- ── Auto-create profile on signup ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, email, avatar)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
        NEW.email,
        NEW.raw_user_meta_data ->> 'avatar'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

COMMENT ON FUNCTION handle_new_user IS 'Auto-creates a profile row when a new user signs up via Supabase Auth';

-- ── Admin check helper ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION is_admin IS 'Returns true if the current authenticated user has admin role. Used in RLS policies.';

-- ── Update profile timestamp trigger (for future use) ─────────────────────
-- Note: profiles has no updated_at column since auth.users manages that
-- But we add it here as a hook point for address/order counts if needed

-- ============================================================================
-- NOTE: RLS policies defined in 15_rls_policies.sql
-- ============================================================================
