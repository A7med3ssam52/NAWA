import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Bell, Package, Tag, Info, CheckCheck } from 'lucide-react';
import { useAuth } from '@/contexts';
import { useMyNotifications, useMarkAllRead } from '@/api';
import { getTimeAgo, cn } from '@/utils';
import { Button, EmptyState } from '@/components/ui';
import toast from 'react-hot-toast';

const typeIcons: Record<string, typeof Package> = {
  order: Package,
  promo: Tag,
  system: Info,
};

const typeColors: Record<string, string> = {
  order: 'text-secondary bg-secondary/10',
  promo: 'text-accent bg-accent/10',
  system: 'text-gray-500 bg-gray-100',
};

export function NotificationsPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { data: dbNotifications } = useMyNotifications(user?.id);
  const markAllRead = useMarkAllRead(user?.id);

  if (!user) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} dir={i18n.language === 'ar' ? 'rtl' : 'ltr'} className="max-w-3xl mx-auto px-4 py-12">
        <EmptyState icon={<Bell className="w-16 h-16" />} title={t('notifications.loginRequired')} />
      </motion.div>
    );
  }

  const notifications = dbNotifications || [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = async () => {
    await markAllRead();
    toast.success(t('notifications.allMarkedRead'));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
      className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12"
    >
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold font-cairo text-gray-900">
          {t('notifications.title')}
          {unreadCount > 0 && (
            <span className="text-base font-medium text-gray-400 mr-2">({unreadCount})</span>
          )}
        </h1>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
            <CheckCheck className="w-4 h-4" /> {t('notifications.markAllRead')}
          </Button>
        )}
      </div>

      {notifications.length > 0 ? (
        <div className="space-y-2">
          {notifications.map((notif, i) => {
            const Icon = typeIcons[notif.type];
            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={cn(
                  'flex items-start gap-4 p-4 rounded-2xl border transition-all',
                  notif.read
                    ? 'bg-white border-gray-100'
                    : 'bg-secondary/5 border-secondary/20 shadow-soft'
                )}
              >
                <div className={cn('flex items-center justify-center w-10 h-10 rounded-xl shrink-0', typeColors[notif.type])}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-cairo', notif.read ? 'text-gray-600' : 'text-gray-900 font-semibold')}>
                    {notif.title}
                  </p>
                  <p className="text-xs text-gray-400 font-cairo mt-0.5">{notif.message}</p>
                  <p className="text-[11px] text-gray-300 font-cairo mt-1">{getTimeAgo(notif.createdAt)}</p>
                </div>
                {!notif.read && <div className="w-2 h-2 rounded-full bg-secondary shrink-0 mt-2" />}
              </motion.div>
            );
          })}
        </div>
      ) : (
        <EmptyState icon={<Bell className="w-16 h-16" />} title={t('notifications.noNotifications')} description={t('notifications.noNotificationsDesc')} />
      )}
    </motion.div>
  );
}
