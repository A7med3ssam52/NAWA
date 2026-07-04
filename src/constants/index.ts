export const SITE_NAME = 'زاهي';
export const SITE_DESCRIPTION = 'زاهي - أناقة تزهو بك';
export const SITE_URL = 'https://zahi.store';

export const API_BASE_URL = '/api';

export const PAGES = {
  HOME: '/',
  PRODUCTS: '/products',
  PRODUCT_DETAILS: '/products/:slug',
  CATEGORIES: '/categories',
  CATEGORY_PRODUCTS: '/categories/:slug',
  OFFERS: '/offers',
  SEARCH: '/search',
  WISHLIST: '/wishlist',
  CART: '/cart',
  CHECKOUT: '/checkout',
  ORDER_SUCCESS: '/order-success/:orderId',
  PROFILE: '/profile',
  MY_ORDERS: '/profile/orders',
  ORDER_DETAILS: '/profile/orders/:orderId',
  ADDRESSES: '/profile/addresses',
  NOTIFICATIONS: '/profile/notifications',
  SETTINGS: '/profile/settings',
  ABOUT: '/about',
  CONTACT: '/contact',
  FAQ: '/faq',
  PRIVACY: '/privacy',
  TERMS: '/terms',
  PAYMENT: '/payment',
  SHIPPING: '/shipping',
  RETURNS: '/returns',
  COMPARE: '/compare',
  INVOICE: '/profile/orders/:orderId/invoice',
} as const;

export const ORDER_STATUS_MAP: Record<string, { label: string; color: string; icon: string }> = {
  pending: { label: 'قيد الانتظار', color: 'text-yellow-500', icon: 'Clock' },
  confirmed: { label: 'تم التأكيد', color: 'text-blue-500', icon: 'CheckCircle' },
  processing: { label: 'قيد التجهيز', color: 'text-indigo-500', icon: 'Package' },
  shipped: { label: 'تم الشحن', color: 'text-purple-500', icon: 'Truck' },
  delivered: { label: 'تم التوصيل', color: 'text-green-500', icon: 'PackageCheck' },
  cancelled: { label: 'ملغي', color: 'text-red-500', icon: 'XCircle' },
};

export const SORT_OPTIONS = [
  { value: 'newest', label: 'الأحدث' },
  { value: 'price-asc', label: 'السعر: من الأقل للأعلى' },
  { value: 'price-desc', label: 'السعر: من الأعلى للأقل' },
  { value: 'rating', label: 'التقييم' },
  { value: 'popular', label: 'الأكثر مبيعاً' },
  { value: 'discount', label: 'أعلى خصم' },
];

export const PAGE_SIZE = 12;

export const CURRENCY = 'ج.م';
export const FREE_SHIPPING_THRESHOLD = 500;
export const SHIPPING_COST = 30;
export const TAX_RATE = 0.14;

export const COLORS = {
  primary: '#0F172A',
  secondary: '#2563EB',
  accent: '#F59E0B',
  success: '#22C55E',
  danger: '#EF4444',
  background: '#F8FAFC',
  card: '#FFFFFF',
} as const;
