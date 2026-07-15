-- ============================================================================
-- ZAHIEG - Dashboard Views
-- Pre-computed aggregations for admin and user dashboards
-- ============================================================================

-- ── View 1: Dashboard Quick Stats ─────────────────────────────────────────
-- Single-row view with all summary statistics
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT
    (SELECT COUNT(*) FROM products)::INTEGER AS total_products,
    (SELECT COUNT(*) FROM orders)::INTEGER AS total_orders,
    (SELECT COALESCE(SUM(total), 0) FROM orders)::NUMERIC(12,2) AS total_revenue,
    (SELECT COUNT(*) FROM profiles)::INTEGER AS total_users,
    (SELECT COUNT(*) FROM brands)::INTEGER AS total_brands,
    (SELECT COUNT(*) FROM categories)::INTEGER AS total_categories,
    (SELECT COUNT(*) FROM coupons)::INTEGER AS total_coupons,
    (SELECT COUNT(*) FROM orders WHERE status = 'pending')::INTEGER AS pending_orders,
    (SELECT COUNT(*) FROM products WHERE stock < 10)::INTEGER AS low_stock_products,
    NOW()::TIMESTAMPTZ AS calculated_at;

COMMENT ON VIEW dashboard_stats IS 'Single-row summary statistics for admin dashboard cards';

-- ── View 2: Monthly Revenue ───────────────────────────────────────────────
CREATE OR REPLACE VIEW monthly_revenue AS
SELECT
    DATE_TRUNC('month', created_at)::DATE AS month_date,
    TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month_key,
    COUNT(*)::INTEGER AS orders_count,
    COALESCE(SUM(total), 0)::NUMERIC(12,2) AS revenue
FROM orders
WHERE status != 'cancelled'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month_date DESC;

COMMENT ON VIEW monthly_revenue IS 'Monthly revenue and order count for revenue charts';

-- ── View 3: Order Status Distribution ────────────────────────────────────
CREATE OR REPLACE VIEW order_status_distribution AS
SELECT
    status::TEXT,
    COUNT(*)::INTEGER AS count
FROM orders
GROUP BY status
ORDER BY count DESC;

COMMENT ON VIEW order_status_distribution IS 'Count of orders per status for pie/donut charts';

-- ── View 4: Category Distribution ─────────────────────────────────────────
CREATE OR REPLACE VIEW category_distribution AS
SELECT
    c.id,
    c.name,
    COUNT(p.id)::INTEGER AS products_count
FROM categories c
LEFT JOIN products p ON p.category_id = c.id
GROUP BY c.id, c.name
ORDER BY products_count DESC;

COMMENT ON VIEW category_distribution IS 'Product count per category for distribution charts';

-- ── View 5: Top Products ──────────────────────────────────────────────────
CREATE OR REPLACE VIEW top_products AS
SELECT
    id,
    name,
    slug,
    price,
    images,
    rating,
    reviews_count,
    stock,
    is_featured
FROM products
ORDER BY reviews_count DESC, rating DESC
LIMIT 10;

COMMENT ON VIEW top_products IS 'Top 10 products by reviews count and rating';

-- ── View 6: Recent Orders ─────────────────────────────────────────────────
CREATE OR REPLACE VIEW recent_orders AS
SELECT
    o.id,
    o.order_number,
    o.status,
    o.total,
    o.created_at,
    p.name AS customer_name
FROM orders o
LEFT JOIN profiles p ON p.id = o.user_id
ORDER BY o.created_at DESC
LIMIT 10;

COMMENT ON VIEW recent_orders IS 'Last 10 orders with customer name for dashboard table';

-- ── View 7: Low Stock Products ────────────────────────────────────────────
CREATE OR REPLACE VIEW low_stock_products AS
SELECT
    id,
    name,
    slug,
    stock,
    price,
    images[1] AS primary_image
FROM products
WHERE stock < 10 AND stock > 0
ORDER BY stock ASC;

COMMENT ON VIEW low_stock_products IS 'Products with stock below 10 units (excluding out-of-stock)';

-- ── View 8: Out of Stock Products ─────────────────────────────────────────
CREATE OR REPLACE VIEW out_of_stock_products AS
SELECT
    id,
    name,
    slug,
    stock,
    price,
    images[1] AS primary_image
FROM products
WHERE stock = 0
ORDER BY name ASC;

COMMENT ON VIEW out_of_stock_products IS 'Products with zero stock for restock planning';

-- ── View 9: Brand Distribution ────────────────────────────────────────────
CREATE OR REPLACE VIEW brand_distribution AS
SELECT
    b.id,
    b.name,
    COUNT(p.id)::INTEGER AS products_count
FROM brands b
LEFT JOIN products p ON p.brand_id = b.id
GROUP BY b.id, b.name
ORDER BY products_count DESC;

COMMENT ON VIEW brand_distribution IS 'Product count per brand for distribution analysis';

-- ── View 10: User Sales Summary ───────────────────────────────────────────
CREATE OR REPLACE VIEW user_sales_summary AS
SELECT
    p.id AS user_id,
    p.name,
    p.email,
    COUNT(o.id)::INTEGER AS total_orders,
    COALESCE(SUM(o.total), 0)::NUMERIC(12,2) AS total_spent,
    COALESCE(AVG(o.total), 0)::NUMERIC(10,2) AS avg_order_value,
    MAX(o.created_at) AS last_order_date,
    MIN(o.created_at) AS first_order_date
FROM profiles p
LEFT JOIN orders o ON o.user_id = p.id
GROUP BY p.id, p.name, p.email
ORDER BY total_spent DESC;

COMMENT ON VIEW user_sales_summary IS 'Customer lifetime value and order statistics';

-- ── Function: Get all dashboard data in one call ──────────────────────────
CREATE OR REPLACE FUNCTION get_dashboard_data()
RETURNS JSONB AS $$
DECLARE
    v_stats JSONB;
    v_monthly_revenue JSONB;
    v_order_statuses JSONB;
    v_top_products JSONB;
    v_recent_orders JSONB;
    v_low_stock JSONB;
BEGIN
    SELECT row_to_json(ds.*)::jsonb INTO v_stats FROM dashboard_stats ds;

    SELECT COALESCE(jsonb_agg(mr.* ORDER BY mr.month_date DESC), '[]'::jsonb)
    INTO v_monthly_revenue FROM monthly_revenue mr;

    SELECT COALESCE(jsonb_agg(osd.*), '[]'::jsonb)
    INTO v_order_statuses FROM order_status_distribution osd;

    SELECT COALESCE(jsonb_agg(tp.*), '[]'::jsonb)
    INTO v_top_products FROM top_products tp;

    SELECT COALESCE(jsonb_agg(ro.*), '[]'::jsonb)
    INTO v_recent_orders FROM recent_orders ro;

    SELECT COALESCE(jsonb_agg(ls.*), '[]'::jsonb)
    INTO v_low_stock FROM low_stock_products ls;

    RETURN jsonb_build_object(
        'stats',              v_stats,
        'monthly_revenue',    v_monthly_revenue,
        'order_statuses',     v_order_statuses,
        'top_products',       v_top_products,
        'recent_orders',      v_recent_orders,
        'low_stock_products', v_low_stock
    );
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_dashboard_data IS 'Returns all dashboard data as a single JSON object for efficient frontend loading';
