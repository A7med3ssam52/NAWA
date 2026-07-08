import i18n from '@/i18n';
import {
  products as initialProducts,
  categories as initialCategories,
  brands as initialBrands,
  coupons as initialCoupons,
  orders as initialOrders,
  reviews as initialReviews,
  users as initialUsers,
  notifications as initialNotifications,
  addresses as initialAddresses,
  spinPrizes as initialSpinPrizes,
} from '@/data';
import type { Product, Category, Brand, Coupon, Order, Review, Notification, AnnouncementConfig, SpinPrize } from '@/types';

let products: Product[] = JSON.parse(JSON.stringify(initialProducts));
let categories: Category[] = JSON.parse(JSON.stringify(initialCategories));
let brands: Brand[] = JSON.parse(JSON.stringify(initialBrands));
let coupons: Coupon[] = JSON.parse(JSON.stringify(initialCoupons));
let orders: Order[] = JSON.parse(JSON.stringify(initialOrders));
let reviews: Review[] = JSON.parse(JSON.stringify(initialReviews));
let notifications: Notification[] = JSON.parse(JSON.stringify(initialNotifications));
let mutableUsers: import('@/types').User[] = JSON.parse(JSON.stringify(initialUsers));
let spinPrizes: SpinPrize[] = JSON.parse(JSON.stringify(initialSpinPrizes));

function genId(prefix: string) {
  const num = crypto.randomUUID().slice(0, 8);
  return `${prefix}-${num}`;
}

