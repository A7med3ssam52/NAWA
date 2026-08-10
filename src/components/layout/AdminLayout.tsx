import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Package, ShoppingCart, Grid3X3, Users,
  Star, Bell, Settings, ChevronDown, Menu, X, Percent, LogOut,
  Store, Home, ChevronLeft, ChevronRight, Gift, BookOpen,
} from 'lucide-react';
import { cn } from '@/utils';
import { useAuth } from '@/contexts';
import { useTranslation } from 'react-i18next';
import { adminService } from '@/services';
import { Spinner } from '@/components/ui';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

const BASE_NAV_ITEMS: Omit<NavItem, 'badge'>[] = [
  { label: 'admin.dashboard', href: '/admin', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'admin.products', href: '/admin/products', icon: <Package className="w-5 h-5" /> },
  { label: 'admin.orders', href: '/admin/orders', icon: <ShoppingCart className="w-5 h-5" /> },
  { label: 'admin.categories', href: '/admin/categories', icon: <Grid3X3 className="w-5 h-5" /> },
  { label: 'admin.coupons', href: '/admin/coupons', icon: <Percent className="w-5 h-5" /> },
  { label: 'admin.users', href: '/admin/users', icon: <Users className="w-5 h-5" /> },
  { label: 'admin.reviews', href: '/admin/reviews', icon: <Star className="w-5 h-5" /> },
  { label: 'admin.accounts', href: '/admin/accounts', icon: <BookOpen className="w-5 h-5" /> },
  { label: 'admin.notifications', href: '/admin/notifications', icon: <Bell className="w-5 h-5" /> },
  { label: 'admin.spinWheel', href: '/admin/spin-prizes', icon: <Gift className="w-5 h-5" /> },
  { label: 'admin.settings', href: '/admin/settings', icon: <Settings className="w-5 h-5" /> },
];

const SITE_NAME = 'NAWA';

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1, x: 0, transition: { delay: i * 0.05, type: 'spring', stiffness: 300, damping: 25 },
  }),
};

