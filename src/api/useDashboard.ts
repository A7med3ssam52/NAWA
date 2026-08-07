import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services';

export function useDashboard() {
  return useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => adminService.getDashboardData(),
    staleTime: 30000,
  });
}