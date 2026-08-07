import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { adminService } from '@/services';
import { mapCategory, mapBrand, mapTestimonial, mapReview } from '@/lib/mappers';

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
    queryFn: async () => {
      const { data, error } = await supabase.from('testimonials').select('*');
      if (!error && data) return (data as any[]).map(mapTestimonial);
      return [];
    },
    staleTime: 30000,
  });
}

export function useProductReviews(productId: string | undefined) {
  return useQuery({
    queryKey: ['product-reviews', productId],
    queryFn: async () => {
      if (!productId) return [];
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });
      if (!error && data) return (data as any[]).map(mapReview);
      return [];
    },
    enabled: !!productId,
    staleTime: 30000,
  });
}