-- ============================================================================
-- ZAHIEG - Marketing & Contact Schema
-- Standalone tables for marketing and customer interaction
-- ============================================================================

-- ── Testimonials ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS testimonials (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    avatar      TEXT,
    rating      INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment     TEXT NOT NULL,
    role        TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  testimonials IS 'Customer testimonials displayed on the homepage';
COMMENT ON COLUMN testimonials.avatar IS 'Customer avatar image URL';
COMMENT ON COLUMN testimonials.rating IS 'Customer rating (1-5)';
COMMENT ON COLUMN testimonials.role IS 'Customer role/title (e.g. "عميل مميز")';

-- ── Newsletter Subscribers ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       TEXT NOT NULL UNIQUE,
    subscribed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  newsletter_subscribers IS 'Email newsletter subscribers';

-- ── Contact Messages ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contact_messages (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    email       TEXT NOT NULL,
    subject     TEXT,
    message     TEXT NOT NULL,
    read        BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  contact_messages IS 'Contact form submissions from visitors';
COMMENT ON COLUMN contact_messages.read IS 'Whether admin has read this message';

-- ── Back-In-Stock Requests ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS back_in_stock_requests (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    email       TEXT NOT NULL,
    notified    BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (product_id, email)
);

COMMENT ON TABLE  back_in_stock_requests IS 'Customer requests to be notified when a product is back in stock';
COMMENT ON COLUMN back_in_stock_requests.notified IS 'Whether the customer has been notified';

-- ============================================================================
-- NOTE: RLS policies defined in 15_rls_policies.sql
-- ============================================================================