export const adminService = {
  // ─── Products ─────────────────────────────────────
  getProducts(search?: string, category?: string, brand?: string, page = 1, pageSize = 10) {
    let result = [...products];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
    }
    if (category) result = result.filter((p) => p.category === category);
    if (brand) result = result.filter((p) => p.brand === brand);
    const total = result.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const items = result.slice(start, start + pageSize);
    return { items, total, totalPages, page };
  },

  getProduct(id: string) {
    return products.find((p) => p.id === id);
  },

  createProduct(data: Partial<Product>): Product {
    const now = new Date().toISOString();
    const product: Product = {
      id: genId('prod'),
      name: data.name || '',
      slug: data.slug || '',
      description: data.description || '',
      shortDescription: data.shortDescription || '',
      price: data.price || 0,
      oldPrice: data.oldPrice || null,
      discount: data.discount || null,
      images: data.images || ['https://picsum.photos/seed/default/600/600'],
      category: data.category || '',
      brand: data.brand || '',
      rating: 0,
      reviewsCount: 0,
      stock: data.stock || 0,
      sku: data.sku || '',
      specifications: data.specifications || [],
      tags: data.tags || [],
      isNew: true,
      isFeatured: data.isFeatured || false,
      createdAt: now,
    };
    products.unshift(product);
    return product;
  },

  updateProduct(id: string, data: Partial<Product>): Product | null {
    const idx = products.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    products[idx] = { ...products[idx], ...data, id };
    return products[idx];
  },

  deleteProduct(id: string): boolean {
    const idx = products.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    products.splice(idx, 1);
    return true;
  },

  // ─── Categories ────────────────────────────────────
  getCategories() {
    return categories.map((c) => ({
      ...c,
      productsCount: products.filter((p) => p.category === c.id).length,
    }));
  },

  getCategory(id: string) {
    return categories.find((c) => c.id === id);
  },

  createCategory(data: Partial<Category>): Category {
    const cat: Category = {
      id: genId('cat'),
      name: data.name || '',
      slug: data.slug || '',
      image: data.image || 'https://picsum.photos/seed/cat/400/400',
      icon: data.icon || 'Folder',
      productsCount: 0,
    };
    categories.push(cat);
    return cat;
  },

  updateCategory(id: string, data: Partial<Category>): Category | null {
    const idx = categories.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    categories[idx] = { ...categories[idx], ...data, id };
    return categories[idx];
  },

  deleteCategory(id: string): boolean {
    const idx = categories.findIndex((c) => c.id === id);
    if (idx === -1) return false;
    categories.splice(idx, 1);
    return true;
  },

  // ─── Brands ────────────────────────────────────────
  getBrands() {
    return brands.map((b) => ({
      ...b,
      productsCount: products.filter((p) => p.brand === b.id).length,
    }));
  },

  getBrand(id: string) {
    return brands.find((b) => b.id === id);
  },

  createBrand(data: Partial<Brand>): Brand {
    const brand: Brand = {
      id: genId('brand'),
      name: data.name || '',
      slug: data.slug || '',
      logo: data.logo || 'https://picsum.photos/seed/brand/200/100',
      productsCount: 0,
    };
    brands.push(brand);
    return brand;
  },

  updateBrand(id: string, data: Partial<Brand>): Brand | null {
    const idx = brands.findIndex((b) => b.id === id);
    if (idx === -1) return null;
    brands[idx] = { ...brands[idx], ...data, id };
    return brands[idx];
  },

  deleteBrand(id: string): boolean {
    const idx = brands.findIndex((b) => b.id === id);
    if (idx === -1) return false;
    brands.splice(idx, 1);
    return true;
  },

  // ─── Coupons ───────────────────────────────────────
  getCoupons() {
    return [...coupons];
  },

  getCoupon(id: string) {
    return coupons.find((c) => c.id === id);
  },

  createCoupon(data: Partial<Coupon>): Coupon {
    const coupon: Coupon = {
      id: genId('coupon'),
      code: data.code || '',
      discount: data.discount || 0,
      type: data.type || 'percentage',
      minOrder: data.minOrder || 0,
      maxDiscount: data.maxDiscount || 0,
      expiresAt: data.expiresAt || new Date(Date.now() + 365 * 86400000).toISOString(),
      usageLimit: data.usageLimit || 100,
      usedCount: 0,
    };
    coupons.push(coupon);
    return coupon;
  },

  updateCoupon(id: string, data: Partial<Coupon>): Coupon | null {
    const idx = coupons.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    coupons[idx] = { ...coupons[idx], ...data, id };
    return coupons[idx];
  },

  deleteCoupon(id: string): boolean {
    const idx = coupons.findIndex((c) => c.id === id);
    if (idx === -1) return false;
    coupons.splice(idx, 1);
    return true;
  },

  // ─── Orders ────────────────────────────────────────
  getOrders(status?: string, search?: string, page = 1, pageSize = 10) {
    let result = [...orders];
    if (status) result = result.filter((o) => o.status === status);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((o) => o.orderNumber.toLowerCase().includes(q));
    }
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const total = result.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const items = result.slice(start, start + pageSize);
    return { items, total, totalPages, page };
  },

  getOrder(id: string) {
    return orders.find((o) => o.id === id);
  },

  updateOrderStatus(id: string, status: Order['status']): Order | null {
    const idx = orders.findIndex((o) => o.id === id);
    if (idx === -1) return null;
    orders[idx] = {
      ...orders[idx],
      status,
      updatedAt: new Date().toISOString(),
      tracking: [
        ...orders[idx].tracking,
        {
          status,
          date: new Date().toISOString(),
          description: status === 'confirmed' ? i18n.t('orders.trackingConfirmed')
            : status === 'processing' ? i18n.t('orders.trackingProcessing')
            : status === 'shipped' ? i18n.t('orders.trackingShipped')
            : status === 'delivered' ? i18n.t('orders.trackingDelivered')
            : status === 'cancelled' ? i18n.t('orders.trackingCancelled')
            : i18n.t('orders.trackingUpdated', { status }),
          completed: status === 'delivered' || status === 'cancelled',
        },
      ],
    };
    return orders[idx];
  },

  deleteOrder(id: string): boolean {
    const idx = orders.findIndex((o) => o.id === id);
    if (idx === -1) return false;
    orders.splice(idx, 1);
    return true;
  },

  // ─── Reviews ───────────────────────────────────────
  getReviews(productId?: string, page = 1, pageSize = 10) {
    let result = [...reviews];
    if (productId) result = result.filter((r) => r.productId === productId);
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const total = result.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const items = result.slice(start, start + pageSize);
    return { items, total, totalPages, page };
  },

  deleteReview(id: string): boolean {
    const idx = reviews.findIndex((r) => r.id === id);
    if (idx === -1) return false;
    reviews.splice(idx, 1);
    return true;
  },

  // ─── Notifications ─────────────────────────────────
  getNotifications(page = 1, pageSize = 20) {
    let result = [...notifications];
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const total = result.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const items = result.slice(start, start + pageSize);
    return { items, total, totalPages, page };
  },

  createNotification(data: Partial<Notification>): Notification {
    const notif: Notification = {
      id: genId('notif'),
      type: data.type || 'info',
      title: data.title || '',
      message: data.message || '',
      read: false,
      createdAt: new Date().toISOString(),
    };
    notifications.unshift(notif);
    return notif;
  },

  markNotificationRead(id: string): boolean {
    const idx = notifications.findIndex((n) => n.id === id);
    if (idx === -1) return false;
    notifications[idx].read = true;
    return true;
  },

  deleteNotification(id: string): boolean {
    const idx = notifications.findIndex((n) => n.id === id);
    if (idx === -1) return false;
    notifications.splice(idx, 1);
    return true;
  },

  // ─── Users ─────────────────────────────────────────
  getUsers(search?: string) {
    let result = [...mutableUsers];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    return result.map((u) => ({
      ...u,
      ordersCount: orders.filter((o) => u.orders.includes(o.id)).length,
    }));
  },

  // ─── Stats ─────────────────────────────────────────
  getStats() {
    const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
    const pendingOrders = orders.filter((o) => o.status === 'pending').length;
    const lowStock = products.filter((p) => p.stock < 10).length;
    return {
      totalProducts: products.length,
      totalOrders: orders.length,
      totalRevenue,
      totalUsers: mutableUsers.length,
      totalCategories: categories.length,
      totalBrands: brands.length,
      totalCoupons: coupons.length,
      pendingOrders,
      lowStockProducts: lowStock,
    };
  },

  // ─── Spin Prizes ────────────────────────────────────
  getSpinPrizes() {
    return [...spinPrizes];
  },

  getSpinPrize(id: string) {
    return spinPrizes.find((p) => p.id === id);
  },

  createSpinPrize(data: Partial<SpinPrize>): SpinPrize {
    const prize: SpinPrize = {
      id: genId('spin'),
      label: data.label || '',
      type: data.type || 'tryAgain',
      value: data.value,
      color: data.color || '#2563EB',
      weight: data.weight || 1,
      isActive: data.isActive ?? true,
    };
    spinPrizes.push(prize);
    return prize;
  },

  updateSpinPrize(id: string, data: Partial<SpinPrize>): SpinPrize | null {
    const idx = spinPrizes.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    spinPrizes[idx] = { ...spinPrizes[idx], ...data, id };
    return spinPrizes[idx];
  },

  deleteSpinPrize(id: string): boolean {
    const idx = spinPrizes.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    spinPrizes.splice(idx, 1);
    return true;
  },

  // ─── Announcement Bar ──────────────────────────────
  _announcement: {
    text: i18n.t('home.freeDeliveryAnnouncement'),
    enabled: true,
    dismissible: true,
  } as AnnouncementConfig,

  getAnnouncement(): AnnouncementConfig {
    return this._announcement;
  },

  updateAnnouncement(config: Partial<AnnouncementConfig>): AnnouncementConfig {
    this._announcement = { ...this._announcement, ...config };
    return { ...this._announcement };
  },
};
