-- ============================================================================
-- ZAHIEG — MASTER Schema (Unified / Idempotent / Runs many times)
-- ----------------------------------------------------------------------------
-- This file merges the best of:
--   * back-end schema/  (normalized split files 01..19)
--   * supabase-complete.sql (front-end compatible layout)
--   * supabase-seed.sql / fix_schema.sql (corrected)
--
-- It is the SINGLE source of truth covering: joining all aspects.
--     25 tables + functions + triggers + RLS + views + indexes + storage + seed
--
-- Key fixes vs. the old files:
--   1. uuid_generate_v4()      -> gen_random_uuid()  (built-in, no extension)
--   2. RLS never opens private tables to the public (profiles/addresses stay private)
--   3. TEXT keys everywhere (matches the front-end: prod-xxx, coup-1, user-1)
--   4. free_shipping / try_again value names align frontend + DB
--   5. accounts / order_email_logs single names (order_email_logs kept)
--   6. All statements re-runnable (IF NOT EXISTS / OR REPLACE / ON CONFLICT)
--   7. Security hardening: SECURITY DEFINER functions pin search_path; views use
--      security_invoker; client EXECUTE revoked from trigger/helper functions.
-- ============================================================================


-- ############################################################################
-- 0. (OPTIONAL) Full reset — uncomment ONLY if you want to rebuild from scratch
-- ############################################################################
-- DROP VIEW IF EXISTS dashboard_stats, monthly_revenue, order_status_distribution,
--   category_distribution, top_products, recent_orders, low_stock_products,
--   out_of_stock_products, brand_distribution, user_sales_summary CASCADE;
-- DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
-- DROP TRIGGER IF EXISTS trg_orders_order_number ON orders;
-- DROP TRIGGER IF EXISTS trg_prevent_order_mutation ON orders;
-- DROP TRIGGER IF EXISTS trg_reviews_update_product ON reviews;
-- DROP TRIGGER IF EXISTS trg_addresses_single_default ON addresses;
-- DROP TRIGGER IF EXISTS trg_settings_updated_at ON settings;
-- DROP TRIGGER IF EXISTS trg_products_search ON products;
-- DROP TRIGGER IF EXISTS trg_accounting_entries_updated_at ON accounting_entries;
-- DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
-- DROP TRIGGER IF EXISTS trg_protect_profile_role ON profiles;
-- DROP TRIGGER IF EXISTS trg_normalize_coupon_type ON coupons;
-- DROP TRIGGER IF EXISTS trg_normalize_spin_prize_type ON spin_prizes;
-- DROP TABLE IF EXISTS order_email_logs, recent_searches, recently_viewed,
--   announcements, store_settings, settings, back_in_stock_requests,
--   contact_messages, newsletter_subscribers, spin_history, spin_prizes,
--   notifications, coupons, reviews, order_items, orders, wishlist_items,
--   cart_items, addresses, products, profiles, brands, categories CASCADE;
-- DROP FUNCTION IF EXISTS handle_new_user(), is_admin(), is_low_stock(text, integer),
--   get_user_count(text), generate_order_number(), orders_set_updated_at(),
--   orders_set_order_number(), update_product_rating(), ensure_single_address(),
--   --   settings_set_updated_at(), validate_coupon(text, numeric), get_coupon(text),
--   increment_coupon_usage(text), create_order(text, jsonb, numeric, numeric, numeric,
--   numeric, text, text, jsonb, text, text), products_search_update(),
--   update_accounting_entries_updated_at(), get_dashboard_data(),
--   protect_profile_role(), prevent_order_mutation(), normalize_coupon_type(),
--   normalize_spin_prize_type(), link_guest_order(text) CASCADE;


-- ############################################################################
-- 1. PROFILES  (extends auth.users) — id = same UUID as auth.users.id
-- ############################################################################
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT DEFAULT '',
    avatar TEXT DEFAULT '',
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    addresses TEXT[] DEFAULT '{}',
    orders TEXT[] DEFAULT '{}',
    wishlist TEXT[] DEFAULT '{}',
    notifications TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE profiles IS 'User profiles extending Supabase Auth';

-- Auto-create profile on signup (idempotent)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, email, avatar)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.email, ''),
        NEW.raw_user_meta_data ->> 'avatar'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Admin helper (used by every write-policy)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
          AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;
COMMENT ON FUNCTION is_admin IS 'True if the current user has role=admin. Used in RLS.';

-- Guard: only admins may create/change a role (prevents self-escalation)
CREATE OR REPLACE FUNCTION protect_profile_role()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.role <> 'customer' AND NOT is_admin() THEN
            RAISE EXCEPTION 'Only an admin may set a role';
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.role IS DISTINCT FROM OLD.role AND NOT is_admin() THEN
            RAISE EXCEPTION 'Only an admin may change a role';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_protect_profile_role ON profiles;
CREATE TRIGGER trg_protect_profile_role
    BEFORE INSERT OR UPDATE OF role ON profiles
    FOR EACH ROW EXECUTE FUNCTION protect_profile_role();

-- ############################################################################
-- 2. CATEGORIES & BRANDS   (TEXT keys -> match frontend DB row ids)
-- ############################################################################
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    image TEXT DEFAULT '',
    icon TEXT DEFAULT 'Folder',
    products_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS brands (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    logo TEXT DEFAULT '',
    products_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ############################################################################
-- 3. PRODUCTS    (FK -> categories.id / brands.id, keys are TEXT)
-- ############################################################################
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT DEFAULT '',
    short_description TEXT DEFAULT '',
    price NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
    old_price NUMERIC(10,2),
    discount INT,
    images TEXT[] NOT NULL DEFAULT '{}',
    category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
    brand_id TEXT REFERENCES brands(id) ON DELETE SET NULL,
    rating NUMERIC(2,1) NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    reviews_count INT NOT NULL DEFAULT 0 CHECK (reviews_count >= 0),
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    sku TEXT DEFAULT '',
    specifications JSONB NOT NULL DEFAULT '[]'::jsonb,
    tags TEXT[] NOT NULL DEFAULT '{}',
    colors TEXT[] NOT NULL DEFAULT '{}',
    sizes TEXT[] NOT NULL DEFAULT '{}',
    stock_by_color JSONB NOT NULL DEFAULT '{}'::jsonb,
    stock_by_size JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_new BOOLEAN NOT NULL DEFAULT false,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    search_vector TSVECTOR,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT valid_old_price CHECK (old_price IS NULL OR old_price >= price)
);

-- Idempotent migration for existing databases (already-created products tables
-- keep working: every column is optional with a safe default)
ALTER TABLE products ADD COLUMN IF NOT EXISTS colors TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS sizes TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_by_color JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_by_size JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Full-text search support
CREATE OR REPLACE FUNCTION products_search_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('simple',
        coalesce(NEW.name, '') || ' ' ||
        coalesce(NEW.description, '') || ' ' ||
        coalesce(array_to_string(NEW.tags, ' '), ''));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_products_search ON products;
CREATE TRIGGER trg_products_search
    BEFORE INSERT OR UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION products_search_update();

-- ############################################################################
-- 4. ADDRESSES  (user_id is TEXT — supports both uuid and local ids)
-- ############################################################################
CREATE TABLE IF NOT EXISTS addresses (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    label TEXT DEFAULT 'Home',
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    street TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT DEFAULT '',
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE addresses IS 'User shipping addresses';

-- Only one default address per user
CREATE OR REPLACE FUNCTION ensure_single_address()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default THEN
        UPDATE addresses
        SET is_default = false
        WHERE user_id = NEW.user_id AND id <> NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_addresses_single_default ON addresses;
CREATE TRIGGER trg_addresses_single_default
    BEFORE INSERT OR UPDATE OF is_default ON addresses
    FOR EACH ROW WHEN (NEW.is_default = true)
    EXECUTE FUNCTION ensure_single_address();

-- ############################################################################
-- 5. CART & WISHLIST
-- ############################################################################
CREATE TABLE IF NOT EXISTS cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity >= 1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS wishlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, product_id)
);

