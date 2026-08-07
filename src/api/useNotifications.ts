import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { mapNotification } from '@/lib/mappers';
import i18n from '@/i18n';

export function useMyNotifications(userId: string | undefined) {
  return useQuery({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .or(`user_id.eq.${userId},user_id.eq.,user_id.eq.broadcast`)
        .order('created_at', { ascending: false });
      if (!error && data) return (data as any[]).map(mapNotification);
      return [];
    },
    enabled: !!userId,
  });
}

export function useUnreadNotifications(userId: string | undefined) {
  const { data } = useMyNotifications(userId);
  return (data || []).filter((n) => !n.read).length;
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };
}

export function useMarkAllRead(userId: string | undefined) {
  const queryClient = useQueryClient();
  return async () => {
    if (!userId) return;
    await supabase.from('notifications').update({ read: true }).in('user_id', [userId, '', 'broadcast']);
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  return async (id: string) => {
    const { error } = await supabase.from('notifications').delete().eq('id', id);
    if (error) {
      console.warn(i18n.t('notifications.deleteError', 'Cannot delete this notification'));
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };
}