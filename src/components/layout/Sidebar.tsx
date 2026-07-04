import { useEffect, memo } from 'react';
import { Link } from 'react-router-dom';
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
} from 'lucide-react';
import { cn } from '@/utils';
import { useAuth } from '@/contexts';
import { categories } from '@/data';
import { PAGES } from '@/constants';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navLinks = [
  { label: 'الرئيسية', href: PAGES.HOME, icon: Home },
  { label: 'المنتجات', href: PAGES.PRODUCTS, icon: Package },
  { label: 'الأقسام', href: PAGES.CATEGORIES, icon: Grid3X3 },
  { label: 'العروض', href: PAGES.OFFERS, icon: Percent },
];

const contactItems = [
  { icon: MapPin, text: 'القاهرة، مصر' },
  { icon: Phone, text: '+20 100 123 4567', dir: 'ltr' as const },
  { icon: Mail, text: 'info@zahi.store' },
];

const catColors = [
  'from-secondary to-blue-400',
  'from-accent to-orange-400',
  'from-success to-green-400',
  'from-danger to-red-400',
  'from-purple-500 to-pink-500',
  'from-cyan-500 to-blue-500',
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
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="القائمة الجانبية">
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
            className="absolute inset-y-0 right-0 w-full max-w-sm bg-gradient-to-b from-white to-gray-50 dark:from-dark-card dark:to-[#1a2744] shadow-2xl flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: 0, transition: { type: 'spring', damping: 30, stiffness: 300 } }}
            exit={{ x: '100%', transition: { duration: 0.25, ease: 'easeIn' } }}
            dir="rtl"
          >
            {/* Decorative blobs */}
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

            {/* Header with user section */}
            <div className="relative bg-gradient-to-l from-secondary/5 to-transparent border-b border-gray-100 dark:border-white/5">
              <div className="flex items-center justify-between p-4">
                {isAuthenticated && user ? (
                  <motion.div
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="relative">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-secondary to-blue-400 flex items-center justify-center text-white font-bold font-cairo text-lg overflow-hidden shadow-lg shadow-secondary/20">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          user.name.charAt(0)
                        )}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-success rounded-full border-2 border-white dark:border-dark-card" />
                    </div>
                    <div>
                      <p className="text-sm font-bold font-cairo text-gray-900 dark:text-dark-text">مرحباً، {user.name}</p>
                      <p className="text-xs text-gray-500 dark:text-dark-muted font-cairo">{user.email}</p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-secondary/20 to-blue-400/20 flex items-center justify-center">
                      <User className="w-6 h-6 text-secondary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold font-cairo text-gray-900 dark:text-dark-text">مرحباً بك</p>
                      <p className="text-xs text-gray-500 dark:text-dark-muted font-cairo">تسوق واستمتع بأفضل العروض</p>
                    </div>
                  </motion.div>
                )}
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-dark-text hover:bg-white/50 dark:hover:bg-white/5 transition-colors"
                  aria-label="إغلاق"
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
                    className="flex items-center justify-between px-4 py-3 rounded-2xl bg-gradient-to-l from-secondary to-blue-500 text-white text-sm font-bold font-cairo shadow-lg shadow-secondary/25 hover:shadow-xl hover:shadow-secondary/30 transition-all"
                  >
                    <span>تسجيل الدخول أو إنشاء حساب</span>
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
                        className="flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-sm font-medium font-cairo text-gray-700 dark:text-dark-muted hover:bg-secondary/5 dark:hover:bg-white/5 hover:text-secondary dark:hover:text-secondary transition-all duration-200 group"
                      >
                        <span className="p-2 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-400 group-hover:bg-secondary/10 group-hover:text-secondary transition-all duration-200">
                          <Icon className="w-5 h-5" />
                        </span>
                        {link.label}
                      </Link>
                    </motion.div>
                  );
                })}
              </div>

              {/* Divider */}
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100 dark:border-white/5" />
                </div>
              </div>

              {/* User Links */}
              <motion.div className="space-y-0.5 mb-6" variants={itemVariants}>
                <div className="px-3.5 mb-2">
                  <span className="text-[11px] font-bold font-cairo text-gray-400 dark:text-dark-muted uppercase tracking-widest">حسابي</span>
                </div>
                {[
                  { label: 'المفضلة', href: PAGES.WISHLIST, icon: Heart },
                  { label: 'سلة التسوق', href: PAGES.CART, icon: ShoppingCart },
                  ...(isAuthenticated
                    ? [{ label: 'الملف الشخصي', href: PAGES.PROFILE, icon: User }]
                    : [{ label: 'تسجيل الدخول', href: '/login', icon: LogIn }]
                  ),
                ].map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.label}
                      to={link.href}
                      onClick={onClose}
                      className="flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl text-sm font-medium font-cairo text-gray-700 dark:text-dark-muted hover:bg-secondary/5 dark:hover:bg-white/5 hover:text-secondary dark:hover:text-secondary transition-all duration-200 group"
                    >
                      <span className="p-1.5 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-400 group-hover:bg-secondary/10 group-hover:text-secondary transition-all duration-200">
                        <Icon className="w-4 h-4" />
                      </span>
                      {link.label}
                    </Link>
                  );
                })}
              </motion.div>

              {/* Divider */}
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100 dark:border-white/5" />
                </div>
              </div>

              {/* Categories */}
              <motion.div className="mb-6" variants={itemVariants}>
                <div className="px-3.5 mb-3">
                  <span className="text-[11px] font-bold font-cairo text-gray-400 dark:text-dark-muted uppercase tracking-widest">الأقسام</span>
                </div>
                <div className="space-y-0.5">
                  {categories.map((cat, idx) => (
                    <Link
                      key={cat.id}
                      to={`${PAGES.CATEGORY_PRODUCTS.replace(':slug', cat.slug)}`}
                      onClick={onClose}
                      className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-cairo text-gray-700 dark:text-dark-muted hover:bg-secondary/5 dark:hover:bg-white/5 hover:text-secondary dark:hover:text-secondary transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-2 h-2 rounded-full bg-gradient-to-br',
                          catColors[idx % catColors.length],
                        )} />
                        <span>{cat.name}</span>
                      </div>
                      <span className="text-xs text-gray-400 dark:text-dark-muted bg-gray-50 dark:bg-white/5 px-2 py-0.5 rounded-full">{cat.productsCount}</span>
                    </Link>
                  ))}
                </div>
              </motion.div>

              {/* Divider */}
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100 dark:border-white/5" />
                </div>
              </div>

              {/* Contact Info */}
              <motion.div className="mb-4" variants={itemVariants}>
                <div className="px-3.5 mb-3">
                  <span className="text-[11px] font-bold font-cairo text-gray-400 dark:text-dark-muted uppercase tracking-widest">تواصل معنا</span>
                </div>
                <div className="space-y-2 px-3.5">
                  {contactItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.text} className="flex items-center gap-3 text-sm text-gray-500 dark:text-dark-muted font-cairo">
                        <span className="p-1.5 rounded-xl bg-secondary/5 text-secondary shrink-0">
                          <Icon className="w-3.5 h-3.5" />
                        </span>
                        <span dir={item.dir}>{item.text}</span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Footer branding */}
              <div className="text-center pt-2 pb-1">
                <p className="text-[10px] text-gray-400 dark:text-dark-muted font-cairo">© زاهي 2026 - جميع الحقوق محفوظة</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
});
