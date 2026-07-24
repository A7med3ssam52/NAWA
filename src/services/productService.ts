import { supabase } from '@/lib/supabase';
import type { Product, FilterState } from '@/types';
import {
  products as localProducts,
  getNewProducts as getLocalNew,
  getFeaturedProducts as getLocalFeatured,
  getDiscountedProducts as getLocalDiscounted,
  getBestSellingProducts as getLocalBestSelling,
  getRelatedProducts as getLocalRelated,
  filterProducts as localFilterProducts,
} from '@/data';

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

export const productService = {
  getAll: async (filters: Partial<FilterState>) => {
    let query = supabase.from('products').select('*', { count: 'exact' });
    const { search, category, brand, priceMin, priceMax, sort, page = 1, pageSize = 12 } = filters;

    if (search) {
      const q = search.toLowerCase();
      query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`);
    }
    if (category?.length) query = query.in('category_id', category);
    if (brand?.length) query = query.in('brand_id', brand);
    if (priceMin !== undefined) query = query.gte('price', priceMin);
    if (priceMax !== undefined) query = query.lte('price', priceMax);

    if (sort === 'price-asc') query = query.order('price', { ascending: true });
    else if (sort === 'price-desc') query = query.order('price', { ascending: false });
    else if (sort === 'rating') query = query.order('rating', { ascending: false });
    else query = query.order('created_at', { ascending: false });

    const start = (page - 1) * pageSize;
    const { data, error, count } = await query.range(start, start + pageSize - 1);

    if (!error && data !== null && data.length > 0) {
      const mapped = (data as any[]).map(mapProduct);
      return { items: mapped, total: count || data.length, totalPages: Math.ceil((count || data.length) / pageSize), page, pageSize };
    }
    // Fallback to local data
    return localFilterProducts(filters);
  },

  getBySlug: async (slug: string) => {
    const { data } = await supabase.from('products').select('*').eq('slug', slug).single();
    if (data) return mapProduct(data as any);
    return localProducts.find((p) => p.slug === slug) || null;
  },

  getById: async (id: string) => {
    const { data } = await supabase.from('products').select('*').eq('id', id).single();
    if (data) return mapProduct(data as any);
    return localProducts.find((p) => p.id === id) || null;
  },

  getFeatured: async () => {
    const { data, error } = await supabase.from('products').select('*').eq('is_featured', true);
    if (!error && data !== null && data.length > 0) return (data as any[]).map(mapProduct);
    return getLocalFeatured();
  },

  getNew: async () => {
    const { data, error } = await supabase.from('products').select('*').eq('is_new', true);
    if (!error && data !== null && data.length > 0) return (data as any[]).map(mapProduct);
    return getLocalNew();
  },

  getDiscounted: async () => {
    const { data, error } = await supabase.from('products').select('*').not('discount', 'is', null).gt('discount', 0);
    if (!error && data !== null && data.length > 0) return (data as any[]).map(mapProduct);
    return getLocalDiscounted();
  },

  getBestSelling: async () => {
    const { data, error } = await supabase.from('products').select('*').order('reviews_count', { ascending: false }).limit(8);
    if (!error && data !== null && data.length > 0) return (data as any[]).map(mapProduct);
    return getLocalBestSelling();
  },

  getRelated: async (productId: string) => {
    const product = await productService.getById(productId);
    if (!product) return [];
    const { data, error } = await supabase.from('products').select('*').eq('category_id', product.category).neq('id', productId);
    if (!error && data !== null && data.length > 0) return (data as any[]).map(mapProduct);
    // Fallback: use local helper which already filters by category
    return getLocalRelated(productId);
  },
};