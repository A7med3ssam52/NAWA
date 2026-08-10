import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services';
import { INITIAL_TESTIMONIALS } from '@/data/mockData';
import type { Review } from '@/types';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => adminService.getCategories(),
    staleTime: 30000,
  });
}

export function useBrands() {
  return useQuery({
    queryKey: ['brands'],
    queryFn: () => adminService.getBrands(),
    staleTime: 30000,
  });
}

export function useTestimonials() {
  return useQuery({
    queryKey: ['testimonials'],
    queryFn: async () => INITIAL_TESTIMONIALS,
    staleTime: 30000,
  });
}

export function useProductReviews(productId: string | undefined) {
  return useQuery({
    queryKey: ['product-reviews', productId],
    queryFn: async (): Promise<Review[]> => [],
    enabled: !!productId,
    staleTime: 30000,
  });
}