import i18n from '@/i18n';

export const SITE_NAME = () => i18n.t('common.siteName');
export const SITE_DESCRIPTION = () => i18n.t('common.siteDescription');
export const SITE_URL = 'https://zahieg.com';

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
  LOGIN: '/login',
  ORDER_SUCCESS: '/order-success/:orderId',
  PROFILE: '/profile',
  MY_ORDERS: '/profile/orders',
  ORDER_DETAILS: '/profile/orders/:orderId',
  ADDRESSES: '/profile/addresses',
  NOTIFICATIONS: '/profile/notifications',
  SETTINGS: '/profile/settings',
  ABOUT: '/about',
  CONTACT: '/contact',
  CONTACTS: '/contacts',
  FAQ: '/faq',
  PRIVACY: '/privacy',
  TERMS: '/terms',
  PAYMENT: '/payment',
  SHIPPING: '/shipping',
  RETURNS: '/returns',
  COMPARE: '/compare',
  INVOICE: '/profile/orders/:orderId/invoice',
} as const;

export function getOrderStatusMap(): Record<string, { label: string; color: string; icon: string }> {
  return {
    pending: { label: i18n.t('orders.pending'), color: 'text-yellow-500', icon: 'Clock' },
    confirmed: { label: i18n.t('orders.confirmed'), color: 'text-blue-500', icon: 'CheckCircle' },
    processing: { label: i18n.t('orders.processing'), color: 'text-indigo-500', icon: 'Package' },
    shipped: { label: i18n.t('orders.shipped'), color: 'text-purple-500', icon: 'Truck' },
    delivered: { label: i18n.t('orders.delivered'), color: 'text-green-500', icon: 'PackageCheck' },
    cancelled: { label: i18n.t('orders.cancelled'), color: 'text-red-500', icon: 'XCircle' },
  };
}

export function getSortOptions() {
  return [
    { value: 'newest', label: i18n.t('products.sortNewest') },
    { value: 'price-asc', label: i18n.t('products.sortPriceAsc') },
    { value: 'price-desc', label: i18n.t('products.sortPriceDesc') },
    { value: 'rating', label: i18n.t('products.sortRating') },
    { value: 'popular', label: i18n.t('products.sortPopular') },
    { value: 'discount', label: i18n.t('products.sortDiscount') },
  ];
}

export const PAGE_SIZE = 12;

export const CURRENCY = () => i18n.t('common.currency');
export const FREE_SHIPPING_THRESHOLD = 500;
export const SHIPPING_COST = 30;
export const TAX_RATE = 0.14;

export const INSTAPAY_PHONE = '01091202785';
export const WALLET_PHONE = '01037223730';
export const PAYMENT_METHODS = { INSTAPAY: 'instapay', WALLET: 'wallet', COD: 'cod' } as const;


export const COLORS = {
  primary: '#0F172A',
  secondary: '#2563EB',
  accent: '#F59E0B',
  success: '#22C55E',
  danger: '#EF4444',
  background: '#F8FAFC',
  card: '#FFFFFF',
} as const;

export const EGYPT_GOVERNORATES = [
  'القاهرة',
  'الجيزة',
  'الإسكندرية',
  'الدقهلية',
  'البحيرة',
  'الشرقية',
  'الغربية',
  'المنوفية',
  'القليوبية',
  'كفر الشيخ',
  'دمياط',
  'الإسماعيلية',
  'بورسعيد',
  'السويس',
  'شمال سيناء',
  'جنوب سيناء',
  'بني سويف',
  'الفيوم',
  'المنيا',
  'أسيوط',
  'سوهاج',
  'قنا',
  'الأقصر',
  'أسوان',
  'البحر الأحمر',
  'الوادي الجديد',
  'مطروح',
] as const;
