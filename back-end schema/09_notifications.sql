-- ============================================================================
-- NAWA - Notifications Schema
-- Depends on: profiles
-- ============================================================================

-- ── Notification Type Enum ────────────────────────────────────────────────
DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM (
        'info', 'success', 'warning', 'error', 'order'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TYPE notification_type IS 'Notification severity/type';

CREATE TABLE IF NOT EXISTS notifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type        notification_type NOT NULL DEFAULT 'info',
    title       TEXT NOT NULL,
    message     TEXT NOT NULL,
    read        BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  notifications IS 'In-app user notifications';
COMMENT ON COLUMN notifications.user_id IS 'Recipient user';
COMMENT ON COLUMN notifications.type IS 'Notification type for UI styling';
COMMENT ON COLUMN notifications.read IS 'Whether the user has read this notification';

-- ============================================================================
-- NOTE: RLS policies defined in 15_rls_policies.sql
-- Indexes defined in 16_indexes.sql
-- ============================================================================
