import i18n from '@/i18n';
import { supabase } from '@/lib/supabase';
import type { Product, Category, Brand, Review, Order, Notification, Coupon, Address, Testimonial, SpinPrize, User } from '@/types';
import productsData from './products.json';
import categoriesData from './categories.json';
import brandsData from './brands.json';

let products: Product[] = productsData as Product[];
let categories: Category[] = categoriesData as Category[];
let brands: Brand[] = brandsData as Brand[];
let reviews: Review[] = [];
let users: User[] = [];
let orders: Order[] = [];
let notifications: Notification[] = [];
let coupons: Coupon[] = [];
let addresses: Address[] = [];
let testimonials: Testimonial[] = [];
let spinPrizes: SpinPrize[] = [];

let loaded = false;

async function loadTable<T>(table: string): Promise<T[]> {
  const { data, error } = await supabase.from(table).select('*');
  if (error || !data) return [];
  return data as unknown as T[];
}

export async function loadAllData() {
  if (loaded) return;
  loaded = true;
  try {
    const [p, c, b, r, u, o, n, co, a, t, s] = await Promise.all([
      loadTable<Product>('products'),
      loadTable<Category>('categories'),
      loadTable<Brand>('brands'),
      loadTable<Review>('reviews'),
      loadTable<User>('profiles'),
      loadTable<Order>('orders'),
      loadTable<Notification>('notifications'),
      loadTable<Coupon>('coupons'),
      loadTable<Address>('addresses'),
      loadTable<Testimonial>('testimonials'),
      loadTable<SpinPrize>('spin_prizes'),
    ]);
    if (p.length > 0) products = p;
    if (c.length > 0) categories = c;
    if (b.length > 0) brands = b;
    reviews = r; users = u; orders = o; notifications = n;
    coupons = co; addresses = a; testimonials = t; spinPrizes = s;
  } catch (e) {
    console.warn('Supabase load failed, using local data', e);
  }
}

export function setProductsData(p: Product[]) { products = p; }
export function setCategoriesData(c: Category[]) { categories = c; }
export function setBrandsData(b: Brand[]) { brands = b; }
export function setReviewsData(r: Review[]) { reviews = r; }
export function setUsersData(u: User[]) { users = u; }
export function setOrdersData(o: Order[]) { orders = o; }
export function setNotificationsData(n: Notification[]) { notifications = n; }
export function setCouponsData(c: Coupon[]) { coupons = c; }
export function setAddressesData(a: Address[]) { addresses = a; }
export function setSpinPrizesData(s: SpinPrize[]) { spinPrizes = s; }

export {
  products, categories, brands, reviews, users,
  orders, notifications, coupons, addresses,
  testimonials, spinPrizes,
};

export const getProductById = (id: string) =>
  products.find((p) => p.id === id);

export const getProductBySlug = (slug: string) =>
  products.find((p) => p.slug === slug);

export const getCategoryBySlug = (slug: string) =>
  categories.find((c) => c.slug === slug);

export const getProductsByCategory = (categorySlug: string) => {
  const category = getCategoryBySlug(categorySlug);
  if (!category) return [];
  return products.filter((p) => p.category === category.id);
};

export const getProductsByBrand = (brandSlug: string) => {
  const brand = brands.find((b) => b.slug === brandSlug);
  if (!brand) return [];
  return products.filter((p) => p.brand === brand.id);
};

export const getFeaturedProducts = () =>
  products.filter((p) => p.isFeatured);

export const getNewProducts = () =>
  products.filter((p) => p.isNew);

export const getDiscountedProducts = () =>
  products.filter((p) => p.discount && p.discount > 0);

export const getBestSellingProducts = () =>
  [...products].sort((a, b) => b.reviewsCount - a.reviewsCount).slice(0, 8);

export const getRelatedProducts = (productId: string) => {
  const product = getProductById(productId);
  if (!product) return [];
  return products.filter(
    (p) => p.category === product.category && p.id !== productId
  );
};

export const getProductReviews = (productId: string) =>
  reviews.filter((r) => r.productId === productId);

export const getUser = (userId: string) =>
  users.find((u) => u.id === userId);

export const getUserOrders = (userId: string) => {
  const user = getUser(userId);
  const byUserId = orders.filter((o) => o.userId === userId);
  if (byUserId.length > 0) return byUserId;
  if (!user) return [];
  return orders.filter((o) => user.orders?.includes(o.id));
};

export const getOrderById = (orderId: string) =>
  orders.find((o) => o.id === orderId);

export const getCouponByCode = (code: string) =>
  coupons.find(
    (c) => c.code === code.toUpperCase() && new Date(c.expiresAt) > new Date()
  );

export const getUserNotifications = (userId: string) => {
  const user = getUser(userId);
  const byUserId = notifications.filter((n) => n.userId === userId);
  if (byUserId.length > 0) return byUserId;
  if (!user) return [];
  return notifications.filter((n) => user.notifications?.includes(n.id));
};

