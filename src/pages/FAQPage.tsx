import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Accordion } from '@/components/ui/Accordion';
import type { AccordionItem } from '@/components/ui/Accordion';

export function FAQPage() {
  const { t, i18n } = useTranslation();

  const faqItems: AccordionItem[] = [
    { id: '1', title: t('faq.q1'), content: t('faq.q1a') },
    { id: '2', title: t('faq.q2'), content: t('faq.q2a') },
    { id: '3', title: t('faq.q3'), content: t('faq.q3a') },
    { id: '4', title: t('faq.q4'), content: t('faq.q4a') },
    { id: '5', title: t('faq.q5'), content: t('faq.q5a') },
    { id: '6', title: t('faq.q6'), content: t('faq.q6a') },
    { id: '7', title: t('faq.q7'), content: t('faq.q7a') },
    { id: '8', title: t('faq.q8'), content: t('faq.q8a') },
    { id: '9', title: t('faq.q9'), content: t('faq.q9a') },
    { id: '10', title: t('faq.q10'), content: t('faq.q10a') },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
      className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-16"
    >
      <div className="text-center mb-10">
        <h1 className="text-3xl lg:text-4xl font-bold font-cairo text-gray-900 mb-3">
          {t('faq.title')}
        </h1>
        <p className="text-sm lg:text-base text-gray-500 font-cairo">
          {t('faq.subtitle')}
        </p>
      </div>

      <Accordion items={faqItems} />
    </motion.div>
  );
}
