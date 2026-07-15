-- ============================================================================
-- ZAHIEG - Settings Schema
-- Key-Value store for application configuration
-- ============================================================================

CREATE TABLE IF NOT EXISTS settings (
    key         TEXT PRIMARY KEY,
    value       JSONB NOT NULL,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  settings IS 'Application key-value configuration store';
COMMENT ON COLUMN settings.key IS 'Unique setting key (e.g. "announcement", "store_info")';
COMMENT ON COLUMN settings.value IS 'JSON value (flexible structure per setting type)';

-- ── Auto-update timestamp ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION settings_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_settings_updated_at ON settings;
CREATE TRIGGER trg_settings_updated_at
    BEFORE UPDATE ON settings
    FOR EACH ROW
    EXECUTE FUNCTION settings_set_updated_at();

COMMENT ON FUNCTION settings_set_updated_at IS 'Auto-updates settings.updated_at on any update';

-- ── Seed default settings ─────────────────────────────────────────────────
INSERT INTO settings (key, value) VALUES
    ('announcement', '{"text": "توصيل مجاني للطلبات فوق 500 ج.م", "enabled": true, "dismissible": true}'::jsonb),
    ('store_info', '{"name": "زاهي", "description": "متجر إلكتروني مصري", "currency": "ج.م", "phone": "", "email": "", "whatsapp": ""}'::jsonb),
    ('shipping', '{"cost": 30, "free_threshold": 500, "tax_rate": 0.14}'::jsonb)
ON CONFLICT (key) DO NOTHING;

COMMENT ON TABLE  settings IS 'Seed data for default application settings';

-- ============================================================================
-- NOTE: RLS policies defined in 15_rls_policies.sql
-- ============================================================================