export const getUserAddresses = (userId: string) => {
  const user = getUser(userId);
  const byUserId = addresses.filter((a) => a.userId === userId);
  if (byUserId.length > 0) return byUserId;
  if (!user) return [];
  return addresses.filter((a) => user.addresses?.includes(a.id));
};

export const getCartItemTotal = (quantity: number, price: number) =>
  quantity * price;

export const getCartSubtotal = (items: { quantity: number; price: number }[]) =>
  items.reduce((sum, item) => sum + item.quantity * item.price, 0);

export const getDiscountedPrice = (price: number, discount?: number | null) =>
  discount ? price - (price * discount) / 100 : price;

export const getDashboardStats = () => {
  const totalProducts = products.length;
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const totalUsers = users.length;
  const totalBrands = brands.length;
  const totalCategories = categories.length;
  const totalCoupons = coupons.length;
  const pendingOrders = orders.filter((o) => o.status === 'pending').length;
  const lowStockProducts = products.filter((p) => p.stock < 10).length;

  const monthlyRevenue: { month: string; revenue: number; orders: number }[] = [];
  const months = i18n.t('utils.months', { returnObjects: true }) as string[];
  const monthMap = new Map<string, { revenue: number; orders: number }>();

  orders.forEach((o) => {
    const d = new Date(o.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = `${months[d.getMonth()]} ${d.getFullYear()}`;
    if (!monthMap.has(label)) monthMap.set(label, { revenue: 0, orders: 0 });
    const entry = monthMap.get(label)!;
    entry.revenue += o.total;
    entry.orders += 1;
  });

  monthMap.forEach((val, key) => {
    monthlyRevenue.push({ month: key, revenue: val.revenue, orders: val.orders });
  });
  monthlyRevenue.sort((a, b) => {
    const [aM, aY] = a.month.split(' ');
    const [bM, bY] = b.month.split(' ');
    const ma = months.indexOf(aM) + (aY ? parseInt(aY) * 12 : 0);
    const mb = months.indexOf(bM) + (bY ? parseInt(bY) * 12 : 0);
    return ma - mb;
  });

  const categoryDistribution = categories.map((c) => ({
    name: c.name,
    count: products.filter((p) => p.category === c.id).length,
  }));

  const topProducts = [...products].sort((a, b) => b.reviewsCount - a.reviewsCount).slice(0, 5);
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const orderStatusDistribution = [
    { status: 'pending', count: orders.filter((o) => o.status === 'pending').length },
    { status: 'confirmed', count: orders.filter((o) => o.status === 'confirmed').length },
    { status: 'processing', count: orders.filter((o) => o.status === 'processing').length },
    { status: 'shipped', count: orders.filter((o) => o.status === 'shipped').length },
    { status: 'delivered', count: orders.filter((o) => o.status === 'delivered').length },
    { status: 'cancelled', count: orders.filter((o) => o.status === 'cancelled').length },
  ];

  return {
    totalProducts, totalOrders, totalRevenue, totalUsers,
    totalBrands, totalCategories, totalCoupons,
    pendingOrders, lowStockProducts, monthlyRevenue,
    categoryDistribution, topProducts, recentOrders, orderStatusDistribution,
  };
};

export type DashboardStats = ReturnType<typeof getDashboardStats>;

export const filterProducts = (filters: {
  category?: string[];
  brand?: string[];
  priceMin?: number;
  priceMax?: number;
  rating?: number | null;
  discount?: number | null;
  inStock?: boolean;
  sort?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}) => {
  const { search, category, brand, priceMin, priceMax, rating, discount, inStock, sort, page = 1, pageSize = 12 } = filters;
  const q = search?.toLowerCase();
  const catSet = category?.length ? new Set(category) : null;
  const brandSet = brand?.length ? new Set(brand) : null;

  const filtered = products.filter((p) => {
    if (q && !p.name.toLowerCase().includes(q) && !p.description.toLowerCase().includes(q) && !p.tags.some((t) => t.toLowerCase().includes(q))) return false;
    if (catSet && !catSet.has(p.category)) return false;
    if (brandSet && !brandSet.has(p.brand)) return false;
    if (priceMin !== undefined && p.price < priceMin) return false;
    if (priceMax !== undefined && p.price > priceMax) return false;
    if (rating && p.rating < rating) return false;
    if (discount && (p.discount || 0) < discount) return false;
    if (inStock && p.stock <= 0) return false;
    return true;
  });

  if (sort) {
    switch (sort) {
      case 'price-asc': filtered.sort((a, b) => a.price - b.price); break;
      case 'price-desc': filtered.sort((a, b) => b.price - a.price); break;
      case 'rating': filtered.sort((a, b) => b.rating - a.rating); break;
      case 'popular': filtered.sort((a, b) => b.reviewsCount - a.reviewsCount); break;
      case 'discount': filtered.sort((a, b) => (b.discount || 0) - (a.discount || 0)); break;
      default: filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  }

  const total = filtered.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);

  return { items, total, totalPages, page, pageSize };
};
