import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Target, Eye, Users, ShoppingBag, Package, HeadphonesIcon, Award } from 'lucide-react';

export function AboutPage() {
  const { t, i18n } = useTranslation();
  const [siteStats] = useState({ customers: 1200, productsAvailable: 150, productsSold: 450, satisfaction: 98 });

  const formatNumber = (n: number) => n.toLocaleString(i18n.language === 'ar' ? 'ar-EG' : 'en-US');
  const { customers, productsAvailable, productsSold, satisfaction } = siteStats;

  const stats = [
    { icon: Users, value: `${formatNumber(customers)}+`, label: t('about.customers') },
    { icon: ShoppingBag, value: `${formatNumber(productsSold)}+`, label: t('about.productsSold') },
    { icon: Package, value: `${formatNumber(productsAvailable)}+`, label: t('about.productsAvailable') },
    { icon: Award, value: `${formatNumber(satisfaction)}%`, label: t('about.satisfaction') },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
      className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-16"
    >
      <section className="text-center mb-12 lg:mb-16">
        <h1 className="text-3xl lg:text-4xl font-bold font-cairo text-gray-900 mb-4">
          {t('about.title')}
        </h1>
        <div className="w-20 h-1 bg-secondary rounded-full mx-auto mb-6" />
        <p className="text-sm lg:text-base text-gray-600 font-cairo leading-relaxed max-w-2xl mx-auto">
          {t('about.introText')}
        </p>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12 lg:mb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="p-6 bg-white rounded-2xl border border-gray-100 shadow-soft">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-secondary/10 text-secondary mb-4">
            <Target className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold font-cairo text-gray-900 mb-2">{t('about.mission')}</h3>
          <p className="text-sm text-gray-600 font-cairo leading-relaxed">
            {t('about.missionText')}
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="p-6 bg-white rounded-2xl border border-gray-100 shadow-soft">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-accent/10 text-accent mb-4">
            <Eye className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold font-cairo text-gray-900 mb-2">{t('about.vision')}</h3>
          <p className="text-sm text-gray-600 font-cairo leading-relaxed">
            {t('about.visionText')}
          </p>
        </motion.div>
      </div>

      <section className="mb-12 lg:mb-16">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="p-5 bg-white rounded-2xl border border-gray-100 shadow-soft text-center"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-secondary/10 text-secondary mx-auto mb-3">
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-xl font-bold font-cairo text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500 font-cairo mt-1">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>
      </section>
    </motion.div>
  );
}
