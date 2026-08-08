import { supabase } from '@/lib/supabase';
import type { Product, Category, Brand, Coupon, Order, Review, Notification, AnnouncementConfig, SpinPrize, User } from '@/types';
import {
  mapProduct, mapCategory, mapBrand, mapOrder, mapReview, mapNotification,
  mapSpinPrize, mapCoupon, mapProfile, SPIN_TYPE_MAP,
} from '@/lib/mappers';
import i18n from '@/i18n';

function genId(prefix: string) {
  const num = crypto.randomUUID().slice(0, 8);
  return `${prefix}-${num}`;
}

export type DashboardData = {
  stats: {
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
    totalUsers: number;
    totalCategories: number;
    totalBrands: number;
    totalCoupons: number;
    pendingOrders: number;
    lowStockProducts: number;
  };
  monthlyRevenue: { month_date: string; month_key: string; orders_count: number; revenue: number }[];
  orderStatuses: { status: string; count: number }[];
  topProducts: { id: string; name: string; slug: string; price: number; images: string[] | null; rating: number; reviews_count: number; stock: number; is_featured: boolean | null }[];
  recentOrders: { id: string; order_number: string; status: string; total: number; created_at: string; customer_name: string | null }[];
  lowStockProducts: { id: string; name: string; slug: string; stock: number; price: number; primary_image: string | null }[];
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
    const rows = !error && data !== null ? (data as unknown as any[]) : [];
    return { items: rows.map(mapProduct), total: count || rows.length, totalPages: Math.ceil((count || rows.length) / pageSize), page };
  },

  async getProduct(id: string) {
    const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
    if (!error && data) return mapProduct(data as any);
    return null;
  },

  async createProduct(data: Partial<Product>): Promise<Product> {
    const now = new Date().toISOString();
    const product: Product = {
      id: genId('prod'), name: data.name || '', slug: data.slug || '',
      description: data.description || '', shortDescription: data.shortDescription || '',
      price: data.price || 0, oldPrice: data.oldPrice || null, discount: data.discount || null,
      images: data.images || [],
      category: data.category || '', brand: data.brand || '',
      rating: 0, reviewsCount: 0, stock: data.stock || 0, sku: data.sku || '',
      specifications: data.specifications || [], tags: data.tags || [],
      isNew: true, isFeatured: data.isFeatured || false, createdAt: now,
      colors: data.colors || [], sizes: data.sizes || [],
      stockByColor: data.stockByColor || {}, stockBySize: data.stockBySize || {},
    };
    let oldPrice = product.oldPrice;
    if (oldPrice != null && oldPrice < product.price) oldPrice = null;
    const discount = product.discount != null && product.discount >= 0 ? Math.floor(product.discount) : null;
    const dbRow = {
      id: product.id, name: product.name, slug: product.slug,
      description: product.description, short_description: product.shortDescription,
      price: product.price, old_price: oldPrice, discount: discount,
      images: product.images, category_id: product.category, brand_id: product.brand,
      rating: 0, reviews_count: 0, stock: product.stock, sku: product.sku,
      specifications: product.specifications, tags: product.tags,
      colors: product.colors, sizes: product.sizes,
      stock_by_color: product.stockByColor, stock_by_size: product.stockBySize,
      is_new: true, is_featured: product.isFeatured, created_at: now,
    };
    const { error } = await supabase.from('products').insert(dbRow);
    if (error) throw error;
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
    if (data.price !== undefined || data.oldPrice !== undefined) {
      const price = data.price ?? (await supabase.from('products').select('price').eq('id', id).single()).data?.price ?? 0;
      const oldPrice = data.oldPrice ?? (await supabase.from('products').select('old_price').eq('id', id).single()).data?.old_price;
      if (oldPrice != null && oldPrice < price) dbRow.old_price = null;
    }
    if (data.discount !== undefined) dbRow.discount = data.discount != null && data.discount >= 0 ? Math.floor(data.discount) : null;
    if (data.images !== undefined) dbRow.images = data.images;
    if (data.category !== undefined) dbRow.category_id = data.category;
    if (data.brand !== undefined) dbRow.brand_id = data.brand;
    if (data.stock !== undefined) dbRow.stock = data.stock;
    if (data.sku !== undefined) dbRow.sku = data.sku;
    if (data.specifications !== undefined) dbRow.specifications = data.specifications;
    if (data.tags !== undefined) dbRow.tags = data.tags;
    if (data.colors !== undefined) dbRow.colors = data.colors;
    if (data.sizes !== undefined) dbRow.sizes = data.sizes;
    if (data.stockByColor !== undefined) dbRow.stock_by_color = data.stockByColor;
    if (data.stockBySize !== undefined) dbRow.stock_by_size = data.stockBySize;
    if (data.isFeatured !== undefined) dbRow.is_featured = data.isFeatured;
    const { data: updated, error } = await supabase.from('products').update(dbRow).eq('id', id).select().single();
    if (!error && updated) return mapProduct(updated as any);
    return null;
  },

  async deleteProduct(id: string): Promise<boolean> {
    const { error } = await supabase.from('products').delete().eq('id', id);
    return !error;
  },

  // ─── Categories ────────────────────────────────────
  async getCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*, products(count)');
    if (!error && data !== null) return (data as any[]).map(mapCategory);
    const { data: fallback, error: fallbackError } = await supabase.from('categories').select('*');
    if (!fallbackError && fallback !== null) return (fallback as any[]).map(mapCategory);
    return [];
  },

  async getCategory(id: string) {
    const { data, error } = await supabase.from('categories').select('*').eq('id', id).single();
    if (!error && data) return mapCategory(data as any);
    return null;
  },

  async createCategory(data: Partial<Category>): Promise<Category> {
    const cat: Category = {
      id: genId('cat'), name: data.name || '', slug: data.slug || '',
      image: data.image || '', icon: data.icon || 'Folder', productsCount: 0,
    };
    const { error } = await supabase.from('categories').insert({
      id: cat.id, name: cat.name, slug: cat.slug, image: cat.image, icon: cat.icon,
    });
    if (error) throw error;
    return cat;
  },

  async updateCategory(id: string, data: Partial<Category>): Promise<Category | null> {
    const dbRow: Record<string, any> = {};
    if (data.name !== undefined) dbRow.name = data.name;
    if (data.slug !== undefined) dbRow.slug = data.slug;
    if (data.image !== undefined) dbRow.image = data.image;
    if (data.icon !== undefined) dbRow.icon = data.icon;
    const { data: updated, error } = await supabase.from('categories').update(dbRow).eq('id', id).select().single();
    if (!error && updated) return mapCategory(updated as any);
    return null;
  },

  async deleteCategory(id: string): Promise<boolean> {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    return !error;
  },

  // ─── Brands ────────────────────────────────────────
  async getBrands() {
    const { data, error } = await supabase
      .from('brands')
      .select('*, products(count)');
    if (!error && data !== null) return (data as any[]).map(mapBrand);
    const { data: fallback, error: fallbackError } = await supabase.from('brands').select('*');
    if (!fallbackError && fallback !== null) return (fallback as any[]).map(mapBrand);
    return [];
  },

  async getBrand(id: string) {
    const { data, error } = await supabase.from('brands').select('*').eq('id', id).single();
    if (!error && data) return mapBrand(data as any);
    return null;
  },

  async createBrand(data: Partial<Brand>): Promise<Brand> {
    const brand: Brand = {
      id: genId('brand'), name: data.name || '', slug: data.slug || '',
      logo: data.logo || '', productsCount: 0,
    };
    const { error } = await supabase.from('brands').insert({
      id: brand.id, name: brand.name, slug: brand.slug, logo: brand.logo,
    });
    if (error) throw error;
    return brand;
  },

  async updateBrand(id: string, data: Partial<Brand>): Promise<Brand | null> {
    const dbRow: Record<string, any> = {};
    if (data.name !== undefined) dbRow.name = data.name;
    if (data.slug !== undefined) dbRow.slug = data.slug;
    if (data.logo !== undefined) dbRow.logo = data.logo;
    const { data: updated, error } = await supabase.from('brands').update(dbRow).eq('id', id).select().single();
    if (!error && updated) return mapBrand(updated as any);
    return null;
  },

  async deleteBrand(id: string): Promise<boolean> {
    const { error } = await supabase.from('brands').delete().eq('id', id);
    return !error;
  },

  // ─── Coupons ───────────────────────────────────────
  async getCoupons() {
    const { data, error } = await supabase.from('coupons').select('*');
    if (!error && data !== null) return (data as any[]).map(mapCoupon);
    return [];
  },

  async getCoupon(id: string) {
    const { data, error } = await supabase.from('coupons').select('*').eq('id', id).single();
    if (!error && data) return mapCoupon(data as any);
    return null;
  },

  async createCoupon(data: Partial<Coupon>): Promise<Coupon> {
    const coupon: Coupon = {
      id: genId('coupon'), code: (data.code || '').trim().toUpperCase(), discount: data.discount || 0,
      type: data.type || 'percentage', minOrder: data.minOrder || 0, maxDiscount: data.maxDiscount || 0,
      expiresAt: data.expiresAt || new Date(Date.now() + 365 * 86400000).toISOString(),
      usageLimit: data.usageLimit || 100, usedCount: 0,
    };
    const { error } = await supabase.from('coupons').insert({
      id: coupon.id, code: coupon.code, discount: coupon.discount, type: coupon.type,
      min_order: coupon.minOrder, max_discount: coupon.maxDiscount,
      expires_at: coupon.expiresAt, usage_limit: coupon.usageLimit, used_count: 0,
      is_active: true,
    });
    if (error) throw error;
    return coupon;
  },

  async updateCoupon(id: string, data: Partial<Coupon>): Promise<Coupon | null> {
    const dbRow: Record<string, any> = {};
    if (data.code !== undefined) dbRow.code = (data.code as string).trim().toUpperCase();
    if (data.discount !== undefined) dbRow.discount = data.discount;
    if (data.type !== undefined) dbRow.type = data.type;
    if (data.minOrder !== undefined) dbRow.min_order = data.minOrder;
    if (data.maxDiscount !== undefined) dbRow.max_discount = data.maxDiscount;
    if (data.expiresAt !== undefined) dbRow.expires_at = data.expiresAt;
    if (data.usageLimit !== undefined) dbRow.usage_limit = data.usageLimit;
    const { data: updated, error } = await supabase.from('coupons').update(dbRow).eq('id', id).select().single();
    if (!error && updated) return mapCoupon(updated as any);
    return null;
  },

  async deleteCoupon(id: string): Promise<boolean> {
    const { error } = await supabase.from('coupons').delete().eq('id', id);
    return !error;
  },

  // ─── Orders ────────────────────────────────────────
  async getOrders(status?: string, search?: string, page = 1, pageSize = 10) {
    let query = supabase.from('orders').select('*', { count: 'exact' });
    if (status) query = query.eq('status', status);
    if (search) query = query.ilike('order_number', `%${search}%`);
    const start = (page - 1) * pageSize;
    const { data, error, count } = await query.range(start, start + pageSize - 1).order('created_at', { ascending: false });
    const rows = !error && data !== null ? (data as unknown as any[]) : [];
    return { items: rows.map(mapOrder), total: count || rows.length, totalPages: Math.ceil((count || rows.length) / pageSize), page };
  },

  async getOrder(id: string) {
    const { data, error } = await supabase.from('orders').select('*').eq('id', id).single();
    if (!error && data) return mapOrder(data as any);
    return null;
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
    const { data: updated, error } = await supabase.from('orders').update({
      status, updated_at: new Date().toISOString(), tracking: newTracking,
    }).eq('id', id).select().single();
    if (!error && updated) return mapOrder(updated as any);
    return null;
  },

  async deleteOrder(id: string): Promise<boolean> {
    const { error } = await supabase.from('orders').delete().eq('id', id);
    return !error;
  },

  // ─── Reviews ───────────────────────────────────────
  async getReviews(productId?: string, page = 1, pageSize = 10) {
    let query = supabase.from('reviews').select('*', { count: 'exact' });
    if (productId) query = query.eq('product_id', productId);
    const start = (page - 1) * pageSize;
    const { data, error, count } = await query.range(start, start + pageSize - 1).order('created_at', { ascending: false });
    const rows = !error && data !== null ? (data as unknown as any[]) : [];
    return { items: rows.map(mapReview), total: count || rows.length, totalPages: Math.ceil((count || rows.length) / pageSize), page };
  },

  async deleteReview(id: string): Promise<boolean> {
    const { error } = await supabase.from('reviews').delete().eq('id', id);
    return !error;
  },

  // ─── Notifications ─────────────────────────────────
  async getNotifications(page = 1, pageSize = 20) {
    let query = supabase.from('notifications').select('*', { count: 'exact' }).order('created_at', { ascending: false });
    const start = (page - 1) * pageSize;
    const { data, error, count } = await query.range(start, start + pageSize - 1);
    const rows = !error && data !== null ? (data as unknown as any[]) : [];
    return { items: rows.map(mapNotification), total: count || rows.length, totalPages: Math.ceil((count || rows.length) / pageSize), page };
  },

  async createNotification(data: Partial<Notification>): Promise<Notification> {
    const notif: Notification = {
      id: genId('notif'), userId: data.userId, type: data.type || 'info', title: data.title || '',
      message: data.message || '', read: false, createdAt: new Date().toISOString(),
    };
    const { error } = await supabase.from('notifications').insert({
      id: notif.id, type: notif.type, title: notif.title,
      message: notif.message, read: false, created_at: notif.createdAt,
      user_id: data.userId || '',
    });
    if (error) throw error;
    return notif;
  },

  async markNotificationRead(id: string): Promise<boolean> {
    const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
    return !error;
  },

  async deleteNotification(id: string): Promise<boolean> {
    const { error } = await supabase.from('notifications').delete().eq('id', id);
    return !error;
  },

  // ─── Users ─────────────────────────────────────────
  async getUsers(search?: string) {
    const { data, error } = await supabase.from('profiles').select('*');
    if (!error && data !== null) {
      let rows: User[] = (data as any[]).map(mapProfile);
      if (search) {
        const q = search.toLowerCase();
        rows = rows.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
      }
      const ids = rows.map((u) => u.id);
      let counts: Record<string, number> = {};
      if (ids.length > 0) {
        const { data: orderRows } = await supabase.from('orders').select('user_id');
        if (orderRows) {
          counts = orderRows.reduce((acc: Record<string, number>, o) => {
            const uid = (o as any).user_id || '';
            acc[uid] = (acc[uid] || 0) + 1;
            return acc;
          }, {});
        }
      }
      return rows.map((u) => ({ ...u, ordersCount: counts[u.id] || 0 }));
    }
    return [];
  },

  // ─── Stats ─────────────────────────────────────────
  async getStats() {
    const { data, error } = await supabase.rpc('get_dashboard_data');
    if (!error && data) {
      const d = data as any;
      return {
        totalProducts: (d.total_products ?? data.stats?.total_products) || 0,
        totalOrders: (d.total_orders ?? data.stats?.total_orders) || 0,
        totalRevenue: (d.total_revenue ?? data.stats?.total_revenue) || 0,
        totalUsers: (d.total_users ?? data.stats?.total_users) || 0,
        totalCategories: (d.total_categories ?? data.stats?.total_categories) || 0,
        totalBrands: (d.total_brands ?? data.stats?.total_brands) || 0,
        totalCoupons: (d.total_coupons ?? data.stats?.total_coupons) || 0,
        pendingOrders: (d.pending_orders ?? data.stats?.pending_orders) || 0,
        lowStockProducts: (d.low_stock_products ?? data.stats?.low_stock_products) || 0,
      };
    }
    const { count: totalProducts } = await supabase.from('products').select('*', { count: 'exact', head: true });
    const { data: ordersData } = await supabase.from('orders').select('status,total,user_id');
    const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: totalCategories } = await supabase.from('categories').select('*', { count: 'exact', head: true });
    const { count: totalBrands } = await supabase.from('brands').select('*', { count: 'exact', head: true });
    const { count: totalCoupons } = await supabase.from('coupons').select('*', { count: 'exact', head: true });
    const ordersList = ordersData || [];
    const totalRevenue = ordersList.reduce((s, o) => s + (o.total || 0), 0);
    const pendingOrders = ordersList.filter((o) => o.status === 'pending').length;
    return {
      totalProducts: totalProducts ?? 0,
      totalOrders: ordersList.length,
      totalRevenue,
      totalUsers: totalUsers ?? 0,
      totalCategories: totalCategories ?? 0,
      totalBrands: totalBrands ?? 0,
      totalCoupons: totalCoupons ?? 0,
      pendingOrders,
      lowStockProducts: 0,
    };
  },

  // ─── Dashboard ─────────────────────────────────────
  async getDashboardData(): Promise<DashboardData> {
    const { data, error } = await supabase.rpc('get_dashboard_data');
    if (!error && data) {
      const d = data as any;
      const st = d.stats ?? {};
      return {
        stats: {
          totalProducts: st.total_products ?? 0,
          totalOrders: st.total_orders ?? 0,
          totalRevenue: Number(st.total_revenue) || 0,
          totalUsers: st.total_users ?? 0,
          totalCategories: st.total_categories ?? 0,
          totalBrands: st.total_brands ?? 0,
          totalCoupons: st.total_coupons ?? 0,
          pendingOrders: st.pending_orders ?? 0,
          lowStockProducts: st.low_stock_products ?? 0,
        },
        monthlyRevenue: d.monthly_revenue ?? [],
        orderStatuses: d.order_statuses ?? [],
        topProducts: d.top_products ?? [],
        recentOrders: d.recent_orders ?? [],
        lowStockProducts: d.low_stock_products ?? [],
      };
    }
    return {
      stats: await this.getStats(),
      monthlyRevenue: [], orderStatuses: [], topProducts: [], recentOrders: [], lowStockProducts: [],
    };
  },

  // ─── Spin Prizes ────────────────────────────────────
  async getSpinPrizes() {
    const { data, error } = await supabase.from('spin_prizes').select('*');
    if (!error && data !== null) return (data as any[]).map(mapSpinPrize);
    return [];
  },

  async getSpinPrize(id: string) {
    const { data, error } = await supabase.from('spin_prizes').select('*').eq('id', id).single();
    if (!error && data) return mapSpinPrize(data as any);
    return null;
  },

  async createSpinPrize(data: Partial<SpinPrize>): Promise<SpinPrize> {
    const prize: SpinPrize = {
      id: genId('spin'), label: data.label || '', type: data.type || 'tryAgain',
      value: data.value, color: data.color || '#2563EB',
      weight: data.weight || 1, isActive: data.isActive ?? true,
    };
    const { error } = await supabase.from('spin_prizes').insert({
      id: prize.id, label: prize.label, type: SPIN_TYPE_MAP[prize.type] || prize.type,
      value: prize.value, color: prize.color, weight: prize.weight, is_active: prize.isActive,
      coupon_code: data.couponCode || null,
    });
    if (error) throw error;
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
    const { data: updated, error } = await supabase.from('spin_prizes').update(dbRow).eq('id', id).select().single();
    if (!error && updated) return mapSpinPrize(updated as any);
    return null;
  },

  async deleteSpinPrize(id: string): Promise<boolean> {
    const { error } = await supabase.from('spin_prizes').delete().eq('id', id);
    return !error;
  },

  // ─── Store Settings ──────────────────────────────
  async getStoreSettings() {
    const { data } = await supabase.from('store_settings').select('*').single();
    return {
      name: data?.name || '',
      description: data?.description || '',
      phone: data?.phone || '+201234567890',
      email: data?.email || 'info@zahieg.com',
      address: data?.address || '',
      shippingCost: Number(data?.shipping_cost) || 30,
      freeShippingThreshold: Number(data?.free_shipping_threshold) || 500,
    };
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
    return {
      name: data?.name || dbRow.name || '',
      description: data?.description || dbRow.description || '',
      phone: data?.phone || dbRow.phone || '+201234567890',
      email: data?.email || dbRow.email || 'info@zahieg.com',
      address: data?.address || dbRow.address || '',
      shippingCost: Number(data?.shipping_cost ?? dbRow.shipping_cost) || 30,
      freeShippingThreshold: Number(data?.free_shipping_threshold ?? dbRow.free_shipping_threshold) || 500,
    };
  },

  // ─── Announcement Bar ──────────────────────────────
  async getAnnouncement(): Promise<AnnouncementConfig> {
    const { data } = await supabase.from('announcements').select('*').single();
    return { text: data?.text || '', enabled: data ? !!data.enabled : true, dismissible: data ? (data.dismissible ?? true) : true };
  },

  async updateAnnouncement(config: Partial<AnnouncementConfig>): Promise<AnnouncementConfig> {
    const dbRow: Record<string, any> = { id: 'default' };
    if (config.text !== undefined) dbRow.text = config.text;
    if (config.enabled !== undefined) dbRow.enabled = config.enabled;
    if (config.dismissible !== undefined) dbRow.dismissible = config.dismissible;
    const { data } = await supabase.from('announcements').upsert(dbRow).select().single();
    return { text: data?.text || config.text || '', enabled: data ? !!data.enabled : (config.enabled ?? true), dismissible: data ? (data.dismissible ?? true) : (config.dismissible ?? true) };
  },
};