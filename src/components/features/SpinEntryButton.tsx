import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, AlertCircle, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth, useSpin } from '@/contexts';
import { SpinWheel } from './SpinWheel';
import { SpinResultModal } from './SpinResultModal';
import { cn } from '@/utils';

const PHONE_STORAGE_KEY = 'spin_guest_phone';

function isValidEgyptianPhone(phone: string): boolean {
  return /^01[0-9]{9}$/.test(phone.replace(/\s/g, ''));
}

function getStoredPhone(): string | null {
  try { return localStorage.getItem(PHONE_STORAGE_KEY); } catch { return null; }
}

function storePhone(phone: string) {
  try { localStorage.setItem(PHONE_STORAGE_KEY, phone); } catch {}
}

export function SpinEntryButton() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useAuth();
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
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const stored = getStoredPhone();
      if (stored) {
        setPhone(stored);
        setPhoneVerified(true);
      } else {
        setPhone('');
        setPhoneVerified(false);
      }
      setPhoneError('');
    }
  }, [isOpen]);

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

  const handlePhoneSubmit = useCallback(() => {
    const cleaned = phone.replace(/\s/g, '');
    if (!isValidEgyptianPhone(cleaned)) {
      setPhoneError(t('spin.phoneError'));
      return;
    }
    storePhone(cleaned);
    setPhoneVerified(true);
    setPhoneError('');
  }, [phone]);

  const handlePhoneInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9\s]/g, '').slice(0, 11);
    setPhone(val);
    if (phoneError) setPhoneError('');
  }, [phoneError]);

  const needsPhone = !isAuthenticated && !phoneVerified;

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
                ? 'bg-gradient-to-r from-secondary to-accent text-white hover:shadow-secondary/40 hover:scale-105 active:scale-95'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed',
              isMobile
                ? 'bottom-20 left-3 px-3 py-2.5 text-xs'
                : 'bottom-6 left-6 px-4 py-3 text-sm',
            )}
            style={{
              paddingBottom: isMobile ? 'calc(0.625rem + env(safe-area-inset-bottom, 0px))' : undefined,
            }}
          >
            <motion.span
              animate={{ rotate: canSpin ? [0, 360] : [0, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
            >
              <RefreshCw className={isMobile ? 'w-4 h-4' : 'w-5 h-5'} />
            </motion.span>
            <span>{isMobile ? t('spin.shortTitle') : t('spin.spinButton')}</span>
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
              key={needsPhone ? 'phone' : 'wheel'}
              initial={{ scale: 0.8, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 40 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-[calc(100vw-1rem)] sm:max-w-md mx-auto bg-white rounded-3xl shadow-2xl border border-gray-100 p-4 sm:p-6 pt-8 sm:pt-10 overflow-y-auto max-h-[95vh]"
              dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
            >
              <button
                onClick={handleClose}
                className="absolute top-2 left-2 sm:top-3 sm:left-3 p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label={t('common.close')}
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {needsPhone ? (
                <>
                  <div className="text-center mb-6 sm:mb-8">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-2xl bg-gradient-to-br from-secondary/10 to-accent/10 flex items-center justify-center mb-4">
                      <Phone className="w-8 h-8 sm:w-10 sm:h-10 text-secondary" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold font-cairo text-gray-900">
                      {t('spin.enterPhone')}
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-500 font-cairo mt-2 max-w-xs mx-auto">
                      {t('spin.phonePrompt')}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="relative">
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm sm:text-base font-cairo text-gray-400">
                          +
                        </span>
                        <input
                          type="tel"
                          value={phone}
                          onChange={handlePhoneInput}
                          placeholder="20XXXXXXXXX"
                          className={cn(
                            'w-full text-left dir-ltr px-4 pr-8 py-3 sm:py-3.5 text-base sm:text-lg font-cairo tracking-wider',
                            'bg-gray-50 border-2 rounded-2xl transition-all',
                            'text-gray-900 placeholder-gray-400',
                            'focus:outline-none focus:border-secondary focus:bg-white',
                            phoneError ? 'border-danger' : 'border-gray-200',
                          )}
                          autoFocus
                        />
                      </div>
                      {phoneError && (
                        <div className="flex items-center gap-1.5 mt-2 text-xs text-danger font-cairo">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          {phoneError}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-2xl border border-amber-200">
                      <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                      <p className="text-[11px] text-amber-700 font-cairo">
                        {t('spin.phonePrivacy')}
                      </p>
                    </div>

                    <button
                      onClick={handlePhoneSubmit}
                      disabled={phone.length < 10}
                      className="w-full py-3 sm:py-3.5 rounded-2xl text-sm sm:text-base font-bold font-cairo text-white bg-gradient-to-l from-secondary to-accent shadow-lg shadow-secondary/25 hover:shadow-secondary/40 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-secondary/25"
                    >
                      {t('common.continue')}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center mb-4 sm:mb-6">
                    <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1 rounded-full bg-gradient-to-l from-secondary/10 to-accent/10 text-secondary text-[11px] sm:text-sm font-bold font-cairo mb-2 sm:mb-3">
                      <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
                      {t('spin.dailyChance')}
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold font-cairo text-gray-900">
                      {t('spin.spinButton')}
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-500 font-cairo mt-1">
                      {canSpin
                        ? t('spin.spinsRemaining', { count: spinsRemainingToday })
                        : t('spin.noSpinsLeft')}
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
                    <p className="text-[10px] sm:text-[11px] font-bold text-gray-400 font-cairo text-center mb-2">
                      {t('spin.prizes')}
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
                </>
              )}
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
