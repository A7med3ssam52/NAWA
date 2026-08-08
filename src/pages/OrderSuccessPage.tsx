import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, Package, ShoppingBag, KeyRound, Mail, Copy, ShieldCheck, AlertCircle } from 'lucide-react';
import { useOrder } from '@/api';
import { PAGES } from '@/constants';
import { Button } from '@/components/ui';
import { readGuestCredentials, type GuestAccountCredentials } from '@/lib/guestAccount';
import toast from 'react-hot-toast';

export function OrderSuccessPage() {
  const { t, i18n } = useTranslation();
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { data: order } = useOrder(orderId);
  const [guestCredentials] = useState<GuestAccountCredentials | null>(() => readGuestCredentials());

  const copyText = async (text: string, successKey: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t(successKey));
    } catch {
      // clipboard unavailable — ignore
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
      className="max-w-lg mx-auto px-4 sm:px-6 py-12 lg:py-20 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
        className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-success/10 mb-6"
      >
        <CheckCircle className="w-14 h-14 text-success" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-2xl lg:text-3xl font-bold font-cairo text-gray-900 mb-2"
      >
        {t('orders.orderSuccessTitle')}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-sm text-gray-500 font-cairo mb-6"
      >
        {t('orders.orderSuccessDesc')}
      </motion.p>

      {order && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="p-4 bg-gray-50 rounded-2xl mb-6"
        >
          <p className="text-xs text-gray-400 font-cairo mb-1">{t('orders.orderNumber')}</p>
          <p className="text-lg font-bold font-cairo text-gray-900 font-mono" dir="ltr">{order.orderNumber}</p>
        </motion.div>
      )}

      {guestCredentials && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="bg-secondary/5 rounded-2xl border border-secondary/15 p-5 text-right mb-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-secondary" />
            </div>
            <div className="flex-1 text-left">
              <h2 className="text-sm font-bold font-cairo text-gray-900">{t('orders.guestAccountTitle')}</h2>
              <p className="text-xs text-gray-500 font-cairo">{t('orders.guestAccountDesc')}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 px-3.5 h-11">
              <Mail className="w-4 h-4 text-gray-400 shrink-0" />
              <span dir="ltr" className="flex-1 text-sm font-cairo text-gray-900 truncate">{guestCredentials.email}</span>
              <button
                type="button"
                onClick={() => copyText(guestCredentials.email, 'orders.guestCopiedEmail')}
                className="p-1 text-gray-400 hover:text-secondary transition-colors"
                aria-label={t('orders.guestCopyEmail')}
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-start gap-2 bg-white rounded-xl border border-gray-200 p-3">
              <KeyRound className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
              <p className="text-xs font-cairo text-gray-600 leading-relaxed">{t('orders.guestChosenPassword')}</p>
            </div>

            {!guestCredentials.activated && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-cairo text-amber-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {t('orders.guestActivation')}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-4">
            <Link to={PAGES.PROFILE} className="inline-flex items-center gap-1.5 text-xs font-cairo text-secondary hover:text-secondary/80 transition-colors">
              <KeyRound className="w-3.5 h-3.5" />
              {t('orders.guestChangePassword')}
            </Link>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex flex-col sm:flex-row items-center justify-center gap-3"
      >
        <Button variant="secondary" size="lg" rounded="xl" fullWidth onClick={() => navigate(PAGES.MY_ORDERS)}>
          <Package className="w-5 h-5" />
          {t('orders.followOrder')}
        </Button>
        <Button variant="primary" size="lg" rounded="xl" fullWidth onClick={() => navigate(PAGES.PRODUCTS)}>
          <ShoppingBag className="w-5 h-5" />
          {t('orders.continueShopping')}
        </Button>
      </motion.div>
    </motion.div>
  );
}