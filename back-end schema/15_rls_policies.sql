-- ============================================================================
-- ZAHIEG - Row Level Security (RLS) Policies
-- Applied to ALL tables after they are created
-- ============================================================================

-- ── Enable RLS on all tables ──────────────────────────────────────────────
ALTER TABLE IF EXISTS categories       ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS brands           ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS products         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS addresses        ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cart_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS wishlist_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS orders           ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS order_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reviews          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS coupons          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications    ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS spin_prizes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS spin_history     ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS testimonials     ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS back_in_stock_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS settings         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS recently_viewed  ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS recent_searches  ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS order_email_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 1. CATEGORIES – Public read, Admin write
-- ============================================================================
DROP POLICY IF EXISTS "categories_select" ON categories;
CREATE POLICY "categories_select" ON categories
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "categories_insert" ON categories;
CREATE POLICY "categories_insert" ON categories
    FOR INSERT WITH CHECK (is_admin());

DROP POLICY IF EXISTS "categories_update" ON categories;
CREATE POLICY "categories_update" ON categories
    FOR UPDATE USING (is_admin());

DROP POLICY IF EXISTS "categories_delete" ON categories;
CREATE POLICY "categories_delete" ON categories
    FOR DELETE USING (is_admin());

-- ============================================================================
-- 2. BRANDS – Public read, Admin write
-- ============================================================================
DROP POLICY IF EXISTS "brands_select" ON brands;
CREATE POLICY "brands_select" ON brands
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "brands_insert" ON brands;
CREATE POLICY "brands_insert" ON brands
    FOR INSERT WITH CHECK (is_admin());

DROP POLICY IF EXISTS "brands_update" ON brands;
CREATE POLICY "brands_update" ON brands
    FOR UPDATE USING (is_admin());

DROP POLICY IF EXISTS "brands_delete" ON brands;
CREATE POLICY "brands_delete" ON brands
    FOR DELETE USING (is_admin());

-- ============================================================================
-- 3. PRODUCTS – Public read, Admin write
-- ============================================================================
DROP POLICY IF EXISTS "products_select" ON products;
CREATE POLICY "products_select" ON products
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "products_insert" ON products;
CREATE POLICY "products_insert" ON products
    FOR INSERT WITH CHECK (is_admin());

DROP POLICY IF EXISTS "products_update" ON products;
CREATE POLICY "products_update" ON products
    FOR UPDATE USING (is_admin());

DROP POLICY IF EXISTS "products_delete" ON products;
CREATE POLICY "products_delete" ON products
    FOR DELETE USING (is_admin());

-- ============================================================================
-- 4. PROFILES – User reads/writes own, Admin reads/writes all
-- ============================================================================
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles
    FOR SELECT USING (id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles
    FOR INSERT WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles
    FOR UPDATE USING (id = auth.uid() OR is_admin());

-- ============================================================================
-- 5. ADDRESSES – User manages own, Admin manages all
-- ============================================================================
DROP POLICY IF EXISTS "addresses_select" ON addresses;
CREATE POLICY "addresses_select" ON addresses
    FOR SELECT USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "addresses_insert" ON addresses;
CREATE POLICY "addresses_insert" ON addresses
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "addresses_update" ON addresses;
CREATE POLICY "addresses_update" ON addresses
    FOR UPDATE USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "addresses_delete" ON addresses;
CREATE POLICY "addresses_delete" ON addresses
    FOR DELETE USING (user_id = auth.uid() OR is_admin());

-- ============================================================================
-- 6. CART ITEMS – User manages own only
-- ============================================================================
DROP POLICY IF EXISTS "cart_items_select" ON cart_items;
CREATE POLICY "cart_items_select" ON cart_items
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "cart_items_insert" ON cart_items;
CREATE POLICY "cart_items_insert" ON cart_items
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "cart_items_update" ON cart_items;
CREATE POLICY "cart_items_update" ON cart_items
    FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "cart_items_delete" ON cart_items;
CREATE POLICY "cart_items_delete" ON cart_items
    FOR DELETE USING (user_id = auth.uid());

-- ============================================================================
-- 7. WISHLIST ITEMS – User manages own only
-- ============================================================================
DROP POLICY IF EXISTS "wishlist_items_select" ON wishlist_items;
CREATE POLICY "wishlist_items_select" ON wishlist_items
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "wishlist_items_insert" ON wishlist_items;
CREATE POLICY "wishlist_items_insert" ON wishlist_items
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "wishlist_items_delete" ON wishlist_items;
CREATE POLICY "wishlist_items_delete" ON wishlist_items
    FOR DELETE USING (user_id = auth.uid());

-- ============================================================================
-- 8. ORDERS – User views own, Admin full access
-- ============================================================================
DROP POLICY IF EXISTS "orders_select" ON orders;
CREATE POLICY "orders_select" ON orders
    FOR SELECT USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "orders_insert" ON orders;
CREATE POLICY "orders_insert" ON orders
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "orders_update" ON orders;
CREATE POLICY "orders_update" ON orders
    FOR UPDATE USING (is_admin());

DROP POLICY IF EXISTS "orders_delete" ON orders;
CREATE POLICY "orders_delete" ON orders
    FOR DELETE USING (is_admin());

-- ============================================================================
-- 9. ORDER ITEMS – User views own, Admin full access
-- ============================================================================
DROP POLICY IF EXISTS "order_items_select" ON order_items;
CREATE POLICY "order_items_select" ON order_items
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
        OR is_admin()
    );

