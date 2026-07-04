export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  oldPrice: number | null;
  discount: number | null;
  images: string[];
  category: string;
  brand: string;
  rating: number;
  reviewsCount: number;
  stock: number;
  sku: string;
  specifications: Specification[];
  tags: string[];
  isNew: boolean;
  isFeatured: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  icon: string;
  productsCount: number;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo: string;
  productsCount: number;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
  likes: number;
}

export interface Specification {
  label: string;
  value: string;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
}

export interface WishlistItem {
  id: string;
  product: Product;
  addedAt: string;
}

export interface Address {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: string;
  items: OrderItem[];
  total: number;
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  couponCode?: string;
  shippingAddress: Address;
  paymentMethod: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  tracking: TrackingEvent[];
}

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
}

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface TrackingEvent {
  status: string;
  date: string;
  description: string;
  completed: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  addresses: string[];
  orders: string[];
  wishlist: string[];
  notifications: string[];
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount: number;
  type: string;
  minOrder: number;
  maxDiscount: number;
  expiresAt: string;
  usageLimit: number;
  usedCount: number;
}

export interface Testimonial {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  comment: string;
  role: string;
}

export interface FilterState {
  category: string[];
  brand: string[];
  priceMin: number;
  priceMax: number;
  rating: number | null;
  discount: number | null;
  inStock: boolean;
  sort: string;
  search: string;
  page: number;
  pageSize: number;
}

export interface SearchSuggestion {
  text: string;
  type: 'product' | 'category' | 'brand';
  id?: string;
}
