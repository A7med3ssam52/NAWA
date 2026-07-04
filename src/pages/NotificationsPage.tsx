import { motion } from 'framer-motion';
import { Bell, Package, Tag, Info, CheckCheck } from 'lucide-react';
import { useAuth } from '@/contexts';
import { getUserNotifications } from '@/data';
import { getTimeAgo, cn } from '@/utils';
import { Button, EmptyState } from '@/components/ui';

const typeIcons: Record<string, typeof Package> = {
  order: Package,
  promo: Tag,
  system: Info,
};

const typeColors: Record<string, string> = {
  order: 'text-secondary bg-secondary/10',
  promo: 'text-accent bg-accent/10',
  system: 'text-gray-500 bg-gray-100 dark:bg-dark-border',
};

export function NotificationsPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} dir="rtl" className="max-w-3xl mx-auto px-4 py-12">
        <EmptyState icon={<Bell className="w-16 h-16" />} title="يرجى تسجيل الدخول" />
      </motion.div>
    );
  }

  const notifications = getUserNotifications(user.id);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      dir="rtl"
      className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12"
    >
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold font-cairo text-gray-900 dark:text-dark-text">
          الإشعارات
          {unreadCount > 0 && (
            <span className="text-base font-medium text-gray-400 dark:text-dark-muted mr-2">({unreadCount})</span>
          )}
        </h1>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
            <CheckCheck className="w-4 h-4" /> تحديد الكل كمقروء
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
                    ? 'bg-white dark:bg-dark-card border-gray-100 dark:border-dark-border'
                    : 'bg-secondary/5 border-secondary/20 shadow-soft'
                )}
              >
                <div className={cn('flex items-center justify-center w-10 h-10 rounded-xl shrink-0', typeColors[notif.type])}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-cairo', notif.read ? 'text-gray-600 dark:text-dark-muted' : 'text-gray-900 dark:text-dark-text font-semibold')}>
                    {notif.title}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-dark-muted font-cairo mt-0.5">{notif.message}</p>
                  <p className="text-[11px] text-gray-300 dark:text-dark-muted font-cairo mt-1">{getTimeAgo(notif.createdAt)}</p>
                </div>
                {!notif.read && <div className="w-2 h-2 rounded-full bg-secondary shrink-0 mt-2" />}
              </motion.div>
            );
          })}
        </div>
      ) : (
        <EmptyState icon={<Bell className="w-16 h-16" />} title="لا توجد إشعارات" description="ستظهر الإشعارات هنا عندما تصلك" />
      )}
    </motion.div>
  );
}
