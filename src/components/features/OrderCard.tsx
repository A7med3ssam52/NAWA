import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn, formatPrice, formatDate } from '@/utils';
import type { Order } from '@/types';
import { PAGES, getOrderStatusMap } from '@/constants';
import { Badge, Divider } from '@/components/ui';

interface OrderCardProps {
  order: Order;
  index?: number;
}

const statusColors: Record<string, 'success' | 'danger' | 'warning' | 'info'> = {
  pending: 'warning',
  confirmed: 'info',
  processing: 'info',
  shipped: 'info',
  delivered: 'success',
  cancelled: 'danger',
};

export function OrderCard({ order, index = 0 }: OrderCardProps) {
  const { t } = useTranslation();
  const statusInfo = getOrderStatusMap()[order.status];

  const steps = [
    { key: 'pending', label: t('orders.pending') },
    { key: 'confirmed', label: t('orders.confirmed') },
    { key: 'processing', label: t('orders.processing') },
    { key: 'shipped', label: t('orders.shipped') },
    { key: 'delivered', label: t('orders.delivered') },
  ];
  const currentStepIndex = steps.findIndex((s) => s.key === order.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Link
        to={PAGES.ORDER_DETAILS.replace(':orderId', order.id)}
        className="block bg-white rounded-2xl border border-gray-100 shadow-soft hover:shadow-soft-lg transition-all duration-300 overflow-hidden group"
      >
        {/* Header */}
        <div className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="text-xs text-gray-400 font-cairo mb-0.5">
                {t('orders.orderNumber')}
              </p>
              <p className="text-sm font-bold font-cairo text-gray-900 font-mono" dir="ltr">
                {order.orderNumber}
              </p>
            </div>
            <Badge variant={statusColors[order.status]} size="md">
              {statusInfo.label}
            </Badge>
          </div>

          <div className="flex items-center gap-4 text-xs text-gray-500 font-cairo mb-4">
            <span>{t('orders.orderDate', { date: formatDate(order.createdAt) })}</span>
            <span>{t('orders.productCount', { count: order.items.length })}</span>
          </div>

          {/* Items Preview */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center -space-x-2 rtl:space-x-reverse">
              {order.items.slice(0, 4).map((item, idx) => (
                <div
                  key={idx}
                  className="w-10 h-10 rounded-xl border-2 border-white bg-gray-50 overflow-hidden"
                >
                  <img
                    src={item.productImage}
                    alt={item.productName}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
              {order.items.length > 4 && (
                <div className="w-10 h-10 rounded-xl border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] font-bold font-cairo text-gray-500">
                  +{order.items.length - 4}
                </div>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-1 mb-4">
            {steps.map((step, idx) => {
              const isCompleted = idx <= currentStepIndex && order.status !== 'cancelled';
              const isCurrent = idx === currentStepIndex;
              return (
                <div key={step.key} className="flex-1 flex items-center gap-1">
                  <div
                    className={cn(
                      'h-1.5 rounded-full flex-1 transition-colors duration-300',
                      isCompleted
                        ? 'bg-success'
                        : order.status === 'cancelled'
                          ? 'bg-danger'
                          : 'bg-gray-200'
                    )}
                  />
                  {isCurrent && (
                    <div
                      className={cn(
                        'w-2 h-2 rounded-full',
                        order.status === 'cancelled' ? 'bg-danger' : 'bg-success'
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Total & Action */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-400 font-cairo">{t('orders.total')}</span>
              <p className="text-base font-bold font-cairo text-gray-900">
                {formatPrice(order.total)}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-sm font-medium font-cairo text-secondary group-hover:gap-2.5 transition-all">
              {t('orders.viewDetails')}
              <ChevronLeft className="w-4 h-4" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
