-- ZAHIEG Seed Data
-- Run this AFTER supabase-schema.sql in the Supabase SQL Editor

-- ─── Profiles ───
-- Note: profiles are linked to auth.users. Create auth users first via Dashboard > Authentication > Users
-- Then insert profiles with matching auth_id.
-- For kiady@zahieg.com / 123456, create the user in Dashboard > Authentication > Add User
-- Then run: INSERT INTO profiles (auth_id, name, email, phone, avatar, addresses, orders, wishlist, notifications)
-- VALUES ('THE-AUTH-UUID', 'Kiady Zahi', 'kiady@zahieg.com', '+201000000000', 'https://ui-avatars.com/api/?name=Kiady+Zahi&background=2563EB&color=fff', '{}', '{}', '{}', '{}');

INSERT INTO profiles (id, name, email, phone, avatar, addresses, orders, wishlist, notifications) VALUES
('user-1', 'محمد الكيادي', 'ahmed@example.com', '+201234567890', 'https://picsum.photos/seed/avatar1/200/200', '{addr-1,addr-2}', '{ord-1,ord-3}', '{prod-5,prod-14,prod-22}', '{notif-1,notif-2,notif-3}'),
('user-2', 'محمد الكيادي', 'sara@example.com', '+201098765432', 'https://picsum.photos/seed/avatar2/200/200', '{addr-3}', '{ord-2}', '{prod-2,prod-9,prod-19}', '{notif-4,notif-5}');

-- ─── Categories ───
INSERT INTO categories (id, name, slug, image, icon, products_count) VALUES
('cat-1', 'ملابس رجالي', 'mens-clothing', 'https://picsum.photos/seed/men/400/400', 'Shirt', 12),
('cat-2', 'ملابس حريمي', 'womens-clothing', 'https://picsum.photos/seed/women/400/400', 'Shirt', 8),
('cat-3', 'أحذية', 'shoes', 'https://picsum.photos/seed/shoes/400/400', 'Footprints', 5),
('cat-4', 'إكسسوارات', 'accessories', 'https://picsum.photos/seed/accessories/400/400', 'Watch', 4),
('cat-5', 'شنط', 'bags', 'https://picsum.photos/seed/bags/400/400', 'ShoppingBag', 3),
('cat-6', 'عطور', 'perfumes', 'https://picsum.photos/seed/perfumes/400/400', 'Zap', 3),
('cat-7', 'ساعات', 'watches', 'https://picsum.photos/seed/watches/400/400', 'Clock', 2),
('cat-8', 'إلكترونيات', 'electronics', 'https://picsum.photos/seed/electronics/400/400', 'Smartphone', 2),
('cat-9', 'مكياج', 'makeup', 'https://picsum.photos/seed/makeup/400/400', 'Palette', 2);

-- ─── Brands ───
INSERT INTO brands (id, name, slug, logo, products_count) VALUES
('brand-1', 'ZARA', 'zara', 'https://picsum.photos/seed/zara/200/100', 6),
('brand-2', 'H&M', 'hm', 'https://picsum.photos/seed/hm/200/100', 5),
('brand-3', 'Nike', 'nike', 'https://picsum.photos/seed/nike/200/100', 4),
('brand-4', 'Adidas', 'adidas', 'https://picsum.photos/seed/adidas/200/100', 3),
('brand-5', 'Gucci', 'gucci', 'https://picsum.photos/seed/gucci/200/100', 3),
('brand-6', 'Puma', 'puma', 'https://picsum.photos/seed/puma/200/100', 2),
('brand-7', 'Samsung', 'samsung', 'https://picsum.photos/seed/samsung/200/100', 2),
('brand-8', 'Apple', 'apple', 'https://picsum.photos/seed/apple/200/100', 2);

