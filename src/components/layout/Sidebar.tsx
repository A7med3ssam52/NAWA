import { useEffect, memo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Home,
  Package,
  Grid3X3,
  Percent,
  Heart,
  ShoppingCart,
  User,
  LogIn,
  Mail,
  Phone,
  MapPin,
  ArrowLeft,
  Bell,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/utils';
import { useAuth } from '@/contexts';
import { categories } from '@/data';
import { PAGES } from '@/constants';
import { LanguageSwitcher } from '@/components/ui';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navLinks = [
  { label: 'nav.home', href: PAGES.HOME, icon: Home },
  { label: 'nav.products', href: PAGES.PRODUCTS, icon: Package },
  { label: 'nav.categories', href: PAGES.CATEGORIES, icon: Grid3X3 },
  { label: 'nav.offers', href: PAGES.OFFERS, icon: Percent },
];

const contactItems = [
  { icon: MapPin, tKey: 'nav.location' as const },
  { icon: Phone, text: '+20 100 123 4567', dir: 'ltr' as const },
  { icon: Mail, text: 'info@zahieg.com' },
];

const catColors = [
  'from-secondary to-accent',
  'from-accent to-orange-400',
  'from-success to-green-400',
  'from-danger to-red-400',
  'from-purple-500 to-pink-500',
  'from-cyan-500 to-accent',
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } },
};

