-- ============================================================================
-- ZAHIEG - Orders Schema
-- Depends on: profiles, products, addresses
-- ============================================================================

-- ── Order Status Enum ─────────────────────────────────────────────────────
DO $$ BEGIN
    CREATE TYPE order_status AS ENUM (
        'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TYPE order_status IS 'Order lifecycle states';

-- ── Payment Method Enum ───────────────────────────────────────────────────
DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM (
        'cod', 'card', 'vodafone_cash', 'fawry', 'instapay'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TYPE payment_method IS 'Available payment methods';

-- ── Orders ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    order_number      TEXT NOT NULL UNIQUE,
    status            order_status NOT NULL DEFAULT 'pending',
    subtotal          NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),
    shipping          NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (shipping >= 0),
    discount          NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
    total             NUMERIC(10,2) NOT NULL CHECK (total >= 0),
    coupon_code       TEXT,
    payment_method    payment_method NOT NULL DEFAULT 'cod',
    shipping_address  JSONB NOT NULL,
    notes             TEXT,
    tracking          JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT valid_totals CHECK (total = subtotal + shipping - discount)
);

COMMENT ON TABLE  orders IS 'Customer orders';
COMMENT ON COLUMN orders.order_number IS 'Human-readable order number (e.g. "MAT-2026-0001")';
COMMENT ON COLUMN orders.status IS 'Current order status in its lifecycle';
COMMENT ON COLUMN orders.subtotal IS 'Sum of all order_items before shipping and discount';
COMMENT ON COLUMN orders.shipping IS 'Shipping cost';
COMMENT ON COLUMN orders.discount IS 'Applied discount amount';
COMMENT ON COLUMN orders.total IS 'Final total payable (subtotal + shipping - discount)';
COMMENT ON COLUMN orders.coupon_code IS 'Coupon code used for this order (if any)';
COMMENT ON COLUMN orders.payment_method IS 'Payment method chosen by customer';
COMMENT ON COLUMN orders.shipping_address IS 'Snapshot of the shipping address at time of order';
COMMENT ON COLUMN orders.notes IS 'Order notes / special instructions';
COMMENT ON COLUMN orders.tracking IS 'Array of {status, date, description, completed} tracking events';

-- ── Order Items ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id      UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id    UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name  TEXT NOT NULL,
    product_image TEXT,
    quantity      INTEGER NOT NULL CHECK (quantity >= 1),
    price         NUMERIC(10,2) NOT NULL CHECK (price >= 0)
);

COMMENT ON TABLE  order_items IS 'Line items within an order (historical snapshots)';
COMMENT ON COLUMN order_items.product_name IS 'Product name at time of order (snapshot)';
COMMENT ON COLUMN order_items.product_image IS 'Product image at time of order (snapshot)';
COMMENT ON COLUMN order_items.price IS 'Unit price at time of order (snapshot)';

-- ── Auto-update updated_at on orders ──────────────────────────────────────
CREATE OR REPLACE FUNCTION orders_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
CREATE TRIGGER trg_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION orders_set_updated_at();

COMMENT ON FUNCTION orders_set_updated_at IS 'Auto-updates orders.updated_at on any update';

-- ── Generate order number ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    year_part TEXT;
    seq_part TEXT;
BEGIN
    year_part := EXTRACT(YEAR FROM now())::TEXT;
    seq_part := LPAD(floor(random() * 9999)::TEXT, 4, '0');
    RETURN 'MAT-' || year_part || '-' || seq_part;
END;
$$ LANGUAGE plpgsql VOLATILE;

COMMENT ON FUNCTION generate_order_number IS 'Generates a unique order number (MAT-YYYY-NNNN)';

-- ── Auto-set order_number on insert ───────────────────────────────────────
CREATE OR REPLACE FUNCTION orders_set_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL THEN
        LOOP
            NEW.order_number := generate_order_number();
            BEGIN
                -- Check uniqueness; if conflict, loop retries
                PERFORM 1 FROM orders WHERE order_number = NEW.order_number;
                IF NOT FOUND THEN EXIT; END IF;
            END;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_orders_order_number ON orders;
CREATE TRIGGER trg_orders_order_number
    BEFORE INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION orders_set_order_number();

COMMENT ON FUNCTION orders_set_order_number IS 'Auto-generates a unique order number if none provided';

-- ============================================================================
-- NOTE: RLS policies defined in 15_rls_policies.sql
-- Indexes defined in 16_indexes.sql
-- ============================================================================