-- ─── Products (sample - add all from products.json) ───
INSERT INTO products (id, name, slug, description, short_description, price, old_price, discount, images, category, brand, rating, reviews_count, stock, sku, specifications, tags, is_new, is_featured, created_at) VALUES
('prod-1', 'تيشيرت قطن رجالي', 'mens-cotton-tshirt', 'تيشيرت قطن عالي الجودة مناسب للارتداء اليومي', 'تيشيرت قطن مريح', 299, 399, 25, '{https://picsum.photos/seed/prod1a/600/600,https://picsum.photos/seed/prod1b/600/600}', 'cat-1', 'brand-1', 4.5, 128, 50, 'TCH-001', '[{"label":"المادة","value":"قطن 100%"}]', '{تيشيرت,قطن,رجالي}', true, true, '2025-01-15T00:00:00Z'),
('prod-2', 'فستان صيفي', 'summer-dress', 'فستان صيفي أنيق بقصة مريحة', 'فستان صيفي أنيق', 549, 699, 21, '{https://picsum.photos/seed/prod2a/600/600,https://picsum.photos/seed/prod2b/600/600}', 'cat-2', 'brand-2', 4.3, 89, 30, 'DRS-001', '[{"label":"المادة","value":"بوليستر"}]', '{فستان,صيفي,حريمي}', true, true, '2025-02-01T00:00:00Z'),
('prod-3', 'حذاء رياضي', 'running-shoes', 'حذاء رياضي مريح للجري والتمارين', 'حذاء رياضي مريح', 899, 1199, 25, '{https://picsum.photos/seed/prod3a/600/600,https://picsum.photos/seed/prod3b/600/600}', 'cat-3', 'brand-3', 4.7, 256, 20, 'SHO-001', '[{"label":"المادة","value":"جلد+قماش"}]', '{حذاء,رياضي,نيوك,رجالي}', false, true, '2025-01-10T00:00:00Z'),
('prod-4', 'ساعة أنيقة', 'elegant-watch', 'ساعة أنيقة بسوار من الستانلس ستيل', 'ساعة أنيقة', 1299, 1599, 19, '{https://picsum.photos/seed/prod4a/600/600,https://picsum.photos/seed/prod4b/600/600}', 'cat-7', 'brand-5', 4.6, 67, 15, 'WAT-001', '[{"label":"النوع","value":"ساعة يد"}]', '{ساعة,أنيقة,رجالي}', false, true, '2025-02-15T00:00:00Z');

-- ─── Coupons ───
INSERT INTO coupons (id, code, discount, type, min_order, max_discount, expires_at, usage_limit, used_count) VALUES
('coup-1', 'WELCOME10', 10, 'percentage', 0, 100, '2026-12-31T00:00:00Z', 1000, 45),
('coup-2', 'ZAHI20', 20, 'percentage', 500, 200, '2026-06-30T00:00:00Z', 500, 128),
('coup-3', 'SALE50', 50, 'fixed', 300, 50, '2026-03-31T00:00:00Z', 200, 67),
('coup-4', 'FREESHIP', 100, 'percentage', 200, 30, '2026-09-30T00:00:00Z', 300, 89);

-- ─── Addresses ───
INSERT INTO addresses (id, user_id, label, full_name, phone, street, city, state, is_default) VALUES
('addr-1', 'user-1', 'المنزل', 'أحمد محمد', '+201234567890', 'شارع النيل', 'القاهرة', 'القاهرة', true),
('addr-2', 'user-1', 'العمل', 'أحمد محمد', '+201234567890', 'شارع التحرير', 'الجيزة', 'الجيزة', false),
('addr-3', 'user-2', 'المنزل', 'سارة أحمد', '+201098765432', 'شارع البحر', 'الإسكندرية', 'الإسكندرية', true);

-- ─── Spin Prizes ───
INSERT INTO spin_prizes (id, label, type, value, coupon_code, color, weight, is_active) VALUES
('spin-1', 'خصم 10%', 'percentage', 10, NULL, '#22C55E', 20, true),
('spin-2', 'خصم 20%', 'percentage', 20, NULL, '#3B82F6', 15, true),
('spin-3', 'خصم 30%', 'percentage', 30, NULL, '#8B5CF6', 10, true),
('spin-4', 'خصم 50%', 'percentage', 50, NULL, '#F59E0B', 5, true),
('spin-5', 'خصم 70%', 'percentage', 70, NULL, '#EF4444', 3, true),
('spin-6', 'شحن مجاني', 'freeShipping', NULL, NULL, '#06B6D4', 12, true),
('spin-7', '50 جنيه كاش', 'fixed', 50, NULL, '#EC4899', 8, true),
('spin-8', '100 جنيه كاش', 'fixed', 100, NULL, '#F97316', 5, true),
('spin-9', 'حظ أوفر', 'tryAgain', NULL, NULL, '#6B7280', 17, true),
('spin-10', '200 جنيه كاش', 'fixed', 200, NULL, '#E11D48', 5, true);

-- ─── Testimonials ───
INSERT INTO testimonials (id, name, avatar, rating, comment, role) VALUES
('test-1', 'أحمد علي', 'https://picsum.photos/seed/t1/200/200', 5, 'منتجات رائعة وجودة ممتازة. أنصح الجميع بالتسوق من هنا!', 'عميل مميز'),
('test-2', 'سارة محمد', 'https://picsum.photos/seed/t2/200/200', 5, 'التوصيل سريع جداً والتغليف جميل. تجربة تسوق رائعة.', 'عميلة'),
('test-3', 'محمد حسن', 'https://picsum.photos/seed/t3/200/200', 4, 'جودة المنتجات ممتازة والاسعار مناسبة. سعيد بالتجربة.', 'عميل'),
('test-4', 'نورا أحمد', 'https://picsum.photos/seed/t4/200/200', 5, 'أفضل متجر إلكتروني في مصر. تشكيلة واسعة وجودة عالية.', 'عميلة مميزة'),
('test-5', 'خالد يوسف', 'https://picsum.photos/seed/t5/200/200', 5, 'خدمة عملاء ممتازة ومنتجات أصلية. تجربة شراء لا تنسى.', 'عميل');
