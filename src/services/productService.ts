import { supabase } from '@/lib/supabase';
import type { Product, FilterState } from '@/types';
import { mapProduct } from '@/lib/mappers';

export const productService = {
  async getAll(filters: Partial<FilterState>) {
    const { search, category, brand, priceMin, priceMax, sort, page = 1, pageSize = 12 } = filters;

    let query;
    if (category?.length) {
      query = supabase.from('products')
        .select('*, product_categories!inner(category_id)', { count: 'exact' })
        .in('product_categories.category_id', category);
    } else {
      query = supabase.from('products').select('*', { count: 'exact' });
    }

    if (search) {
      const q = search.toLowerCase();
      query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`);
    }
    if (brand?.length) query = query.in('brand_id', brand);
    if (priceMin !== undefined && priceMin > 0) query = query.gte('price', priceMin);
    if (priceMax !== undefined && priceMax > 0) query = query.lte('price', priceMax);

    if (sort === 'price-asc') query = query.order('price', { ascending: true });
    else if (sort === 'price-desc') query = query.order('price', { ascending: false });
    else if (sort === 'rating') query = query.order('rating', { ascending: false });
    else query = query.order('created_at', { ascending: false });

    const start = (page - 1) * pageSize;
    const { data, error, count } = await query.range(start, start + pageSize - 1);

    const rows = !error && data ? (data as any[]) : [];
    return {
      items: rows.map(mapProduct),
      total: count || rows.length,
      totalPages: Math.ceil((count || rows.length) / pageSize),
      page,
      pageSize,
    };
  },

  async getBySlug(slug: string): Promise<Product | null> {
    const { data, error } = await supabase.from('products').select('*').eq('slug', slug).maybeSingle();
    if (!error && data) return mapProduct(data as any);
    return null;
  },

  async getById(id: string): Promise<Product | null> {
    const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle();
    if (!error && data) return mapProduct(data as any);
    return null;
  },

  async getFeatured(): Promise<Product[]> {
    const { data, error } = await supabase.from('products').select('*').eq('is_featured', true);
    if (!error && data) return (data as any[]).map(mapProduct);
    return [];
  },

  async getNew(): Promise<Product[]> {
    const { data, error } = await supabase.from('products').select('*').eq('is_new', true);
    if (!error && data) return (data as any[]).map(mapProduct);
    return [];
  },

  async getDiscounted(): Promise<Product[]> {
    const { data, error } = await supabase.from('products').select('*').not('discount', 'is', null).gt('discount', 0);
    if (!error && data) return (data as any[]).map(mapProduct);
    return [];
  },

  async getBestSelling(): Promise<Product[]> {
    const { data, error } = await supabase.from('products').select('*').order('reviews_count', { ascending: false }).limit(8);
    if (!error && data) return (data as any[]).map(mapProduct);
    return [];
  },

  async getRelated(productId: string): Promise<Product[]> {
    const product = await productService.getById(productId);
    if (!product) return [];
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('category_id', product.category)
      .neq('id', productId)
      .order('created_at', { ascending: false });
    if (!error && data) return (data as any[]).map(mapProduct);
    return [];
  },
};