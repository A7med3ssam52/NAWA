import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Heart,
  Sun,
  Moon,
  Menu,
  X,
  ChevronDown,
  User,
  LogOut,
  Package,
  Settings,
  HelpCircle,
  Home,
  LayoutGrid,
  ShoppingBag,
  UserCircle,
  BarChart3,
  Grid3X3,
} from 'lucide-react';
import { cn } from '@/utils';
import { useCart } from '@/contexts';
import { useWishlist } from '@/contexts';
import { useAuth } from '@/contexts';
import { useTheme } from '@/contexts';
import { useMediaQuery } from '@/hooks';
import { useDebounce } from '@/hooks';
import { categories } from '@/data';
import { PAGES, SITE_NAME } from '@/constants';
import { Button, Badge } from '@/components/ui';
import { Sidebar } from './Sidebar';
import { SearchSuggestions, NotificationPopover, MobileSearchOverlay } from '@/components/features';
import { AnnouncementBar } from './AnnouncementBar';
import { CartPreview } from './CartPreview';

const NAV_LINKS = [
  { label: 'الرئيسية', href: PAGES.HOME, icon: Home },
  { label: 'المنتجات', href: PAGES.PRODUCTS, icon: LayoutGrid },
  { label: 'سلة التسوق', href: PAGES.CART, icon: ShoppingBag, badge: true },
  { label: 'الحساب', href: PAGES.PROFILE, icon: UserCircle },
];

const MOBILE_BOTTOM_LINKS = [
  { label: 'الرئيسية', href: PAGES.HOME, icon: Home },
  { label: 'الأقسام', href: PAGES.CATEGORIES, icon: Grid3X3 },
  { label: 'المفضلة', href: PAGES.WISHLIST, icon: Heart, badge: 'wishlist' as const },
  { label: 'الحساب', href: PAGES.PROFILE, icon: UserCircle },
  { label: 'سلة التسوق', href: PAGES.CART, icon: ShoppingBag, badge: 'cart' as const },
];

