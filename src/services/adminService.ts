import { supabase } from '@/lib/supabase';
import type { Product, Category, Brand, Coupon, Order, Review, Notification, AnnouncementConfig, SpinPrize, User, SpinPrizeType } from '@/types';
import {
  products, setProductsData, categories, setCategoriesData,
  brands, setBrandsData, coupons, setCouponsData,
  orders, setOrdersData, reviews, setReviewsData,
  users, setUsersData, notifications, setNotificationsData,
  spinPrizes, setSpinPrizesData,
} from '@/data';
import i18n from '@/i18n';

function genId(prefix: string) {
  const num = crypto.randomUUID().slice(0, 8);
  return `${prefix}-${num}`;
}

const SPIN_TYPE_MAP: Record<string, string> = {
  percentage: 'percentage',
  fixed: 'fixed',
  freeShipping: 'free_shipping',
  tryAgain: 'try_again',
};
const SPIN_TYPE_REVERSE: Record<string, SpinPrizeType> = {
  percentage: 'percentage',
  fixed: 'fixed',
  free_shipping: 'freeShipping',
  try_again: 'tryAgain',
};

export const adminService = {
  // ─── Products ─────────────────────────────────────
  async getProducts(search?: string, categoryId?: string, brandId?: string, page = 1, pageSize = 10) {
    let query = supabase.from('products').select('*', { count: 'exact' });
    if (search) {
      const q = search.toLowerCase();
      query = query.or(`name.ilike.%${q}%,sku.ilike.%${q}%`);
    }
    if (categoryId) query = query.eq('category_id', categoryId);
    if (brandId) query = query.eq('brand_id', brandId);
    const start = (page - 1) * pageSize;
    const { data, error, count } = await query.range(start, start + pageSize - 1).order('created_at', { ascending: false });
    if (!error && data) {
      const mapped = (data as unknown as any[]).map(mapProduct);
      setProductsData(mapped);
      return { items: mapped, total: count || data.length, totalPages: Math.ceil((count || data.length) / pageSize), page };
    }
    let result = [...products];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
    }
    if (categoryId) result = result.filter((p) => p.category === categoryId);
    if (brandId) result = result.filter((p) => p.brand === brandId);
    const total = result.length;
    const totalPages = Math.ceil(total / pageSize);
    return { items: result.slice(start, start + pageSize), total, totalPages, page };
  },

  async getProduct(id: string) {
    const { data } = await supabase.from('products').select('*').eq('id', id).single();
    if (data) return mapProduct(data as any);
    return products.find((p) => p.id === id) || null;
  },

  async createProduct(data: Partial<Product>): Promise<Product> {
    const now = new Date().toISOString();
    const product: Product = {
      id: genId('prod'), name: data.name || '', slug: data.slug || '',
      description: data.description || '', shortDescription: data.shortDescription || '',
      price: data.price || 0, oldPrice: data.oldPrice || null, discount: data.discount || null,
      images: data.images || ['https://picsum.photos/seed/default/600/600'],
      category: data.category || '', brand: data.brand || '',
      rating: 0, reviewsCount: 0, stock: data.stock || 0, sku: data.sku || '',
      specifications: data.specifications || [], tags: data.tags || [],
      isNew: true, isFeatured: data.isFeatured || false, createdAt: now,
    };
    const dbRow = {
      id: product.id, name: product.name, slug: product.slug,
      description: product.description, short_description: product.shortDescription,
      price: product.price, old_price: product.oldPrice, discount: product.discount,
      images: product.images, category_id: product.category, brand_id: product.brand,
      rating: 0, reviews_count: 0, stock: product.stock, sku: product.sku,
      specifications: product.specifications, tags: product.tags,
      is_new: true, is_featured: product.isFeatured, created_at: now,
    };
    await supabase.from('products').insert(dbRow);
    setProductsData([product, ...products]);
    return product;
  },

  async updateProduct(id: string, data: Partial<Product>): Promise<Product | null> {
    const dbRow: Record<string, any> = {};
    if (data.name !== undefined) dbRow.name = data.name;
    if (data.slug !== undefined) dbRow.slug = data.slug;
    if (data.description !== undefined) dbRow.description = data.description;
    if (data.shortDescription !== undefined) dbRow.short_description = data.shortDescription;
    if (data.price !== undefined) dbRow.price = data.price;
    if (data.oldPrice !== undefined) dbRow.old_price = data.oldPrice;
    if (data.discount !== undefined) dbRow.discount = data.discount;
    if (data.images !== undefined) dbRow.images = data.images;
    if (data.category !== undefined) dbRow.category_id = data.category;
    if (data.brand !== undefined) dbRow.brand_id = data.brand;
    if (data.stock !== undefined) dbRow.stock = data.stock;
    if (data.sku !== undefined) dbRow.sku = data.sku;
    if (data.specifications !== undefined) dbRow.specifications = data.specifications;
    if (data.tags !== undefined) dbRow.tags = data.tags;
    if (data.isFeatured !== undefined) dbRow.is_featured = data.isFeatured;
    const { data: updated } = await supabase.from('products').update(dbRow).eq('id', id).select().single();
    if (updated) {
      const mapped = mapProduct(updated as any);
      setProductsData(products.map((p) => p.id === id ? mapped : p));
      return mapped;
    }
    const idx = products.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    products[idx] = { ...products[idx], ...data, id };
    return products[idx];
  },

  async deleteProduct(id: string): Promise<boolean> {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) { setProductsData(products.filter((p) => p.id !== id)); return true; }
    const idx = products.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    products.splice(idx, 1);
    return true;
  },

  // ─── Categories ────────────────────────────────────
  async getCategories() {
    const { data } = await supabase.from('categories').select('*');
    if (data && data.length > 0) {
      const mapped = (data as any[]).map(mapCategory);
      setCategoriesData(mapped as Category[]);
      return (mapped as Category[]).map((c) => ({
        ...c, productsCount: products.filter((p) => p.category === c.id).length,
      }));
    }
    return categories.map((c) => ({
      ...c, productsCount: products.filter((p) => p.category === c.id).length,
    }));
  },

  async getCategory(id: string) {
    const { data } = await supabase.from('categories').select('*').eq('id', id).single();
    if (data) return mapCategory(data as any);
    return categories.find((c) => c.id === id) || null;
  },

  async createCategory(data: Partial<Category>): Promise<Category> {
    const cat: Category = {
      id: genId('cat'), name: data.name || '', slug: data.slug || '',
      image: data.image || 'https://picsum.photos/seed/cat/400/400',
      icon: data.icon || 'Folder', productsCount: 0,
    };
    await supabase.from('categories').insert({
      id: cat.id, name: cat.name, slug: cat.slug, image: cat.image, icon: cat.icon,
    });
    setCategoriesData([...categories, cat]);
    return cat;
  },

  async updateCategory(id: string, data: Partial<Category>): Promise<Category | null> {
    const dbRow: Record<string, any> = {};
    if (data.name !== undefined) dbRow.name = data.name;
    if (data.slug !== undefined) dbRow.slug = data.slug;
    if (data.image !== undefined) dbRow.image = data.image;
    if (data.icon !== undefined) dbRow.icon = data.icon;
    const { data: updated } = await supabase.from('categories').update(dbRow).eq('id', id).select().single();
    if (updated) {
      const mapped = mapCategory(updated as any);
      setCategoriesData(categories.map((c) => c.id === id ? mapped : c));
      return mapped;
    }
    const idx = categories.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    categories[idx] = { ...categories[idx], ...data, id };
    return categories[idx];
  },

  async deleteCategory(id: string): Promise<boolean> {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (!error) { setCategoriesData(categories.filter((c) => c.id !== id)); return true; }
    const idx = categories.findIndex((c) => c.id === id);
    if (idx === -1) return false;
    categories.splice(idx, 1);
    return true;
  },

  // ─── Brands ────────────────────────────────────────
  async getBrands() {
    const { data } = await supabase.from('brands').select('*');
    if (data && data.length > 0) {
      const mapped = (data as any[]).map(mapBrand);
      setBrandsData(mapped as Brand[]);
      return (mapped as Brand[]).map((b) => ({
        ...b, productsCount: products.filter((p) => p.brand === b.id).length,
      }));
    }
    return brands.map((b) => ({
      ...b, productsCount: products.filter((p) => p.brand === b.id).length,
    }));
  },

  async getBrand(id: string) {
    const { data } = await supabase.from('brands').select('*').eq('id', id).single();
    if (data) return mapBrand(data as any);
    return brands.find((b) => b.id === id) || null;
  },

  async createBrand(data: Partial<Brand>): Promise<Brand> {
    const brand: Brand = {
      id: genId('brand'), name: data.name || '', slug: data.slug || '',
      logo: data.logo || 'https://picsum.photos/seed/brand/200/100', productsCount: 0,
    };
    await supabase.from('brands').insert({
      id: brand.id, name: brand.name, slug: brand.slug, logo: brand.logo,
    });
    setBrandsData([...brands, brand]);
    return brand;
  },

  async updateBrand(id: string, data: Partial<Brand>): Promise<Brand | null> {
    const dbRow: Record<string, any> = {};
    if (data.name !== undefined) dbRow.name = data.name;
    if (data.slug !== undefined) dbRow.slug = data.slug;
    if (data.logo !== undefined) dbRow.logo = data.logo;
    const { data: updated } = await supabase.from('brands').update(dbRow).eq('id', id).select().single();
    if (updated) {
      const mapped = mapBrand(updated as any);
      setBrandsData(brands.map((b) => b.id === id ? mapped : b));
      return mapped;
    }
    const idx = brands.findIndex((b) => b.id === id);
    if (idx === -1) return null;
    brands[idx] = { ...brands[idx], ...data, id };
    return brands[idx];
  },

  async deleteBrand(id: string): Promise<boolean> {
    const { error } = await supabase.from('brands').delete().eq('id', id);
    if (!error) { setBrandsData(brands.filter((b) => b.id !== id)); return true; }
    const idx = brands.findIndex((b) => b.id === id);
    if (idx === -1) return false;
    brands.splice(idx, 1);
    return true;
  },

  // ─── Coupons ───────────────────────────────────────
  async getCoupons() {
    const { data } = await supabase.from('coupons').select('*');
    if (data && data.length > 0) { setCouponsData(data as unknown as Coupon[]); return data as unknown as Coupon[]; }
    return [...coupons];
  },

  async getCoupon(id: string) {
    const { data } = await supabase.from('coupons').select('*').eq('id', id).single();
    if (data) return data as unknown as Coupon;
    return coupons.find((c) => c.id === id) || null;
  },

  async createCoupon(data: Partial<Coupon>): Promise<Coupon> {
    const coupon: Coupon = {
      id: genId('coupon'), code: data.code || '', discount: data.discount || 0,
      type: data.type || 'percentage', minOrder: data.minOrder || 0, maxDiscount: data.maxDiscount || 0,
      expiresAt: data.expiresAt || new Date(Date.now() + 365 * 86400000).toISOString(),
      usageLimit: data.usageLimit || 100, usedCount: 0,
    };
    await supabase.from('coupons').insert({
      id: coupon.id, code: coupon.code, discount: coupon.discount, type: coupon.type,
      min_order: coupon.minOrder, max_discount: coupon.maxDiscount,
      expires_at: coupon.expiresAt, usage_limit: coupon.usageLimit, used_count: 0,
      is_active: true,
    });
    setCouponsData([...coupons, coupon]);
    return coupon;
  },

  async updateCoupon(id: string, data: Partial<Coupon>): Promise<Coupon | null> {
    const dbRow: Record<string, any> = {};
    if (data.code !== undefined) dbRow.code = data.code;
    if (data.discount !== undefined) dbRow.discount = data.discount;
    if (data.type !== undefined) dbRow.type = data.type;
    if (data.minOrder !== undefined) dbRow.min_order = data.minOrder;
    if (data.maxDiscount !== undefined) dbRow.max_discount = data.maxDiscount;
    if (data.expiresAt !== undefined) dbRow.expires_at = data.expiresAt;
    if (data.usageLimit !== undefined) dbRow.usage_limit = data.usageLimit;
    const { data: updated } = await supabase.from('coupons').update(dbRow).eq('id', id).select().single();
    if (updated) {
      setCouponsData(coupons.map((c) => c.id === id ? updated as unknown as Coupon : c));
      return updated as unknown as Coupon;
    }
    const idx = coupons.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    coupons[idx] = { ...coupons[idx], ...data, id };
    return coupons[idx];
  },

  async deleteCoupon(id: string): Promise<boolean> {
    const { error } = await supabase.from('coupons').delete().eq('id', id);
    if (!error) { setCouponsData(coupons.filter((c) => c.id !== id)); return true; }
    const idx = coupons.findIndex((c) => c.id === id);
    if (idx === -1) return false;
    coupons.splice(idx, 1);
    return true;
  },

  // ─── Orders ────────────────────────────────────────
  async getOrders(status?: string, search?: string, page = 1, pageSize = 10) {
    let query = supabase.from('orders').select('*', { count: 'exact' });
    if (status) query = query.eq('status', status);
    if (search) query = query.ilike('order_number', `%${search}%`);
    const start = (page - 1) * pageSize;
    const { data, error, count } = await query.range(start, start + pageSize - 1).order('created_at', { ascending: false });
    if (!error && data) {
      const mapped = (data as unknown as any[]).map(mapOrder);
      setOrdersData(mapped);
      return { items: mapped, total: count || data.length, totalPages: Math.ceil((count || data.length) / pageSize), page };
    }
    let result = [...orders];
    if (status) result = result.filter((o) => o.status === status);
    if (search) result = result.filter((o) => o.orderNumber.toLowerCase().includes(search.toLowerCase()));
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const total = result.length;
    const totalPages = Math.ceil(total / pageSize);
    return { items: result.slice(start, start + pageSize), total, totalPages, page };
  },

  async getOrder(id: string) {
    const { data } = await supabase.from('orders').select('*').eq('id', id).single();
    if (data) return mapOrder(data as any);
    return orders.find((o) => o.id === id) || null;
  },

  async updateOrderStatus(id: string, status: Order['status']): Promise<Order | null> {
    const trackingEntry = {
      status,
      date: new Date().toISOString(),
      description: status === 'confirmed' ? i18n.t('orders.trackingConfirmed')
        : status === 'processing' ? i18n.t('orders.trackingProcessing')
        : status === 'shipped' ? i18n.t('orders.trackingShipped')
        : status === 'delivered' ? i18n.t('orders.trackingDelivered')
        : status === 'cancelled' ? i18n.t('orders.trackingCancelled')
        : i18n.t('orders.trackingUpdated', { status }),
      completed: status === 'delivered' || status === 'cancelled',
    };
    const { data: existing } = await supabase.from('orders').select('tracking').eq('id', id).single();
    const currentTracking = existing?.tracking || [];
    const newTracking = [...currentTracking, trackingEntry];
    const { data: updated } = await supabase.from('orders').update({
      status, updated_at: new Date().toISOString(), tracking: newTracking,
    }).eq('id', id).select().single();
    if (updated) {
      const mapped = mapOrder(updated as any);
      setOrdersData(orders.map((o) => o.id === id ? mapped : o));
      return mapped;
    }
    const idx = orders.findIndex((o) => o.id === id);
    if (idx === -1) return null;
    orders[idx] = {
      ...orders[idx], status, updatedAt: new Date().toISOString(),
      tracking: [...orders[idx].tracking, trackingEntry],
    };
    return orders[idx];
  },

  async deleteOrder(id: string): Promise<boolean> {
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (!error) { setOrdersData(orders.filter((o) => o.id !== id)); return true; }
    const idx = orders.findIndex((o) => o.id === id);
    if (idx === -1) return false;
    orders.splice(idx, 1);
    return true;
  },

  // ─── Reviews ───────────────────────────────────────
  async getReviews(productId?: string, page = 1, pageSize = 10) {
    let query = supabase.from('reviews').select('*', { count: 'exact' });
    if (productId) query = query.eq('product_id', productId);
    const start = (page - 1) * pageSize;
    const { data, error, count } = await query.range(start, start + pageSize - 1).order('created_at', { ascending: false });
    if (!error && data) {
      const mapped = (data as unknown as any[]).map(mapReview);
      setReviewsData(mapped);
      return { items: mapped, total: count || data.length, totalPages: Math.ceil((count || data.length) / pageSize), page };
    }
    let result = [...reviews];
    if (productId) result = result.filter((r) => r.productId === productId);
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const total = result.length;
    const totalPages = Math.ceil(total / pageSize);
    return { items: result.slice(start, start + pageSize), total, totalPages, page };
  },

  async deleteReview(id: string): Promise<boolean> {
    const { error } = await supabase.from('reviews').delete().eq('id', id);
    if (!error) { setReviewsData(reviews.filter((r) => r.id !== id)); return true; }
    const idx = reviews.findIndex((r) => r.id === id);
    if (idx === -1) return false;
    reviews.splice(idx, 1);
    return true;
  },

  // ─── Notifications ─────────────────────────────────
  async getNotifications(page = 1, pageSize = 20) {
    let query = supabase.from('notifications').select('*', { count: 'exact' }).order('created_at', { ascending: false });
    const start = (page - 1) * pageSize;
    const { data, error, count } = await query.range(start, start + pageSize - 1);
    if (!error && data && data.length > 0) {
      const mapped = (data as unknown as any[]).map(mapNotification);
      setNotificationsData(mapped);
      return { items: mapped, total: count || data.length, totalPages: Math.ceil((count || data.length) / pageSize), page };
    }
    let result = [...notifications];
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const total = result.length;
    const totalPages = Math.ceil(total / pageSize);
    return { items: result.slice(start, start + pageSize), total, totalPages, page };
  },

  async createNotification(data: Partial<Notification>): Promise<Notification> {
    const notif: Notification = {
      id: genId('notif'), type: data.type || 'info', title: data.title || '',
      message: data.message || '', read: false, createdAt: new Date().toISOString(),
    };
    await supabase.from('notifications').insert({
      id: notif.id, type: notif.type, title: notif.title,
      message: notif.message, read: false, created_at: notif.createdAt,
      user_id: data.userId || '',
    });
    setNotificationsData([notif, ...notifications]);
    return notif;
  },

  async markNotificationRead(id: string): Promise<boolean> {
    const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
    if (!error) {
      setNotificationsData(notifications.map((n) => n.id === id ? { ...n, read: true } : n));
      return true;
    }
    const idx = notifications.findIndex((n) => n.id === id);
    if (idx === -1) return false;
    notifications[idx].read = true;
    return true;
  },

  async deleteNotification(id: string): Promise<boolean> {
    const { error } = await supabase.from('notifications').delete().eq('id', id);
    if (!error) { setNotificationsData(notifications.filter((n) => n.id !== id)); return true; }
    const idx = notifications.findIndex((n) => n.id === id);
    if (idx === -1) return false;
    notifications.splice(idx, 1);
    return true;
  },

  // ─── Users ─────────────────────────────────────────
  async getUsers(search?: string) {
    const { data } = await supabase.from('profiles').select('*');
    if (data && data.length > 0) {
      setUsersData(data as unknown as User[]);
      let result = data as unknown as User[];
      if (search) {
        const q = search.toLowerCase();
        result = result.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
      }
      return result.map((u) => ({ ...u, ordersCount: orders.filter((o) => o.userId === u.id).length }));
    }
    let result = [...users];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    return result.map((u) => ({ ...u, ordersCount: orders.filter((o) => o.userId === u.id).length }));
  },

  // ─── Stats ─────────────────────────────────────────
  async getStats() {
    const { data: ordersData } = await supabase.from('orders').select('total,status');
    const { count: totalProducts } = await supabase.from('products').select('*', { count: 'exact', head: true });
    const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: totalCategories } = await supabase.from('categories').select('*', { count: 'exact', head: true });
    const { count: totalBrands } = await supabase.from('brands').select('*', { count: 'exact', head: true });
    const { count: totalCoupons } = await supabase.from('coupons').select('*', { count: 'exact', head: true });

    if (ordersData) {
      const totalRevenue = ordersData.reduce((s, o) => s + (o.total || 0), 0);
      const pendingOrders = ordersData.filter((o) => o.status === 'pending').length;
      const lowStock = products.filter((p) => p.stock < 10).length;
      return {
        totalProducts: totalProducts || products.length,
        totalOrders: ordersData.length,
        totalRevenue,
        totalUsers: totalUsers || users.length,
        totalCategories: totalCategories || categories.length,
        totalBrands: totalBrands || brands.length,
        totalCoupons: totalCoupons || coupons.length,
        pendingOrders,
        lowStockProducts: lowStock,
      };
    }

    const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
    const pendingOrders = orders.filter((o) => o.status === 'pending').length;
    const lowStock = products.filter((p) => p.stock < 10).length;
    return {
      totalProducts: products.length, totalOrders: orders.length, totalRevenue,
      totalUsers: users.length, totalCategories: categories.length,
      totalBrands: brands.length, totalCoupons: coupons.length,
      pendingOrders, lowStockProducts: lowStock,
    };
  },

  // ─── Spin Prizes ────────────────────────────────────
  async getSpinPrizes() {
    const { data } = await supabase.from('spin_prizes').select('*');
    if (data && data.length > 0) {
      const mapped = (data as any[]).map(mapSpinPrize);
      setSpinPrizesData(mapped);
      return mapped;
    }
    return [...spinPrizes];
  },

  async getSpinPrize(id: string) {
    const { data } = await supabase.from('spin_prizes').select('*').eq('id', id).single();
    if (data) return mapSpinPrize(data as any);
    return spinPrizes.find((p) => p.id === id) || null;
  },

  async createSpinPrize(data: Partial<SpinPrize>): Promise<SpinPrize> {
    const prize: SpinPrize = {
      id: genId('spin'), label: data.label || '', type: data.type || 'tryAgain',
      value: data.value, color: data.color || '#2563EB',
      weight: data.weight || 1, isActive: data.isActive ?? true,
    };
    await supabase.from('spin_prizes').insert({
      id: prize.id, label: prize.label, type: SPIN_TYPE_MAP[prize.type] || prize.type,
      value: prize.value, color: prize.color, weight: prize.weight, is_active: prize.isActive,
      coupon_code: data.couponCode || null,
    });
    setSpinPrizesData([...spinPrizes, prize]);
    return prize;
  },

  async updateSpinPrize(id: string, data: Partial<SpinPrize>): Promise<SpinPrize | null> {
    const dbRow: Record<string, any> = {};
    if (data.label !== undefined) dbRow.label = data.label;
    if (data.type !== undefined) dbRow.type = SPIN_TYPE_MAP[data.type] || data.type;
    if (data.value !== undefined) dbRow.value = data.value;
    if (data.color !== undefined) dbRow.color = data.color;
    if (data.weight !== undefined) dbRow.weight = data.weight;
    if (data.isActive !== undefined) dbRow.is_active = data.isActive;
    if (data.couponCode !== undefined) dbRow.coupon_code = data.couponCode;
    const { data: updated } = await supabase.from('spin_prizes').update(dbRow).eq('id', id).select().single();
    if (updated) {
      const mapped = mapSpinPrize(updated as any);
      setSpinPrizesData(spinPrizes.map((p) => p.id === id ? mapped : p));
      return mapped;
    }
    const idx = spinPrizes.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    spinPrizes[idx] = { ...spinPrizes[idx], ...data, id };
    return spinPrizes[idx];
  },

  async deleteSpinPrize(id: string): Promise<boolean> {
    const { error } = await supabase.from('spin_prizes').delete().eq('id', id);
    if (!error) { setSpinPrizesData(spinPrizes.filter((p) => p.id !== id)); return true; }
    const idx = spinPrizes.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    spinPrizes.splice(idx, 1);
    return true;
  },

  // ─── Store Settings ──────────────────────────────
  _storeSettings: {
    name: '',
    description: '',
    phone: '+201234567890',
    email: 'info@zahieg.com',
    address: '',
    shippingCost: 30,
    freeShippingThreshold: 500,
  },

  async getStoreSettings() {
    const { data } = await supabase.from('store_settings').select('*').single();
    if (data) {
      this._storeSettings = {
        name: data.name || '',
        description: data.description || '',
        phone: data.phone || '+201234567890',
        email: data.email || 'info@zahieg.com',
        address: data.address || '',
        shippingCost: Number(data.shipping_cost) || 30,
        freeShippingThreshold: Number(data.free_shipping_threshold) || 500,
      };
      return this._storeSettings;
    }
    return this._storeSettings;
  },

  async updateStoreSettings(settings: Record<string, any>) {
    const dbRow: Record<string, any> = {};
    if (settings.name !== undefined) dbRow.name = settings.name;
    if (settings.description !== undefined) dbRow.description = settings.description;
    if (settings.phone !== undefined) dbRow.phone = settings.phone;
    if (settings.email !== undefined) dbRow.email = settings.email;
    if (settings.address !== undefined) dbRow.address = settings.address;
    if (settings.shippingCost !== undefined) dbRow.shipping_cost = settings.shippingCost;
    if (settings.freeShippingThreshold !== undefined) dbRow.free_shipping_threshold = settings.freeShippingThreshold;
    const { data } = await supabase.from('store_settings').upsert({ id: 'default', ...dbRow }).select().single();
    if (data) {
      this._storeSettings = {
        name: data.name || '', description: data.description || '',
        phone: data.phone || '+201234567890', email: data.email || 'info@zahieg.com',
        address: data.address || '',
        shippingCost: Number(data.shipping_cost) || 30,
        freeShippingThreshold: Number(data.free_shipping_threshold) || 500,
      };
      return this._storeSettings;
    }
    this._storeSettings = { ...this._storeSettings, ...settings };
    return this._storeSettings;
  },

  // ─── Announcement Bar ──────────────────────────────
  _announcement: {
    text: '',
    enabled: true,
    dismissible: true,
  } as AnnouncementConfig,

  async getAnnouncement(): Promise<AnnouncementConfig> {
    const { data } = await supabase.from('announcements').select('*').single();
    if (data) {
      this._announcement = { text: data.text || '', enabled: !!data.enabled, dismissible: data.dismissible ?? true };
      return this._announcement;
    }
    return this._announcement;
  },

  async updateAnnouncement(config: Partial<AnnouncementConfig>): Promise<AnnouncementConfig> {
    const dbRow: Record<string, any> = { id: 'default' };
    if (config.text !== undefined) dbRow.text = config.text;
    if (config.enabled !== undefined) dbRow.enabled = config.enabled;
    if (config.dismissible !== undefined) dbRow.dismissible = config.dismissible;
    const { data } = await supabase.from('announcements').upsert(dbRow).select().single();
    if (data) {
      this._announcement = { text: data.text || '', enabled: !!data.enabled, dismissible: data.dismissible ?? true };
      return this._announcement;
    }
    this._announcement = { ...this._announcement, ...config };
    return { ...this._announcement };
  },
};

