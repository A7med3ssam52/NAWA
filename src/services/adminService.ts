import type { Product, Category, Brand, Coupon, Order, Review, Notification, AnnouncementConfig, SpinPrize, User } from '@/types';
import {
  INITIAL_CATEGORIES,
  INITIAL_BRANDS,
  INITIAL_PRODUCTS,
  INITIAL_TESTIMONIALS,
  INITIAL_COUPONS,
  INITIAL_SPIN_PRIZES,
} from '@/data/mockData';

function genId(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

let localCategories: Category[] = [...INITIAL_CATEGORIES];
let localBrands: Brand[] = [...INITIAL_BRANDS];
let localProducts: Product[] = [...INITIAL_PRODUCTS];
let localCoupons: Coupon[] = [...INITIAL_COUPONS];
let localSpinPrizes: SpinPrize[] = [...INITIAL_SPIN_PRIZES];
let localTestimonials = [...INITIAL_TESTIMONIALS];
let localOrders: Order[] = [];
let localNotifications: Notification[] = [];
let localStoreSettings = {
  name: 'NAWA',
  description: 'أفضل متجر إلكتروني في مصر',
  phone: '+201234567890',
  email: 'info@nawaeg.com',
  address: 'القاهرة، مصر',
  shippingCost: 30,
  freeShippingThreshold: 500,
};
let localUsers: User[] = [
  {
    id: 'user-1',
    name: 'عميل تجريبي',
    email: 'user@nawaeg.com',
    phone: '+201000000000',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    role: 'customer',
    addresses: [],
    orders: [],
    wishlist: [],
    notifications: [],
  },
];

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
  async getProducts(search?: string, categoryId?: string, page = 1, pageSize = 10) {
    let items = [...localProducts];
    if (categoryId) items = items.filter(p => p.category === categoryId);
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
    }
    const total = items.length;
    const start = (page - 1) * pageSize;
    const paginated = items.slice(start, start + pageSize);
    return { items: paginated, total, totalPages: Math.ceil(total / pageSize) || 1, page };
  },

  async getProduct(id: string) {
    return localProducts.find(p => p.id === id) || null;
  },

  async getProductCategoryIds(productId: string): Promise<string[]> {
    const prod = localProducts.find(p => p.id === productId);
    return prod?.category ? [prod.category] : [];
  },

  async createProduct(data: Partial<Product>): Promise<Product> {
    const newProduct: Product = {
      id: genId('prod'),
      name: data.name || '',
      slug: data.slug || `product-${Date.now()}`,
      description: data.description || '',
      shortDescription: data.shortDescription || '',
      price: data.price || 0,
      oldPrice: data.oldPrice || null,
      discount: data.discount || null,
      images: data.images || ['https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80'],
      category: data.category || localCategories[0]?.id || '',
      brand: data.brand || localBrands[0]?.id || '',
      rating: 5,
      reviewsCount: 0,
      stock: data.stock || 10,
      sku: data.sku || `SKU-${Date.now()}`,
      specifications: data.specifications || [],
      tags: data.tags || [],
      isNew: true,
      isFeatured: data.isFeatured || false,
      colors: data.colors || [],
      sizes: data.sizes || [],
      stockByColor: data.stockByColor || {},
      stockBySize: data.stockBySize || {},
      createdAt: new Date().toISOString(),
    };
    localProducts.unshift(newProduct);
    return newProduct;
  },

  async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    const idx = localProducts.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('PRODUCT_NOT_FOUND');
    localProducts[idx] = { ...localProducts[idx], ...data };
    return localProducts[idx];
  },

  async deleteProduct(id: string): Promise<boolean> {
    localProducts = localProducts.filter(p => p.id !== id);
    return true;
  },

  // ─── Categories ────────────────────────────────────
  async getCategories() {
    return [...localCategories];
  },

  async getCategory(id: string) {
    return localCategories.find(c => c.id === id) || null;
  },

  async createCategory(data: Partial<Category>): Promise<Category> {
    const cat: Category = {
      id: genId('cat'),
      name: data.name || '',
      slug: data.slug || `category-${Date.now()}`,
      image: data.image || 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=600&q=80',
      icon: data.icon || 'Folder',
      productsCount: 0,
    };
    localCategories.push(cat);
    return cat;
  },

  async updateCategory(id: string, data: Partial<Category>): Promise<Category | null> {
    const idx = localCategories.findIndex(c => c.id === id);
    if (idx === -1) return null;
    localCategories[idx] = { ...localCategories[idx], ...data };
    return localCategories[idx];
  },

  async deleteCategory(id: string): Promise<boolean> {
    localCategories = localCategories.filter(c => c.id !== id);
    return true;
  },

  // ─── Brands ────────────────────────────────────────
  async getBrands() {
    return [...localBrands];
  },

  async getBrand(id: string) {
    return localBrands.find(b => b.id === id) || null;
  },

  async createBrand(data: Partial<Brand>): Promise<Brand> {
    const brand: Brand = {
      id: genId('brand'),
      name: data.name || '',
      slug: data.slug || `brand-${Date.now()}`,
      logo: data.logo || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=200&q=80',
      productsCount: 0,
    };
    localBrands.push(brand);
    return brand;
  },

  async updateBrand(id: string, data: Partial<Brand>): Promise<Brand | null> {
    const idx = localBrands.findIndex(b => b.id === id);
    if (idx === -1) return null;
    localBrands[idx] = { ...localBrands[idx], ...data };
    return localBrands[idx];
  },

  async deleteBrand(id: string): Promise<boolean> {
    localBrands = localBrands.filter(b => b.id !== id);
    return true;
  },

  // ─── Coupons ───────────────────────────────────────
  async getCoupons() {
    return [...localCoupons];
  },

  async getCoupon(id: string) {
    return localCoupons.find(c => c.id === id) || null;
  },

  async createCoupon(data: Partial<Coupon>): Promise<Coupon> {
    const coup: Coupon = {
      id: genId('coup'),
      code: data.code || 'COUPON10',
      discount: data.discount || 10,
      type: data.type || 'percentage',
      minOrder: data.minOrder || 0,
      maxDiscount: data.maxDiscount || 100,
      expiresAt: data.expiresAt || new Date(Date.now() + 30 * 86400000).toISOString(),
      usageLimit: data.usageLimit || 100,
      usedCount: 0,
    };
    localCoupons.push(coup);
    return coup;
  },

  async updateCoupon(id: string, data: Partial<Coupon>): Promise<Coupon | null> {
    const idx = localCoupons.findIndex(c => c.id === id);
    if (idx === -1) return null;
    localCoupons[idx] = { ...localCoupons[idx], ...data };
    return localCoupons[idx];
  },

  async toggleCouponActive(id: string): Promise<boolean> {
    return true;
  },

  async toggleCoupon(id: string): Promise<Coupon> {
    const idx = localCoupons.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('COUPON_NOT_FOUND');
    localCoupons[idx] = { ...localCoupons[idx], isActive: !(localCoupons[idx].isActive === false) };
    return localCoupons[idx];
  },

  async deleteCoupon(id: string): Promise<boolean> {
    localCoupons = localCoupons.filter(c => c.id !== id);
    return true;
  },

  // ─── Orders ────────────────────────────────────────
  async getOrders(status?: string, search?: string, page = 1, pageSize = 10) {
    let items = [...localOrders];
    if (status && status !== 'all') items = items.filter(o => o.status === status);
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(o => o.orderNumber.toLowerCase().includes(q));
    }
    const total = items.length;
    const start = (page - 1) * pageSize;
    return { items: items.slice(start, start + pageSize), total, totalPages: Math.ceil(total / pageSize) || 1, page };
  },

  async getOrder(id: string) {
    return localOrders.find(o => o.id === id) || null;
  },

  async updateOrderStatus(id: string, status: string, notes?: string): Promise<Order | null> {
    const idx = localOrders.findIndex(o => o.id === id);
    if (idx === -1) return null;
    localOrders[idx].status = status;
    if (notes) localOrders[idx].notes = notes;
    return localOrders[idx];
  },

  async deleteOrder(id: string): Promise<boolean> {
    localOrders = localOrders.filter(o => o.id !== id);
    return true;
  },

  // ─── Reviews ───────────────────────────────────────
  async getReviews(productId?: string, page = 1, pageSize = 10) {
    return { items: [], total: 0, totalPages: 1, page };
  },

  async deleteReview(id: string): Promise<boolean> {
    return true;
  },

  // ─── Notifications ─────────────────────────────────
  async getNotifications(page = 1, pageSize = 10) {
    return { items: localNotifications, total: localNotifications.length, totalPages: 1, page };
  },

  async createNotification(data: Partial<Notification>): Promise<Notification> {
    const notif: Notification = {
      id: genId('notif'),
      type: data.type || 'info',
      title: data.title || '',
      message: data.message || '',
      read: false,
      createdAt: new Date().toISOString(),
    };
    localNotifications.unshift(notif);
    return notif;
  },

  async markNotificationRead(id: string): Promise<boolean> {
    const idx = localNotifications.findIndex(n => n.id === id);
    if (idx !== -1) localNotifications[idx].read = true;
    return true;
  },

  async deleteNotification(id: string): Promise<boolean> {
    localNotifications = localNotifications.filter(n => n.id !== id);
    return true;
  },

  // ─── Spin Prizes ───────────────────────────────────
  async getSpinPrizes() {
    return [...localSpinPrizes];
  },

  async createSpinPrize(data: Partial<SpinPrize>): Promise<SpinPrize> {
    const prize: SpinPrize = {
      id: genId('prize'),
      label: data.label || '',
      type: data.type || 'percentage',
      value: data.value,
      couponCode: data.couponCode,
      color: data.color || '#2563EB',
      weight: data.weight || 10,
      isActive: data.isActive ?? true,
    };
    localSpinPrizes.push(prize);
    return prize;
  },

  async deleteSpinPrize(id: string): Promise<boolean> {
    localSpinPrizes = localSpinPrizes.filter(p => p.id !== id);
    return true;
  },

  async updateSpinPrize(id: string, data: Partial<SpinPrize>): Promise<SpinPrize | null> {
    const idx = localSpinPrizes.findIndex(p => p.id === id);
    if (idx === -1) return null;
    localSpinPrizes[idx] = { ...localSpinPrizes[idx], ...data };
    return localSpinPrizes[idx];
  },

  async toggleSpinPrizeActive(id: string): Promise<boolean> {
    const idx = localSpinPrizes.findIndex(p => p.id === id);
    if (idx !== -1) localSpinPrizes[idx].isActive = !localSpinPrizes[idx].isActive;
    return true;
  },

  // ─── Users ─────────────────────────────────────────
  async getUsers(search?: string, role?: string, page = 1, pageSize = 10) {
    let items = [...localUsers];
    if (role && role !== 'all') items = items.filter(u => u.role === role);
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    const total = items.length;
    return { items, total, totalPages: 1, page };
  },

  async updateUserRole(id: string, role: 'admin' | 'customer'): Promise<boolean> {
    const idx = localUsers.findIndex(u => u.id === id);
    if (idx !== -1) localUsers[idx].role = role;
    return true;
  },

  // ─── Store Settings / Announcement ────────────────
  async getAnnouncement(): Promise<AnnouncementConfig> {
    return {
      enabled: true,
      text: 'عروض الصيف المذهلة! خصومات تصل إلى 50% على تشكيلة نوى حصرياً',
      dismissible: true,
    };
  },

  async updateAnnouncement(config: Partial<AnnouncementConfig>): Promise<AnnouncementConfig> {
    return {
      enabled: config.enabled ?? true,
      text: config.text || '',
      dismissible: config.dismissible ?? true,
    };
  },

  async getStoreSettings() {
    return { ...localStoreSettings };
  },

  async updateStoreSettings(data: Partial<typeof localStoreSettings>) {
    localStoreSettings = { ...localStoreSettings, ...data };
    return { ...localStoreSettings };
  },

  // ─── Dashboard Stats ──────────────────────────────
  async getDashboardData(): Promise<DashboardData> {
    return {
      stats: {
        totalProducts: localProducts.length,
        totalOrders: localOrders.length,
        totalRevenue: 12500,
        totalUsers: localUsers.length,
        totalCategories: localCategories.length,
        totalBrands: localBrands.length,
        totalCoupons: localCoupons.length,
        pendingOrders: 0,
        lowStockProducts: 0,
      },
      monthlyRevenue: [
        { month_date: '2026-01', month_key: 'يناير', orders_count: 12, revenue: 4500 },
        { month_date: '2026-02', month_key: 'فبراير', orders_count: 18, revenue: 8000 },
      ],
      orderStatuses: [
        { status: 'delivered', count: 15 },
        { status: 'shipped', count: 3 },
      ],
      topProducts: localProducts.slice(0, 5).map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        images: p.images,
        rating: p.rating,
        reviews_count: p.reviewsCount,
        stock: p.stock,
        is_featured: p.isFeatured,
      })),
      recentOrders: [],
      lowStockProducts: [],
    };
  },

  async clearAllData(): Promise<boolean> {
    localProducts = [];
    localOrders = [];
    return true;
  },
};