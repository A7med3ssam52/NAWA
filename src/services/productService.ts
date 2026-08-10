import type { Product, FilterState } from '@/types';
import { INITIAL_PRODUCTS } from '@/data/mockData';

let localProducts: Product[] = [...INITIAL_PRODUCTS];

export const productService = {
  async getAll(filters: Partial<FilterState>) {
    const { search, category, brand, priceMin, priceMax, rating, discount, inStock, sort, page = 1, pageSize = 12 } = filters;

    let items = [...localProducts];

    if (category?.length) {
      items = items.filter(p => category.includes(p.category) || (p.categoryIds && p.categoryIds.some(c => category.includes(c))));
    }

    if (search) {
      const q = search.toLowerCase();
      items = items.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }

    if (brand?.length) {
      items = items.filter(p => brand.includes(p.brand));
    }

    if (priceMin !== undefined && priceMin > 0) {
      items = items.filter(p => p.price >= priceMin);
    }

    if (priceMax !== undefined && priceMax > 0) {
      items = items.filter(p => p.price <= priceMax);
    }

    if (rating != null && rating > 0) {
      items = items.filter(p => p.rating >= rating);
    }

    if (discount != null && discount > 0) {
      items = items.filter(p => (p.discount || 0) >= discount);
    }

    if (inStock) {
      items = items.filter(p => p.stock > 0);
    }

    if (sort === 'price-asc') items.sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') items.sort((a, b) => b.price - a.price);
    else if (sort === 'rating') items.sort((a, b) => b.rating - a.rating);
    else if (sort === 'popular') items.sort((a, b) => b.reviewsCount - a.reviewsCount);
    else if (sort === 'discount') items.sort((a, b) => (b.discount || 0) - (a.discount || 0));

    const total = items.length;
    const start = (page - 1) * pageSize;
    const paginatedItems = items.slice(start, start + pageSize);

    return {
      items: paginatedItems,
      total,
      totalPages: Math.ceil(total / pageSize) || 1,
      page,
      pageSize,
    };
  },

  async getBySlug(slug: string): Promise<Product | null> {
    return localProducts.find(p => p.slug === slug) || localProducts[0] || null;
  },

  async getById(id: string): Promise<Product | null> {
    return localProducts.find(p => p.id === id) || null;
  },

  async getFeatured(): Promise<Product[]> {
    return localProducts.filter(p => p.isFeatured);
  },

  async getNew(): Promise<Product[]> {
    return localProducts.filter(p => p.isNew);
  },

  async getDiscounted(): Promise<Product[]> {
    return localProducts.filter(p => p.discount && p.discount > 0);
  },

  async getBestSelling(): Promise<Product[]> {
    return [...localProducts].sort((a, b) => b.reviewsCount - a.reviewsCount).slice(0, 8);
  },

  async getRelated(productId: string): Promise<Product[]> {
    const product = localProducts.find(p => p.id === productId);
    if (!product) return localProducts.slice(0, 4);
    return localProducts.filter(p => p.id !== productId && p.category === product.category).slice(0, 4);
  },
};