-- ############################################################################
-- 6. ORDERS  (JSON columns — matches frontend orderService mapping exactly)
-- ############################################################################
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    order_number TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending','confirmed','processing','shipped','delivered','cancelled')),
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
    shipping NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (shipping >= 0),
    discount NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
    total NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
    coupon_code TEXT,
    payment_method TEXT NOT NULL DEFAULT '',
    shipping_address JSONB,
    notes TEXT DEFAULT '',
    tracking JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (abs(total - (subtotal + shipping - discount)) <= 0.01),
    CONSTRAINT orders_discount_le_subtotal
        CHECK (discount <= subtotal + shipping)
);
COMMENT ON TABLE orders IS 'Customer orders with embedded line items + tracking';

CREATE OR REPLACE FUNCTION orders_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
CREATE TRIGGER trg_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION orders_set_updated_at();

-- Human-readable order number generator (sequence-backed, monotonic; used only if not provided)
CREATE SEQUENCE IF NOT EXISTS orders_number_seq START 1;
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    year_part TEXT;
    seq_part TEXT;
BEGIN
    year_part := EXTRACT(YEAR FROM now())::TEXT;
    LOOP
        seq_part := LPAD(nextval('orders_number_seq')::TEXT, 6, '0');
        EXIT WHEN NOT EXISTS (SELECT 1 FROM orders WHERE order_number = 'MAT-' || year_part || '-' || seq_part);
    END LOOP;
    RETURN 'MAT-' || year_part || '-' || seq_part;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION orders_set_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL THEN
        NEW.order_number := generate_order_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_orders_order_number ON orders;
CREATE TRIGGER trg_orders_order_number
    BEFORE INSERT ON orders
    FOR EACH ROW EXECUTE FUNCTION orders_set_order_number();

-- Financial integrity guard: non-admins may only cancel their own orders;
-- status/amount fields are admin-managed (P4)
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
       OR NEW.items    IS DISTINCT FROM OLD.items THEN
        RAISE EXCEPTION 'Only an admin may modify order financial fields';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_prevent_order_mutation ON orders;
CREATE TRIGGER trg_prevent_order_mutation
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION prevent_order_mutation();

-- Server-side order creation with integrity checks.
-- The frontend (orderService) may switch from direct insert to this RPC later;
-- the public insert path is preserved for compatibility.
CREATE OR REPLACE FUNCTION create_order(
    p_user_id TEXT,
    p_items JSONB,
    p_subtotal NUMERIC,
    p_shipping NUMERIC,
    p_discount NUMERIC,
    p_total NUMERIC,
    p_coupon_code TEXT DEFAULT NULL,
    p_payment_method TEXT DEFAULT 'cod',
    p_shipping_address JSONB DEFAULT NULL,
    p_notes TEXT DEFAULT '',
    p_id TEXT DEFAULT NULL
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
                        discount, total, coupon_code, payment_method, shipping_address, notes)
    VALUES (COALESCE(p_id, gen_random_uuid()::text), p_user_id, NULL, 'pending',
            p_items, p_subtotal, p_shipping, p_discount, p_total,
            p_coupon_code, p_payment_method, p_shipping_address, p_notes)
    RETURNING * INTO v_order;
    RETURN v_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
COMMENT ON FUNCTION create_order IS 'Safe order creation RPC with amount integrity + ownership checks (guest orders pass user_id NULL)';
GRANT EXECUTE ON FUNCTION create_order(text, jsonb, numeric, numeric, numeric, numeric,
    text, text, jsonb, text, text) TO anon, authenticated;

-- 6.5 GUEST CHECKOUT → LINK THE ORDER TO THE JUST-CREATED ACCOUNT
-- After a guest places an order (user_id = NULL) and the store creates an account
-- for them via auth.signUp, the client (CheckoutPage) calls this RPC to claim the
-- order back so it shows under "My Orders". Order ids are unguessable UUIDs and
-- claiming is only allowed while the order still has no owner.
-- NOTE: no plaintext password is ever stored — the temporary password is generated
-- and handled entirely client-side (shown once, kept in sessionStorage only).
CREATE OR REPLACE FUNCTION public.link_guest_order(p_order_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_uid TEXT := auth.uid()::text;
BEGIN
    IF v_uid IS NULL OR v_uid = '' THEN
        RETURN FALSE;
    END IF;
    UPDATE orders
       SET user_id = v_uid
     WHERE id = p_order_id
       AND user_id IS NULL;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
COMMENT ON FUNCTION public.link_guest_order IS
    'Claims a guest order (user_id IS NULL) for the freshly created account of the current user.';
REVOKE ALL ON FUNCTION public.link_guest_order(TEXT) FROM public;
GRANT EXECUTE ON FUNCTION public.link_guest_order(TEXT) TO anon, authenticated;

-- ############################################################################
-- 7. ORDER ITEMS   (line items snapshot — independent from orders.items JSON)
-- ############################################################################
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    product_image TEXT,
    quantity INT NOT NULL CHECK (quantity >= 1),
    price NUMERIC(10,2) NOT NULL CHECK (price >= 0)
);

