# 📋 NAWA — خريطة كاملة لجميع الإجراءات (Actions) والبيانات

## 🎯 الهدف
توثيق كل إجراء في التطبيق، مصدر البيانات الحالي، ومستقبلاً مع Supabase.

---

## 1. 🔐 AUTHENTICATION — تسجيل الدخول والتسجيل

| الإجراء | أين يحدث | الداتا الحالية (localStorage) | بعد Supabase (جداول) |
|---------|---------|------------------------------|---------------------|
| تسجيل جديد (Register) | `AuthContext.tsx:137`, `LoginPage.tsx` | `localStorage('registeredUsers')` | **WRITE**: `auth.users` (Supabase Auth signUp) → Trigger → `profiles` |
| تسجيل دخول (Login) | `AuthContext.tsx:96`, `LoginPage.tsx` | `localStorage('auth')` | **READ/VERIFY**: Supabase Auth signInWithPassword |
| تسجيل خروج (Logout) | `AuthContext.tsx:163`, `AdminLayout.tsx` | يحذف `localStorage('auth')` | **CALL**: Supabase Auth signOut |
| تعديل البروفايل | `ProfilePage.tsx`, `AuthContext.tsx:165` | `localStorage('auth')` | **UPDATE**: `profiles` WHERE id = auth.uid() |
| تغيير كلمة السر | `LoginPage.tsx` (fake) | لا شيء | **CALL**: Supabase Auth updatePassword |
| forgot password | `LoginPage.tsx` (placeholder) | لا شيء | **CALL**: Supabase Auth resetPasswordForEmail |

**جداول Supabase**: `auth.users` (Supabase Auth), `profiles`

---

## 2. 🏠 HOME PAGE — الصفحة الرئيسية

| الإجراء | المكوّن | الداتا الحالية | بعد Supabase |
|---------|--------|---------------|-------------|
| عرض المنتجات المميزة | `HomePage.tsx` → `useFeaturedProducts()` | `@/data` → `products.json` | **READ**: `products` WHERE is_featured = true |
| عرض أحدث المنتجات | `HomePage.tsx` → `useNewProducts()` | `@/data` → `products.json` | **READ**: `products` WHERE is_new = true |
| عرض الأكثر مبيعاً | `HomePage.tsx` → `useBestSellingProducts()` | `@/data` → sort by reviewsCount | **READ**: `products` ORDER BY reviews_count DESC LIMIT 8 |
| عرض المنتجات المخفضة | `HomePage.tsx` → `useDiscountedProducts()` | `@/data` → `products.json` | **READ**: `products` WHERE discount > 0 |
| عرض التصنيفات | `HomePage.tsx` | `@/data` → `categories.json` | **READ**: `categories` |
| عرض الماركات | `HomePage.tsx` | `@/data` → `brands.json` | **READ**: `brands` |
| عرض آراء العملاء | `HomePage.tsx` | `@/data` → `testimonials.json` | **READ**: `testimonials` |
| عرض المنتجات الأخيرة | `HomePage.tsx` → `useRecentlyViewed()` | `localStorage('recently_viewed')` | **READ**: `recently_viewed` WHERE user_id = auth.uid() |
| الاشتراك في النشرة البريدية | `NewsletterSection.tsx` (WhatsApp حالياً) | لا شيء (redirect) | **WRITE**: `newsletter_subscribers` (email) |

**جداول Supabase**: `products`, `categories`, `brands`, `testimonials`, `recently_viewed`, `newsletter_subscribers`

---

## 3. 🛍️ PRODUCTS — المنتجات والتصفح

