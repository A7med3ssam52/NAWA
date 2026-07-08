import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const WHATSAPP_NUMBER = '201037223730';

export function NewsletterSection() {
  const { t, i18n } = useTranslation();

  const handleWhatsApp = () => {
    window.open(`https://wa.me/${WHATSAPP_NUMBER}`, '_blank');
  };

  return (
    <section dir={i18n.language === 'ar' ? 'rtl' : 'ltr'} className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-secondary via-secondary/80 to-accent">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03]" aria-hidden="true">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.5 }}
        className="relative z-10 px-6 py-12 lg:py-16 lg:px-16 text-center"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm mb-5">
            <MessageCircle className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl lg:text-3xl font-bold font-cairo text-white mb-2">
            {t('nav.newsletter')}
          </h2>
          <p className="text-base text-white/80 font-cairo max-w-lg mx-auto mb-6">
            {t('nav.newsletterDesc')}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto"
        >
          <button
            type="button"
            onClick={handleWhatsApp}
            className="inline-flex items-center justify-center gap-2 bg-white text-secondary hover:bg-white/90 shadow-lg whitespace-nowrap h-12 px-6 rounded-xl font-cairo font-bold text-base transition-all duration-200"
          >
            <MessageCircle className="w-5 h-5" />
            {t('nav.subscribe')}
          </button>
        </motion.div>
      </motion.div>
    </section>
  );
}