-- ############################################################################
-- 8. REVIEWS
-- ############################################################################
CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
    user_id TEXT,
    user_name TEXT NOT NULL,
    user_avatar TEXT DEFAULT '',
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT DEFAULT '',
    comment TEXT NOT NULL,
    likes INT NOT NULL DEFAULT 0 CHECK (likes >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- SECURITY DEFINER: allows the aggregate rating push to bypass RLS
-- (products.*_update policies are admin-only) while staying a pure aggregate write.
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
DECLARE
    avg_rating NUMERIC(2,1);
    cnt INT;
BEGIN
    SELECT coalesce(round(avg(rating)::numeric, 1), 0), count(*)
    INTO avg_rating, cnt
    FROM reviews
    WHERE product_id = coalesce(NEW.product_id, OLD.product_id);

    UPDATE products
    SET rating = avg_rating, reviews_count = cnt
    WHERE id = coalesce(NEW.product_id, OLD.product_id);

    RETURN coalesce(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_reviews_update_product ON reviews;
CREATE TRIGGER trg_reviews_update_product
    AFTER INSERT OR DELETE OR UPDATE OF rating ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_product_rating();

-- ############################################################################
-- 9. COUPONS  (client reads go through get_coupon() RPC — see section 26;
--    the coupons table itself is admin-only read via its RLS policy)
-- ############################################################################
CREATE TABLE IF NOT EXISTS coupons (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL DEFAULT 'percentage'
        CHECK (type IN ('percentage','fixed','free_shipping')),
    discount NUMERIC(10,2) NOT NULL CHECK (discount > 0),
    min_order NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (min_order >= 0),
    max_discount NUMERIC(10,2) DEFAULT NULL CHECK (max_discount IS NULL OR max_discount >= 0),
    expires_at TIMESTAMPTZ NOT NULL,
    usage_limit INT NOT NULL DEFAULT 100 CHECK (usage_limit >= 0),
    used_count INT NOT NULL DEFAULT 0 CHECK (used_count >= 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (usage_limit = 0 OR used_count <= usage_limit)
);

CREATE OR REPLACE FUNCTION validate_coupon(p_code TEXT, p_order_total NUMERIC)
RETURNS TABLE(valid BOOLEAN, discount_type TEXT, discount_value NUMERIC,
               max_discount NUMERIC, message TEXT) AS $$
DECLARE
    c coupons%ROWTYPE;
BEGIN
    SELECT * INTO c FROM coupons WHERE upper(coupons.code) = upper(p_code) LIMIT 1;
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, NULL::TEXT, 0::NUMERIC, 0::NUMERIC, 'invalid code'::TEXT; RETURN;
    END IF;
    IF NOT c.is_active THEN
        RETURN QUERY SELECT false, NULL, 0, 0, 'coupon is disabled'::TEXT; RETURN;
    END IF;
    IF c.expires_at < now() THEN
        RETURN QUERY SELECT false, NULL, 0, 0, 'coupon has expired'::TEXT; RETURN;
    END IF;
    IF c.usage_limit > 0 AND c.used_count >= c.usage_limit THEN
        RETURN QUERY SELECT false, NULL, 0, 0, 'usage limit reached'::TEXT; RETURN;
    END IF;
    IF p_order_total < c.min_order THEN
        RETURN QUERY SELECT false, NULL, 0, 0, 'minimum order required'::TEXT; RETURN;
    END IF;
    RETURN QUERY SELECT true, c.type, c.discount, coalesce(c.max_discount, c.discount), 'valid'::TEXT;
END;
$$ LANGUAGE plpgsql STABLE SET search_path = public;
COMMENT ON FUNCTION validate_coupon IS 'Validates a coupon for a given order total (server-side only)';

CREATE OR REPLACE FUNCTION increment_coupon_usage(p_code TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE coupons
    SET used_count = used_count + 1
    WHERE upper(coupons.code) = upper(p_code)
      AND is_active = true
      AND expires_at > now()
      AND (usage_limit = 0 OR used_count < usage_limit);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Public-safe coupon lookup (no used_count / usage_limit exposure).
-- Clients (e.g. CartPage) should call this RPC instead of SELECTing coupons.
-- NOTE: the WHERE clause MUST qualify coupons.code — an unqualified `code`
-- collides with the OUT parameter `code` and raises 42702 at runtime.
CREATE OR REPLACE FUNCTION get_coupon(p_code TEXT)
RETURNS TABLE(valid BOOLEAN, code TEXT, discount_type TEXT, discount_value NUMERIC,
              max_discount NUMERIC, min_order NUMERIC, expires_at TIMESTAMPTZ, message TEXT) AS $$
DECLARE
    c coupons%ROWTYPE;
BEGIN
    SELECT * INTO c FROM coupons WHERE upper(coupons.code) = upper(p_code) LIMIT 1;
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, coalesce(p_code, ''), NULL::TEXT, 0::NUMERIC, 0::NUMERIC,
                            0::NUMERIC, NULL::TIMESTAMPTZ, 'invalid code'::TEXT; RETURN;
    END IF;
    IF NOT c.is_active THEN
        RETURN QUERY SELECT false, c.code, c.type, c.discount, coalesce(c.max_discount, c.discount),
                            c.min_order, c.expires_at, 'coupon disabled'::TEXT; RETURN;
    END IF;
    IF c.expires_at < now() THEN
        RETURN QUERY SELECT false, c.code, c.type, c.discount, coalesce(c.max_discount, c.discount),
                            c.min_order, c.expires_at, 'coupon expired'::TEXT; RETURN;
    END IF;
    RETURN QUERY SELECT true, c.code, c.type, c.discount, coalesce(c.max_discount, c.discount),
                        c.min_order, c.expires_at, 'valid'::TEXT;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;
COMMENT ON FUNCTION get_coupon IS 'Client-safe coupon lookup (P5): type/discount/validity without usage counters';
GRANT EXECUTE ON FUNCTION get_coupon(text) TO anon, authenticated;

-- Keeps DB values canonical (freeShipping -> free_shipping, tryAgain -> try_again)
-- so the strict CHECK can stay enforced while the frontend keeps sending aliases.
CREATE OR REPLACE FUNCTION normalize_coupon_type()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.type = 'freeShipping' THEN
        NEW.type := 'free_shipping';
    ELSIF NEW.type = 'tryAgain' THEN
        NEW.type := 'try_again';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_normalize_coupon_type ON coupons;
CREATE TRIGGER trg_normalize_coupon_type
    BEFORE INSERT OR UPDATE OF type ON coupons
    FOR EACH ROW EXECUTE FUNCTION normalize_coupon_type();

-- ############################################################################
-- 10. NOTIFICATIONS, TESTIMONIALS, SOCIAL
-- ############################################################################
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    type TEXT NOT NULL DEFAULT 'info'
        CHECK (type IN ('info','order','promo','system','success','warning','error')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS testimonials (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    avatar TEXT DEFAULT '',
    rating INT NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    role TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- opportunistic: recent activity
CREATE TABLE IF NOT EXISTS recently_viewed (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS recent_searches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    query TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ############################################################################
-- 11. SETTINGS (generic key-value), STORE SETTINGS (singleton), ANNOUNCEMENTS
-- ############################################################################
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION settings_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_settings_updated_at ON settings;
CREATE TRIGGER trg_settings_updated_at
    BEFORE UPDATE ON settings
    FOR EACH ROW EXECUTE FUNCTION settings_set_updated_at();

CREATE TABLE IF NOT EXISTS store_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    name TEXT DEFAULT '',
    description TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    email TEXT DEFAULT '',
    address TEXT DEFAULT '',
    shipping_cost NUMERIC(10,2) DEFAULT 30,
    free_shipping_threshold NUMERIC(10,2) DEFAULT 500,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE store_settings IS 'Singleton row — the frontend reads & upserts id=default';

CREATE TABLE IF NOT EXISTS announcements (
    id TEXT PRIMARY KEY DEFAULT 'default',
    text TEXT DEFAULT '',
    enabled BOOLEAN NOT NULL DEFAULT false,
    dismissible BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ############################################################################
-- 12. MARKETING / CONTACT / STOCK-ALERTS / EMAIL LOG
-- ############################################################################
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    subscribed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT newsletter_subscribers_email_check
        CHECK (email ~* '^[^@]+@[^@]+\.[^@]+$')
);

CREATE TABLE IF NOT EXISTS contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS back_in_stock_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    notified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (product_id, email)
);

CREATE TABLE IF NOT EXISTS order_email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT,
    email TEXT NOT NULL,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- NOTE (P13): the frontend CheckoutPage inserts email logs from the client, so the
-- INSERT policy stays public for now; moving it to an edge function / admin-only
-- insert requires a frontend change — see "remaining frontend work".

-- ############################################################################
-- 13. SPIN WHEEL (canonical type values: percentage/fixed/free_shipping/try_again;
--     aliases freeShipping/tryAgain are normalized by trigger)
-- ############################################################################
CREATE TABLE IF NOT EXISTS spin_prizes (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    type TEXT NOT NULL
        CHECK (type IN ('percentage','fixed','free_shipping','try_again')),
    value INT CHECK (value IS NULL OR value > 0),
    coupon_code TEXT,
    color TEXT NOT NULL DEFAULT '#2563EB',
    weight INT NOT NULL DEFAULT 1 CHECK (weight >= 1),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION normalize_spin_prize_type()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.type = 'freeShipping' THEN
        NEW.type := 'free_shipping';
    ELSIF NEW.type = 'tryAgain' THEN
        NEW.type := 'try_again';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_normalize_spin_prize_type ON spin_prizes;
CREATE TRIGGER trg_normalize_spin_prize_type
    BEFORE INSERT OR UPDATE OF type ON spin_prizes
    FOR EACH ROW EXECUTE FUNCTION normalize_spin_prize_type();

CREATE TABLE IF NOT EXISTS spin_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    guest_phone TEXT,
    prize_id TEXT REFERENCES spin_prizes(id) ON DELETE SET NULL,
    prize_label TEXT NOT NULL,
    type TEXT NOT NULL,
    value INT,
    coupon_code TEXT,
    claimed BOOLEAN NOT NULL DEFAULT false,
    spun_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (user_id IS NOT NULL OR guest_phone IS NOT NULL)
);

-- ############################################################################
-- 14. ACCOUNTING / BOOKKEEPING  (uuid fix: uuid_generate_v4 -> gen_random_uuid)
-- ############################################################################
CREATE TABLE IF NOT EXISTS accounting_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('income','expense')),
    category TEXT NOT NULL,
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    description TEXT DEFAULT '',
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION update_accounting_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_accounting_entries_updated_at ON accounting_entries;
CREATE TRIGGER trg_accounting_entries_updated_at
    BEFORE UPDATE ON accounting_entries
    FOR EACH ROW EXECUTE FUNCTION update_accounting_entries_updated_at();

-- ============================================================================
-- 15. COMMON HELPERS
-- ============================================================================
CREATE OR REPLACE FUNCTION get_user_count(p_user_id TEXT)
RETURNS INT AS $$
BEGIN
    RETURN (SELECT count(*) FROM orders WHERE user_id = p_user_id);
END;
$$ LANGUAGE plpgsql STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION is_low_stock(p_product_id TEXT, p_threshold INT DEFAULT 10)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM products WHERE id = p_product_id AND stock < p_threshold);
END;
$$ LANGUAGE plpgsql STABLE SET search_path = public;

-- ============================================================================
-- 16. INDEXES   (IF NOT EXISTS → safe reruns)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_products_category_id   ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand_id      ON products(brand_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug   ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_created_at    ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_price         ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_featured      ON products(id) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_products_new           ON products(id) WHERE is_new = true;
CREATE INDEX IF NOT EXISTS idx_products_discounted    ON products(id) WHERE discount IS NOT NULL AND discount > 0;
CREATE INDEX IF NOT EXISTS idx_products_low_stock     ON products(id) WHERE stock < 10;
CREATE INDEX IF NOT EXISTS idx_products_search        ON products USING GIN(search_vector);

-- order_number has a UNIQUE constraint (orders_order_number_key) — drop the duplicate index
DROP INDEX IF EXISTS idx_orders_number;
CREATE INDEX IF NOT EXISTS idx_orders_user_id         ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status          ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_status_created  ON orders(status, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_created_at      ON orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id   ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

CREATE INDEX IF NOT EXISTS idx_cart_items_user_id     ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id  ON cart_items(product_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id       ON wishlist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_product_id    ON wishlist_items(product_id);

CREATE INDEX IF NOT EXISTS idx_reviews_product_id     ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id        ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at     ON reviews(created_at DESC);
-- One review per (logged-in) user per product; the frontend uses user_id='guest'
-- for anonymous reviews, so those are excluded from the uniqueness scope.
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_user_product
    ON reviews(user_id, product_id) WHERE user_id IS NOT NULL AND user_id <> 'guest';

CREATE INDEX IF NOT EXISTS idx_notifications_user_id  ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread   ON notifications(user_id) WHERE read = false;

CREATE INDEX IF NOT EXISTS idx_addresses_user_id      ON addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_spin_history_user_id   ON spin_history(user_id);
CREATE INDEX IF NOT EXISTS idx_back_in_stock_product  ON back_in_stock_requests(product_id);
CREATE INDEX IF NOT EXISTS idx_rec_viewed_user        ON recently_viewed(user_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_rec_searches_user      ON recent_searches(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_unread ON contact_messages(id) WHERE read = false;
CREATE UNIQUE INDEX IF NOT EXISTS idx_coupons_upper_code ON coupons(upper(code));

-- ============================================================================
-- 17. DASHBOARD VIEWS + META-FUNCTION
--     All views use security_invoker = true → they inherit the caller's RLS.
--     5 sensitive views (PII / revenue) are locked from anon + authenticated and
--     are only reachable through get_dashboard_data() (SECURITY DEFINER + admin guard).
--     5 catalog views stay public (explicit SELECT grants for anon + authenticated).
--     NOTE: view privileges are normally managed from the Supabase dashboard;
--     the REVOKE/GRANT below are the deterministic defaults for this file.
-- ============================================================================
CREATE OR REPLACE VIEW dashboard_stats WITH (security_invoker = true) AS
SELECT
    (SELECT count(*) FROM products)::int AS total_products,
    (SELECT count(*) FROM orders)::int AS total_orders,
    (SELECT coalesce(sum(total),0) FROM orders)::numeric(12,2) AS total_revenue,
    (SELECT count(*) FROM profiles)::int AS total_users,
    (SELECT count(*) FROM brands)::int AS total_brands,
    (SELECT count(*) FROM categories)::int AS total_categories,
    (SELECT count(*) FROM coupons)::int AS total_coupons,
    (SELECT count(*) FROM orders WHERE status='pending')::int AS pending_orders,
    (SELECT count(*) FROM products WHERE stock < 10)::int AS low_stock_products,
    now()::timestamptz AS calculated_at;

CREATE OR REPLACE VIEW monthly_revenue WITH (security_invoker = true) AS
SELECT date_trunc('month', created_at)::date AS month_date,
       to_char(date_trunc('month', created_at), 'YYYY-MM') AS month_key,
       count(*)::int AS orders_count,
       coalesce(sum(total),0)::numeric(12,2) AS revenue
FROM orders WHERE status <> 'cancelled'
GROUP BY 1,2 ORDER BY month_date DESC;

CREATE OR REPLACE VIEW order_status_distribution WITH (security_invoker = true) AS
SELECT status, count(*)::int AS count FROM orders GROUP BY status ORDER BY count DESC;

CREATE OR REPLACE VIEW category_distribution WITH (security_invoker = true) AS
SELECT c.id, c.name, count(p.id)::int AS products_count
FROM categories c LEFT JOIN products p ON p.category_id = c.id
GROUP BY c.id, c.name ORDER BY products_count DESC;

CREATE OR REPLACE VIEW brand_distribution WITH (security_invoker = true) AS
SELECT b.id, b.name, count(p.id)::int AS products_count
FROM brands b LEFT JOIN products p ON p.brand_id = b.id
GROUP BY b.id, b.name ORDER BY products_count DESC;

CREATE OR REPLACE VIEW top_products WITH (security_invoker = true) AS
SELECT id, name, slug, price, images, rating, reviews_count, stock, is_featured
FROM products ORDER BY reviews_count DESC, rating DESC LIMIT 10;

CREATE OR REPLACE VIEW recent_orders WITH (security_invoker = true) AS
SELECT o.id, o.order_number, o.status, o.total, o.created_at, p.name AS customer_name
FROM orders o LEFT JOIN profiles p ON p.id::text = o.user_id
ORDER BY o.created_at DESC LIMIT 10;

CREATE OR REPLACE VIEW low_stock_products WITH (security_invoker = true) AS
SELECT id, name, slug, stock, price, images[1] AS primary_image
FROM products WHERE stock < 10 AND stock > 0 ORDER BY stock ASC;

CREATE OR REPLACE VIEW out_of_stock_products WITH (security_invoker = true) AS
SELECT id, name, slug, stock, price, images[1] AS primary_image
FROM products WHERE stock = 0 ORDER BY name ASC;

CREATE OR REPLACE VIEW user_sales_summary WITH (security_invoker = true) AS
SELECT p.id::text AS user_id, p.name, p.email,
       count(o.id)::int AS total_orders,
       coalesce(sum(o.total),0)::numeric(12,2) AS total_spent,
       coalesce(avg(o.total),0)::numeric(10,2) AS avg_order_value,
       max(o.created_at) AS last_order_date
FROM profiles p LEFT JOIN orders o ON o.user_id = p.id::text
GROUP BY p.id, p.name, p.email ORDER BY total_spent DESC;

-- Sensitive views: fully locked from clients (admin only, via RPC below)
REVOKE ALL ON dashboard_stats FROM anon, authenticated;
REVOKE ALL ON monthly_revenue FROM anon, authenticated;
REVOKE ALL ON order_status_distribution FROM anon, authenticated;
REVOKE ALL ON user_sales_summary FROM anon, authenticated;
REVOKE ALL ON recent_orders FROM anon, authenticated;

-- Public catalog views: explicit read grants (idempotent)
GRANT SELECT ON category_distribution TO anon, authenticated;
GRANT SELECT ON brand_distribution TO anon, authenticated;
GRANT SELECT ON top_products TO anon, authenticated;
GRANT SELECT ON low_stock_products TO anon, authenticated;
GRANT SELECT ON out_of_stock_products TO anon, authenticated;

-- One-call dashboard (admin-only; SECURITY DEFINER so it can read the locked views)
CREATE OR REPLACE FUNCTION get_dashboard_data()
RETURNS jsonb AS $$
DECLARE
    v_stats jsonb; v_mr jsonb; v_os jsonb; v_tp jsonb; v_ro jsonb; v_ls jsonb;
BEGIN
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Only an admin may view dashboard data';
    END IF;
    SELECT row_to_json(ds.*)::jsonb INTO v_stats FROM dashboard_stats ds;
    SELECT coalesce(jsonb_agg(mr.*), '[]'::jsonb) INTO v_mr FROM monthly_revenue mr;
    SELECT coalesce(jsonb_agg(os.*), '[]'::jsonb) INTO v_os FROM order_status_distribution os;
    SELECT coalesce(jsonb_agg(tp.*), '[]'::jsonb) INTO v_tp FROM top_products tp;
    SELECT coalesce(jsonb_agg(ro.*), '[]'::jsonb) INTO v_ro FROM recent_orders ro;
    SELECT coalesce(jsonb_agg(ls.*), '[]'::jsonb) INTO v_ls FROM low_stock_products ls;
    RETURN jsonb_build_object(
        'stats', v_stats, 'monthly_revenue', v_mr, 'order_statuses', v_os,
        'top_products', v_tp, 'recent_orders', v_ro, 'low_stock_products', v_ls);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;
COMMENT ON FUNCTION get_dashboard_data IS 'Admin dashboard payload (reads the locked admin views)';
REVOKE ALL ON FUNCTION get_dashboard_data() FROM anon;

-- ============================================================================
-- 18. ROW LEVEL SECURITY  (applies to every table — nothing public opens users)
-- ============================================================================
-- Anti search_path-hijack hardening for the two postgres client roles
ALTER ROLE anon SET search_path = public;
ALTER ROLE authenticated SET search_path = public;

ALTER TABLE profiles                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories               ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE products                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses                ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items               ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items           ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items              ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications            ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials             ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers   ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages         ENABLE ROW LEVEL SECURITY;
ALTER TABLE back_in_stock_requests   ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings           ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements            ENABLE ROW LEVEL SECURITY;
ALTER TABLE recently_viewed          ENABLE ROW LEVEL SECURITY;
ALTER TABLE recent_searches          ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_email_logs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE spin_prizes              ENABLE ROW LEVEL SECURITY;
ALTER TABLE spin_history             ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting_entries       ENABLE ROW LEVEL SECURITY;

-- ── profiles: own-select/insert/update, owner-read, admin-all ──────────────
DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select" ON profiles FOR SELECT
    USING (id = auth.uid() OR is_admin());
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
CREATE POLICY "profiles_insert" ON profiles FOR INSERT
    WITH CHECK (id = auth.uid() OR is_admin());
DROP POLICY IF EXISTS "profiles_update" ON profiles;
CREATE POLICY "profiles_update" ON profiles FOR UPDATE
    USING (id = auth.uid() OR is_admin())
    WITH CHECK (id = auth.uid() OR is_admin());
DROP POLICY IF EXISTS "profiles_delete" ON profiles;
CREATE POLICY "profiles_delete" ON profiles FOR DELETE USING (is_admin());

-- ── catalog: public read, admin write ──────────────────────────────────────
DROP POLICY IF EXISTS "categories_select" ON categories;
CREATE POLICY "categories_select" ON categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "categories_insert" ON categories;
CREATE POLICY "categories_insert" ON categories FOR INSERT WITH CHECK (is_admin());
DROP POLICY IF EXISTS "categories_update" ON categories;
CREATE POLICY "categories_update" ON categories FOR UPDATE USING (is_admin());
DROP POLICY IF EXISTS "categories_delete" ON categories;
CREATE POLICY "categories_delete" ON categories FOR DELETE USING (is_admin());

DROP POLICY IF EXISTS "brands_select" ON brands;
CREATE POLICY "brands_select" ON brands FOR SELECT USING (true);
DROP POLICY IF EXISTS "brands_insert" ON brands;
CREATE POLICY "brands_insert" ON brands FOR INSERT WITH CHECK (is_admin());
DROP POLICY IF EXISTS "brands_update" ON brands;
CREATE POLICY "brands_update" ON brands FOR UPDATE USING (is_admin());
DROP POLICY IF EXISTS "brands_delete" ON brands;
CREATE POLICY "brands_delete" ON brands FOR DELETE USING (is_admin());

DROP POLICY IF EXISTS "products_select" ON products;
CREATE POLICY "products_select" ON products FOR SELECT USING (true);
DROP POLICY IF EXISTS "products_insert" ON products;
CREATE POLICY "products_insert" ON products FOR INSERT WITH CHECK (is_admin());
DROP POLICY IF EXISTS "products_update" ON products;
CREATE POLICY "products_update" ON products FOR UPDATE USING (is_admin());
DROP POLICY IF EXISTS "products_delete" ON products;
CREATE POLICY "products_delete" ON products FOR DELETE USING (is_admin());

-- ── user-owned resources ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "addresses_select" ON addresses;
CREATE POLICY "addresses_select" ON addresses FOR SELECT
    USING (user_id = auth.uid()::text OR is_admin());
DROP POLICY IF EXISTS "addresses_insert" ON addresses;
CREATE POLICY "addresses_insert" ON addresses FOR INSERT
    WITH CHECK (user_id = auth.uid()::text OR is_admin());
DROP POLICY IF EXISTS "addresses_update" ON addresses;
CREATE POLICY "addresses_update" ON addresses FOR UPDATE
    USING (user_id = auth.uid()::text OR is_admin());
DROP POLICY IF EXISTS "addresses_delete" ON addresses;
CREATE POLICY "addresses_delete" ON addresses FOR DELETE
    USING (user_id = auth.uid()::text OR is_admin());

DROP POLICY IF EXISTS "cart_items_select" ON cart_items;
CREATE POLICY "cart_items_select" ON cart_items FOR SELECT
    USING (user_id = auth.uid()::text);
DROP POLICY IF EXISTS "cart_items_insert" ON cart_items;
CREATE POLICY "cart_items_insert" ON cart_items FOR INSERT
    WITH CHECK (user_id = auth.uid()::text);
DROP POLICY IF EXISTS "cart_items_update" ON cart_items;
CREATE POLICY "cart_items_update" ON cart_items FOR UPDATE
    USING (user_id = auth.uid()::text);
DROP POLICY IF EXISTS "cart_items_delete" ON cart_items;
CREATE POLICY "cart_items_delete" ON cart_items FOR DELETE
    USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "wishlist_select" ON wishlist_items;
CREATE POLICY "wishlist_select" ON wishlist_items FOR SELECT
    USING (user_id = auth.uid()::text);
DROP POLICY IF EXISTS "wishlist_insert" ON wishlist_items;
CREATE POLICY "wishlist_insert" ON wishlist_items FOR INSERT
    WITH CHECK (user_id = auth.uid()::text);
DROP POLICY IF EXISTS "wishlist_delete" ON wishlist_items;
CREATE POLICY "wishlist_delete" ON wishlist_items FOR DELETE
    USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "orders_select" ON orders;
CREATE POLICY "orders_select" ON orders FOR SELECT
    USING (user_id = auth.uid()::text OR is_admin());
DROP POLICY IF EXISTS "orders_insert" ON orders;
CREATE POLICY "orders_insert" ON orders FOR INSERT
    WITH CHECK (user_id = auth.uid()::text OR user_id IS NULL OR is_admin());
DROP POLICY IF EXISTS "orders_update" ON orders;
CREATE POLICY "orders_update" ON orders FOR UPDATE
    USING (user_id = auth.uid()::text OR is_admin())
    WITH CHECK (user_id = auth.uid()::text OR is_admin());
DROP POLICY IF EXISTS "orders_delete" ON orders;
CREATE POLICY "orders_delete" ON orders FOR DELETE USING (is_admin());

DROP POLICY IF EXISTS "order_items_select" ON order_items;
CREATE POLICY "order_items_select" ON order_items FOR SELECT
    USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id
                   AND (orders.user_id = auth.uid()::text OR is_admin())));
DROP POLICY IF EXISTS "order_items_insert" ON order_items;
CREATE POLICY "order_items_insert" ON order_items FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id
                        AND (orders.user_id = auth.uid()::text OR is_admin())));

DROP POLICY IF EXISTS "reviews_select" ON reviews;
CREATE POLICY "reviews_select" ON reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "reviews_insert" ON reviews;
CREATE POLICY "reviews_insert" ON reviews FOR INSERT
    WITH CHECK (user_id = auth.uid()::text OR user_id IS NULL OR is_admin());
DROP POLICY IF EXISTS "reviews_update" ON reviews;
CREATE POLICY "reviews_update" ON reviews FOR UPDATE
    USING (user_id = auth.uid()::text OR is_admin());
DROP POLICY IF EXISTS "reviews_delete" ON reviews;
CREATE POLICY "reviews_delete" ON reviews FOR DELETE USING (is_admin());

-- ── coupons / settings / testimonials / prizes: public read, admin write ───
DROP POLICY IF EXISTS "coupons_select" ON coupons;
-- Client coupon lookups must use get_coupon(code) RPC; the table is admin-only.
CREATE POLICY "coupons_select" ON coupons FOR SELECT USING (is_admin());
DROP POLICY IF EXISTS "coupons_insert" ON coupons;
CREATE POLICY "coupons_insert" ON coupons FOR INSERT WITH CHECK (is_admin());
DROP POLICY IF EXISTS "coupons_update" ON coupons;
CREATE POLICY "coupons_update" ON coupons FOR UPDATE USING (is_admin());
DROP POLICY IF EXISTS "coupons_delete" ON coupons;
CREATE POLICY "coupons_delete" ON coupons FOR DELETE USING (is_admin());

DROP POLICY IF EXISTS "settings_select" ON settings;
CREATE POLICY "settings_select" ON settings FOR SELECT USING (is_admin());
DROP POLICY IF EXISTS "settings_insert" ON settings;
CREATE POLICY "settings_insert" ON settings FOR INSERT WITH CHECK (is_admin());
DROP POLICY IF EXISTS "settings_update" ON settings;
CREATE POLICY "settings_update" ON settings FOR UPDATE USING (is_admin());
DROP POLICY IF EXISTS "settings_delete" ON settings;
CREATE POLICY "settings_delete" ON settings FOR DELETE USING (is_admin());

DROP POLICY IF EXISTS "store_settings_select" ON store_settings;
CREATE POLICY "store_settings_select" ON store_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "store_settings_write" ON store_settings;
CREATE POLICY "store_settings_write" ON store_settings FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "announcements_select" ON announcements;
CREATE POLICY "announcements_select" ON announcements FOR SELECT USING (true);
DROP POLICY IF EXISTS "announcements_write" ON announcements;
CREATE POLICY "announcements_write" ON announcements FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "testimonials_select" ON testimonials;
CREATE POLICY "testimonials_select" ON testimonials FOR SELECT USING (true);
DROP POLICY IF EXISTS "testimonials_insert" ON testimonials;
CREATE POLICY "testimonials_insert" ON testimonials FOR INSERT WITH CHECK (is_admin());
DROP POLICY IF EXISTS "testimonials_update" ON testimonials;
CREATE POLICY "testimonials_update" ON testimonials FOR UPDATE USING (is_admin());
DROP POLICY IF EXISTS "testimonials_delete" ON testimonials;
CREATE POLICY "testimonials_delete" ON testimonials FOR DELETE USING (is_admin());

DROP POLICY IF EXISTS "spin_prizes_select" ON spin_prizes;
CREATE POLICY "spin_prizes_select" ON spin_prizes FOR SELECT USING (true);
DROP POLICY IF EXISTS "spin_prizes_insert" ON spin_prizes;
CREATE POLICY "spin_prizes_insert" ON spin_prizes FOR INSERT WITH CHECK (is_admin());
DROP POLICY IF EXISTS "spin_prizes_update" ON spin_prizes;
CREATE POLICY "spin_prizes_update" ON spin_prizes FOR UPDATE USING (is_admin());
DROP POLICY IF EXISTS "spin_prizes_delete" ON spin_prizes;
CREATE POLICY "spin_prizes_delete" ON spin_prizes FOR DELETE USING (is_admin());

DROP POLICY IF EXISTS "spin_history_select" ON spin_history;
CREATE POLICY "spin_history_select" ON spin_history FOR SELECT
    USING (user_id = auth.uid()::text OR is_admin());
DROP POLICY IF EXISTS "spin_history_insert" ON spin_history;
CREATE POLICY "spin_history_insert" ON spin_history FOR INSERT
    WITH CHECK (user_id = auth.uid()::text OR user_id IS NULL OR is_admin());
DROP POLICY IF EXISTS "spin_history_update" ON spin_history;
CREATE POLICY "spin_history_update" ON spin_history FOR UPDATE
    USING (user_id = auth.uid()::text OR is_admin());
DROP POLICY IF EXISTS "spin_history_delete" ON spin_history;
CREATE POLICY "spin_history_delete" ON spin_history FOR DELETE USING (is_admin());

-- ── public-submit, admin-read resources ────────────────────────────────────
DROP POLICY IF EXISTS "newsletter_insert" ON newsletter_subscribers;
CREATE POLICY "newsletter_insert" ON newsletter_subscribers FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "newsletter_select" ON newsletter_subscribers;
CREATE POLICY "newsletter_select" ON newsletter_subscribers FOR SELECT USING (is_admin());
DROP POLICY IF EXISTS "newsletter_delete" ON newsletter_subscribers;
CREATE POLICY "newsletter_delete" ON newsletter_subscribers FOR DELETE USING (is_admin());

DROP POLICY IF EXISTS "contact_insert" ON contact_messages;
CREATE POLICY "contact_insert" ON contact_messages FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "contact_select" ON contact_messages;
CREATE POLICY "contact_select" ON contact_messages FOR SELECT USING (is_admin());
DROP POLICY IF EXISTS "contact_update" ON contact_messages;
CREATE POLICY "contact_update" ON contact_messages FOR UPDATE USING (is_admin());
DROP POLICY IF EXISTS "contact_delete" ON contact_messages;
CREATE POLICY "contact_delete" ON contact_messages FOR DELETE USING (is_admin());

DROP POLICY IF EXISTS "backinstock_insert" ON back_in_stock_requests;
CREATE POLICY "backinstock_insert" ON back_in_stock_requests FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "backinstock_select" ON back_in_stock_requests;
CREATE POLICY "backinstock_select" ON back_in_stock_requests FOR SELECT USING (is_admin());
DROP POLICY IF EXISTS "backinstock_update" ON back_in_stock_requests;
CREATE POLICY "backinstock_update" ON back_in_stock_requests FOR UPDATE USING (is_admin());
DROP POLICY IF EXISTS "backinstock_delete" ON back_in_stock_requests;
CREATE POLICY "backinstock_delete" ON back_in_stock_requests FOR DELETE USING (is_admin());

DROP POLICY IF EXISTS "email_log_insert" ON order_email_logs;
CREATE POLICY "email_log_insert" ON order_email_logs FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "email_log_select" ON order_email_logs;
CREATE POLICY "email_log_select" ON order_email_logs FOR SELECT USING (is_admin());
DROP POLICY IF EXISTS "email_log_delete" ON order_email_logs;
CREATE POLICY "email_log_delete" ON order_email_logs FOR DELETE USING (is_admin());

-- ── personalization ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "rec_viewed_select" ON recently_viewed;
CREATE POLICY "rec_viewed_select" ON recently_viewed FOR SELECT
    USING (user_id = auth.uid()::text);
DROP POLICY IF EXISTS "rec_viewed_insert" ON recently_viewed;
CREATE POLICY "rec_viewed_insert" ON recently_viewed FOR INSERT
    WITH CHECK (user_id = auth.uid()::text);
DROP POLICY IF EXISTS "rec_viewed_delete" ON recently_viewed;
CREATE POLICY "rec_viewed_delete" ON recently_viewed FOR DELETE
    USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "rec_searches_select" ON recent_searches;
CREATE POLICY "rec_searches_select" ON recent_searches FOR SELECT
    USING (user_id = auth.uid()::text);
DROP POLICY IF EXISTS "rec_searches_insert" ON recent_searches;
CREATE POLICY "rec_searches_insert" ON recent_searches FOR INSERT
    WITH CHECK (user_id = auth.uid()::text);
DROP POLICY IF EXISTS "rec_searches_update" ON recent_searches;
CREATE POLICY "rec_searches_update" ON recent_searches FOR UPDATE
    USING (user_id = auth.uid()::text);
DROP POLICY IF EXISTS "rec_searches_delete" ON recent_searches;
CREATE POLICY "rec_searches_delete" ON recent_searches FOR DELETE
    USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "notifications_select" ON notifications;
CREATE POLICY "notifications_select" ON notifications FOR SELECT
    USING (user_id = auth.uid()::text OR user_id IN ('', 'broadcast') OR is_admin());
DROP POLICY IF EXISTS "notifications_insert" ON notifications;
CREATE POLICY "notifications_insert" ON notifications FOR INSERT WITH CHECK (is_admin());
DROP POLICY IF EXISTS "notifications_update" ON notifications;
CREATE POLICY "notifications_update" ON notifications FOR UPDATE
    USING (user_id = auth.uid()::text OR user_id IN ('', 'broadcast') OR is_admin());
DROP POLICY IF EXISTS "notifications_delete" ON notifications;
CREATE POLICY "notifications_delete" ON notifications FOR DELETE USING (is_admin());

-- ── accounting (admin-only) ────────────────────────────────────────────────
DROP POLICY IF EXISTS "accounting_select" ON accounting_entries;
CREATE POLICY "accounting_select" ON accounting_entries FOR SELECT USING (is_admin());
DROP POLICY IF EXISTS "accounting_insert" ON accounting_entries;
CREATE POLICY "accounting_insert" ON accounting_entries FOR INSERT WITH CHECK (is_admin());
DROP POLICY IF EXISTS "accounting_update" ON accounting_entries;
CREATE POLICY "accounting_update" ON accounting_entries FOR UPDATE USING (is_admin());
DROP POLICY IF EXISTS "accounting_delete" ON accounting_entries;
CREATE POLICY "accounting_delete" ON accounting_entries FOR DELETE USING (is_admin());

-- ============================================================================
-- 19. STORAGE — buckets + storage-level policies (idempotent)
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('product-images', 'product-images', true, 5242880,
     ARRAY['image/jpeg','image/png','image/webp','image/avif']),
  ('avatars',       'avatars',       true, 2097152,
     ARRAY['image/jpeg','image/png','image/webp']),
  ('brand-logos',   'brand-logos',   true, 2097152,
     ARRAY['image/jpeg','image/png','image/webp','image/svg+xml']),
  ('category-images','category-images', true, 5242880,
     ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "product_images_public_select" ON storage.objects;
CREATE POLICY "product_images_public_select" ON storage.objects
    FOR SELECT USING (bucket_id = 'product-images');
DROP POLICY IF EXISTS "product_images_admin_write" ON storage.objects;
CREATE POLICY "product_images_admin_write" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'product-images' AND is_admin());
DROP POLICY IF EXISTS "product_images_admin_delete" ON storage.objects;
CREATE POLICY "product_images_admin_delete" ON storage.objects
    FOR DELETE USING (bucket_id = 'product-images' AND is_admin());

DROP POLICY IF EXISTS "avatars_public_select" ON storage.objects;
CREATE POLICY "avatars_public_select" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');
-- Client uploads to "avatars/<uuid>.<ext>" (src/lib/upload.ts → fileName()).
-- Owner check = the file name (stripped of its extension) equals the user's uid.
DROP POLICY IF EXISTS "avatars_owner_insert" ON storage.objects;
CREATE POLICY "avatars_owner_insert" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'avatars'
        AND (is_admin() OR auth.uid()::text = split_part(storage.filename(name), '.', 1))
    );
DROP POLICY IF EXISTS "avatars_owner_update" ON storage.objects;
CREATE POLICY "avatars_owner_update" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'avatars'
        AND (is_admin() OR auth.uid()::text = split_part(storage.filename(name), '.', 1))
    )
    WITH CHECK (
        bucket_id = 'avatars'
        AND (is_admin() OR auth.uid()::text = split_part(storage.filename(name), '.', 1))
    );
DROP POLICY IF EXISTS "avatars_owner_delete" ON storage.objects;
CREATE POLICY "avatars_owner_delete" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'avatars'
        AND (is_admin() OR auth.uid()::text = split_part(storage.filename(name), '.', 1))
    );

DROP POLICY IF EXISTS "brand_logos_public_select" ON storage.objects;
CREATE POLICY "brand_logos_public_select" ON storage.objects
    FOR SELECT USING (bucket_id = 'brand-logos');
DROP POLICY IF EXISTS "brand_logos_admin_write" ON storage.objects;
CREATE POLICY "brand_logos_admin_write" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'brand-logos' AND is_admin());
DROP POLICY IF EXISTS "brand_logos_admin_delete" ON storage.objects;
CREATE POLICY "brand_logos_admin_delete" ON storage.objects
    FOR DELETE USING (bucket_id = 'brand-logos' AND is_admin());

DROP POLICY IF EXISTS "categories_public_select" ON storage.objects;
CREATE POLICY "categories_public_select" ON storage.objects
    FOR SELECT USING (bucket_id = 'category-images');
DROP POLICY IF EXISTS "categories_admin_write" ON storage.objects;
CREATE POLICY "categories_admin_write" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'category-images' AND is_admin());
DROP POLICY IF EXISTS "categories_admin_delete" ON storage.objects;
CREATE POLICY "categories_admin_delete" ON storage.objects
    FOR DELETE USING (bucket_id = 'category-images' AND is_admin());

