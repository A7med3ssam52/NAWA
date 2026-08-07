import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { mapAddress } from '@/lib/mappers';

export function useAddresses(userId: string | undefined) {
  return useQuery({
    queryKey: ['addresses', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase.from('addresses').select('*').eq('user_id', userId);
      if (!error && data) return (data as any[]).map(mapAddress);
      return [];
    },
    enabled: !!userId,
  });
}