export const Navbar = memo(function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTabIndex, setActiveTabIndex] = useState(() => {
    const path = location.pathname;
    if (path === PAGES.HOME) return 0;
    if (path === PAGES.CATEGORIES) return 1;
    if (path === PAGES.WISHLIST) return 2;
    if (path.startsWith(PAGES.PROFILE)) return 3;
    if (path === PAGES.CART) return 4;
    return 0;
  });
  const { itemsCount } = useCart();
  const { itemsCount: wishlistCount } = useWishlist();
  const { user, isAuthenticated, logout } = useAuth();
  const { isDark, toggle: toggleTheme } = useTheme();
  const isMobile = useMediaQuery('(max-width: 1023px)');

  const headerRef = useRef<HTMLDivElement>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [showCategories, setShowCategories] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [hideHeader, setHideHeader] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const [announcementDismissed, setAnnouncementDismissed] = useState(() => {
    try { return localStorage.getItem('announcement-dismissed') === 'true'; }
    catch { return false; }
  });

  const handleDismissAnnouncement = () => {
    setAnnouncementDismissed(true);
    try { localStorage.setItem('announcement-dismissed', 'true'); }
    catch {}
  };

  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const debouncedSearch = useDebounce(searchQuery, 300);

  const lastScrollY = useRef(0);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const onScroll = () => {
      const currentY = window.scrollY;
      const isScrollingDown = currentY > lastScrollY.current;
      el.classList.toggle('shadow-lg', currentY > 10);
      if (currentY > 40) {
        setHideHeader(isScrollingDown);
      } else {
        setHideHeader(false);
      }
      setScrolled(currentY > 10);
      lastScrollY.current = currentY;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchSuggestions(false);
      }
      if (categoriesRef.current && !categoriesRef.current.contains(e.target as Node)) {
        setShowCategories(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !searchFocused && !mobileSearchOpen) {
        const tag = (e.target as HTMLElement).tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
          e.preventDefault();
          searchInputRef.current?.focus();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [searchFocused, mobileSearchOpen]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setShowSearchSuggestions(false);
    searchInputRef.current?.focus();
  }, []);

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`${PAGES.SEARCH}?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearchSuggestions(false);
      setSearchOpen(false);
    }
  }, [searchQuery, navigate]);

  const handleSuggestionSelect = useCallback((text: string) => {
    setSearchQuery(text);
    navigate(`${PAGES.SEARCH}?q=${encodeURIComponent(text)}`);
    setShowSearchSuggestions(false);
    setSearchOpen(false);
  }, [navigate]);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    navigate(PAGES.HOME);
  };

  const handleTabClick = useCallback((tab: { href: string }, idx: number) => {
    setActiveTabIndex(idx);
    navigate(tab.href);
  }, [navigate]);

  return (
    <>
      {/* Announcement Bar */}
      {!announcementDismissed && <AnnouncementBar onDismiss={handleDismissAnnouncement} />}

      {/* Desktop Navbar */}
      <header
        ref={headerRef}
        dir="rtl"
        className={cn(
          'fixed left-0 right-0 z-40 transition-[top,transform] duration-500 ease-in-out',
          hideHeader && '-translate-y-full',
          isDark
            ? 'ios-dark-nav-bar'
            : 'ios-nav-bar',
          !isDark && cn(
            'border-b transition-all duration-300',
            scrolled
              ? 'bg-white/95 backdrop-blur-2xl border-gray-200/80'
              : 'bg-white/80 backdrop-blur-md border-transparent'
          ),
          isDark && cn(
            'transition-all duration-300',
            scrolled
              ? 'bg-dark-bg/95 backdrop-blur-2xl border-white/10'
              : 'bg-dark-bg/80 backdrop-blur-md border-transparent'
          ),
        )}
        style={{ top: announcementDismissed ? '0' : '36px', paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Left group: Menu + Logo */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden relative p-2 rounded-xl text-gray-600 dark:text-dark-muted hover:bg-gray-100 dark:hover:bg-dark-border transition-all duration-200 active:scale-90"
                aria-label="القائمة"
              >
                <Menu className="w-6 h-6" />
              </button>
              <Link
                to={PAGES.HOME}
                className="shrink-0"
                aria-label="الصفحة الرئيسية"
              >
                <span className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-l from-secondary to-accent bg-clip-text text-transparent font-cairo">
                  {SITE_NAME}
                </span>
              </Link>
            </div>

            {/* Right group: Search + Actions */}
            <div className="flex items-center gap-1 lg:gap-2">
              {/* Mobile Search Button */}
              <button
                onClick={() => setMobileSearchOpen(true)}
                className="lg:hidden p-2 rounded-xl text-gray-600 dark:text-dark-muted hover:bg-gray-100 dark:hover:bg-dark-border transition-all active:scale-90"
                aria-label="بحث"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Desktop Navigation */}
              <nav className="hidden lg:flex items-center gap-1">
                {NAV_LINKS.map((link) => {
                  const isActive = link.href === PAGES.HOME
                    ? location.pathname === PAGES.HOME
                    : location.pathname.startsWith(link.href);
                  return (
                    <Link
                      key={link.href}
                      to={link.href}
                      className={cn(
                        'px-4 py-2 text-sm font-medium font-cairo rounded-xl transition-all duration-200',
                        isActive
                          ? 'bg-secondary/10 text-secondary font-bold dark:bg-secondary/20'
                          : 'text-gray-700 dark:text-dark-muted hover:text-secondary dark:hover:text-secondary hover:bg-gray-100 dark:hover:bg-dark-border/50'
                      )}
                    >
                      {link.label}
                    </Link>
                  );
                })}
                <div ref={categoriesRef} className="relative">
                  <button
                    onClick={() => setShowCategories(!showCategories)}
                    className={cn(
                      'flex items-center gap-1.5 px-4 py-2 text-sm font-medium font-cairo rounded-xl transition-all duration-200',
                      showCategories
                        ? 'bg-secondary/10 text-secondary font-bold'
                        : 'text-gray-700 dark:text-dark-muted hover:text-secondary dark:hover:text-secondary hover:bg-gray-100 dark:hover:bg-dark-border/50'
                    )}
                    aria-expanded={showCategories}
                    aria-haspopup="true"
                  >
                    الأقسام
                    <ChevronDown
                      className={cn(
                        'w-4 h-4 transition-transform duration-200',
                        showCategories && 'rotate-180'
                      )}
                    />
                  </button>
                  <AnimatePresence>
                    {showCategories && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full right-0 mt-2 w-[500px] lg:w-[600px] bg-white dark:bg-dark-card rounded-2xl shadow-soft-xl border border-gray-100 dark:border-dark-border overflow-hidden z-50"
                      >
                        <div className="p-3">
                          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                            {categories.map((cat) => (
                              <Link
                                key={cat.id}
                                to={`${PAGES.CATEGORY_PRODUCTS.replace(':slug', cat.slug)}`}
                                onClick={() => setShowCategories(false)}
                                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-border/50 transition-all group"
                              >
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-secondary/10 to-accent/10 dark:from-secondary/20 dark:to-accent/10 overflow-hidden shrink-0">
                                  <img
                                    src={cat.image}
                                    alt={cat.name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                    loading="lazy"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span className="text-sm font-cairo font-medium text-gray-900 dark:text-dark-text group-hover:text-secondary transition-colors block truncate">
                                    {cat.name}
                                  </span>
                                  <span className="text-[11px] text-gray-400 dark:text-dark-muted font-cairo">
                                    {cat.productsCount} منتج
                                  </span>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                        <div className="p-3 bg-gray-50/50 dark:bg-dark-border/20 border-t border-gray-100 dark:border-dark-border">
                          <Link
                            to={PAGES.CATEGORIES}
                            onClick={() => setShowCategories(false)}
                            className="flex items-center justify-center gap-1.5 py-2 text-sm font-medium font-cairo text-secondary hover:text-secondary/80 transition-colors rounded-xl hover:bg-gray-100 dark:hover:bg-dark-border/50"
                          >
                            عرض جميع الأقسام
                            <ChevronDown className="w-3.5 h-3.5 rotate-[-90deg]" />
                          </Link>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </nav>

              {/* Search Bar - Desktop */}
              <div ref={searchContainerRef} className={cn(
                'hidden lg:flex flex-1 relative transition-all duration-300',
                searchFocused ? 'max-w-xl' : 'max-w-md'
              )}>
                <div ref={searchRef} className="w-full">
                  <form onSubmit={handleSearchSubmit} className="w-full">
                    <div className="relative">
                      <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 dark:text-dark-muted pointer-events-none" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setShowSearchSuggestions(true);
                        }}
                        onFocus={() => {
                          setSearchFocused(true);
                          setShowSearchSuggestions(true);
                        }}
                        onBlur={() => setSearchFocused(false)}
                        placeholder="ابحث عن منتجات..."
                        className="w-full py-2.5 pr-10 pl-12 text-sm font-cairo bg-gray-100 dark:bg-dark-border/50 border border-transparent focus:border-secondary/30 rounded-xl text-gray-900 dark:text-dark-text placeholder-gray-400 dark:placeholder-dark-muted focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all"
                        dir="rtl"
                      />
                      {searchQuery ? (
                        <button
                          type="button"
                          onClick={handleClearSearch}
                          className="absolute left-1.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-dark-text hover:bg-gray-200 dark:hover:bg-dark-border transition-colors"
                          aria-label="مسح البحث"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        !searchFocused && (
                          <kbd className="absolute left-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded-md text-[10px] font-medium text-gray-400 dark:text-dark-muted bg-gray-200 dark:bg-dark-border border border-gray-300 dark:border-dark-border leading-none pointer-events-none">
                            /
                          </kbd>
                        )
                      )}
                    </div>
                  </form>
                  {showSearchSuggestions && (searchQuery || debouncedSearch) && (
                    <SearchSuggestions
                      query={debouncedSearch}
                      onSelect={handleSuggestionSelect}
                      onClose={() => setShowSearchSuggestions(false)}
                    />
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-0 sm:gap-1 lg:gap-2">
              {/* Theme Toggle - Desktop only */}
              <button
                onClick={toggleTheme}
                className="hidden lg:flex p-2 rounded-xl text-gray-600 dark:text-dark-muted hover:bg-gray-100 dark:hover:bg-dark-border transition-colors"
                aria-label={isDark ? 'الوضع النهاري' : 'الوضع الليلي'}
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* Wishlist - Desktop only */}
              <Link
                to={PAGES.WISHLIST}
                className="hidden lg:flex relative p-2 rounded-xl text-gray-600 dark:text-dark-muted hover:bg-gray-100 dark:hover:bg-dark-border transition-colors"
                aria-label="المفضلة"
              >
                <Heart className="w-5 h-5" />
                {wishlistCount > 0 && (
                  <Badge
                    variant="danger"
                    size="sm"
                    className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1"
                  >
                    {wishlistCount > 99 ? '99+' : wishlistCount}
                  </Badge>
                )}
              </Link>

              {/* Compare - Desktop only */}
              <Link
                to={PAGES.COMPARE}
                className="hidden lg:flex relative p-2 rounded-xl text-gray-600 dark:text-dark-muted hover:bg-gray-100 dark:hover:bg-dark-border transition-colors"
                aria-label="مقارنة"
              >
                <BarChart3 className="w-5 h-5" />
              </Link>

              {/* Cart with Preview */}
              <CartPreview />

              {/* Notifications - Desktop only */}
              <div className="hidden lg:block">
                <NotificationPopover />
              </div>

              {/* User Menu */}
              <div ref={userMenuRef} className="relative">
                {isAuthenticated && user ? (
                  <>
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-border transition-colors"
                      aria-expanded={showUserMenu}
                      aria-haspopup="true"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary to-accent flex items-center justify-center text-white text-sm font-bold font-cairo overflow-hidden">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          user.name.charAt(0)
                        )}
                      </div>
                      <span className="hidden lg:block text-sm font-medium font-cairo text-gray-700 dark:text-dark-text max-w-[100px] truncate">
                        {user.name}
                      </span>
                      <ChevronDown
                        className={cn(
                          'hidden lg:block w-4 h-4 text-gray-400 transition-transform duration-200',
                          showUserMenu && 'rotate-180'
                        )}
                      />
                    </button>
                    {showUserMenu && (
                      <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-dark-card rounded-2xl shadow-soft-xl border border-gray-100 dark:border-dark-border overflow-hidden animate-fade-in">
                        <div className="p-2">
                          <div className="px-3 py-2 border-b border-gray-100 dark:border-dark-border mb-1">
                            <p className="text-sm font-bold font-cairo text-gray-900 dark:text-dark-text">{user.name}</p>
                            <p className="text-xs text-gray-500 dark:text-dark-muted font-cairo">{user.email}</p>
                          </div>
                          <Link
                            to={PAGES.PROFILE}
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-cairo text-gray-700 dark:text-dark-muted hover:bg-gray-50 dark:hover:bg-dark-border/50 transition-colors"
                          >
                            <User className="w-4 h-4" />
                            الملف الشخصي
                          </Link>
                          <Link
                            to={PAGES.MY_ORDERS}
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-cairo text-gray-700 dark:text-dark-muted hover:bg-gray-50 dark:hover:bg-dark-border/50 transition-colors"
                          >
                            <Package className="w-4 h-4" />
                            طلباتي
                          </Link>
                          <Link
                            to={PAGES.SETTINGS}
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-cairo text-gray-700 dark:text-dark-muted hover:bg-gray-50 dark:hover:bg-dark-border/50 transition-colors"
                          >
                            <Settings className="w-4 h-4" />
                            الإعدادات
                          </Link>
                          <Link
                            to={PAGES.FAQ}
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-cairo text-gray-700 dark:text-dark-muted hover:bg-gray-50 dark:hover:bg-dark-border/50 transition-colors"
                          >
                            <HelpCircle className="w-4 h-4" />
                            المساعدة
                          </Link>
                          <hr className="my-1 border-gray-100 dark:border-dark-border" />
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm font-cairo text-danger hover:bg-danger/5 transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            تسجيل الخروج
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="lg:hidden p-2 rounded-xl text-gray-600 dark:text-dark-muted hover:bg-gray-100 dark:hover:bg-dark-border transition-colors"
                      aria-label="تسجيل الدخول"
                    >
                      <UserCircle className="w-5 h-5" />
                    </Link>
                    <Link to="/login" className="hidden lg:block">
                      <Button variant="primary" size="sm" rounded="full" className="shadow-none hover:shadow-none">
                        تسجيل الدخول
                      </Button>
                    </Link>
                  </>
                )}
              </div>
              </div>
            </div>
          </div>
        </div>


      </header>

      {/* Spacer for fixed header */}
      <div className={cn(announcementDismissed ? 'h-16 lg:h-20' : 'h-[100px] lg:h-[116px]')} />

      {/* Premium Bottom Navigation for Mobile */}
      <nav className={cn(
        'md:hidden fixed bottom-0 left-0 right-0 z-50 transition-transform duration-500 ease-in-out',
        hideHeader && 'translate-y-full',
        'ios-safe-area-inset'
      )}>
        <div className="relative mx-3 mb-2 rounded-2xl bg-white/90 dark:bg-dark-card/90 backdrop-blur-xl shadow-[0_-4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)] border border-white/20 dark:border-dark-border/50">
          <div className="flex items-center justify-around h-16 px-1">
            {MOBILE_BOTTOM_LINKS.map((tab, idx) => {
              const Icon = tab.icon;
              const isActive = activeTabIndex === idx;
              const badgeCount = tab.badge === 'cart' ? itemsCount : tab.badge === 'wishlist' ? wishlistCount : 0;
              return (
                <button
                  key={tab.label}
                  onClick={() => handleTabClick(tab, idx)}
                  className={cn(
                    'flex flex-col items-center justify-center w-full h-full relative py-1',
                    'transition-all duration-200'
                  )}
                >
                  <div className={cn(
                    'relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200',
                    isActive && 'bg-secondary/10 dark:bg-secondary/20'
                  )}>
                    <Icon className={cn(
                      'w-5 h-5 transition-all duration-200',
                      isActive ? 'text-secondary scale-110' : 'text-gray-400 dark:text-dark-muted'
                    )} />
                    {badgeCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-[9px] font-bold text-white shadow-lg shadow-danger/30">
                        {badgeCount > 99 ? '99+' : badgeCount}
                      </span>
                    )}
                  </div>
                  <span className={cn(
                    'text-[10px] font-cairo mt-0.5 transition-all duration-200',
                    isActive
                      ? 'text-secondary font-bold'
                      : 'text-gray-400 dark:text-dark-muted'
                  )}>
                    {tab.label}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="bottomTab"
                      className="absolute -bottom-0.5 w-6 h-0.5 rounded-full bg-secondary"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Mobile Search Overlay */}
      {mobileSearchOpen && (
        <MobileSearchOverlay
          isOpen={mobileSearchOpen}
          onClose={() => setMobileSearchOpen(false)}
          initialQuery={searchQuery}
        />
      )}
    </>
  );
});