-- ============================================================================
-- 20. SEED  (ON CONFLICT => re-runnable)
-- ============================================================================
-- Note: real products/categories arrive from the store / admin panel.

INSERT INTO brands (id, name, slug, logo, products_count) VALUES
('b-1', 'ZARA',   'zara',   '', 0),
('b-2', 'H&M',    'hm',     '', 0),
('b-3', 'Nike',   'nike',   '', 0),
('b-4', 'Adidas', 'adidas', '', 0),
('b-5', 'Gucci',  'gucci',  '', 0),
('b-6', 'Puma',   'puma',   '', 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO coupons (id, code, type, discount, min_order, max_discount, expires_at, usage_limit, used_count)
VALUES
('coup-1','WELCOME10','percentage',10,0,100,'2027-12-31',1000,0),
('coup-2','ZAHI20','percentage',20,500,200,'2027-06-30',500,0),
('coup-3','SALE50','fixed',50,300,50,'2027-03-31',200,0),
('coup-4','FREESHIP','free_shipping',30,200,30,'2027-09-30',300,0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO spin_prizes (id, label, type, value, color, weight, is_active) VALUES
('spin-1','خصم 10%','percentage',10,'#22C55E',20,true),
('spin-2','خصم 20%','percentage',20,'#3B82F6',15,true),
('spin-3','خصم 30%','percentage',30,'#8B5CF6',10,true),
('spin-4','خصم 50%','percentage',50,'#F59E0B',5,true),
('spin-5','خصم 70%','percentage',70,'#EF4444',3,true),
('spin-6','شحن مجاني','free_shipping',NULL,'#06B6D4',12,true),
('spin-7','50 جنيه كاش','fixed',50,'#EC4899',8,true),
('spin-8','100 جنيه كاش','fixed',100,'#F97316',5,true),
('spin-9','حظ أوفر','try_again',NULL,'#6B7280',17,true),
('spin-10','200 جنيه كاش','fixed',200,'#E11D48',5,true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO testimonials (id, name, avatar, rating, comment, role) VALUES
('t-1','أحمد علي','',5,'منتجات رائعة وجودة ممتازة','عميل'),
('t-2','سارة محمد','',5,'التوصيل سريع جداً والتغليف جميل','عميلة'),
('t-3','محمد حسن','',4,'جودة ممتازة واسعار مناسبة','عميل'),
('t-4','نورا أحمد','',5,'أفضل متجر الكتروني في مصر','عميلة'),
('t-5','خالد يوسف','',5,'خدمة عملاء ممتازة ومنتجات أصلية','عميل')
ON CONFLICT (id) DO NOTHING;

INSERT INTO store_settings (id, name, description, phone, email, address, shipping_cost, free_shipping_threshold)
VALUES ('default','Zahi','أفضل متجر إلكتروني في مصر','+201234567890','info@zahieg.com','القاهرة، مصر',30,500)
ON CONFLICT (id) DO NOTHING;

INSERT INTO announcements (id, text, enabled, dismissible)
VALUES ('default','',false,true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO settings (key, value) VALUES
  ('announcement','{"text":"توصيل مجاني للطلبات فوق 500 ج.م","enabled":true,"dismissible":true}'::jsonb),
  ('store_info','{"name":"زاهي","description":"متجر إلكتروني مصري","currency":"ج.م","phone":"","email":"","whatsapp":""}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- 25. FUNCTION EXECUTE HARDENING
--     Trigger/helper functions are never called by clients directly (triggers
--     run them regardless of EXECUTE grants), so client roles are revoked.
--     is_admin() keeps EXECUTE — RLS policy expressions need it for anon/authenticated.
-- ============================================================================
REVOKE ALL ON FUNCTION handle_new_user() FROM anon, authenticated;
REVOKE ALL ON FUNCTION protect_profile_role() FROM anon, authenticated;
REVOKE ALL ON FUNCTION ensure_single_address() FROM anon, authenticated;
REVOKE ALL ON FUNCTION orders_set_updated_at() FROM anon, authenticated;
REVOKE ALL ON FUNCTION generate_order_number() FROM anon, authenticated;
REVOKE ALL ON FUNCTION orders_set_order_number() FROM anon, authenticated;
REVOKE ALL ON FUNCTION products_search_update() FROM anon, authenticated;
REVOKE ALL ON FUNCTION update_product_rating() FROM anon, authenticated;
REVOKE ALL ON FUNCTION settings_set_updated_at() FROM anon, authenticated;
REVOKE ALL ON FUNCTION update_accounting_entries_updated_at() FROM anon, authenticated;
REVOKE ALL ON FUNCTION normalize_coupon_type() FROM anon, authenticated;
REVOKE ALL ON FUNCTION normalize_spin_prize_type() FROM anon, authenticated;
REVOKE ALL ON FUNCTION validate_coupon(text, numeric) FROM anon, authenticated;
REVOKE ALL ON FUNCTION increment_coupon_usage(text) FROM anon, authenticated;
REVOKE ALL ON FUNCTION get_user_count(text) FROM anon, authenticated;
REVOKE ALL ON FUNCTION is_low_stock(text, integer) FROM anon, authenticated;
REVOKE ALL ON FUNCTION prevent_order_mutation() FROM anon, authenticated;
-- Public RPCs keep EXECUTE: get_coupon(text), create_order(...),
-- link_guest_order(text), is_admin()

-- ============================================================================
-- 26. MIGRATIONS / SANITY  (idempotent repairs for pre-existing databases)
--     Safe to run at any time; every statement tolerates repeated execution.
-- ============================================================================

-- 26.1 Seed coupons must never expire (code-based: works regardless of row id)
UPDATE coupons SET expires_at = '2027-12-31'
    WHERE code = 'WELCOME10' AND expires_at < now() + interval '30 days';
UPDATE coupons SET expires_at = '2027-06-30'
    WHERE code = 'ZAHI20' AND expires_at < now() + interval '30 days';
UPDATE coupons SET expires_at = '2027-03-31'
    WHERE code = 'SALE50' AND expires_at < now() + interval '30 days';
UPDATE coupons SET expires_at = '2027-09-30'
    WHERE code = 'FREESHIP' AND expires_at < now() + interval '30 days';

-- 26.2 max_discount: NULL == "no cap" (0 was the legacy sentinel)
ALTER TABLE coupons ALTER COLUMN max_discount SET DEFAULT NULL;
UPDATE coupons SET max_discount = NULL WHERE max_discount = 0;

-- 26.3 Normalize legacy type aliases BEFORE re-adding the strict constraints
UPDATE coupons SET type = 'free_shipping' WHERE type = 'freeShipping';
UPDATE spin_prizes SET type = 'free_shipping' WHERE type = 'freeShipping';
UPDATE spin_prizes SET type = 'try_again'    WHERE type = 'tryAgain';

ALTER TABLE coupons DROP CONSTRAINT IF EXISTS coupons_type_check;
ALTER TABLE coupons ADD CONSTRAINT coupons_type_check
    CHECK (type IN ('percentage','fixed','free_shipping'));
ALTER TABLE spin_prizes DROP CONSTRAINT IF EXISTS spin_prizes_type_check;
ALTER TABLE spin_prizes ADD CONSTRAINT spin_prizes_type_check
    CHECK (type IN ('percentage','fixed','free_shipping','try_again'));

-- 26.4 Order financial integrity (total / discount guards)
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_discount_le_subtotal;
ALTER TABLE orders ADD CONSTRAINT orders_discount_le_subtotal
    CHECK (discount <= subtotal + shipping);

-- 26.5 Newsletter email format guard (P33)
ALTER TABLE newsletter_subscribers DROP CONSTRAINT IF EXISTS newsletter_subscribers_email_check;
ALTER TABLE newsletter_subscribers ADD CONSTRAINT newsletter_subscribers_email_check
    CHECK (email ~* '^[^@]+@[^@]+\.[^@]+$');

-- 26.6 Drop the obsolete UUID overload of get_user_count (replaced by TEXT version)
DROP FUNCTION IF EXISTS get_user_count(uuid);

-- ============================================================================
-- HOW TO CREATE YOUR FIRST ADMIN  (Supabase Dashboard → SQL Editor)
--   UPDATE profiles SET role = 'admin'
--   WHERE email = 'your-admin@zahieg.com';
-- ============================================================================
-- VERIFY (optional):
--   SELECT table_name FROM information_schema.tables
--   WHERE table_schema = 'public' ORDER BY 1;
--   SELECT get_dashboard_data();