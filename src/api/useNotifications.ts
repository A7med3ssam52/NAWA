import { useQuery } from '@tanstack/react-query';
import type { Notification } from '@/types';

const INITIAL_NOTIFS: Notification[] = [
  {
    id: 'notif-1',
    type: 'order',
    title: 'أهلاً بك في متجر نوى',
    message: 'نتمنى لك تجربة تسوق ممتعة ومميزة!',
    read: false,
    createdAt: new Date().toISOString(),
  },
];

export function useMyNotifications(userId: string | undefined) {
  return useQuery({
    queryKey: ['notifications', userId],
    queryFn: async (): Promise<Notification[]> => {
      return INITIAL_NOTIFS;
    },
    enabled: true,
  });
}

export function useUnreadNotifications(userId: string | undefined) {
  const { data } = useMyNotifications(userId);
  return (data || []).filter((n) => !n.read).length;
}

export function useMarkNotificationRead() {
  return async (id: string) => {};
}

export function useMarkAllRead(userId: string | undefined) {
  return async () => {};
}

export function useDeleteNotification() {
  return async (id: string) => {};
}