| الإجراء | المكوّن | الداتا الحالية | بعد Supabase |
|---------|--------|---------------|-------------|
| عرض قائمة المنتجات (مع فلتر) | `ProductsPage.tsx` → `useProducts(filters)` | `@/data` → `filterProducts()` | **READ**: `products` WHERE filters... PLUS search_vector @@ query |
| الفلترة (سعر، تقييم، تصنيف...) | `FilterSidebar.tsx`, `ProductsPage.tsx` | client-side filtering | **READ**: `products` + `categories` + `brands` مع WHERE conditions |
| الترتيب (السعر، التقييم، الأحدث) | `ProductsPage.tsx` | client-side sort | **READ**: `products` ORDER BY clause |
| عرض صفحة منتج واحد | `ProductDetailsPage.tsx` → `useProduct(slug)` | `@/data` → `getProductBySlug()` | **READ**: `products` WHERE slug = ? |
| عرض منتجات مشابهة | `ProductDetailsPage.tsx` → `useRelatedProducts(id)` | `@/data` → filter by category | **READ**: `products` WHERE category_id = ? AND id != ? LIMIT 8 |
| عرض التقييمات | `ProductDetailsPage.tsx` | `@/data` → `reviews.json` | **READ**: `reviews` WHERE product_id = ? ORDER BY created_at DESC |
| البحث (Search) | `SearchPage.tsx`, `SearchSuggestions.tsx` | `@/data` → filter by name/tags | **READ**: `products` WHERE search_vector @@ plainto_tsquery(?) |
| اقتراحات البحث | `SearchSuggestions.tsx` | `@/data` (products, categories, brands) | **READ**: `products` LIMIT 5 + `categories` LIMIT 3 + `brands` LIMIT 3 |
| البحث الحديث | `SearchSuggestions.tsx` | `localStorage('recent-searches')` | **READ/WRITE**: `recent_searches` (اختياري) |
| عرض المقارنة | `ComparePage.tsx` | `localStorage('compare_items')` | **READ**: `products` WHERE id IN (...) |

**جداول Supabase**: `products`, `categories`, `brands`, `reviews`, `recent_searches`

---

## 4. 🛒 CART & CHECKOUT — عربة التسوق والدفع

| الإجراء | المكوّن | الداتا الحالية | بعد Supabase |
|---------|--------|---------------|-------------|
| إضافة إلى العربة | `ProductCard.tsx`, `ProductDetailsPage.tsx` → `useCart().addItem()` | `localStorage('cart')` | **WRITE**: `cart_items` (INSERT ON CONFLICT UPDATE quantity) |
| تعديل الكمية | `CartItem.tsx`, `CartPage.tsx` → `updateQuantity()` | `localStorage('cart')` | **UPDATE**: `cart_items` SET quantity = ? |
| حذف من العربة | `CartItem.tsx` → `removeItem()` | `localStorage('cart')` | **DELETE**: `cart_items` WHERE id = ? |
| مسح العربة | `CartContext.tsx` → `clearCart()` | `localStorage('cart')` | **DELETE**: `cart_items` WHERE user_id = auth.uid() |
| إضافة كوبون | `CartPage.tsx`, `CheckoutPage.tsx` → `getCouponByCode()` | `@/data` → `coupons.json` | **READ**: `validate_coupon(code, total)` function |
| إتمام الطلب (Place Order) | `CheckoutPage.tsx:70` | `crypto.randomUUID()` + `localStorage('order_emails')` | **WRITE**: `orders` + `order_items` (ضمن transaction) |
| اختيار طريقة الدفع | `CheckoutPage.tsx` | Local state | **STORED IN**: `orders.payment_method` |
| إدخال عنوان الشحن | `CheckoutPage.tsx` | Local state + form | **STORED IN**: `orders.shipping_address` (JSONB snapshot) |
| تأكيد الطلب (Email log) | `CheckoutPage.tsx:74-76` | `localStorage('order_emails')` | **WRITE**: `order_email_logs` |
| الصفحة بعد الطلب | `OrderSuccessPage.tsx` | `@/data` → `getOrderById()` | **READ**: `orders` WHERE id = ? |

**جداول Supabase**: `cart_items`, `coupons`, `orders`, `order_items`, `order_email_logs`

---

## 5. 💖 WISHLIST — المفضلة

| الإجراء | المكوّن | الداتا الحالية | بعد Supabase |
|---------|--------|---------------|-------------|
| إضافة/إزالة من المفضلة | `ProductCard.tsx`, `ProductDetailsPage.tsx` → `toggleItem()` | `localStorage('wishlist')` | **WRITE**: `wishlist_items` INSERT / DELETE |
| عرض المفضلة | `WishlistPage.tsx` | `localStorage('wishlist')` | **READ**: `wishlist_items` JOIN `products` WHERE user_id = auth.uid() |
| معرفة هل في المفضلة | أي مكان → `isInWishlist(id)` | `localStorage('wishlist')` | **READ**: `wishlist_items` WHERE user_id = auth.uid() AND product_id = ? |

**جداول Supabase**: `wishlist_items`

---

## 6. 📦 ORDERS — الطلبات

