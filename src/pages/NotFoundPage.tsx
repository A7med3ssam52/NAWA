import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, Store } from 'lucide-react';
import { Button } from '@/components/ui';
import { PAGES } from '@/constants';

export function NotFoundPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      className="relative min-h-screen overflow-hidden bg-secondary flex items-center justify-center px-4 py-12"
    >
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -right-32 w-[28rem] h-[28rem] rounded-full bg-accent/15 blur-3xl" />
        <div className="absolute -bottom-40 -left-32 w-[32rem] h-[32rem] rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[36rem] h-[36rem] rounded-full bg-background/5 blur-2xl" />
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: 'radial-gradient(circle, #EFEDE2 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-xl w-full">
        {/* 404 number */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="font-cairo font-black text-[7rem] sm:text-[9rem] lg:text-[11rem] leading-none bg-clip-text text-transparent bg-gradient-to-b from-accent via-accent to-accent/30 drop-shadow-[0_10px_30px_rgba(233,195,148,0.25)]"
        >
          404
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: '4rem' }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="h-1 rounded-full bg-accent mb-7"
        />

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="text-2xl sm:text-3xl font-bold font-cairo text-background mb-4"
        >
          {t('notFound.title')}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.45 }}
          className="text-sm sm:text-base text-background/70 font-cairo max-w-md mb-10 leading-relaxed"
        >
          {t('notFound.description')}
        </motion.p>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.55 }}
          className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto"
        >
          <Button
            variant="accent"
            size="lg"
            rounded="xl"
            fullWidth
            className="sm:w-auto sm:min-w-[220px]"
            onClick={() => navigate(PAGES.HOME)}
          >
            <Store className="w-5 h-5" />
            {t('notFound.backToStore')}
          </Button>
          <Button
            variant="outline"
            size="lg"
            rounded="xl"
            fullWidth
            className="sm:w-auto sm:min-w-[180px] border-background/40 text-background hover:bg-background hover:text-secondary"
            onClick={() => navigate(-1)}
          >
            <BackIcon className="w-5 h-5" />
            {t('notFound.goBack')}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}