import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export function PrivacyPage() {
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
        {t('privacy.title')}
      </h1>
      <div className="w-20 h-1 bg-secondary rounded-full mb-8" />

      <div className="prose prose-sm max-w-none font-cairo text-gray-600 space-y-6 leading-relaxed">
        <p>{t('privacy.intro')}</p>

        <h2 className="text-lg font-bold text-gray-900">{t('privacy.section1Title')}</h2>
        <p>{t('privacy.section1Content')}</p>
        <ul className="list-disc pr-5 space-y-1">
          <li>{t('privacy.section1Item1')}</li>
          <li>{t('privacy.section1Item2')}</li>
          <li>{t('privacy.section1Item3')}</li>
          <li>{t('privacy.section1Item4')}</li>
        </ul>

        <h2 className="text-lg font-bold text-gray-900">{t('privacy.section2Title')}</h2>
        <p>{t('privacy.section2Content')}</p>
        <ul className="list-disc pr-5 space-y-1">
          <li>{t('privacy.section2Item1')}</li>
          <li>{t('privacy.section2Item2')}</li>
          <li>{t('privacy.section2Item3')}</li>
          <li>{t('privacy.section2Item4')}</li>
          <li>{t('privacy.section2Item5')}</li>
        </ul>

        <h2 className="text-lg font-bold text-gray-900">{t('privacy.section3Title')}</h2>
        <p>{t('privacy.section3Content')}</p>

        <h2 className="text-lg font-bold text-gray-900">{t('privacy.section4Title')}</h2>
        <p>{t('privacy.section4Content')}</p>

        <h2 className="text-lg font-bold text-gray-900">{t('privacy.section5Title')}</h2>
        <p>{t('privacy.section5Content')}</p>

        <h2 className="text-lg font-bold text-gray-900">{t('privacy.section6Title')}</h2>
        <p>{t('privacy.section6Content')}</p>
        <ul className="list-disc pr-5 space-y-1">
          <li>{t('privacy.section6Item1')}</li>
          <li>{t('privacy.section6Item2')}</li>
          <li>{t('privacy.section6Item3')}</li>
          <li>{t('privacy.section6Item4')}</li>
        </ul>

        <h2 className="text-lg font-bold text-gray-900">{t('privacy.section7Title')}</h2>
        <p>{t('privacy.section7Content')}</p>

        <h2 className="text-lg font-bold text-gray-900">{t('privacy.section8Title')}</h2>
        <p>{t('privacy.section8Content')}</p>

        <p className="text-xs text-gray-400">{t('privacy.lastUpdated')}</p>
      </div>
    </motion.div>
  );
}