| الإجراء | المكوّن | الداتا الحالية | بعد Supabase |
|---------|--------|---------------|-------------|
| عرض طلباتي | `MyOrdersPage.tsx` → `getUserOrders(userId)` | `@/data` → `orders.json` | **READ**: `orders` WHERE user_id = auth.uid() ORDER BY created_at DESC |
| عرض تفاصيل الطلب | `OrderDetailsPage.tsx` → `getOrderById()` | `@/data` → `orders.json` | **READ**: `orders` + `order_items` WHERE order_id = ? |
| عرض الفاتورة | `InvoicePage.tsx` → `getOrderById()` | `@/data` → `orders.json` | **READ**: `orders` + `order_items` |
| تتبع الطلب (Tracking) | `OrderDetailsPage.tsx` → `order.tracking` | `orders.json` → tracking array | **READ**: `orders.tracking` (JSONB) |

**جداول Supabase**: `orders`, `order_items`

---

## 7. ⭐ REVIEWS — التقييمات

| الإجراء | المكوّن | الداتا الحالية | بعد Supabase |
|---------|--------|---------------|-------------|
| عرض التقييمات | `ProductDetailsPage.tsx` | `@/data` → `reviews.json` | **READ**: `reviews` WHERE product_id = ? |
| إضافة تقييم | `ProductDetailsPage.tsx` | `localStorage('product_reviews')` | **WRITE**: `reviews` (INSERT) → **TRIGGER**: `update_product_rating()` |
| إعجاب بتقييم | `ReviewCard.tsx` | Local state فقط (مؤقت) | **UPDATE**: `reviews` SET likes = likes + 1 |
| تقييم كـ Guest | `ProductDetailsPage.tsx` | `localStorage('product_reviews')` | **WRITE**: `reviews` مع user_id = NULL |

**جداول Supabase**: `reviews`, `products` (auto-update via trigger)

---

## 8. 👤 PROFILE — الملف الشخصي

| الإجراء | المكوّن | الداتا الحالية | بعد Supabase |
|---------|--------|---------------|-------------|
| عرض البروفايل | `ProfilePage.tsx` | `@/data` + `localStorage('auth')` | **READ**: `profiles` WHERE id = auth.uid() |
| تعديل البيانات | `ProfilePage.tsx` → `updateProfile()` | `localStorage('auth')` | **UPDATE**: `profiles` SET name, phone, avatar |
| تغيير الصورة | `ImageUpload.tsx` → `ProfilePage.tsx` | base64 data URL | **UPLOAD**: Supabase Storage `avatars/` bucket → save URL in `profiles.avatar` |
| dashboard (مستخدم) | `DashboardPage.tsx` → `getDashboardStats()` | `@/data` | **READ**: `get_dashboard_data()` function |

**جداول Supabase**: `profiles`, `dashboard_views`

---

## 9. 📍 ADDRESSES — العناوين

| الإجراء | المكوّن | الداتا الحالية | بعد Supabase |
|---------|--------|---------------|-------------|
| عرض العناوين | `AddressesPage.tsx`, `AuthContext.tsx:177` | `@/data` → `addresses.json` | **READ**: `addresses` WHERE user_id = auth.uid() |
| إضافة عنوان | `AddressesPage.tsx` → `addAddress()` | `AuthContext` (localStorage) | **WRITE**: `addresses` INSERT |
| تعديل عنوان | `AddressesPage.tsx` | `AuthContext` | **UPDATE**: `addresses` WHERE id = ? AND user_id = auth.uid() |
| حذف عنوان | `AddressesPage.tsx` → `removeAddress()` | `AuthContext` | **DELETE**: `addresses` WHERE id = ? AND user_id = auth.uid() |
| تعيين كافتراضي | `AddressesPage.tsx` → `setDefaultAddress()` | `AuthContext` | **UPDATE**: `addresses` مع trigger `ensure_single_default_address()` |

**جداول Supabase**: `addresses`

---

## 10. 🔔 NOTIFICATIONS — الإشعارات

| الإجراء | المكوّن | الداتا الحالية | بعد Supabase |
|---------|--------|---------------|-------------|
| عرض الإشعارات | `NotificationsPage.tsx`, `NotificationPopover.tsx` | `@/data` → `notifications.json` | **READ**: `notifications` WHERE user_id = auth.uid() ORDER BY created_at DESC |
| تحديد كمقروء | `NotificationsPage.tsx` | `user_id` in `notifications.json` | **UPDATE**: `notifications` SET read = true WHERE id = ? |
| إنشاء إشعار (Admin) | `AdminNotificationsPage.tsx` → `adminService.createNotification()` | in-memory array | **WRITE**: `notifications` INSERT |

