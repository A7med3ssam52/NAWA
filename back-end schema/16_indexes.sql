-- ============================================================================
-- ZAHIEG - Database Indexes
-- Performance optimization for common queries
-- ============================================================================

-- ── Products ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_products_category_id    ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand_id       ON products(brand_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug    ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_created_at     ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_price          ON products(price);

-- Partial indexes for filtered queries
CREATE INDEX IF NOT EXISTS idx_products_featured       ON products(id) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_products_new            ON products(id) WHERE is_new = true;
CREATE INDEX IF NOT EXISTS idx_products_discounted     ON products(id) WHERE discount IS NOT NULL AND discount > 0;
CREATE INDEX IF NOT EXISTS idx_products_low_stock      ON products(id) WHERE stock < 10;

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_products_search         ON products USING GIN(search_vector);

-- ── Orders ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_orders_user_id          ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status           ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at       ON orders(created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_number    ON orders(order_number);

-- ── Order Items ───────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_order_items_order_id    ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id  ON order_items(product_id);

-- ── Cart Items ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id      ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id   ON cart_items(product_id);

-- ── Wishlist Items ────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_wishlist_items_user_id    ON wishlist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_product_id ON wishlist_items(product_id);

-- ── Reviews ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_reviews_product_id      ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id         ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at      ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_rating          ON reviews(rating DESC);

-- ── Notifications ─────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_notifications_user_id   ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread    ON notifications(user_id) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- ── Addresses ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_addresses_user_id       ON addresses(user_id);

-- ── Spin History ──────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_spin_history_user_id    ON spin_history(user_id);
CREATE INDEX IF NOT EXISTS idx_spin_history_spun_at    ON spin_history(spun_at DESC);

-- ── Back-In-Stock Requests ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_back_in_stock_product   ON back_in_stock_requests(product_id);
CREATE INDEX IF NOT EXISTS idx_back_in_stock_notified  ON back_in_stock_requests(product_id) WHERE notified = false;

-- ── Recently Viewed ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_recently_viewed_user    ON recently_viewed(user_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_recently_viewed_product ON recently_viewed(product_id);

-- ── Recent Searches ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_recent_searches_user    ON recent_searches(user_id, created_at DESC);

-- ── Contact Messages ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_contact_messages_read   ON contact_messages(read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_contact_messages_created ON contact_messages(created_at DESC);

-- ── Settings ─────────────────────────────────────────────────────────────
-- Only primary key needed (simple key-value table)

-- ── Coupons ───────────────────────────────────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS idx_coupons_code     ON coupons(UPPER(code));
