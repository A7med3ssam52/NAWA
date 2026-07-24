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
('cat-1', 'رجالى', 'men', 'https://picsum.photos/seed/men/400/400', 'Shirt', 1),
('cat-2', 'حريمى', 'women', 'https://picsum.photos/seed/women/400/400', 'Dress', 1);

-- ─── Brands ───
INSERT INTO brands (id, name, slug, logo, products_count) VALUES
('brand-1', 'ZARA', 'zara', 'https://picsum.photos/seed/zara/200/100', 1),
('brand-2', 'H&M', 'hm', 'https://picsum.photos/seed/hm/200/100', 0),
('brand-3', 'Nike', 'nike', 'https://picsum.photos/seed/nike/200/100', 0),
('brand-4', 'Adidas', 'adidas', 'https://picsum.photos/seed/adidas/200/100', 0),
('brand-5', 'Gucci', 'gucci', 'https://picsum.photos/seed/gucci/200/100', 0),
('brand-6', 'Puma', 'puma', 'https://picsum.photos/seed/puma/200/100', 1),
('brand-7', 'Samsung', 'samsung', 'https://picsum.photos/seed/samsung/200/100', 0),
('brand-8', 'Apple', 'apple', 'https://picsum.photos/seed/apple/200/100', 0);

-- ─── Products (sample - add all from products.json) ───
INSERT INTO products (id, name, slug, description, short_description, price, old_price, discount, images, category, brand, rating, reviews_count, stock, sku, specifications, tags, is_new, is_featured, created_at) VALUES
('prod-1', 'تيشيرت قطن رجالي', 'mens-1', 'ملابس رجالية عالية الجودة. تيشيرت قطن رجالي بتصميم عصري وأنيق مناسب لجميع الأذواق.', 'تيشيرت قطن رجالي - ملابس رجالية عالية الجودة', 840, 1075, 28, '{https://loremflickr.com/600/600/mens,cloth,shirt?lock=10,https://loremflickr.com/600/600/mens,cloth,shirt?lock=11}', 'cat-1', 'brand-6', 4.5, 312, 164, '10001', '[{"label":"المادة","value":"قطن 100%"}]', '{رجالي,ملابس,موضة,أزياء}', true, true, '2026-07-24T21:00:00Z'),
('prod-2', 'فستان ماكسي حريمي', 'womens-1', 'فستان ماكسي حريمي أنيق بتصميم عصري وجذاب. مصنوع من خامات عالية الجودة توفر أقصى درجات الراحة والأناقة.', 'فستان ماكسي حريمي - أناقة وراحة في تصميم واحد', 1250, 1600, 22, '{https://loremflickr.com/600/600/women,dress,cloth?lock=20,https://loremflickr.com/600/600/women,dress,cloth?lock=21}', 'cat-2', 'brand-1', 4.3, 89, 45, '10002', '[{"label":"المادة","value":"مزيج قطن وبوليستر"},{"label":"المقاسات","value":"S - 3XL"},{"label":"الألوان","value":"بيج، أسود، كحلي"},{"label":"الجنس","value":"حريمي"},{"label":"الطول","value":"ماكسي (طويل)"}]', '{حريمي,ملابس,فستان,موضة,أزياء}', true, true, '2026-07-24T21:00:00Z');

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
