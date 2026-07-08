import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts';
import { getUserOrders } from '@/data';
import { OrderCard } from '@/components/features/OrderCard';
import { Tabs, EmptyState } from '@/components/ui';
import { Package } from 'lucide-react';
import type { Tab } from '@/components/ui/Tabs';

const statusTabs: Tab[] = [
  { id: 'all', label: 'الكل' },
  { id: 'pending', label: 'قيد الانتظار' },
  { id: 'processing', label: 'قيد التجهيز' },
  { id: 'shipped', label: 'تم الشحن' },
  { id: 'delivered', label: 'تم التوصيل' },
  { id: 'cancelled', label: 'ملغية' },
];

export function MyOrdersPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');

  if (!user) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} dir="rtl" className="max-w-4xl mx-auto px-4 py-12">
        <EmptyState icon={<Package className="w-16 h-16" />} title="يرجى تسجيل الدخول" description="قم بتسجيل الدخول لعرض طلباتك" />
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
      dir="rtl"
      className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12"
    >
      <h1 className="text-2xl lg:text-3xl font-bold font-cairo text-gray-900 mb-6">
        طلباتي
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
          title="لا توجد طلبات"
          description={activeTab === 'all' ? 'لم تقم بأي طلبات بعد' : `لا توجد طلبات ${statusTabs.find((t) => t.id === activeTab)?.label}`}
        />
      )}
    </motion.div>
  );
}
