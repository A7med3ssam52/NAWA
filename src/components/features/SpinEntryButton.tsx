import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, X, Sparkles } from 'lucide-react';
import { useSpin } from '@/contexts';
import { SpinWheel } from './SpinWheel';
import { SpinResultModal } from './SpinResultModal';
import { cn } from '@/utils';

export function SpinEntryButton() {
  const {
    prizes,
    isSpinning,
    currentPrize,
    showResult,
    spinsRemainingToday,
    startSpin,
    completeSpin,
    claimPrize,
    dismissResult,
  } = useSpin();

  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const canSpin = spinsRemainingToday > 0;

  const handleStartSpin = useCallback(() => {
    if (!canSpin || isSpinning) return;
    startSpin();
  }, [canSpin, isSpinning, startSpin]);

  const handleOpen = useCallback(() => setIsOpen(true), []);
  const handleClose = useCallback(() => setIsOpen(false), []);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) setIsOpen(false);
  }, []);

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            onClick={handleOpen}
            className={cn(
              'fixed z-40 flex items-center gap-2',
              'rounded-2xl shadow-2xl transition-all duration-300',
              'font-bold font-cairo',
              canSpin
                ? 'bg-gradient-to-r from-secondary to-blue-500 text-white hover:shadow-secondary/40 hover:scale-105 active:scale-95'
                : 'bg-gray-200 dark:bg-dark-border text-gray-400 dark:text-dark-muted cursor-not-allowed',
              isMobile
                ? 'bottom-20 left-3 px-3 py-2.5 text-xs'
                : 'bottom-6 left-6 px-4 py-3 text-sm',
            )}
            style={{
              paddingBottom: isMobile ? 'calc(0.625rem + env(safe-area-inset-bottom, 0px))' : undefined,
            }}
          >
            {canSpin ? (
              <motion.span
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              >
                <Gift className={isMobile ? 'w-4 h-4' : 'w-5 h-5'} />
              </motion.span>
            ) : (
              <Sparkles className={isMobile ? 'w-4 h-4' : 'w-5 h-5'} />
            )}
            <span>{isMobile ? 'حظ' : 'عجلة الحظ'}</span>
            {canSpin && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={cn(
                  'absolute -top-1.5 -right-1.5 rounded-full bg-danger text-white font-bold flex items-center justify-center shadow-lg shadow-danger/40',
                  isMobile ? 'w-4 h-4 text-[8px]' : 'w-5 h-5 text-[9px]',
                )}
              >
                {spinsRemainingToday}
              </motion.span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
            onClick={handleBackdropClick}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 40 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-[calc(100vw-1rem)] sm:max-w-md mx-auto bg-white dark:bg-dark-card rounded-3xl shadow-2xl border border-gray-100 dark:border-dark-border p-4 sm:p-6 pt-8 sm:pt-10 overflow-y-auto max-h-[95vh]"
              dir="rtl"
            >
              <button
                onClick={handleClose}
                className="absolute top-2 left-2 sm:top-3 sm:left-3 p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-border transition-colors"
                aria-label="إغلاق"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <div className="text-center mb-4 sm:mb-6">
                <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1 rounded-full bg-gradient-to-l from-secondary/10 to-blue-500/10 text-secondary text-[11px] sm:text-sm font-bold font-cairo mb-2 sm:mb-3">
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                  فرصة يومية
                </div>
                <h2 className="text-xl sm:text-2xl font-bold font-cairo text-gray-900 dark:text-dark-text">
                  عجلة الحظ
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-dark-muted font-cairo mt-1">
                  {canSpin
                    ? `لديك ${spinsRemainingToday} فرصة للفوز اليوم`
                    : 'لقد استنفذت فرصك اليوم، عد غداً!'}
                </p>
              </div>

              <SpinWheel
                prizes={prizes}
                spinning={isSpinning}
                onSpinEnd={completeSpin}
                onStartSpin={handleStartSpin}
                disabled={!canSpin || isSpinning}
              />

              <div className="mt-4 sm:mt-6 space-y-1.5">
                <p className="text-[10px] sm:text-[11px] font-bold text-gray-400 dark:text-dark-muted font-cairo text-center mb-2">
                  الجوائز
                </p>
                <div className="flex flex-wrap justify-center gap-1 sm:gap-1.5">
                  {prizes.filter((p) => p.isActive).map((prize) => (
                    <span
                      key={prize.id}
                      className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold font-cairo"
                      style={{
                        backgroundColor: prize.color + '20',
                        color: prize.color,
                      }}
                    >
                      <span
                        className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full"
                        style={{ backgroundColor: prize.color }}
                      />
                      {prize.label}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <SpinResultModal
        isOpen={showResult}
        prize={currentPrize}
        couponCode={currentPrize && currentPrize.type !== 'tryAgain' ? `SPIN-${Date.now().toString(36).slice(-6).toUpperCase()}` : undefined}
        onClaim={claimPrize}
        onClose={dismissResult}
      />
    </>
  );
}
