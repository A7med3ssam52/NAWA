import { type ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/utils';
import { useTranslation } from 'react-i18next';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
  hideClose?: boolean;
}

const sizeStyles = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-[calc(100%-2rem)]',
};

const backdrop = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalAnim = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', damping: 25, stiffness: 300 },
  },
  exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.15 } },
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  className,
  hideClose,
}: ModalProps) {
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            variants={backdrop}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            className={cn(
              'relative w-full bg-white rounded-2xl shadow-soft-xl border border-gray-100',
              'max-h-[90vh] overflow-y-auto',
              sizeStyles[size],
              className
            )}
            variants={modalAnim}
            initial="hidden"
            animate="visible"
            exit="exit"
            dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
          >
            {(title || !hideClose) && (
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                {title && (
                  <h2 className="text-lg font-bold text-gray-900 font-cairo">
                    {title}
                  </h2>
                )}
                {!hideClose && (
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    aria-label={t('common.close')}
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}
            <div className="p-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
