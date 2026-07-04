import { useRef, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronUp } from 'lucide-react';
import { cn } from '@/utils';

interface IosBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  showHandle?: boolean;
}

export const IosBottomSheet = memo(function IosBottomSheet({
  isOpen,
  onClose,
  title,
  children,
  showHandle = true
}: IosBottomSheetProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const handleOverlayClick = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleSheetClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            ref={overlayRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleOverlayClick}
            className="ios-bottom-sheet-overlay fixed inset-0 z-50"
          />

          <motion.div
            ref={sheetRef}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={handleSheetClick}
            className={cn(
              'ios-bottom-sheet ios-safe-area-inset',
              isOpen && 'open'
            )}
            style={{ maxHeight: '85vh' }}
          >
            {showHandle && (
              <div className="flex justify-center py-3">
                <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
              </div>
            )}

            {title && (
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center">
                  {title}
                </h3>
              </div>
            )}

            <div className="px-4 py-6 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 80px)' }}>
              {children}
            </div>

            {onClose && (
              <button
                onClick={onClose}
                className="absolute top-3 right-3 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white ios-touch-feedback"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});