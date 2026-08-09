import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useOrder } from '@/api';
import { formatPrice, formatDate } from '@/utils';
import { PAGES, SITE_NAME } from '@/constants';
import { Button, Spinner } from '@/components/ui';
import { Printer } from 'lucide-react';

export function InvoicePage() {
  const { t, i18n } = useTranslation();
  const { orderId } = useParams<{ orderId: string }>();
  const { data: order, isLoading } = useOrder(orderId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!order) {
    return (
      <div dir="rtl" className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-lg font-cairo text-gray-500">{t('orders.orderNotFound')}</p>
        <Link to={PAGES.HOME} className="text-secondary text-sm font-cairo mt-2 inline-block">{t('common.back')}</Link>
      </div>
    );
  }

  return (
    <div dir={i18n.language === 'ar' ? 'rtl' : 'ltr'} className="max-w-2xl mx-auto px-4 sm:px-6 py-8 lg:py-12">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl lg:text-2xl font-bold font-cairo text-gray-900">{t('orders.invoice')}</h1>
        <Button variant="outline" size="sm" rounded="xl" onClick={() => window.print()}>
          <Printer className="w-4 h-4" /> {t('orders.print')}
        </Button>
      </div>

      <div id="invoice" className="bg-white rounded-2xl border border-gray-100 p-6 shadow-soft">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
           <span className="text-lg font-bold text-secondary font-cairo">{SITE_NAME()}</span>
          <div className="text-left">
            <p className="text-xs text-gray-400 font-cairo">{t('orders.invoiceNumber')}</p>
            <p className="text-sm font-bold font-cairo text-gray-900">{order.orderNumber}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div>
            <p className="text-xs text-gray-400 font-cairo mb-1">{t('orders.orderDateAlt')}</p>
            <p className="font-semibold font-cairo text-gray-900">{formatDate(order.createdAt)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-cairo mb-1">{t('checkout.paymentMethod')}</p>
            <p className="font-semibold font-cairo text-gray-900">{order.paymentMethod}</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-gray-400 font-cairo mb-1">{t('checkout.shippingAddress')}</p>
            <p className="font-semibold font-cairo text-gray-900">{order.shippingAddress.street}, {order.shippingAddress.city}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm mb-4">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-right pb-2 font-cairo text-gray-500 font-medium">{t('orders.item')}</th>
                <th className="text-center pb-2 font-cairo text-gray-500 font-medium">{t('cart.quantityLabel')}</th>
                <th className="text-left pb-2 font-cairo text-gray-500 font-medium">{t('compare.price')}</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.productId} className="border-b border-gray-50">
                  <td className="py-2 font-cairo text-gray-900">{item.productName}</td>
                  <td className="py-2 text-center font-cairo text-gray-900">{item.quantity}</td>
                  <td className="py-2 text-left font-cairo text-gray-900">{formatPrice(item.price * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-1 text-sm border-t border-gray-100 pt-3">
          <div className="flex justify-between"><span className="text-gray-500 font-cairo">{t('cart.subtotal')}</span><span className="font-semibold font-cairo text-gray-900">{formatPrice(order.subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-gray-500 font-cairo">{t('cart.shipping')}</span><span className="font-semibold font-cairo text-gray-900">{order.shipping === 0 ? t('common.free') : formatPrice(order.shipping)}</span></div>
          {order.discount > 0 && <div className="flex justify-between"><span className="text-success font-cairo">{t('cart.discount')}</span><span className="text-success font-semibold font-cairo">-{formatPrice(order.discount)}</span></div>}
          <div className="flex justify-between text-base pt-2 border-t border-gray-100"><span className="font-bold font-cairo text-gray-900">{t('cart.total')}</span><span className="font-bold font-cairo text-gray-900">{formatPrice(order.total)}</span></div>
        </div>

        <p className="text-[10px] text-gray-400 font-cairo text-center mt-6 border-t border-gray-100 pt-4">
          {t('nav.copyright')}
        </p>
      </div>

      <div className="mt-4 text-center">
        <Link to={PAGES.ORDER_DETAILS.replace(':orderId', orderId || '')} className="text-sm text-secondary hover:underline font-cairo">{t('orders.backToOrderDetails')}</Link>
      </div>
    </div>
  );
}
