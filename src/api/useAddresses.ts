import { useQuery } from '@tanstack/react-query';
import type { Address } from '@/types';

export function useAddresses(userId: string | undefined) {
  return useQuery({
    queryKey: ['addresses', userId],
    queryFn: async (): Promise<Address[]> => {
      return [
        {
          id: 'addr-default',
          label: 'المنزل',
          fullName: 'عميل نوى',
          phone: '+201000000000',
          street: 'شارع التجاري',
          city: 'القاهرة',
          state: 'القاهرة',
          isDefault: true,
        },
      ];
    },
    enabled: true,
  });
}