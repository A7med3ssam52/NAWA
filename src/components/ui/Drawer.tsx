import { type ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/utils';
import { useTranslation } from 'react-i18next';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  width?: string;
  className?: string;
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const drawerVariants = {
  hidden: { x: '100%', opacity: 0.5 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: 'spring', damping: 28, stiffness: 300, mass: 0.8 },
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
};

export function Drawer({
  isOpen,
  onClose,
  title,
  children,
  width = 'max-w-md',
  className,
}: DrawerProps) {
  const { t, i18n } = useTranslation();

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
        <div
          className="fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-l from-black/60 via-black/40 to-transparent backdrop-blur-sm"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            className={cn(
              'absolute inset-y-0 left-0 w-full bg-white shadow-2xl border-l border-gray-100 flex flex-col overflow-hidden',
              width,
            )}
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
          >
            {/* Decorative gradient */}
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />

            {(title) && (
              <div className="relative flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-l from-secondary/5 to-transparent">
                <h2 className="text-lg font-bold text-gray-900 font-cairo">
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors active:scale-90"
                  aria-label={t('common.close')}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
            <div className="relative flex-1 overflow-y-auto p-4 scrollbar-thin">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