DROP POLICY IF EXISTS "order_items_insert" ON order_items;
CREATE POLICY "order_items_insert" ON order_items
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
        OR is_admin()
    );

-- ============================================================================
-- 10. REVIEWS – Public read, Authenticated insert, Admin full access
-- ============================================================================
DROP POLICY IF EXISTS "reviews_select" ON reviews;
CREATE POLICY "reviews_select" ON reviews
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "reviews_insert" ON reviews;
CREATE POLICY "reviews_insert" ON reviews
    FOR INSERT WITH CHECK (
        (user_id = auth.uid()) OR
        (user_id IS NULL) OR
        is_admin()
    );

DROP POLICY IF EXISTS "reviews_update" ON reviews;
CREATE POLICY "reviews_update" ON reviews
    FOR UPDATE USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "reviews_delete" ON reviews;
CREATE POLICY "reviews_delete" ON reviews
    FOR DELETE USING (is_admin());

-- ============================================================================
-- 11. COUPONS – Admin only (validation done server-side)
-- ============================================================================
DROP POLICY IF EXISTS "coupons_select" ON coupons;
CREATE POLICY "coupons_select" ON coupons
    FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "coupons_insert" ON coupons;
CREATE POLICY "coupons_insert" ON coupons
    FOR INSERT WITH CHECK (is_admin());

DROP POLICY IF EXISTS "coupons_update" ON coupons;
CREATE POLICY "coupons_update" ON coupons
    FOR UPDATE USING (is_admin());

DROP POLICY IF EXISTS "coupons_delete" ON coupons;
CREATE POLICY "coupons_delete" ON coupons
    FOR DELETE USING (is_admin());

-- ============================================================================
-- 12. NOTIFICATIONS – User reads/updates own, Admin full access
-- ============================================================================
DROP POLICY IF EXISTS "notifications_select" ON notifications;
CREATE POLICY "notifications_select" ON notifications
    FOR SELECT USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "notifications_update" ON notifications;
CREATE POLICY "notifications_update" ON notifications
    FOR UPDATE USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "notifications_insert" ON notifications;
CREATE POLICY "notifications_insert" ON notifications
    FOR INSERT WITH CHECK (is_admin());

DROP POLICY IF EXISTS "notifications_delete" ON notifications;
CREATE POLICY "notifications_delete" ON notifications
    FOR DELETE USING (is_admin());

-- ============================================================================
-- 13. SPIN PRIZES – Public read, Admin write
-- ============================================================================
DROP POLICY IF EXISTS "spin_prizes_select" ON spin_prizes;
CREATE POLICY "spin_prizes_select" ON spin_prizes
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "spin_prizes_insert" ON spin_prizes;
CREATE POLICY "spin_prizes_insert" ON spin_prizes
    FOR INSERT WITH CHECK (is_admin());

DROP POLICY IF EXISTS "spin_prizes_update" ON spin_prizes;
CREATE POLICY "spin_prizes_update" ON spin_prizes
    FOR UPDATE USING (is_admin());

DROP POLICY IF EXISTS "spin_prizes_delete" ON spin_prizes;
CREATE POLICY "spin_prizes_delete" ON spin_prizes
    FOR DELETE USING (is_admin());

-- ============================================================================
-- 14. SPIN HISTORY – User views own, inserts own, Admin all
-- ============================================================================
DROP POLICY IF EXISTS "spin_history_select" ON spin_history;
CREATE POLICY "spin_history_select" ON spin_history
    FOR SELECT USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "spin_history_insert" ON spin_history;
