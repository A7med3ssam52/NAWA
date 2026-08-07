import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, Package, ShoppingBag } from 'lucide-react';
import { useOrder } from '@/api';
import { PAGES } from '@/constants';
import { Button } from '@/components/ui';

export function OrderSuccessPage() {
  const { t, i18n } = useTranslation();
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { data: order } = useOrder(orderId);

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
