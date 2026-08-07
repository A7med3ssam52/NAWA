import { useQuery } from '@tanstack/react-query';
import { orderService } from '@/services';

export function useMyOrders(userId: string | undefined) {
  return useQuery({
    queryKey: ['my-orders', userId],
    queryFn: () => orderService.getUserOrders(userId as string),
    enabled: !!userId,
  });
}

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => orderService.getById(id as string),
    enabled: !!id,
  });
}