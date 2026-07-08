import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export function TermsPage() {
  const { t, i18n } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
      className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-16"
    >
      <h1 className="text-3xl lg:text-4xl font-bold font-cairo text-gray-900 mb-3">
        {t('terms.title')}
      </h1>
      <div className="w-20 h-1 bg-secondary rounded-full mb-8" />

      <div className="prose prose-sm max-w-none font-cairo text-gray-600 space-y-6 leading-relaxed">
        <p>{t('terms.intro')}</p>

        <h2 className="text-lg font-bold text-gray-900">{t('terms.section1Title')}</h2>
        <p>{t('terms.section1Content')}</p>

        <h2 className="text-lg font-bold text-gray-900">{t('terms.section2Title')}</h2>
        <ul className="list-disc pr-5 space-y-1">
          <li>{t('terms.section2Item1')}</li>
          <li>{t('terms.section2Item2')}</li>
          <li>{t('terms.section2Item3')}</li>
          <li>{t('terms.section2Item4')}</li>
        </ul>

        <h2 className="text-lg font-bold text-gray-900">{t('terms.section3Title')}</h2>
        <ul className="list-disc pr-5 space-y-1">
          <li>{t('terms.section3Item1')}</li>
          <li>{t('terms.section3Item2')}</li>
          <li>{t('terms.section3Item3')}</li>
        </ul>

        <h2 className="text-lg font-bold text-gray-900">{t('terms.section4Title')}</h2>
        <ul className="list-disc pr-5 space-y-1">
          <li>{t('terms.section4Item1')}</li>
          <li>{t('terms.section4Item2')}</li>
          <li>{t('terms.section4Item3')}</li>
          <li>{t('terms.section4Item4')}</li>
        </ul>

        <h2 className="text-lg font-bold text-gray-900">{t('terms.section5Title')}</h2>
        <ul className="list-disc pr-5 space-y-1">
          <li>{t('terms.section5Item1')}</li>
          <li>{t('terms.section5Item2')}</li>
          <li>{t('terms.section5Item3')}</li>
          <li>{t('terms.section5Item4')}</li>
        </ul>

        <h2 className="text-lg font-bold text-gray-900">{t('terms.section6Title')}</h2>
        <p>{t('terms.section6Content')}</p>

        <h2 className="text-lg font-bold text-gray-900">{t('terms.section7Title')}</h2>
        <p>{t('terms.section7Content')}</p>

        <h2 className="text-lg font-bold text-gray-900">{t('terms.section8Title')}</h2>
        <p>{t('terms.section8Content')}</p>

        <h2 className="text-lg font-bold text-gray-900">{t('terms.section9Title')}</h2>
        <p>{t('terms.section9Content')}</p>

        <h2 className="text-lg font-bold text-gray-900">{t('terms.section10Title')}</h2>
        <p>{t('terms.section10Content')}</p>

        <p className="text-xs text-gray-400">{t('terms.lastUpdated')}</p>
      </div>
    </motion.div>
  );
}
