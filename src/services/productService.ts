import { filterProducts, getProductBySlug, getProductById, getFeaturedProducts, getNewProducts, getDiscountedProducts, getBestSellingProducts, getRelatedProducts } from '@/data';
import type { FilterState } from '@/types';

export const productService = {
  getAll: (filters: Partial<FilterState>) => {
    return filterProducts({
      category: filters.category,
      brand: filters.brand,
      priceMin: filters.priceMin,
      priceMax: filters.priceMax,
      rating: filters.rating,
      discount: filters.discount,
      inStock: filters.inStock,
      sort: filters.sort,
      search: filters.search,
      page: filters.page,
      pageSize: filters.pageSize,
    });
  },

  getBySlug: (slug: string) => getProductBySlug(slug),

  getById: (id: string) => getProductById(id),

  getFeatured: () => getFeaturedProducts(),

  getNew: () => getNewProducts(),

  getDiscounted: () => getDiscountedProducts(),

  getBestSelling: () => getBestSellingProducts(),

  getRelated: (productId: string) => getRelatedProducts(productId),
};
