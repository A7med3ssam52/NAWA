-- 1) Order columns
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_receipt_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_phone TEXT;

-- 2) Recreate create_order with 2 trailing optional params
DROP FUNCTION IF EXISTS create_order(text, jsonb, numeric, numeric, numeric, numeric, text, text, jsonb, text, text);

CREATE OR REPLACE FUNCTION create_order(
    p_user_id TEXT,
    p_items JSONB,
    p_subtotal NUMERIC,
    p_shipping NUMERIC,
    p_discount NUMERIC,
    p_total NUMERIC,
    p_coupon_code TEXT DEFAULT NULL,
    p_payment_method TEXT DEFAULT 'instapay',
    p_shipping_address JSONB DEFAULT NULL,
    p_notes TEXT DEFAULT '',
    p_id TEXT DEFAULT NULL,
    p_payment_receipt_url TEXT DEFAULT NULL,
    p_payment_phone TEXT DEFAULT NULL
)
RETURNS orders AS $$
DECLARE
    v_order orders;
BEGIN
    IF p_subtotal < 0 OR p_shipping < 0 OR p_discount < 0 OR p_total < 0 THEN
        RAISE EXCEPTION 'Order amounts must be non-negative';
    END IF;
    IF abs(p_total - (p_subtotal + p_shipping - p_discount)) > 0.01 THEN
        RAISE EXCEPTION 'Order total does not match its components';
    END IF;
    IF p_discount > p_subtotal + p_shipping THEN
        RAISE EXCEPTION 'Discount cannot exceed the order value';
    END IF;
    IF p_user_id IS DISTINCT FROM auth.uid()::text AND NOT is_admin() THEN
        RAISE EXCEPTION 'You may only create orders for your own account';
    END IF;
    INSERT INTO orders (id, user_id, order_number, status, items, subtotal, shipping,
                        discount, total, coupon_code, payment_method, shipping_address, notes,
                        payment_receipt_url, payment_phone)
    VALUES (COALESCE(p_id, gen_random_uuid()::text), p_user_id, NULL, 'pending',
            p_items, p_subtotal, p_shipping, p_discount, p_total,
            p_coupon_code, p_payment_method, p_shipping_address, p_notes,
            p_payment_receipt_url, p_payment_phone)
    RETURNING * INTO v_order;
    IF p_coupon_code IS NOT NULL AND p_coupon_code <> '' THEN
        PERFORM increment_coupon_usage(p_coupon_code);
    END IF;
    RETURN v_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION create_order(text, jsonb, numeric, numeric, numeric, numeric,
    text, text, jsonb, text, text, text, text) TO anon, authenticated;

-- 3) Guard the new columns against non-admin direct UPDATEs
CREATE OR REPLACE FUNCTION prevent_order_mutation()
RETURNS TRIGGER AS $$
BEGIN
    IF is_admin() THEN
        RETURN NEW;
    END IF;
    IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status <> 'cancelled' THEN
        RAISE EXCEPTION 'Only an admin may change order status (except cancel)';
    END IF;
    IF NEW.total     IS DISTINCT FROM OLD.total
       OR NEW.subtotal IS DISTINCT FROM OLD.subtotal
       OR NEW.shipping IS DISTINCT FROM OLD.shipping
       OR NEW.discount IS DISTINCT FROM OLD.discount
       OR NEW.items    IS DISTINCT FROM OLD.items
       OR NEW.payment_receipt_url IS DISTINCT FROM OLD.payment_receipt_url
       OR NEW.payment_phone       IS DISTINCT FROM OLD.payment_phone THEN
        RAISE EXCEPTION 'Only an admin may modify order financial fields';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_prevent_order_mutation ON orders;
CREATE TRIGGER trg_prevent_order_mutation
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION prevent_order_mutation();

-- 4) Storage bucket + policies (anon insert REQUIRED: guests upload before account creation)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('payment-receipts', 'payment-receipts', true, 5242880,
     ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "payment_receipts_public_select" ON storage.objects;
CREATE POLICY "payment_receipts_public_select" ON storage.objects
    FOR SELECT USING (bucket_id = 'payment-receipts');

DROP POLICY IF EXISTS "payment_receipts_insert" ON storage.objects;
CREATE POLICY "payment_receipts_insert" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'payment-receipts');

DROP POLICY IF EXISTS "payment_receipts_admin_delete" ON storage.objects;
CREATE POLICY "payment_receipts_admin_delete" ON storage.objects
    FOR DELETE USING (bucket_id = 'payment-receipts' AND is_admin());
