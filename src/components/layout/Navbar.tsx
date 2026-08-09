import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Heart,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  User,
  LogOut,
  Package,
  Settings,
  HelpCircle,
  Home,
  ShoppingBag,
  UserCircle,
  BarChart3,
  Grid3X3,
} from 'lucide-react';
import { cn } from '@/utils';
import { useCart } from '@/contexts';
import { useWishlist } from '@/contexts';
import { useAuth } from '@/contexts';
import { useMediaQuery } from '@/hooks';
import { useDebounce } from '@/hooks';
import { useCategories } from '@/api';
import { PAGES, SITE_NAME } from '@/constants';
import { Button, Badge, LanguageSwitcher } from '@/components/ui';
import { Sidebar } from './Sidebar';
import { SearchSuggestions, NotificationPopover, MobileSearchOverlay } from '@/components/features';
import { AnnouncementBar } from './AnnouncementBar';
import { CartPreview } from './CartPreview';

const MOBILE_BOTTOM_LINKS = [
  { label: 'nav.home', href: PAGES.HOME, icon: Home },
  { label: 'nav.categories', href: PAGES.CATEGORIES, icon: Grid3X3 },
  { label: 'nav.wishlist', href: PAGES.WISHLIST, icon: Heart, badge: 'wishlist' as const },
  { label: 'nav.account', href: PAGES.PROFILE, icon: UserCircle },
  { label: 'nav.cart', href: PAGES.CART, icon: ShoppingBag, badge: 'cart' as const },
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
  const { t, i18n } = useTranslation();
  const { itemsCount } = useCart();
  const { itemsCount: wishlistCount } = useWishlist();
  const { user, isAuthenticated, logout } = useAuth();
  const isMobile = useMediaQuery('(max-width: 1023px)');

  const headerRef = useRef<HTMLDivElement>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [hideHeader, setHideHeader] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const { data: categories } = useCategories();
  const visibleCategories = (categories || []).slice(0, 3);

  const [announcementDismissed, setAnnouncementDismissed] = useState(() => {
    try { return localStorage.getItem('announcement-dismissed') === 'true'; }
    catch { return false; }
  });
  const [announcementEnabled, setAnnouncementEnabled] = useState(true);

  const handleDismissAnnouncement = () => {
    setAnnouncementDismissed(true);
    try { localStorage.setItem('announcement-dismissed', 'true'); }
    catch {}
  };

  const announcementVisible = !announcementDismissed && announcementEnabled;

  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const debouncedSearch = useDebounce(searchQuery, 300);

  const lastScrollY = useRef(0);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const onScroll = () => {
      const currentY = window.scrollY;
      const isScrollingDown = currentY > lastScrollY.current;
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
      {!announcementDismissed && <AnnouncementBar onDismiss={handleDismissAnnouncement} onVisibilityChange={setAnnouncementEnabled} />}

      {/* Desktop Navbar */}
      <header
        ref={headerRef}
        dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
        className={cn(
          'ios-nav-bar fixed left-0 right-0 z-40 transition-[top,transform] duration-500 ease-in-out',
          hideHeader && '-translate-y-full',
          'border-b transition-all duration-300',
          scrolled
            ? 'bg-white/95 backdrop-blur-2xl border-gray-200/80 shadow-lg'
            : 'bg-white border-transparent'
        )}
        style={{ top: announcementVisible ? '36px' : '0' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20 flex-nowrap">
            {/* Left group: Menu + Logo */}
            <div className="flex items-center gap-1 sm:gap-2 h-full">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden relative p-1.5 rounded-xl text-gray-600 hover:bg-gray-100 transition-all duration-200 active:scale-90"
                aria-label={t('nav.menuLabel')}
              >
                <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <Link
                to={PAGES.HOME}
                className="shrink-0 h-full flex items-center"
                aria-label={t('nav.homePage')}
              >
                <img src="/images/zahieg.png" alt={SITE_NAME()} className="h-full w-auto object-contain" />
              </Link>
            </div>

            {/* Right group: Search + Actions */}
            <div className="flex items-center gap-0.5 sm:gap-1 lg:gap-2">
              {/* Mobile Search Button */}
              <button
                onClick={() => setMobileSearchOpen(true)}
                className="lg:hidden p-1.5 rounded-xl text-gray-600 hover:bg-gray-100 transition-all active:scale-90"
                aria-label={t('nav.searchLabel')}
              >
                <Search className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

                {/* Desktop Navigation */}
              <nav className="hidden lg:flex items-center gap-1">
                <Link
                  to={PAGES.HOME}
                  className={cn(
                    'px-4 py-2 text-sm font-medium font-cairo rounded-xl transition-all duration-200',
                    location.pathname === PAGES.HOME
                      ? 'bg-secondary/10 text-secondary font-bold'
                      : 'text-gray-700 hover:text-secondary hover:bg-gray-100'
                  )}
                >
                  {t('nav.home')}
                </Link>
                <Link
                  to={PAGES.PRODUCTS}
                  className={cn(
                    'px-4 py-2 text-sm font-medium font-cairo rounded-xl transition-all duration-200',
                    location.pathname.startsWith(PAGES.PRODUCTS)
                      ? 'bg-secondary/10 text-secondary font-bold'
                      : 'text-gray-700 hover:text-secondary hover:bg-gray-100'
                  )}
                >
                  {t('nav.store')}
                </Link>
                {visibleCategories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`${PAGES.CATEGORY_PRODUCTS.replace(':slug', cat.slug)}`}
                    className={cn(
                      'px-4 py-2 text-sm font-medium font-cairo rounded-xl transition-all duration-200',
                      location.pathname === `/categories/${cat.slug}`
                        ? 'bg-secondary/10 text-secondary font-bold'
                        : 'text-gray-700 hover:text-secondary hover:bg-gray-100'
                    )}
                  >
                    {cat.name}
                  </Link>
                ))}

                {/* All Categories Dropdown */}
                <div
                  className="relative"
                  onMouseEnter={() => setCategoriesOpen(true)}
                  onMouseLeave={() => setCategoriesOpen(false)}
                >
                  <button
                    type="button"
                    onClick={() => setCategoriesOpen((open) => !open)}
                    aria-haspopup="menu"
                    aria-expanded={categoriesOpen}
                    className={cn(
                      'flex items-center gap-1.5 px-4 py-2 text-sm font-medium font-cairo rounded-xl transition-all duration-200',
                      categoriesOpen || location.pathname === PAGES.CATEGORIES
                        ? 'bg-secondary/10 text-secondary font-bold'
                        : 'text-gray-700 hover:text-secondary hover:bg-gray-100'
                    )}
                  >
                    <Grid3X3 className="w-4 h-4" />
                    {t('categories.allCategories')}
                    <ChevronDown
                      className={cn(
                        'w-4 h-4 transition-transform duration-200',
                        categoriesOpen && 'rotate-180'
                      )}
                    />
                  </button>

                  <div
                    className={cn(
                      'absolute top-full z-50 mt-2 w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-soft-xl transition-all duration-200',
                      categoriesOpen
                        ? 'visible pointer-events-auto translate-y-0 opacity-100'
                        : 'invisible pointer-events-none translate-y-1 opacity-0'
                    )}
                    style={i18n.language === 'ar' ? { right: 0 } : { left: 0 }}
                  >
                    <div className="max-h-[70vh] overflow-y-auto p-2">
                      {(categories || []).length === 0 ? (
                        <p className="px-3 py-6 text-sm text-gray-400 text-center font-cairo">
                          {t('categories.empty')}
                        </p>
                      ) : (
                        <>
                          {(categories || []).map((cat) => (
                            <Link
                              key={cat.id}
                              to={`${PAGES.CATEGORY_PRODUCTS.replace(':slug', cat.slug)}`}
                              onClick={() => setCategoriesOpen(false)}
                              className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-cairo text-gray-700 hover:bg-secondary/5 hover:text-secondary transition-colors"
                            >
                              <span className="flex items-center gap-3 min-w-0">
                                {cat.image ? (
                                  <img src={cat.image} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
                                ) : (
                                  <span className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                                    <Grid3X3 className="w-4 h-4" />
                                  </span>
                                )}
                                <span className="truncate">{cat.name}</span>
                              </span>
                              {cat.productsCount > 0 && (
                                <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-gray-100 text-xs text-gray-500 font-cairo">
                                  {t('categories.productsCount', { count: cat.productsCount })}
                                </span>
                              )}
                            </Link>
                          ))}
                          <div className="mt-1 pt-2 border-t border-gray-100">
                            <Link
                              to={PAGES.CATEGORIES}
                              onClick={() => setCategoriesOpen(false)}
                              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold font-cairo text-secondary hover:bg-secondary/5 transition-colors"
                            >
                              {t('nav.categories')}
                              <ChevronRight className={cn('w-4 h-4', i18n.language === 'ar' && 'rotate-180')} />
                            </Link>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
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
                      <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 pointer-events-none" />
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
                        placeholder={t('common.searchPlaceholder')}
                        className="w-full py-2.5 pr-10 pl-12 text-sm font-cairo bg-gray-100 border border-transparent focus:border-secondary/30 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all"
                        dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
                      />
                      {searchQuery ? (
                        <button
                          type="button"
                          onClick={handleClearSearch}
                          className="absolute left-1.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
                          aria-label={t('nav.clearSearch')}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        !searchFocused && (
                          <kbd className="absolute left-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded-md text-[10px] font-medium text-gray-400 bg-gray-200 border border-gray-300 leading-none pointer-events-none">
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

              {/* Language Switcher - Mobile */}
              <div className="lg:hidden">
                <LanguageSwitcher iconOnly />
              </div>

              {/* Desktop-only: Wishlist, Compare, Language, Notifications */}
              <div className="hidden lg:flex items-center gap-1">
                <Link
                  to={PAGES.WISHLIST}
                  className="relative p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
                  aria-label={t('nav.wishlistLabel')}
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

                <Link
                  to={PAGES.COMPARE}
                  className="relative p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
                  aria-label={t('nav.compareLabel')}
                >
                  <BarChart3 className="w-5 h-5" />
                </Link>

                <LanguageSwitcher />

                <NotificationPopover />
              </div>

              {/* Cart with Preview */}
              <CartPreview />

              {/* User Menu */}
              <div ref={userMenuRef} className="relative">
                {isAuthenticated && user ? (
                  <>
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center gap-2 p-1 sm:p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
                      aria-expanded={showUserMenu}
                      aria-haspopup="true"
                    >
                      <div className="w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 rounded-full bg-secondary flex items-center justify-center text-white text-xs lg:text-sm font-bold font-cairo overflow-hidden">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          user.name.charAt(0)
                        )}
                      </div>
                      <span className="hidden lg:block text-sm font-medium font-cairo text-gray-700 max-w-[100px] truncate">
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
                      <div className="absolute top-full left-0 mt-2 w-56 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-soft-xl border border-gray-100 overflow-hidden animate-fade-in">
                        <div className="p-2">
                          <div className="px-3 py-2 border-b border-gray-100 mb-1">
                            <p className="text-sm font-bold font-cairo text-gray-900">{user.name}</p>
                            <p className="text-xs text-gray-500 font-cairo">{user.email}</p>
                          </div>
                          <Link
                            to={PAGES.PROFILE}
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-cairo text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <User className="w-4 h-4" />
                            {t('nav.profile')}
                          </Link>
                          <Link
                            to={PAGES.MY_ORDERS}
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-cairo text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Package className="w-4 h-4" />
                            {t('nav.myOrders')}
                          </Link>
                          <Link
                            to={PAGES.SETTINGS}
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-cairo text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Settings className="w-4 h-4" />
                            {t('nav.settings')}
                          </Link>
                          <Link
                            to={PAGES.FAQ}
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-cairo text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <HelpCircle className="w-4 h-4" />
                            {t('nav.help')}
                          </Link>
                          <hr className="my-1 border-gray-100" />
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm font-cairo text-danger hover:bg-danger/5 transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            {t('nav.logout')}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="lg:hidden p-1.5 sm:p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
                      aria-label={t('nav.loginLabel')}
                    >
                      <UserCircle className="w-6 h-6 sm:w-7 sm:h-7" />
                    </Link>
                    <Link to="/login" className="hidden lg:block">
                      <Button variant="primary" size="sm" rounded="full" className="shadow-none hover:shadow-none">
                        {t('nav.login')}
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>


      </header>

      {/* Spacer for fixed header */}
      <div className={cn(announcementVisible ? 'h-[100px] lg:h-[116px]' : 'h-16 lg:h-20')} />

      {/* Premium Bottom Navigation for Mobile */}
      <nav className={cn(
        'md:hidden fixed bottom-0 left-0 right-0 z-50 transition-transform duration-500 ease-in-out',
        hideHeader && 'translate-y-full',
        'ios-safe-area-inset'
      )}>
        <div className="relative mx-3 mb-2 rounded-2xl bg-white/90 backdrop-blur-xl shadow-[0_-4px_20px_rgba(0,0,0,0.08),0_-4px_20px_rgba(0,0,0,0.3)] border border-white/20">
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
                    isActive && 'bg-secondary/10'
                  )}>
                    <Icon className={cn(
                      'w-5 h-5 transition-all duration-200',
                      isActive ? 'text-secondary scale-110' : 'text-gray-400'
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
                      : 'text-gray-400'
                  )}>
                    {t(tab.label)}
                  </span>
                  {isActive && (
                    <div className="absolute -bottom-0.5 w-6 h-0.5 rounded-full bg-secondary animate-fade-in" />
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