export const Sidebar = memo(function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={t('nav.sidebarLabel')}>
          {/* Backdrop with gradient blur */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-l from-black/70 via-black/50 to-transparent backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.div
            className="absolute inset-y-0 right-0 w-full max-w-sm bg-white shadow-2xl flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: 0, transition: { type: 'spring', damping: 30, stiffness: 300 } }}
            exit={{ x: '100%', transition: { duration: 0.25, ease: 'easeIn' } }}
            dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
          >
            {/* Decorative blobs */}
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

            {/* Header with user section */}
            <div className="relative bg-gradient-to-l from-secondary/5 to-transparent border-b border-gray-100">
              <div className="flex items-center justify-between p-4">
                {isAuthenticated && user ? (
                  <motion.div
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="relative">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-secondary to-accent flex items-center justify-center text-white font-bold font-cairo text-lg overflow-hidden shadow-lg shadow-secondary/20">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          user.name.charAt(0)
                        )}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-success rounded-full border-2 border-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold font-cairo text-gray-900">{t('nav.welcomeUser', { name: user.name })}</p>
                      <p className="text-xs text-gray-500 font-cairo">{user.email}</p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-secondary/20 to-accent/20 flex items-center justify-center">
                      <User className="w-6 h-6 text-secondary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold font-cairo text-gray-900">{t('nav.welcome')}</p>
                      <p className="text-xs text-gray-500 font-cairo">{t('nav.welcomeDesc')}</p>
                    </div>
                  </motion.div>
                )}
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-white/50 transition-colors"
                  aria-label={t('common.close')}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Quick actions for guests */}
              {!isAuthenticated && (
                <div className="px-4 pb-4">
                  <Link
                    to="/login"
                    onClick={onClose}
                    className="flex items-center justify-between px-4 py-3 rounded-2xl bg-gradient-to-l from-secondary to-accent text-white text-sm font-bold font-cairo shadow-lg shadow-secondary/25 hover:shadow-xl hover:shadow-secondary/30 transition-all"
                  >
                    <span>{t('nav.loginOrRegister')}</span>
                    <ArrowLeft className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>

            {/* Navigation */}
            <motion.div
              className="flex-1 overflow-y-auto p-4 scrollbar-thin"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {/* Main Links */}
              <div className="space-y-0.5 mb-6">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <motion.div key={link.href} variants={itemVariants}>
                      <Link
                        to={link.href}
                        onClick={onClose}
                        className="flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-sm font-medium font-cairo text-gray-700 hover:bg-secondary/5 hover:text-secondary transition-all duration-200 group"
                      >
                        <span className="p-2 rounded-xl bg-gray-100 text-gray-400 group-hover:bg-secondary/10 group-hover:text-secondary transition-all duration-200">
                          <Icon className="w-5 h-5" />
                        </span>
                        {t(link.label)}
                      </Link>
                    </motion.div>
                  );
                })}
              </div>

              {/* Divider */}
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100" />
                </div>
              </div>

              {/* User Links */}
              <motion.div className="space-y-0.5 mb-6" variants={itemVariants}>
                <div className="px-3.5 mb-2">
                  <span className="text-[11px] font-bold font-cairo text-gray-400 uppercase tracking-widest">{t('nav.myAccount')}</span>
                </div>
                {[
                  { label: 'nav.wishlist', href: PAGES.WISHLIST, icon: Heart },
                  { label: 'nav.cart', href: PAGES.CART, icon: ShoppingCart },
                  ...(isAuthenticated
                    ? [{ label: 'nav.profile', href: PAGES.PROFILE, icon: User }]
                    : [{ label: 'nav.login', href: '/login', icon: LogIn }]
                  ),
                ].map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={t(link.label)}
                      to={link.href}
                      onClick={onClose}
                      className="flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl text-sm font-medium font-cairo text-gray-700 hover:bg-secondary/5 hover:text-secondary transition-all duration-200 group"
                    >
                      <span className="p-1.5 rounded-xl bg-gray-100 text-gray-400 group-hover:bg-secondary/10 group-hover:text-secondary transition-all duration-200">
                        <Icon className="w-4 h-4" />
                      </span>
                      {t(link.label)}
                    </Link>
                  );
                })}
              </motion.div>

              {/* Divider */}
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100" />
                </div>
              </div>

              {/* More */}
              <motion.div className="space-y-0.5 mb-6" variants={itemVariants}>
                <div className="px-3.5 mb-2">
                  <span className="text-[11px] font-bold font-cairo text-gray-400 uppercase tracking-widest">{t('nav.more')}</span>
                </div>
                <Link
                  to={PAGES.NOTIFICATIONS}
                  onClick={onClose}
                  className="flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl text-sm font-medium font-cairo text-gray-700 hover:bg-secondary/5 hover:text-secondary transition-all duration-200 group"
                >
                  <span className="p-1.5 rounded-xl bg-gray-100 text-gray-400 group-hover:bg-secondary/10 group-hover:text-secondary transition-all duration-200">
                    <Bell className="w-4 h-4" />
                  </span>
                  {t('nav.notifications')}
                </Link>
                <Link
                  to={PAGES.COMPARE}
                  onClick={onClose}
                  className="flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl text-sm font-medium font-cairo text-gray-700 hover:bg-secondary/5 hover:text-secondary transition-all duration-200 group"
                >
                  <span className="p-1.5 rounded-xl bg-gray-100 text-gray-400 group-hover:bg-secondary/10 group-hover:text-secondary transition-all duration-200">
                    <BarChart3 className="w-4 h-4" />
                  </span>
                  {t('nav.compare')}
                </Link>

              </motion.div>

              {/* Divider */}
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100" />
                </div>
              </div>

              {/* Categories */}
              <motion.div className="mb-6" variants={itemVariants}>
                <div className="px-3.5 mb-3">
                  <span className="text-[11px] font-bold font-cairo text-gray-400 uppercase tracking-widest">{t('nav.categories')}</span>
                </div>
                <div className="space-y-0.5">
                  {categories.map((cat, idx) => (
                    <Link
                      key={cat.id}
                      to={`${PAGES.CATEGORY_PRODUCTS.replace(':slug', cat.slug)}`}
                      onClick={onClose}
                      className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-cairo text-gray-700 hover:bg-secondary/5 hover:text-secondary transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-2 h-2 rounded-full bg-gradient-to-br',
                          catColors[idx % catColors.length],
                        )} />
                        <span>{cat.name}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </motion.div>

              {/* Divider */}
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100" />
                </div>
              </div>

              {/* Language Switcher */}
              <motion.div className="mb-4 px-3.5" variants={itemVariants}>
                <div className="px-3.5 mb-3">
                  <span className="text-[11px] font-bold font-cairo text-gray-400 uppercase tracking-widest">{t('profile.language')}</span>
                </div>
                <div className="px-3.5">
                  <LanguageSwitcher />
                </div>
              </motion.div>

              {/* Contact Info */}
              <motion.div className="mb-4" variants={itemVariants}>
                <div className="px-3.5 mb-3">
                  <span className="text-[11px] font-bold font-cairo text-gray-400 uppercase tracking-widest">{t('nav.contactUs')}</span>
                </div>
                <div className="space-y-2 px-3.5">
                  {contactItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.text || item.tKey} className="flex items-center gap-3 text-sm text-gray-500 font-cairo">
                        <span className="p-1.5 rounded-xl bg-secondary/5 text-secondary shrink-0">
                          <Icon className="w-3.5 h-3.5" />
                        </span>
                        <span dir={item.dir}>{item.tKey ? t(item.tKey) : item.text}</span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Footer branding */}
              <div className="text-center pt-2 pb-1">
                <p className="text-[10px] text-gray-400 font-cairo">{t('nav.copyright')}</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
});