**جداول Supabase**: `notifications`

---

## 11. 🎡 SPIN WHEEL — عجلة الحظ

| الإجراء | المكوّن | الداتا الحالية | بعد Supabase |
|---------|--------|---------------|-------------|
| عرض الجوائز | `SpinContext.tsx`, `SpinWheel.tsx` | `@/data` → `spin-prizes.json` + `adminService` | **READ**: `spin_prizes` WHERE is_active = true |
| الدوران | `SpinContext.tsx:168` → `completeSpin()` | Local calculation | **READ/VERIFY**: `spin_history` (daily limit check) |
| تسجيل الدوران | `SpinContext.tsx` → dispatch | `localStorage('spinState')` | **WRITE**: `spin_history` INSERT |
| إدخال رقم الموبايل (ضيف) | `SpinEntryButton.tsx` | `localStorage('spin_guest_phone')` | **WRITE**: `spin_history.guest_phone` |
| استلام الكوبون | `SpinResultModal.tsx`, `SpinContext.tsx:185` | `adminService.createCoupon()` | **WRITE**: `coupons` INSERT + `spin_history.claimed = true` |
| إدارة الجوائز (Admin) | `AdminSpinPrizesPage.tsx` | `adminService` (in-memory) | **CRUD**: `spin_prizes` |

**جداول Supabase**: `spin_prizes`, `spin_history`, `coupons`

---

## 12. 📞 CONTACT & MARKETING — اتصل بنا والتسويق

| الإجراء | المكوّن | الداتا الحالية | بعد Supabase |
|---------|--------|---------------|-------------|
| إرسال رسالة (اتصل بنا) | `ContactPage.tsx` | simulate only (fake Promise) | **WRITE**: `contact_messages` INSERT |
| عرض رسائل الزوار (Admin) | `AdminContacts` (غير موجود) | لا يوجد | **READ**: `contact_messages` WHERE read = false |
| طلب إشعار عند توفر المنتج | `ProductDetailsPage.tsx` | `localStorage('back_in_stock')` | **WRITE**: `back_in_stock_requests` INSERT |

**جداول Supabase**: `contact_messages`, `back_in_stock_requests`

---

## 13. 🛠️ ADMIN — لوحة التحكم

| الإجراء | المكوّن | الداتا الحالية | بعد Supabase |
|---------|--------|---------------|-------------|
| عرض الإحصائيات | `AdminDashboardPage.tsx` → `adminService.getStats()` | in-memory from JSON | **READ**: `dashboard_stats` VIEW + `get_dashboard_data()` |
| عرض المنتجات (مع بحث) | `AdminProductsPage.tsx` | `adminService.getProducts()` | **READ/CRUD**: `products` |
| إنشاء/تعديل/حذف منتج | `AdminProductsPage.tsx` | in-memory array | **CRUD**: `products` |
| عرض الطلبات | `AdminOrdersPage.tsx` | `adminService.getOrders()` | **READ**: `orders` + `order_items` |
| تحديث حالة الطلب | `AdminOrdersPage.tsx` | `adminService.updateOrderStatus()` | **UPDATE**: `orders` SET status = ? + tracking |
| إدارة التصنيفات | `AdminCategoriesPage.tsx` | `adminService` | **CRUD**: `categories` |
| إدارة الماركات | `AdminBrandsPage.tsx` | `adminService` | **CRUD**: `brands` |
| إدارة الكوبونات | `AdminCouponsPage.tsx` | `adminService` | **CRUD**: `coupons` |
| إدارة المستخدمين | `AdminUsersPage.tsx` | `adminService.getUsers()` | **READ**: `profiles` + `user_sales_summary` VIEW |
| إدارة التقييمات | `AdminReviewsPage.tsx` | `adminService.getReviews()` | **READ/DELETE**: `reviews` |
| إدارة الإشعارات | `AdminNotificationsPage.tsx` | `adminService` | **CRUD**: `notifications` |
| إدارة جوائز العجلة | `AdminSpinPrizesPage.tsx` | `adminService` | **CRUD**: `spin_prizes` |
| إدارة الإعدادات | `AdminSettingsPage.tsx` | `adminService.getAnnouncement()` | **READ/UPDATE**: `settings` (announcement, store_info, shipping) |
| رفع الصور (Admin) | `ImageUpload.tsx` → `AdminProductsPage.tsx` | base64 data URL | **UPLOAD**: Supabase Storage `product-images/` |

