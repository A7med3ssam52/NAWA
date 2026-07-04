import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Ticket, Truck, Frown, Sparkles } from 'lucide-react';
import { Modal, Button } from '@/components/ui';
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
    icon: <Gift className="w-8 h-8" />,
    title: 'مبروك!',
    desc: 'لقد ربحت خصماً',
  },
  fixed: {
    icon: <Ticket className="w-8 h-8" />,
    title: 'مبروك!',
    desc: 'لقد ربحت كود خصم',
  },
  freeShipping: {
    icon: <Truck className="w-8 h-8" />,
    title: 'مبروك!',
    desc: 'لقد ربحت شحناً مجانياً',
  },
  tryAgain: {
    icon: <Frown className="w-8 h-8" />,
    title: 'حظ أوفر!',
    desc: 'ربما في المرة القادمة',
  },
};

const confettiColors = ['#2563EB', '#22C55E', '#F59E0B', '#EF4444', '#A855F7', '#EC4899'];

function ConfettiParticles() {
  const particles = useMemo(() =>
    Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -10 - Math.random() * 20,
      color: confettiColors[i % confettiColors.length],
      size: 4 + Math.random() * 8,
      delay: Math.random() * 0.5,
      drift: (Math.random() - 0.5) * 30,
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
            duration: 2.5 + Math.random(),
            delay: p.delay,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        />
      ))}
    </div>
  );
}

export function SpinResultModal({ isOpen, prize, couponCode, onClaim, onClose }: SpinResultModalProps) {
  if (!prize) return null;

  const config = prizeConfig[prize.type] || prizeConfig.tryAgain;
  const isWin = prize.type !== 'tryAgain';

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" hideClose>
      <div className="relative text-center space-y-5 py-4 overflow-hidden">
        {isWin && <ConfettiParticles />}

        <div className="relative">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
            className={cn(
              'w-20 h-20 mx-auto rounded-2xl flex items-center justify-center',
              isWin
                ? 'bg-gradient-to-br from-secondary/10 to-blue-500/10 text-secondary'
                : 'bg-gray-100 text-gray-400',
            )}
          >
            {config.icon}
          </motion.div>

          {/* Sparkles around the icon */}
          {isWin && (
            <>
              <motion.div
                className="absolute -top-1 -right-1"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Sparkles className="w-5 h-5 text-accent" />
              </motion.div>
              <motion.div
                className="absolute -bottom-1 -left-1"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <Sparkles className="w-4 h-4 text-accent" />
              </motion.div>
            </>
          )}
        </div>

        <div className="space-y-2 relative">
          <motion.h3
            className="text-2xl font-bold font-cairo text-gray-900 dark:text-dark-text"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {config.title}
          </motion.h3>
          <motion.p
            className="text-sm text-gray-500 dark:text-dark-muted font-cairo"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {config.desc}
          </motion.p>
        </div>

        <motion.div
          className="relative"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          {prize.type === 'percentage' && (
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-l from-secondary to-blue-500 text-white shadow-lg shadow-secondary/25">
              <span className="text-3xl font-bold font-cairo">{prize.value}%</span>
              <span className="text-sm font-cairo opacity-90">خصم</span>
            </div>
          )}
          {prize.type === 'fixed' && (
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-l from-secondary to-blue-500 text-white shadow-lg shadow-secondary/25">
              <span className="text-3xl font-bold font-cairo">{prize.value?.toLocaleString('ar-EG')}</span>
              <span className="text-sm font-cairo opacity-90">ج.م</span>
            </div>
          )}
          {prize.type === 'freeShipping' && (
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-l from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/25">
              <Truck className="w-6 h-6" />
              <span className="text-xl font-bold font-cairo">شحن مجاني</span>
            </div>
          )}
          {prize.type === 'tryAgain' && (
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gray-100 dark:bg-dark-border text-gray-500 dark:text-dark-muted">
              <span className="text-lg font-bold font-cairo">حظ أوفر في المرة القادمة!</span>
            </div>
          )}
        </motion.div>

        {couponCode && isWin && (
          <motion.div
            className="relative bg-gray-50 dark:bg-dark-border/50 rounded-2xl p-3 border border-dashed border-gray-200 dark:border-gray-600"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-[11px] text-gray-400 dark:text-dark-muted font-cairo mb-1">كود الخصم</p>
            <p className="text-lg font-bold font-cairo text-secondary tracking-wider">{couponCode}</p>
            <p className="text-[10px] text-gray-400 dark:text-dark-muted font-cairo mt-1">صالح لمدة 7 أيام</p>
          </motion.div>
        )}

        <motion.div
          className="relative flex items-center gap-3 pt-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          {isWin ? (
            <>
              <Button variant="ghost" className="flex-1" onClick={onClose}>لاحقاً</Button>
              <Button className="flex-1" onClick={onClaim}>احصل عليه</Button>
            </>
          ) : (
            <Button className="w-full" onClick={onClose}>حسناً</Button>
          )}
        </motion.div>
      </div>
    </Modal>
  );
}

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}
