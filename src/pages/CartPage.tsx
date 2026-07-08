import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Tag, Trash2, ArrowLeft } from 'lucide-react';
import { useCart } from '@/contexts';
import { getCouponByCode } from '@/data';
import { formatPrice, cn } from '@/utils';
import { PAGES, FREE_SHIPPING_THRESHOLD, TAX_RATE } from '@/constants';
import { CartItem } from '@/components/features/CartItem';
import { EmptyState, Button, Input, Divider } from '@/components/ui';
import toast from 'react-hot-toast';

export function CartPage() {
  const navigate = useNavigate();
  const { items, subtotal, shippingCost, total, discount, couponCode, setCoupon, clearCart } = useCart();
  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  if (items.length === 0) {
    return (
      <div dir="rtl" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
        <EmptyState
          icon={<ShoppingCart className="w-16 h-16" />}
          title="السلة فارغة"
          description="تصفح المنتجات وأضف ما يعجبك إلى سلة التسوق"
          action={{ label: 'تسوق الآن', onClick: () => navigate(PAGES.PRODUCTS) }}
        />
      </div>
    );
  }

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    const coupon = getCouponByCode(couponInput);
    if (coupon) {
      const discAmount = coupon.type === 'percentage'
        ? Math.min(subtotal * coupon.discount / 100, coupon.maxDiscount)
        : coupon.discount;
      setCoupon(coupon, coupon.code, discAmount);
      toast.success('تم تطبيق الكوبون بنجاح');
    } else {
      toast.error('كود الخصم غير صالح أو منتهي الصلاحية');
    }
    setCouponLoading(false);
  };

  const handleRemoveCoupon = () => {
    setCoupon(null, '', 0);
    setCouponInput('');
    toast.success('تم إلغاء الكوبون');
  };

  const tax = subtotal * TAX_RATE;
  const progress = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const freeShippingRemaining = Math.max(FREE_SHIPPING_THRESHOLD - subtotal, 0);

  return (
    <div dir="rtl" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 animate-fade-in-up"
    >
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold font-cairo text-gray-900">
          سلة التسوق
          <span className="text-base font-medium text-gray-400 mr-2">({items.length})</span>
        </h1>
        <Button variant="ghost" size="sm" onClick={clearCart}>
          <Trash2 className="w-4 h-4" />
          تفريغ السلة
        </Button>
      </div>

      {freeShippingRemaining > 0 && (
        <div className="mb-6 p-4 bg-accent/10 rounded-2xl border border-accent/20">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-cairo text-accent font-medium">
              أضف {formatPrice(freeShippingRemaining)} للحصول على توصيل مجاني
            </p>
            <span className="text-xs font-cairo text-accent font-bold">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-accent/20 rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-2 space-y-3">
          {items.map((item, i) => (
            <CartItem key={item.id} item={item} index={i} />
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-soft sticky top-28 space-y-4">
            <h3 className="text-base font-bold font-cairo text-gray-900">
              ملخص الطلب
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm font-cairo">
                <span className="text-gray-500">المجموع الفرعي</span>
                <span className="text-gray-900 font-semibold">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm font-cairo">
                <span className="text-gray-500">الشحن</span>
                <span className={cn('font-semibold', shippingCost === 0 ? 'text-success' : 'text-gray-900')}>
                  {shippingCost === 0 ? 'مجاني' : formatPrice(shippingCost)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm font-cairo">
                <span className="text-gray-500">الضريبة (14%)</span>
                <span className="text-gray-900 font-semibold">{formatPrice(tax)}</span>
              </div>
              {discount > 0 && (
                <div className="flex items-center justify-between text-sm font-cairo">
                  <span className="text-success">الخصم</span>
                  <span className="text-success font-semibold">-{formatPrice(discount)}</span>
                </div>
              )}
              <Divider />
              <div className="flex items-center justify-between">
                <span className="text-base font-bold font-cairo text-gray-900">الإجمالي</span>
                <span className="text-xl font-bold font-cairo text-gray-900">{formatPrice(total)}</span>
              </div>
            </div>

            <div className="space-y-2">
              {couponCode ? (
                <div className="flex items-center justify-between p-3 bg-success/10 rounded-xl border border-success/20">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-success" />
                    <span className="text-sm font-cairo text-success font-semibold">{couponCode}</span>
                  </div>
                  <button onClick={handleRemoveCoupon} className="text-xs text-danger font-cairo hover:underline">إلغاء</button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input value={couponInput} onChange={(e) => setCouponInput(e.target.value)} placeholder="كود الخصم" className="text-sm h-10" dir="rtl" />
                  <Button variant="secondary" size="md" rounded="xl" onClick={handleApplyCoupon} loading={couponLoading}>تطبيق</Button>
                </div>
              )}
            </div>

            <Button variant="accent" size="lg" fullWidth rounded="xl" onClick={() => navigate(PAGES.CHECKOUT)}>
              إتمام الطلب
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
