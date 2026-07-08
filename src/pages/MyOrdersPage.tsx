import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts';
import { getUserOrders } from '@/data';
import { OrderCard } from '@/components/features/OrderCard';
import { Tabs, EmptyState } from '@/components/ui';
import { Package } from 'lucide-react';
import type { Tab } from '@/components/ui/Tabs';

export function MyOrdersPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');

  const statusTabs: Tab[] = [
    { id: 'all', label: t('orders.allOrders') },
    { id: 'pending', label: t('orders.pending') },
    { id: 'processing', label: t('orders.processing') },
    { id: 'shipped', label: t('orders.shipped') },
    { id: 'delivered', label: t('orders.delivered') },
    { id: 'cancelled', label: t('orders.cancelled') },
  ];

  if (!user) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} dir="rtl" className="max-w-4xl mx-auto px-4 py-12">
        <EmptyState icon={<Package className="w-16 h-16" />} title={t('notifications.loginRequired')} description={t('orders.loginToViewOrders')} />
      </motion.div>
    );
  }

  const allOrders = getUserOrders(user.id);
  const filteredOrders = activeTab === 'all' ? allOrders : allOrders.filter((o) => o.status === activeTab);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
      className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12"
    >
      <h1 className="text-2xl lg:text-3xl font-bold font-cairo text-gray-900 mb-6">
        {t('orders.myOrders')}
      </h1>

      <Tabs tabs={statusTabs} activeTab={activeTab} onChange={setActiveTab} className="mb-6 overflow-x-auto" />

      {filteredOrders.length > 0 ? (
        <div className="space-y-3">
          {filteredOrders.map((order, i) => (
            <OrderCard key={order.id} order={order} index={i} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Package className="w-16 h-16" />}
          title={t('orders.noOrders')}
          description={activeTab === 'all' ? t('orders.noOrdersDesc') : `${t('orders.noOrdersForStatus')} ${statusTabs.find((t) => t.id === activeTab)?.label}`}
        />
      )}
    </motion.div>
  );
}