CREATE POLICY "spin_history_insert" ON spin_history
    FOR INSERT WITH CHECK (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "spin_history_update" ON spin_history;
CREATE POLICY "spin_history_update" ON spin_history
    FOR UPDATE USING (user_id = auth.uid() OR is_admin());

-- ============================================================================
-- 15. TESTIMONIALS – Public read, Admin write
-- ============================================================================
DROP POLICY IF EXISTS "testimonials_select" ON testimonials;
CREATE POLICY "testimonials_select" ON testimonials
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "testimonials_insert" ON testimonials;
CREATE POLICY "testimonials_insert" ON testimonials
    FOR INSERT WITH CHECK (is_admin());

DROP POLICY IF EXISTS "testimonials_update" ON testimonials;
CREATE POLICY "testimonials_update" ON testimonials
    FOR UPDATE USING (is_admin());

DROP POLICY IF EXISTS "testimonials_delete" ON testimonials;
CREATE POLICY "testimonials_delete" ON testimonials
    FOR DELETE USING (is_admin());

-- ============================================================================
-- 16. NEWSLETTER SUBSCRIBERS – Anyone can insert, Admin reads/deletes
-- ============================================================================
DROP POLICY IF EXISTS "newsletter_subscribers_insert" ON newsletter_subscribers;
CREATE POLICY "newsletter_subscribers_insert" ON newsletter_subscribers
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "newsletter_subscribers_select" ON newsletter_subscribers;
CREATE POLICY "newsletter_subscribers_select" ON newsletter_subscribers
    FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "newsletter_subscribers_delete" ON newsletter_subscribers;
CREATE POLICY "newsletter_subscribers_delete" ON newsletter_subscribers
    FOR DELETE USING (is_admin());

-- ============================================================================
-- 17. CONTACT MESSAGES – Anyone can insert, Admin reads/deletes
-- ============================================================================
DROP POLICY IF EXISTS "contact_messages_insert" ON contact_messages;
CREATE POLICY "contact_messages_insert" ON contact_messages
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "contact_messages_select" ON contact_messages;
CREATE POLICY "contact_messages_select" ON contact_messages
    FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "contact_messages_update" ON contact_messages;
CREATE POLICY "contact_messages_update" ON contact_messages
    FOR UPDATE USING (is_admin());

DROP POLICY IF EXISTS "contact_messages_delete" ON contact_messages;
CREATE POLICY "contact_messages_delete" ON contact_messages
    FOR DELETE USING (is_admin());

-- ============================================================================
-- 18. BACK-IN-STOCK REQUESTS – Anyone can insert, Admin reads/updates
-- ============================================================================
DROP POLICY IF EXISTS "back_in_stock_requests_insert" ON back_in_stock_requests;
CREATE POLICY "back_in_stock_requests_insert" ON back_in_stock_requests
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "back_in_stock_requests_select" ON back_in_stock_requests;
CREATE POLICY "back_in_stock_requests_select" ON back_in_stock_requests
    FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "back_in_stock_requests_update" ON back_in_stock_requests;
CREATE POLICY "back_in_stock_requests_update" ON back_in_stock_requests
    FOR UPDATE USING (is_admin());

-- ============================================================================
-- 19. SETTINGS – Public read, Admin write
-- ============================================================================
DROP POLICY IF EXISTS "settings_select" ON settings;
CREATE POLICY "settings_select" ON settings
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "settings_insert" ON settings;
CREATE POLICY "settings_insert" ON settings
    FOR INSERT WITH CHECK (is_admin());

DROP POLICY IF EXISTS "settings_update" ON settings;
CREATE POLICY "settings_update" ON settings
    FOR UPDATE USING (is_admin());

DROP POLICY IF EXISTS "settings_delete" ON settings;
CREATE POLICY "settings_delete" ON settings
    FOR DELETE USING (is_admin());

-- ============================================================================
-- 20. RECENTLY VIEWED – User manages own only
-- ============================================================================
DROP POLICY IF EXISTS "recently_viewed_select" ON recently_viewed;
CREATE POLICY "recently_viewed_select" ON recently_viewed
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "recently_viewed_insert" ON recently_viewed;
CREATE POLICY "recently_viewed_insert" ON recently_viewed
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "recently_viewed_delete" ON recently_viewed;
CREATE POLICY "recently_viewed_delete" ON recently_viewed
    FOR DELETE USING (user_id = auth.uid());

-- ============================================================================
-- 21. RECENT SEARCHES – User manages own only
-- ============================================================================
DROP POLICY IF EXISTS "recent_searches_select" ON recent_searches;
CREATE POLICY "recent_searches_select" ON recent_searches
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "recent_searches_insert" ON recent_searches;
CREATE POLICY "recent_searches_insert" ON recent_searches
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "recent_searches_update" ON recent_searches;
CREATE POLICY "recent_searches_update" ON recent_searches
    FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "recent_searches_delete" ON recent_searches;
CREATE POLICY "recent_searches_delete" ON recent_searches
    FOR DELETE USING (user_id = auth.uid());

-- ============================================================================
-- 22. ORDER EMAIL LOGS – Admin only (internal logging table)
-- ============================================================================
DROP POLICY IF EXISTS "order_email_logs_select" ON order_email_logs;
CREATE POLICY "order_email_logs_select" ON order_email_logs
    FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "order_email_logs_insert" ON order_email_logs;
CREATE POLICY "order_email_logs_insert" ON order_email_logs
    FOR INSERT WITH CHECK (is_admin());
