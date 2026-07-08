import { motion } from 'framer-motion';
import { Smartphone, Building2, CreditCard, Wallet, Banknote, Landmark } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function PaymentPage() {
  const { t, i18n } = useTranslation();

  const paymentMethods = [
    {
      id: 'vodafone-cash',
      name: t('payment.vodafoneCash'),
      desc: t('payment.vodafoneCashDesc'),
      icon: Smartphone,
      color: '#E60000',
      bg: 'bg-red-50',
      details: [t('payment.detailVodafoneTransfer'), t('payment.detailVodafone247'), t('payment.detailVodafoneFees')],
    },
    {
      id: 'fawry',
      name: t('payment.fawry'),
      desc: t('payment.fawryDesc'),
      icon: Building2,
      color: '#00A651',
      bg: 'bg-green-50',
      details: [t('payment.detailFawryNearby'), t('payment.detailFawryCash'), t('payment.detailFawryInstant')],
    },
    {
      id: 'instapay',
      name: t('payment.instapay'),
      desc: t('payment.instapayDesc'),
      icon: Landmark,
      color: '#4A148C',
      bg: 'bg-purple-50',
      details: [t('payment.detailInstapayBanks'), t('payment.detailInstapayFree'), t('payment.detailInstapayApp')],
    },
    {
      id: 'visa-mastercard',
      name: t('payment.cards'),
      desc: t('payment.cardsDesc'),
      icon: CreditCard,
      color: '#1A1F71',
      bg: 'bg-blue-50',
      details: [t('payment.detailCardsTypes'), t('payment.detailCardsSecure'), t('payment.detailCardsInstant')],
    },
    {
      id: 'valu',
      name: t('payment.valu'),
      desc: t('payment.valuDesc'),
      icon: Banknote,
      color: '#1B9CFC',
      bg: 'bg-sky-50',
      details: [t('payment.detailValuMonths'), t('payment.detailValuApproval'), t('payment.detailValuNoDown')],
    },
    {
      id: 'cod',
      name: t('payment.cod'),
      desc: t('payment.codDesc'),
      icon: Wallet,
      color: '#F59E0B',
      bg: 'bg-amber-50',
      details: [t('payment.detailCodCash'), t('payment.detailCodAllAreas'), t('payment.detailCodInspect')],
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
      className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-16"
    >
      <div className="text-center mb-12">
        <h1 className="text-3xl lg:text-4xl font-bold font-cairo text-gray-900 mb-3">
          {t('payment.title')}
        </h1>
        <p className="text-sm lg:text-base text-gray-500 font-cairo max-w-xl mx-auto">
          {t('payment.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {paymentMethods.map((method, idx) => {
          const Icon = method.icon;
          return (
            <motion.div
              key={method.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.08 }}
              className="bg-white rounded-2xl border border-gray-100 p-6 shadow-soft hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex items-center justify-center w-14 h-14 rounded-2xl shrink-0 ${method.bg}`}
                  style={{ color: method.color }}
                >
                  <Icon className="w-7 h-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold font-cairo text-gray-900 mb-1">
                    {method.name}
                  </h3>
                  <p className="text-sm text-gray-500 font-cairo mb-4">
                    {method.desc}
                  </p>
                  <ul className="space-y-1.5">
                    {method.details.map((detail) => (
                      <li key={detail} className="flex items-center gap-2 text-xs text-gray-600 font-cairo">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: method.color }} />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-12 bg-gradient-to-l from-secondary/10 via-accent/10 to-secondary/10 rounded-2xl p-6 lg:p-8 text-center border border-gray-100">
        <h2 className="text-lg font-bold font-cairo text-gray-900 mb-3">
          {t('payment.safePayment')}
        </h2>
        <p className="text-sm text-gray-500 font-cairo max-w-lg mx-auto">
          {t('payment.safePaymentDesc')}
        </p>
        <div className="flex items-center justify-center gap-3 mt-4">
          <CreditCard className="w-5 h-5 text-secondary" />
          <span className="text-xs text-gray-400 font-cairo">
            {t('payment.poweredBy')}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
