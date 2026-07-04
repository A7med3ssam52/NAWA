import { useQuery } from '@tanstack/react-query';
import { productService } from '@/services';
import type { FilterState } from '@/types';

export function useProducts(filters: Partial<FilterState>) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => productService.getAll(filters),
    staleTime: 30000,
  });
}

export function useFeaturedProducts() {
  return useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => productService.getFeatured(),
    staleTime: 60000,
  });
}

export function useNewProducts() {
  return useQuery({
    queryKey: ['products', 'new'],
    queryFn: () => productService.getNew(),
    staleTime: 60000,
  });
}

export function useDiscountedProducts() {
  return useQuery({
    queryKey: ['products', 'discounted'],
    queryFn: () => productService.getDiscounted(),
    staleTime: 60000,
  });
}

export function useBestSellingProducts() {
  return useQuery({
    queryKey: ['products', 'best-selling'],
    queryFn: () => productService.getBestSelling(),
    staleTime: 60000,
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: () => productService.getBySlug(slug),
    enabled: !!slug,
    staleTime: 60000,
  });
}

export function useRelatedProducts(productId: string) {
  return useQuery({
    queryKey: ['products', 'related', productId],
    queryFn: () => productService.getRelated(productId),
    enabled: !!productId,
    staleTime: 60000,
  });
}
