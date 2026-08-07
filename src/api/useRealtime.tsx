import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;
    const channel = supabase
      .channel('notif-broadcast')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, queryClient]);

  return <>{children}</>;
}