// ─── Mapper Functions ──────────────────────────────────

function mapProduct(data: any): Product {
  return {
    id: data.id, name: data.name, slug: data.slug,
    description: data.description || '', shortDescription: data.short_description || '',
    price: Number(data.price) || 0, oldPrice: data.old_price ? Number(data.old_price) : null,
    discount: data.discount || null,
    images: data.images || ['https://picsum.photos/seed/default/600/600'],
    category: data.category_id || '', brand: data.brand_id || '',
    rating: Number(data.rating) || 0, reviewsCount: data.reviews_count || 0,
    stock: data.stock || 0, sku: data.sku || '',
    specifications: data.specifications || [], tags: data.tags || [],
    isNew: !!data.is_new, isFeatured: !!data.is_featured,
    createdAt: data.created_at || new Date().toISOString(),
  };
}

function mapCategory(data: any): Category {
  return {
    id: data.id, name: data.name, slug: data.slug,
    image: data.image || '', icon: data.icon || 'Folder',
    productsCount: data.products_count || 0,
  };
}

function mapBrand(data: any): Brand {
  return {
    id: data.id, name: data.name, slug: data.slug,
    logo: data.logo || '', productsCount: data.products_count || 0,
  };
}

function mapOrder(data: any): Order {
  return {
    id: data.id, userId: data.user_id, orderNumber: data.order_number || '',
    status: data.status || 'pending',
    items: data.items || [],
    total: Number(data.total) || 0, subtotal: Number(data.subtotal) || 0,
    shipping: Number(data.shipping) || 0, discount: Number(data.discount) || 0,
    couponCode: data.coupon_code || undefined,
    shippingAddress: data.shipping_address || { fullName: '', phone: '', street: '', city: '', state: '' },
    paymentMethod: data.payment_method || '',
    notes: data.notes || '',
    createdAt: data.created_at || new Date().toISOString(),
    updatedAt: data.updated_at || new Date().toISOString(),
    tracking: data.tracking || [],
  };
}

function mapReview(data: any): Review {
  return {
    id: data.id, productId: data.product_id, userId: data.user_id || '',
    userName: data.user_name, userAvatar: data.user_avatar || '',
    rating: data.rating, title: data.title || '', comment: data.comment || '',
    createdAt: data.created_at || new Date().toISOString(), likes: data.likes || 0,
  };
}

function mapNotification(data: any): Notification {
  return {
    id: data.id, type: data.type || 'info', title: data.title || '',
    message: data.message || '', read: !!data.read,
    createdAt: data.created_at || new Date().toISOString(),
  };
}

function mapSpinPrize(data: any): SpinPrize {
  return {
    id: data.id, label: data.label || '',
    type: SPIN_TYPE_REVERSE[data.type] || data.type || 'tryAgain',
    value: data.value, couponCode: data.coupon_code || undefined,
    color: data.color || '#2563EB', weight: data.weight || 1,
    isActive: data.is_active ?? true,
  };
}

