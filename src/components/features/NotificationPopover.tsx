import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  Package,
  Tag,
  Info,
  CheckCheck,
  ChevronLeft,
  Clock,
} from 'lucide-react';
import { cn } from '@/utils';
import { useAuth } from '@/contexts';
import { getUserNotifications } from '@/data';
import { getTimeAgo } from '@/utils';
import { PAGES } from '@/constants';

const typeIcons: Record<string, typeof Package> = {
  order: Package,
  promo: Tag,
  system: Info,
};

const typeConfig: Record<string, { color: string; bg: string }> = {
  order: { color: 'text-secondary', bg: 'bg-secondary/10' },
  promo: { color: 'text-accent', bg: 'bg-accent/10' },
  system: { color: 'text-gray-500', bg: 'bg-gray-100' },
};

export function NotificationPopover() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const notifications = user ? getUserNotifications(user.id) : [];
  const unread = notifications.filter((n) => !n.read);
  const recent = notifications.slice(0, 5);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    if (open) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open]);

  const handleMarkAllRead = () => {};

  return (
    <div ref={popoverRef} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
        aria-label="الإشعارات"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Bell className="w-5 h-5" />
        {unread.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-danger rounded-full shadow-lg shadow-danger/30">
            {unread.length > 99 ? '99+' : unread.length}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute left-0 top-full mt-2 w-[360px] sm:w-96 bg-white rounded-2xl shadow-soft-xl border border-gray-100 overflow-hidden z-50 animate-fade-in-up"
          dir="rtl"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 bg-gradient-to-l from-secondary/5 to-transparent">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-secondary" />
                <span className="text-sm font-bold font-cairo text-gray-900">الإشعارات</span>
                {unread.length > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold text-white bg-danger rounded-full">
                    {unread.length}
                  </span>
                )}
              </div>
              {unread.length > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 text-[11px] font-medium font-cairo text-secondary hover:text-blue-700 transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  تحديد الكل مقروء
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-[360px] overflow-y-auto scrollbar-thin">
              {notifications.length > 0 ? (
                <div className="py-1">
                  {recent.map((notif) => {
                    const Icon = typeIcons[notif.type] || Info;
                    const config = typeConfig[notif.type] || typeConfig.system;
                    return (
                      <div
                        key={notif.id}
                        className={cn(
                          'flex items-start gap-3 px-4 py-3 transition-all duration-200 cursor-pointer group',
                          notif.read
                            ? 'hover:bg-gray-50'
                            : 'bg-secondary/[0.03] hover:bg-secondary/[0.06][0.02][0.05]',
                        )}
                      >
                        <div className={cn(
                          'flex items-center justify-center w-9 h-9 rounded-xl shrink-0 mt-0.5',
                          config.bg,
                        )}>
                          <Icon className={cn('w-4.5 h-4.5', config.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={cn(
                              'text-sm font-cairo leading-snug',
                              notif.read
                                ? 'text-gray-600 font-medium'
                                : 'text-gray-900 font-bold',
                            )}>
                              {notif.title}
                            </p>
                            {!notif.read && (
                              <span className="w-2 h-2 rounded-full bg-secondary shrink-0 mt-1.5" />
                            )}
                          </div>
                          <p className="text-xs text-gray-400 font-cairo mt-0.5 line-clamp-1">
                            {notif.message}
                          </p>
                          <div className="flex items-center gap-1 mt-1.5">
                            <Clock className="w-3 h-3 text-gray-300" />
                            <span className="text-[10px] text-gray-300 font-cairo">
                              {getTimeAgo(notif.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
                    <Bell className="w-7 h-7 text-gray-300" />
                  </div>
                  <p className="text-sm font-bold font-cairo text-gray-900">لا توجد إشعارات</p>
                  <p className="text-xs text-gray-400 font-cairo mt-1">ستظهر الإشعارات هنا عندما تصلك</p>
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <Link
                to={PAGES.NOTIFICATIONS}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm font-medium font-cairo text-secondary hover:text-blue-700 hover:bg-secondary/[0.03][0.03] transition-colors group"
              >
                <span>عرض كل الإشعارات</span>
                <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
              </Link>
            )}
        </div>
      )}
    </div>
  );
}
