import type {
  Product,
  Category,
  Brand,
  Coupon,
  Order,
  Review,
  Notification,
  SpinPrize,
  SpinPrizeType,
  Testimonial,
  User,
  Address,
} from '@/types';

export const SPIN_TYPE_MAP: Record<string, string> = {
  percentage: 'percentage',
  fixed: 'fixed',
  freeShipping: 'free_shipping',
  tryAgain: 'try_again',
};

export const SPIN_TYPE_REVERSE: Record<string, SpinPrizeType> = {
  percentage: 'percentage',
  fixed: 'fixed',
  free_shipping: 'freeShipping',
  try_again: 'tryAgain',
};

export function mapProduct(data: any): Product {
  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    description: data.description || '',
    shortDescription: data.short_description || '',
    price: Number(data.price) || 0,
    oldPrice: data.old_price ? Number(data.old_price) : null,
    discount: data.discount || null,
    images: data.images || [],
    category: data.category_id || '',
    brand: data.brand_id || '',
    rating: Number(data.rating) || 0,
    reviewsCount: data.reviews_count || 0,
    stock: data.stock || 0,
    sku: data.sku || '',
    specifications: data.specifications || [],
    tags: data.tags || [],
    isNew: !!data.is_new,
    isFeatured: !!data.is_featured,
    colors: data.colors || [],
    sizes: data.sizes || [],
    stockByColor: data.stock_by_color || {},
    stockBySize: data.stock_by_size || {},
    createdAt: data.created_at || new Date().toISOString(),
  };
}

export function mapCategory(data: any): Category {
  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    image: data.image || '',
    icon: data.icon || 'Folder',
    productsCount: Number(data.products?.[0]?.count) || Number(data.products_count) || 0,
  };
}

export function mapBrand(data: any): Brand {
  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    logo: data.logo || '',
    productsCount: Number(data.products?.[0]?.count) || Number(data.products_count) || 0,
  };
}

export function mapCoupon(data: any): Coupon {
  return {
    id: data.id,
    code: data.code || '',
    discount: Number(data.discount) || 0,
    type: data.type || 'percentage',
    minOrder: Number(data.min_order) || 0,
    maxDiscount: data.max_discount ? Number(data.max_discount) : 0,
    expiresAt: data.expires_at || new Date(Date.now() + 365 * 86400000).toISOString(),
    usageLimit: data.usage_limit ?? 0,
    usedCount: data.used_count || 0,
  };
}

export function mapOrder(data: any): Order {
  return {
    id: data.id,
    userId: data.user_id || undefined,
    orderNumber: data.order_number || '',
    status: data.status || 'pending',
    items: data.items || [],
    total: Number(data.total) || 0,
    subtotal: Number(data.subtotal) || 0,
    shipping: Number(data.shipping) || 0,
    discount: Number(data.discount) || 0,
    couponCode: data.coupon_code || undefined,
    shippingAddress: data.shipping_address || { fullName: '', phone: '', street: '', city: '', state: '' },
    paymentMethod: data.payment_method || '',
    notes: data.notes || '',
    createdAt: data.created_at || new Date().toISOString(),
    updatedAt: data.updated_at || new Date().toISOString(),
    tracking: data.tracking || [],
  };
}

export function mapReview(data: any): Review {
  return {
    id: data.id,
    productId: data.product_id,
    userId: data.user_id || '',
    userName: data.user_name || '',
    userAvatar: data.user_avatar || '',
    rating: data.rating,
    title: data.title || '',
    comment: data.comment || '',
    createdAt: data.created_at || new Date().toISOString(),
    likes: data.likes || 0,
  };
}

export function mapNotification(data: any): Notification {
  return {
    id: data.id,
    userId: data.user_id || undefined,
    type: data.type || 'info',
    title: data.title || '',
    message: data.message || '',
    read: !!data.read,
    createdAt: data.created_at || new Date().toISOString(),
  };
}

export function mapAddress(data: any): Address {
  return {
    id: data.id,
    userId: data.user_id || undefined,
    label: data.label || 'Home',
    fullName: data.full_name || '',
    phone: data.phone || '',
    street: data.street || '',
    city: data.city || '',
    state: data.state || '',
    isDefault: !!data.is_default,
  };
}

export function mapProfile(data: any): User {
  return {
    id: data.id,
    name: data.name || '',
    email: data.email || '',
    phone: data.phone || '',
    avatar: data.avatar || '',
    role: data.role || 'customer',
    addresses: data.addresses || [],
    orders: data.orders || [],
    wishlist: data.wishlist || [],
    notifications: data.notifications || [],
  };
}

export function mapTestimonial(data: any): Testimonial {
  return {
    id: data.id,
    name: data.name || '',
    avatar: data.avatar || '',
    rating: Number(data.rating) || 0,
    comment: data.comment || '',
    role: data.role || '',
  };
}

export function mapSpinPrize(data: any): SpinPrize {
  return {
    id: data.id,
    label: data.label || '',
    type: SPIN_TYPE_REVERSE[data.type] || data.type || 'tryAgain',
    value: data.value,
    couponCode: data.coupon_code || undefined,
    color: data.color || '#2563EB',
    weight: data.weight || 1,
    isActive: data.is_active ?? true,
  };
}