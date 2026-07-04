import { useState } from 'react';
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

  const canSpin = spinsRemainingToday > 0;

  function handleStartSpin() {
    if (!canSpin || isSpinning) return;
    startSpin();
  }

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            onClick={() => setIsOpen(true)}
            className={cn(
              'fixed bottom-6 left-6 z-40 flex items-center gap-2',
              'px-4 py-3 rounded-2xl shadow-2xl transition-all duration-300',
              'font-bold text-sm font-cairo',
              canSpin
                ? 'bg-gradient-to-r from-secondary to-blue-500 text-white hover:shadow-secondary/40 hover:scale-105 active:scale-95'
                : 'bg-gray-200 dark:bg-dark-border text-gray-400 dark:text-dark-muted cursor-not-allowed',
            )}
          >
            {canSpin && (
              <motion.span
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              >
                <Gift className="w-5 h-5" />
              </motion.span>
            )}
            {!canSpin && <Sparkles className="w-5 h-5" />}
            <span>عجلة الحظ</span>
            {canSpin && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-danger text-white text-[9px] font-bold flex items-center justify-center shadow-lg shadow-danger/40"
              >
                {spinsRemainingToday}
              </motion.span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Modal overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsOpen(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 40 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md bg-white dark:bg-dark-card rounded-3xl shadow-2xl border border-gray-100 dark:border-dark-border p-6 pt-10"
              dir="rtl"
            >
              {/* Close button */}
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-3 left-3 p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-border transition-colors"
                aria-label="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Title */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-l from-secondary/10 to-blue-500/10 text-secondary text-sm font-bold font-cairo mb-3">
                  <Sparkles className="w-4 h-4" />
                  فرصة يومية
                </div>
                <h2 className="text-2xl font-bold font-cairo text-gray-900 dark:text-dark-text">
                  عجلة الحظ
                </h2>
                <p className="text-sm text-gray-500 dark:text-dark-muted font-cairo mt-1">
                  {canSpin
                    ? `لديك ${spinsRemainingToday} فرصة للفوز اليوم`
                    : 'لقد استنفذت فرصك اليوم، عد غداً!'}
                </p>
              </div>

              {/* Wheel */}
              <SpinWheel
                prizes={prizes}
                spinning={isSpinning}
                onSpinEnd={completeSpin}
                onStartSpin={handleStartSpin}
                disabled={!canSpin || isSpinning}
              />

              {/* Prizes legend */}
              <div className="mt-6 space-y-1.5">
                <p className="text-[11px] font-bold text-gray-400 dark:text-dark-muted font-cairo text-center mb-2">
                  الجوائز
                </p>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {prizes.filter((p) => p.isActive).map((prize) => (
                    <span
                      key={prize.id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-cairo"
                      style={{
                        backgroundColor: prize.color + '20',
                        color: prize.color,
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
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

      {/* Result modal */}
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
