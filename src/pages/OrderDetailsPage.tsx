import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, ChevronLeft, MapPin, CreditCard } from 'lucide-react';
import { getOrderById } from '@/data';
import { getPaymentMethodLabel } from '@/utils';
import { PAGES, ORDER_STATUS_MAP } from '@/constants';
import { formatPrice, formatDate } from '@/utils';
import { TrackingTimeline } from '@/components/features/TrackingTimeline';
import { Badge, Button, Divider, ErrorState } from '@/components/ui';

export function OrderDetailsPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const order = orderId ? getOrderById(orderId) : null;

  if (!order) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} dir="rtl" className="max-w-4xl mx-auto px-4 py-12">
        <ErrorState title="الطلب غير موجود" description="عذراً، لم نتمكن من العثور على الطلب" />
      </motion.div>
    );
  }

  const statusInfo = ORDER_STATUS_MAP[order.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      dir="rtl"
      className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12"
    >
      <Link to={PAGES.MY_ORDERS} className="inline-flex items-center gap-1 text-sm text-secondary font-cairo font-medium mb-4 hover:underline">
        <ChevronLeft className="w-4 h-4" /> العودة إلى الطلبات
      </Link>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold font-cairo text-gray-900 mb-1">
            تفاصيل الطلب
          </h1>
          <p className="text-sm font-mono text-gray-500 font-cairo" dir="ltr">{order.orderNumber}</p>
          <p className="text-xs text-gray-400 font-cairo mt-1">{formatDate(order.createdAt)}</p>
        </div>
        <Badge variant={order.status === 'cancelled' ? 'danger' : order.status === 'delivered' ? 'success' : 'info'} size="lg">
          {statusInfo.label}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-soft">
            <h2 className="text-base font-bold font-cairo text-gray-900 mb-4">تتبع الطلب</h2>
            <TrackingTimeline events={order.tracking} currentStatus={order.status} cancelled={order.status === 'cancelled'} />
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-soft">
            <h2 className="text-base font-bold font-cairo text-gray-900 mb-4">المنتجات</h2>
            <div className="space-y-3">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                    <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold font-cairo text-gray-900">{item.productName}</p>
                    <p className="text-xs text-gray-400 font-cairo mt-0.5">الكمية: {item.quantity}</p>
                  </div>
                  <span className="text-sm font-bold font-cairo text-gray-900">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-soft space-y-3">
            <h3 className="text-base font-bold font-cairo text-gray-900">ملخص الطلب</h3>
            <div className="flex justify-between text-sm font-cairo"><span className="text-gray-500">المجموع الفرعي</span><span className="text-gray-900 font-semibold">{formatPrice(order.subtotal)}</span></div>
            <div className="flex justify-between text-sm font-cairo"><span className="text-gray-500">الشحن</span><span className="text-gray-900 font-semibold">{order.shipping === 0 ? 'مجاني' : formatPrice(order.shipping)}</span></div>
            {order.discount > 0 && <div className="flex justify-between text-sm font-cairo"><span className="text-success">الخصم</span><span className="text-success font-semibold">-{formatPrice(order.discount)}</span></div>}
            <Divider />
            <div className="flex justify-between"><span className="text-base font-bold text-gray-900">الإجمالي</span><span className="text-lg font-bold text-gray-900">{formatPrice(order.total)}</span></div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-soft space-y-3">
            <h3 className="text-base font-bold font-cairo text-gray-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" /> عنوان الشحن
            </h3>
            {order.shippingAddress && (
              <>
                <p className="text-sm font-semibold font-cairo text-gray-900">{order.shippingAddress.fullName}</p>
                <p className="text-xs text-gray-500 font-cairo">{order.shippingAddress.phone}</p>
                <p className="text-xs text-gray-500 font-cairo">{order.shippingAddress.street}، {order.shippingAddress.city}، {order.shippingAddress.state}</p>
              </>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-soft space-y-3">
            <h3 className="text-base font-bold font-cairo text-gray-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-gray-400" /> طريقة الدفع
            </h3>
            <p className="text-sm text-gray-500 font-cairo">{getPaymentMethodLabel(order.paymentMethod)}</p>
          </div>

          {order.notes && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-soft">
              <h3 className="text-sm font-bold font-cairo text-gray-900 mb-1">ملاحظات</h3>
              <p className="text-xs text-gray-500 font-cairo">{order.notes}</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
