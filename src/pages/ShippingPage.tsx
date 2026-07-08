import { motion } from 'framer-motion';
import { Truck, Package, Clock, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function ShippingPage() {
  const { t, i18n } = useTranslation();

  const shippingInfo = [
    {
      icon: Truck,
      title: t('shipping.shippingMethods'),
      items: [t('shipping.expressShipping'), t('shipping.standardShipping'), t('shipping.freeShippingOver')],
    },
    {
      icon: Package,
      title: t('shipping.shippingCost'),
      items: [t('shipping.standardCost'), t('shipping.expressCost'), t('shipping.freeShippingOverCost')],
    },
    {
      icon: Clock,
      title: t('shipping.deliveryTime'),
      items: [t('shipping.cairoGiza'), t('shipping.governorates'), t('shipping.remoteAreas')],
    },
    {
      icon: Shield,
      title: t('shipping.trackOrder'),
      items: [t('shipping.trackViaAccount'), t('shipping.trackCodeEmail'), t('shipping.contactForStatus')],
    },
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
      <h1 className="text-3xl lg:text-4xl font-bold font-cairo text-gray-900 mb-3">
        {t('shipping.title')}
      </h1>
      <div className="w-20 h-1 bg-secondary rounded-full mb-8" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-12">
        {shippingInfo.map((section) => {
          const Icon = section.icon;
          return (
            <div key={section.title} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-soft">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-secondary/10 text-secondary">
                  <Icon className="w-5 h-5" />
                </div>
                <h2 className="text-base font-bold font-cairo text-gray-900">{section.title}</h2>
              </div>
              <ul className="space-y-2 pr-2">
                {section.items.map((item) => (
                  <li key={item} className="text-sm font-cairo text-gray-600 flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-secondary shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
        <h2 className="text-base font-bold font-cairo text-amber-800 mb-2">{t('shipping.importantNotes')}</h2>
        <ul className="space-y-1 pr-4">
          <li className="text-sm font-cairo text-amber-700 list-disc">{t('shipping.noteDeliveryVaries')}</li>
          <li className="text-sm font-cairo text-amber-700 list-disc">{t('shipping.noteCorrectAddress')}</li>
          <li className="text-sm font-cairo text-amber-700 list-disc">{t('shipping.noteNonDelivery')}</li>
        </ul>
      </div>
    </motion.div>
  );
}
