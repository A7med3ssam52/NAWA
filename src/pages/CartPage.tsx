import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Tag, Trash2, ArrowLeft } from 'lucide-react';
import { useCart, useAuth } from '@/contexts';
import { supabase } from '@/lib/supabase';
import { formatPrice, cn } from '@/utils';
import { PAGES, FREE_SHIPPING_THRESHOLD } from '@/constants';
import { CartItem } from '@/components/features/CartItem';
import { AccountGateModal } from '@/components/features/AccountGateModal';
import { EmptyState, Button, Input, Divider } from '@/components/ui';
import toast from 'react-hot-toast';
import type { Coupon } from '@/types';

export function CartPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { items, subtotal, shippingCost, total, discount, couponCode, setCoupon, clearCart } = useCart();
  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [showAccountGate, setShowAccountGate] = useState(false);

  if (items.length === 0) {
    return (
      <div dir={i18n.language === 'ar' ? 'rtl' : 'ltr'} className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
        <EmptyState
          icon={<ShoppingCart className="w-16 h-16" />}
          title={t('cart.emptyTitle')}
          description={t('cart.emptyDesc')}
          action={{ label: t('cart.shopNow'), onClick: () => navigate(PAGES.PRODUCTS) }}
        />
      </div>
    );
  }

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    const { data, error } = await supabase.rpc('get_coupon', { p_code: couponInput.trim().toUpperCase() });
    setCouponLoading(false);
    if (error || !data?.valid) {
      if (!error && data?.message === 'coupon expired') {
        toast.error(t('cart.couponExpired'));
      } else if (!error && data?.message === 'coupon disabled') {
        toast.error(t('cart.couponDisabled'));
      } else if (!error && data?.message === 'usage limit reached') {
        toast.error(t('cart.couponLimitReached'));
      } else {
        toast.error(t('cart.couponInvalid'));
      }
      return;
    }
    if (subtotal < Number(data.min_order)) {
      toast.error(t('cart.couponMinOrder', { amount: formatPrice(Number(data.min_order)) }));
      return;
    }
    const discountType = data.discount_type === 'free_shipping' ? 'freeShipping' : data.discount_type || 'percentage';
    const coupon: Coupon = {
      id: data.code,
      code: data.code,
      discount: Number(data.discount_value) || 0,
      type: discountType,
      minOrder: Number(data.min_order) || 0,
      maxDiscount: Number(data.max_discount) || 0,
      expiresAt: data.expires_at || new Date(Date.now() + 365 * 86400000).toISOString(),
      usageLimit: 0,
      usedCount: 0,
    };
    const discAmount = discountType === 'freeShipping'
      ? shippingCost
      : discountType === 'percentage'
        ? Math.min(subtotal * coupon.discount / 100, coupon.maxDiscount || Infinity)
        : coupon.discount;
    setCoupon(coupon, coupon.code, discAmount);
    toast.success(t('cart.couponSuccess'));
  };

  const handleRemoveCoupon = () => {
    setCoupon(null, '', 0);
    setCouponInput('');
    toast.success(t('cart.couponRemoved'));
  };

  const handleCheckout = () => {
    if (isAuthenticated || authLoading) {
      navigate(PAGES.CHECKOUT);
    } else {
      setShowAccountGate(true);
    }
  };

  const progress = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const freeShippingRemaining = Math.max(FREE_SHIPPING_THRESHOLD - subtotal, 0);

  return (
    <div dir={i18n.language === 'ar' ? 'rtl' : 'ltr'} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 animate-fade-in-up"
    >
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold font-cairo text-gray-900">
          {t('cart.title')}
          <span className="text-base font-medium text-gray-400 mr-2">({items.length})</span>
        </h1>
        <Button variant="ghost" size="sm" onClick={clearCart}>
          <Trash2 className="w-4 h-4" />
          {t('cart.clearCart')}
        </Button>
      </div>

      {freeShippingRemaining > 0 && (
        <div className="mb-6 p-4 bg-accent/10 rounded-2xl border border-accent/20">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-cairo text-accent font-medium">
              {t('cart.addForFreeShipping', { amount: formatPrice(freeShippingRemaining) })}
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
              {t('cart.orderSummary')}
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm font-cairo">
                <span className="text-gray-500">{t('cart.subtotal')}</span>
                <span className="text-gray-900 font-semibold">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm font-cairo">
                <span className="text-gray-500">{t('cart.shipping')}</span>
                <span className={cn('font-semibold', shippingCost === 0 ? 'text-success' : 'text-gray-900')}>
                  {shippingCost === 0 ? t('common.free') : formatPrice(shippingCost)}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex items-center justify-between text-sm font-cairo">
                  <span className="text-success">{t('cart.discount')}</span>
                  <span className="text-success font-semibold">-{formatPrice(discount)}</span>
                </div>
              )}
              <Divider />
              <div className="flex items-center justify-between">
                <span className="text-base font-bold font-cairo text-gray-900">{t('cart.total')}</span>
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
                  <button onClick={handleRemoveCoupon} className="text-xs text-danger font-cairo hover:underline">{t('cart.removeCoupon')}</button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input value={couponInput} onChange={(e) => setCouponInput(e.target.value)} placeholder={t('cart.applyCouponPlaceholder')} className="text-sm h-10" dir="rtl" />
                  <Button variant="accent" size="md" rounded="xl" onClick={handleApplyCoupon} loading={couponLoading}>{t('cart.applyCoupon')}</Button>
                </div>
              )}
            </div>

            <Button variant="secondary" size="lg" fullWidth rounded="xl" onClick={handleCheckout}>
              {t('cart.checkout')}
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <AccountGateModal
        isOpen={showAccountGate}
        onClose={() => setShowAccountGate(false)}
        onLogin={() => {
          setShowAccountGate(false);
          navigate(PAGES.LOGIN, { state: { from: PAGES.CHECKOUT } });
        }}
        onContinueGuest={() => {
          setShowAccountGate(false);
          navigate(`${PAGES.CHECKOUT}?guest=1`);
        }}
      />
    </div>
  );
}
