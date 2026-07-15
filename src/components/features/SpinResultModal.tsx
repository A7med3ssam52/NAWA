import { useMemo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Gift, Ticket, Truck, Frown, Sparkles } from 'lucide-react';
import type { SpinPrize } from '@/types';

interface SpinResultModalProps {
  isOpen: boolean;
  prize: SpinPrize | null;
  couponCode?: string;
  onClaim: () => void;
  onClose: () => void;
}

const prizeConfig: Record<string, { icon: React.ReactNode; title: string; desc: string }> = {
  percentage: {
    icon: <Gift className="w-6 h-6 sm:w-8 sm:h-8" />,
    title: 'مبروك!',
    desc: 'لقد ربحت خصماً',
  },
  fixed: {
    icon: <Ticket className="w-6 h-6 sm:w-8 sm:h-8" />,
    title: 'مبروك!',
    desc: 'لقد ربحت كود خصم',
  },
  freeShipping: {
    icon: <Truck className="w-6 h-6 sm:w-8 sm:h-8" />,
    title: 'مبروك!',
    desc: 'لقد ربحت شحناً مجانياً',
  },
  tryAgain: {
    icon: <Frown className="w-6 h-6 sm:w-8 sm:h-8" />,
    title: 'حظ أوفر!',
    desc: 'ربما في المرة القادمة',
  },
};

const confettiColors = ['#2563EB', '#22C55E', '#F59E0B', '#EF4444', '#A855F7', '#EC4899'];

function ConfettiParticles() {
  const particles = useMemo(() =>
    Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -10 - Math.random() * 20,
      color: confettiColors[i % confettiColors.length],
      size: 3 + Math.random() * 6,
      delay: Math.random() * 0.5,
      drift: (Math.random() - 0.5) * 25,
    })),
  []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-sm"
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.size * 0.6,
            backgroundColor: p.color,
          }}
          initial={{ y: p.y, x: 0, rotate: 0, opacity: 1 }}
          animate={{
            y: '110vh',
            x: p.drift,
            rotate: 720,
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: 2 + Math.random(),
            delay: p.delay,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        />
      ))}
    </div>
  );
}

export function SpinResultModal({ isOpen, prize, couponCode, onClaim, onClose }: SpinResultModalProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 480);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!prize || !isOpen) return null;

  const config = prizeConfig[prize.type] || prizeConfig.tryAgain;
  const isWin = prize.type !== 'tryAgain';

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 30 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-[calc(100vw-1rem)] sm:max-w-sm mx-auto bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden"
        dir="rtl"
      >
        <div className="relative text-center px-4 sm:px-6 pt-6 sm:pt-8 pb-4 sm:pb-6 overflow-hidden">
          {isWin && <ConfettiParticles />}

          <div className="relative">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
              className={`w-14 h-14 sm:w-20 sm:h-20 mx-auto rounded-2xl flex items-center justify-center ${
                isWin
                  ? 'bg-gradient-to-br from-secondary/10 to-accent/10 text-secondary'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {config.icon}
            </motion.div>

            {isWin && (
              <>
                <motion.div
                  className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
                </motion.div>
                <motion.div
                  className="absolute -bottom-1 -left-1 sm:-bottom-2 sm:-left-2"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-accent" />
                </motion.div>
              </>
            )}
          </div>

          <div className="space-y-1.5 sm:space-y-2 relative mt-3 sm:mt-4">
            <motion.h3
              className="text-xl sm:text-2xl font-bold font-cairo text-gray-900"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {config.title}
            </motion.h3>
            <motion.p
              className="text-xs sm:text-sm text-gray-500 font-cairo"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {config.desc}
            </motion.p>
          </div>

          <motion.div
            className="relative mt-3 sm:mt-4"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            {prize.type === 'percentage' && (
              <div className="inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-2xl bg-gradient-to-l from-secondary to-accent text-white shadow-lg shadow-secondary/25">
                <span className="text-2xl sm:text-3xl font-bold font-cairo">{prize.value}%</span>
                <span className="text-[11px] sm:text-sm font-cairo opacity-90">خصم</span>
              </div>
            )}
            {prize.type === 'fixed' && (
              <div className="inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-2xl bg-gradient-to-l from-secondary to-accent text-white shadow-lg shadow-secondary/25">
                <span className="text-2xl sm:text-3xl font-bold font-cairo">{prize.value?.toLocaleString('ar-EG')}</span>
                <span className="text-[11px] sm:text-sm font-cairo opacity-90">ج.م</span>
              </div>
            )}
            {prize.type === 'freeShipping' && (
              <div className="inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-2xl bg-gradient-to-l from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/25">
                <Truck className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="text-base sm:text-xl font-bold font-cairo">شحن مجاني</span>
              </div>
            )}
            {prize.type === 'tryAgain' && (
              <div className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-2xl bg-gray-100 text-gray-500">
                <span className="text-sm sm:text-lg font-bold font-cairo">حظ أوفر في المرة القادمة!</span>
              </div>
            )}
          </motion.div>

          {couponCode && isWin && (
            <motion.div
              className="relative bg-gray-50 rounded-2xl p-2.5 sm:p-3 mt-3 sm:mt-4 border border-dashed border-gray-200"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <p className="text-[10px] sm:text-[11px] text-gray-400 font-cairo mb-0.5 sm:mb-1">كود الخصم</p>
              <p className="text-base sm:text-lg font-bold font-cairo text-secondary tracking-wider break-all" dir="ltr">{couponCode}</p>
              <p className="text-[9px] sm:text-[10px] text-gray-400 font-cairo mt-0.5 sm:mt-1">صالح لمدة 7 أيام</p>
            </motion.div>
          )}

          <motion.div
            className="relative flex items-center gap-2 sm:gap-3 pt-3 sm:pt-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            {isWin ? (
              <>
                <button
                  onClick={onClose}
                  className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-bold font-cairo text-gray-500 hover:bg-gray-100 transition-all active:scale-95"
                >
                  لاحقاً
                </button>
                <button
                  onClick={onClaim}
                  className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-bold font-cairo text-white bg-gradient-to-l from-secondary to-accent shadow-lg shadow-secondary/25 hover:shadow-secondary/40 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  احصل عليه
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-bold font-cairo text-white bg-gradient-to-l from-secondary to-accent shadow-lg shadow-secondary/25 hover:shadow-secondary/40 hover:scale-[1.02] active:scale-95 transition-all"
              >
                حسناً
              </button>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