**جداول Supabase**: كل الجداول (Admin has full access via RLS `is_admin()`)

---

## 14. 🔄 COMPARE — المقارنة

| الإجراء | المكوّن | الداتا الحالية | بعد Supabase |
|---------|--------|---------------|-------------|
| إضافة للمقارنة | `CompareContext.tsx` | `localStorage('compare_items')` | **اختياري** — يفضل localStorage (مؤقت) |
| إزالة من المقارنة | `CompareContext.tsx` | `localStorage('compare_items')` | اختياري |
| عرض صفحة المقارنة | `ComparePage.tsx` | `localStorage('compare_items')` | **READ**: `products` WHERE id IN (localStorage) |

**جداول Supabase**: لا يوجد (يبقى في localStorage)

---

## 15. 📄 STATIC PAGES — صفحات ثابتة

| الصفحة | الحالة |
|--------|--------|
| About | داتا من `getAboutStats()` → ممكن `settings` key-value |
| FAQ | من i18n translations |
| Privacy, Terms, Shipping, Returns, Payment | من i18n translations |
| Contact | form → `contact_messages` table |
| NotFound | pure UI |

**جداول Supabase**: `contact_messages`, `settings` (اختياري للـ About stats)

---

## 16. 🖼️ IMAGE UPLOAD — رفع الصور

| الحالة الحالية | بعد Supabase |
|---------------|-------------|
| `FileReader.readAsDataURL()` → base64 (ضخم جداً) | **UPLOAD**: Supabase Storage → bucket `product-images/` / `avatars/` / `brand-logos/` / `category-images/` |
| الصورة بتتخزن في `localStorage` أو JSON | الصورة URL بيتخزن في الجدول (text column) |
| مفيش validation | Size limit 5MB, أنواع `image/jpeg, png, webp, avif` |

**تخزين Supabase**: Storage buckets

---

## 📊 ملخص جداول Supabase والـ CRUD

| # | الجدول | CREATE | READ | UPDATE | DELETE | RLS |
|---|--------|--------|------|--------|--------|-----|
| 1 | `profiles` | Trigger | Own/Admin | Own/Admin | — | ✅ |
| 2 | `categories` | Admin | All | Admin | Admin | ✅ |
| 3 | `brands` | Admin | All | Admin | Admin | ✅ |
| 4 | `products` | Admin | All | Admin | Admin | ✅ |
| 5 | `reviews` | Auth/Anon | All | Own | Admin | ✅ |
| 6 | `cart_items` | User | Own | Own | Own | ✅ |
| 7 | `wishlist_items` | User | Own | — | Own | ✅ |
| 8 | `orders` | User | Own | Admin | Admin | ✅ |
| 9 | `order_items` | Trigger | Own | — | — | ✅ |
| 10 | `addresses` | User | Own | Own | Own | ✅ |
| 11 | `coupons` | Admin | Admin | Admin | Admin | ✅ |
| 12 | `notifications` | Admin | Own | Own | Admin | ✅ |
| 13 | `spin_prizes` | Admin | All | Admin | Admin | ✅ |
| 14 | `spin_history` | Auth | Own | Own | — | ✅ |
| 15 | `testimonials` | Admin | All | Admin | Admin | ✅ |
| 16 | `newsletter_subscribers` | All | Admin | — | Admin | ✅ |
| 17 | `contact_messages` | All | Admin | Admin | Admin | ✅ |
| 18 | `back_in_stock_requests` | All | Admin | Admin | — | ✅ |
| 19 | `settings` | Admin | All | Admin | Admin | ✅ |
| 20 | `recently_viewed` | User | Own | — | Own | ✅ |
| 21 | `recent_searches` | User | Own | Own | Own | ✅ |
| 22 | `order_email_logs` | Admin | Admin | — | — | ✅ |

---

## 🗺️ خريطة تدفق الداتا

```
📱 المستخدم (Frontend)
    ↓
🔐 Supabase Auth (sign up, login, session)
    ↓
⚡ React Query (useProducts, useOrders, ...)
    ↓
📡 supabase-js client
    ↓
🗄️ PostgreSQL Database
    ├── Tables (22 جداول)
    ├── Views (10 views للـ dashboard)
    ├── Functions (12 دوال)
    ├── Triggers (7 triggers) 
    ├── Indexes (30+ فهرس)
    └── RLS (سياسات الأمان)
    ↓
📦 Supabase Storage
    ├── product-images/
    ├── avatars/
    ├── brand-logos/
    └── category-images/
```