function NavLink({ item, isActive, collapsed, onClick }: {
  item: NavItem; isActive: boolean; collapsed: boolean; onClick?: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Link
      to={item.href}
      onClick={onClick}
      className={cn(
        'relative flex items-center gap-3 rounded-2xl text-sm font-medium font-cairo transition-all duration-300 group',
        collapsed ? 'justify-center p-3' : 'px-3.5 py-3',
        isActive
          ? 'text-white shadow-lg shadow-secondary/25'
          : 'text-gray-500 hover:text-gray-700',
      )}
    >
      {isActive && (
        <motion.div
          layoutId="adminNavActive"
          className="absolute inset-0 rounded-2xl bg-secondary"
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
      <span className={cn('relative z-10 shrink-0 transition-transform duration-300', !isActive && 'group-hover:scale-110')}>
        {item.icon}
      </span>
      {!collapsed && (
        <span className="relative z-10 truncate">{t(item.label)}</span>
      )}
      {!collapsed && item.badge !== undefined && item.badge > 0 && (
        <span className={cn(
          'relative z-10 mr-auto text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center',
          isActive ? 'bg-white/20 text-white' : 'bg-secondary/15 text-secondary',
        )}>
          {item.badge}
        </span>
      )}
      {collapsed && item.badge !== undefined && item.badge > 0 && (
        <span className="absolute -top-1 -left-1 z-20 w-4.5 h-4.5 rounded-full bg-danger text-white text-[9px] font-bold flex items-center justify-center shadow-lg shadow-danger/40">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

const sidebarVariants = {
  open: { width: 256, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] } },
  closed: { width: 72, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] } },
};

export function AdminLayout() {
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [pendingOrders, setPendingOrders] = useState(0);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const isAdmin = isAuthenticated && !!user && user.role === 'admin';

  useEffect(() => {
    if (!isAdmin) return;
    adminService.getDashboardData()
      .then((data) => setPendingOrders(data.stats.pendingOrders))
      .catch(() => setPendingOrders(0));
  }, [isAdmin]);

  const navItems: NavItem[] = useMemo(() =>
    BASE_NAV_ITEMS.map((item) =>
      item.href === '/admin/orders' ? { ...item, badge: pendingOrders } : item
    ),
    [pendingOrders]
  );

  const bottomNavItems = useMemo(() =>
    navItems.filter((_, i) => [0, 1, 2, 3, 9].includes(i)),
    [navItems]
  );

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      setSidebarOpen(e.matches);
    };
    handler(mq);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated || !user) {
      navigate('/login', { state: { from: pathname } });
    } else if (user.role !== 'admin') {
      navigate('/');
    }
  }, [isAuthenticated, user, loading, navigate, pathname]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [mobileOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowUserMenu(false);
        if (mobileOpen) closeMobile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen, closeMobile]);

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  const currentPage = navItems.find((n) => isActive(n.href));

  if (loading || !isAuthenticated || !user || user.role !== 'admin') {
    return (
      <div dir={i18n.language === 'ar' ? 'rtl' : 'ltr'} className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div dir={i18n.language === 'ar' ? 'rtl' : 'ltr'} className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* ─── Desktop Sidebar ─── */}
      <motion.aside
        ref={sidebarRef}
        variants={sidebarVariants}
        animate={sidebarOpen ? 'open' : 'closed'}
        className={cn(
          'hidden lg:flex flex-col fixed inset-y-0 right-0 z-30',
          'bg-white',
          'border-l border-gray-200 shadow-sm',
          'overflow-hidden',
        )}
      >
        {/* Decorative gradient orbs */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className={cn(
          'relative flex items-center h-16 lg:h-18 border-b border-gray-100 transition-all duration-300',
          sidebarOpen ? 'justify-between px-4' : 'justify-center px-2',
        )}>
          {sidebarOpen ? (
            <>
              <Link to="/admin" className="flex items-center gap-2.5 min-w-0 group">
                <div className="w-9 h-9 shrink-0 rounded-xl bg-secondary flex items-center justify-center shadow-lg shadow-black/20 transition-shadow">
                  <Store className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <span className="block font-bold text-base font-cairo text-gray-900 truncate">{t('admin.dashboard')}</span>
                  <span className="block text-[10px] text-gray-500 font-cairo truncate">{t('admin.storeManagement')}</span>
                </div>
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label={t('admin.minimize')}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label={t('admin.maximize')}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="relative flex-1 overflow-y-auto p-3 space-y-0.5 scrollbar-thin mt-2">
          {navItems.map((item, i) => (
            <motion.div
              key={item.href}
              custom={i}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
            >
              <NavLink item={item} isActive={isActive(item.href)} collapsed={!sidebarOpen} />
            </motion.div>
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="relative p-3 border-t border-gray-100">
          {/* User Avatar Mini */}
          <Link
            to="/admin/settings"
            className={cn(
              'flex items-center gap-3 rounded-2xl transition-all duration-300 group',
              sidebarOpen ? 'px-3.5 py-3' : 'justify-center p-2.5',
              'hover:bg-gray-50',
            )}
          >
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-white text-sm font-bold font-cairo overflow-hidden shadow-md">
                {user?.avatar ? (
                  <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  user?.name?.charAt(0) || t('admin.admin').charAt(0)
                )}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success rounded-full border-2 border-white" />
          </div>
            {sidebarOpen && (
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium font-cairo text-gray-900 truncate">{user?.name || t('admin.admin')}</p>
                <p className="text-[11px] text-gray-500 font-cairo truncate">{user?.email || 'admin@admin.com'}</p>
              </div>
            )}
          </Link>

          {/* Store Link */}
          <div className="mt-2">
            <Link
              to="/"
              className={cn(
                'flex items-center gap-3 rounded-2xl text-sm font-medium font-cairo transition-all duration-300 group',
                'text-gray-500 hover:text-gray-700 hover:bg-gray-50',
                sidebarOpen ? 'px-3.5 py-2.5' : 'justify-center p-2.5',
              )}
              title={!sidebarOpen ? t('admin.backToStore') : undefined}
             >
               <Home className="w-5 h-5 shrink-0 transition-transform group-hover:scale-110" />
               {sidebarOpen && <span className="truncate">{t('admin.backToStore')}</span>}
            </Link>
          </div>
        </div>
      </motion.aside>

      {/* ─── Mobile Sidebar (Drawer) ─── */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMobile}
            />
            <motion.aside
              className="absolute inset-y-0 right-0 w-[85vw] max-w-sm bg-white flex flex-col shadow-2xl"
              initial={{ x: '100%' }}
              animate={{ x: 0, transition: { type: 'spring', damping: 28, stiffness: 300 } }}
              exit={{ x: '100%', transition: { duration: 0.2, ease: 'easeIn' } }}
            >
              {/* Decorative */}
              <div className="absolute -top-40 -right-40 w-80 h-80 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />

              <div className="relative flex items-center justify-between p-4 border-b border-gray-100">
                <Link to="/admin" onClick={closeMobile} className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shadow-lg shadow-black/20">
                    <Store className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="block font-bold text-base font-cairo text-gray-900">{t('admin.dashboard')}</span>
                    <span className="block text-[10px] text-gray-500 font-cairo">{t('admin.storeManagement')}</span>
                  </div>
                </Link>
                <button
                  onClick={closeMobile}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  aria-label={t('common.close')}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="relative flex-1 overflow-y-auto p-3 space-y-0.5 mt-2">
                {navItems.map((item, i) => (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0, transition: { delay: i * 0.04 } }}
                  >
                    <NavLink item={item} isActive={isActive(item.href)} collapsed={false} onClick={closeMobile} />
                  </motion.div>
                ))}
              </div>

              <div className="relative p-3 border-t border-gray-100 space-y-2">
                <Link to="/admin/settings" onClick={closeMobile}
                  className="flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-medium font-cairo text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center text-white text-xs font-bold overflow-hidden shrink-0">
                    {user?.avatar ? (
                      <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      user?.name?.charAt(0) || t('admin.admin').charAt(0)
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium font-cairo text-gray-900 truncate">{user?.name || t('admin.admin')}</p>
                    <p className="text-[11px] text-gray-500 font-cairo truncate">{user?.email || 'admin@admin.com'}</p>
                  </div>
                </Link>
                <Link to="/" onClick={closeMobile}
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-medium font-cairo text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <Home className="w-5 h-5" />
                  <span>{t('admin.backToStore')}</span>
                </Link>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Main Content Area ─── */}
      <div className={cn(
        'flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out',
        'lg:mr-[72px]',
        sidebarOpen && 'lg:mr-64',
      )}>
        {/* Top Bar */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-gray-100 supports-[backdrop-filter]:bg-white/70">
          <div className="flex items-center justify-between h-14 lg:h-16 px-3 lg:px-6">
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-2 -mr-1 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors active:scale-95"
                aria-label={t('admin.openMenu')}
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <h1 className="text-sm lg:text-base font-bold font-cairo text-gray-900 truncate">
                  {currentPage?.label ? t(currentPage.label) : t('admin.dashboard')}
                </h1>
                <p className="hidden sm:block text-[11px] text-gray-400 font-cairo truncate">
                  {t('common.siteName')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 lg:gap-2">
              {/* User Menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu((prev) => !prev)}
                  className={cn(
                    'flex items-center gap-2 px-2 lg:px-3 py-1.5 rounded-xl transition-all duration-200',
                    'hover:bg-gray-100 active:scale-95',
                    showUserMenu && 'bg-gray-100 ring-1 ring-secondary/20',
                  )}
                  aria-haspopup="true"
                  aria-expanded={showUserMenu}
                >
                  <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-secondary flex items-center justify-center text-white text-xs font-bold font-cairo overflow-hidden shrink-0 shadow-sm">
                    {user?.avatar ? (
                      <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      user?.name?.charAt(0) || t('admin.admin').charAt(0)
                    )}
                  </div>
                  <span className="hidden md:block text-sm font-medium font-cairo text-gray-700 max-w-[100px] truncate">
                    {user?.name || t('admin.admin')}
                  </span>
                  <ChevronDown className={cn(
                    'hidden md:block w-3.5 h-3.5 text-gray-400 transition-transform duration-200',
                    showUserMenu && 'rotate-180',
                  )} />
                </button>
                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 top-full mt-1.5 w-48 bg-white rounded-2xl border border-gray-100 shadow-soft-lg py-1.5 z-50"
                    >
                      <Link to="/" onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-cairo text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Home className="w-4 h-4" />
                        {t('admin.viewStore')}
                      </Link>
                      <div className="h-px bg-gray-100 mx-3 my-1" />
                      <button
                        onClick={() => { logout(); setShowUserMenu(false); }}
                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-cairo text-danger hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        {t('nav.logout')}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 pb-20 lg:pb-0">
          <Outlet />
        </main>
      </div>

      {/* ─── Premium Mobile Bottom Navigation Bar ─── */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 safe-area-bottom">
        <div className="relative mx-3 mb-2 rounded-2xl bg-white/90 backdrop-blur-xl shadow-[0_-4px_20px_rgba(0,0,0,0.08),0_-4px_20px_rgba(0,0,0,0.3)] border border-white/20">
          <div className="flex items-center justify-around h-16 px-1">
            {bottomNavItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'flex flex-col items-center justify-center w-full h-full relative py-1',
                    'transition-all duration-200'
                  )}
                >
                  <div className={cn(
                    'relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200',
                    active && 'bg-secondary/10'
                  )}>
                    <div className={cn(
                      'transition-all duration-200',
                      active ? 'text-secondary scale-110' : 'text-gray-400'
                    )}>
                      {item.icon}
                    </div>
                    {item.badge && item.badge > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-danger text-[8px] font-bold text-white shadow-lg shadow-danger/30">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}

                  </div>
                  <span className={cn(
                    'text-[10px] font-cairo mt-0.5 transition-all duration-200',
                    active
                      ? 'text-secondary font-bold'
                      : 'text-gray-400'
                  )}>
                    {t(item.label)}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
