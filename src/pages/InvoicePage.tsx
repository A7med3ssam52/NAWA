import { useParams, Link } from 'react-router-dom';
import { getOrderById } from '@/data';
import { formatPrice, formatDate } from '@/utils';
import { PAGES, SITE_NAME } from '@/constants';
import { Button } from '@/components/ui';
import { Printer } from 'lucide-react';

export function InvoicePage() {
  const { orderId } = useParams<{ orderId: string }>();
  const order = getOrderById(orderId || '');

  if (!order) {
    return (
      <div dir="rtl" className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-lg font-cairo text-gray-500 dark:text-dark-muted">الطلب غير موجود</p>
        <Link to={PAGES.HOME} className="text-secondary text-sm font-cairo mt-2 inline-block">العودة للرئيسية</Link>
      </div>
    );
  }

  return (
    <div dir="rtl" className="max-w-2xl mx-auto px-4 sm:px-6 py-8 lg:py-12">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl lg:text-2xl font-bold font-cairo text-gray-900 dark:text-dark-text">فاتورة الطلب</h1>
        <Button variant="outline" size="sm" rounded="xl" onClick={() => window.print()}>
          <Printer className="w-4 h-4" /> طباعة
        </Button>
      </div>

      <div id="invoice" className="bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-dark-border p-6 shadow-soft">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-dark-border mb-4">
          <span className="text-lg font-bold bg-gradient-to-l from-secondary to-accent bg-clip-text text-transparent font-cairo">{SITE_NAME}</span>
          <div className="text-left">
            <p className="text-xs text-gray-400 dark:text-dark-muted font-cairo">رقم الفاتورة</p>
            <p className="text-sm font-bold font-cairo text-gray-900 dark:text-dark-text">{order.orderNumber}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div>
            <p className="text-xs text-gray-400 dark:text-dark-muted font-cairo mb-1">تاريخ الطلب</p>
            <p className="font-semibold font-cairo text-gray-900 dark:text-dark-text">{formatDate(order.createdAt)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 dark:text-dark-muted font-cairo mb-1">طريقة الدفع</p>
            <p className="font-semibold font-cairo text-gray-900 dark:text-dark-text">{order.paymentMethod}</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-gray-400 dark:text-dark-muted font-cairo mb-1">عنوان الشحن</p>
            <p className="font-semibold font-cairo text-gray-900 dark:text-dark-text">{order.shippingAddress.street}, {order.shippingAddress.city}</p>
          </div>
        </div>

        <table className="w-full text-sm mb-4">
          <thead>
            <tr className="border-b border-gray-100 dark:border-dark-border">
              <th className="text-right pb-2 font-cairo text-gray-500 dark:text-dark-muted font-medium">المنتج</th>
              <th className="text-center pb-2 font-cairo text-gray-500 dark:text-dark-muted font-medium">الكمية</th>
              <th className="text-left pb-2 font-cairo text-gray-500 dark:text-dark-muted font-medium">السعر</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.productId} className="border-b border-gray-50 dark:border-dark-border/50">
                <td className="py-2 font-cairo text-gray-900 dark:text-dark-text">{item.productName}</td>
                <td className="py-2 text-center font-cairo text-gray-900 dark:text-dark-text">{item.quantity}</td>
                <td className="py-2 text-left font-cairo text-gray-900 dark:text-dark-text">{formatPrice(item.price * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="space-y-1 text-sm border-t border-gray-100 dark:border-dark-border pt-3">
          <div className="flex justify-between"><span className="text-gray-500 dark:text-dark-muted font-cairo">المجموع الفرعي</span><span className="font-semibold font-cairo text-gray-900 dark:text-dark-text">{formatPrice(order.subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-gray-500 dark:text-dark-muted font-cairo">الشحن</span><span className="font-semibold font-cairo text-gray-900 dark:text-dark-text">{order.shipping === 0 ? 'مجاني' : formatPrice(order.shipping)}</span></div>
          <div className="flex justify-between"><span className="text-gray-500 dark:text-dark-muted font-cairo">الضريبة</span><span className="font-semibold font-cairo text-gray-900 dark:text-dark-text">{formatPrice(order.tax)}</span></div>
          {order.discount > 0 && <div className="flex justify-between"><span className="text-success font-cairo">الخصم</span><span className="text-success font-semibold font-cairo">-{formatPrice(order.discount)}</span></div>}
          <div className="flex justify-between text-base pt-2 border-t border-gray-100 dark:border-dark-border"><span className="font-bold font-cairo text-gray-900 dark:text-dark-text">الإجمالي</span><span className="font-bold font-cairo text-gray-900 dark:text-dark-text">{formatPrice(order.total)}</span></div>
        </div>

        <p className="text-[10px] text-gray-400 dark:text-dark-muted font-cairo text-center mt-6 border-t border-gray-100 dark:border-dark-border pt-4">
          {SITE_NAME} - جميع الحقوق محفوظة © {new Date().getFullYear()}
        </p>
      </div>

      <div className="mt-4 text-center">
        <Link to={PAGES.ORDER_DETAILS.replace(':orderId', orderId || '')} className="text-sm text-secondary hover:underline font-cairo">العودة لتفاصيل الطلب</Link>
      </div>
    </div>
  );
}
