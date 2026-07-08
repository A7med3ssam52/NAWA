import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ShoppingCart, CreditCard, ClipboardCheck, Check, ChevronLeft, Truck, Tag, Wallet, Smartphone, Building2, Landmark } from 'lucide-react';
import { useCart } from '@/contexts';
import { getCouponByCode } from '@/data';
import { formatPrice, cn } from '@/utils';
import { PAGES, SHIPPING_COST, FREE_SHIPPING_THRESHOLD, EGYPT_GOVERNORATES } from '@/constants';
import { Button, Input, Select, Textarea, Divider } from '@/components/ui';
import toast from 'react-hot-toast';

type ShippingData = {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
};

export function CheckoutPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { items, subtotal, shippingCost, total, discount, notes, setNotes, clearCart } = useCart();
  const [currentStep, setCurrentStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [processing, setProcessing] = useState(false);

  const shippingSchema = useMemo(() => z.object({
    fullName: z.string().min(3, t('checkout.fullNameRequired')),
    phone: z.string().min(10, t('checkout.phoneInvalid')),
    street: z.string().min(5, t('checkout.streetRequired')),
    city: z.string().min(2, t('checkout.cityRequired')),
    state: z.string().min(2, t('checkout.stateRequired')),
  }), [t]);

  const steps = useMemo(() => [
    { id: 1, label: t('checkout.step1'), icon: Truck },
    { id: 2, label: t('checkout.step2'), icon: Wallet },
    { id: 3, label: t('checkout.step3'), icon: ClipboardCheck },
    { id: 4, label: t('checkout.step4'), icon: Check },
  ], [t]);

  const { register, handleSubmit, formState: { errors } } = useForm<ShippingData>({
    resolver: zodResolver(shippingSchema),
  });

  useEffect(() => {
    if (items.length === 0) navigate(PAGES.CART);
  }, [items.length, navigate]);

  const actualShipping = useMemo(() => subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST, [subtotal]);
  const isGuest = useMemo(() => {
    try {
      return !JSON.parse(localStorage.getItem('auth') || '{}')?.isAuthenticated;
    } catch { return true; }
  }, []);

  const handleShippingSubmit = () => {
    setCurrentStep(2);
  };

  const handlePaymentSubmit = () => {
    setCurrentStep(3);
  };

  const handlePlaceOrder = async () => {
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 1500));
    const orderId = crypto.randomUUID();
    const orderEmail = JSON.parse(localStorage.getItem('order_emails') || '[]');
    orderEmail.push({ orderId, email: 'guest@zahi.store', createdAt: new Date().toISOString(), total: total });
    localStorage.setItem('order_emails', JSON.stringify(orderEmail));
    toast.success(t('checkout.emailConfirmationSent'));
    clearCart();
    navigate(PAGES.ORDER_SUCCESS.replace(':orderId', orderId));
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-8" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
      {steps.map((step, idx) => {
        const StepIcon = step.icon;
        const isActive = currentStep >= step.id;
        const isCurrent = currentStep === step.id;
        return (
          <div key={step.id} className="flex items-center gap-2">
            <div className={cn('flex items-center gap-2')}>
              <div className={cn(
                'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300',
                isActive ? 'bg-secondary border-secondary text-white' : 'border-gray-300 text-gray-400',
                isCurrent && 'ring-2 ring-secondary/30'
              )}>
                <StepIcon className="w-4 h-4" />
              </div>
              <span className={cn('text-xs font-cairo font-medium hidden sm:block', isActive ? 'text-secondary' : 'text-gray-400')}>
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className={cn('w-8 h-0.5 transition-colors duration-300', currentStep > step.id ? 'bg-secondary' : 'bg-gray-200')} />
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div dir={i18n.language === 'ar' ? 'rtl' : 'ltr'} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold font-cairo text-gray-900 text-center mb-4 sm:mb-6">
        {t('checkout.title')}
      </h1>

      {isGuest && (
        <div className="max-w-2xl mx-auto mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-center">
          <p className="text-sm font-cairo text-blue-700">
            {t('checkout.guestOrder')}
          </p>
        </div>
      )}

      {renderStepIndicator()}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-soft">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.form key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleSubmit(handleShippingSubmit)} className="space-y-3 sm:space-y-4">
                <h2 className="text-base sm:text-lg font-bold font-cairo text-gray-900 mb-3 sm:mb-4">{t('checkout.shippingInfo')}</h2>
                <div className="grid grid-cols-1 gap-3 sm:gap-4">
                  <Input label={t('checkout.fullName')} placeholder={t('checkout.fullNamePlaceholder')} error={errors.fullName?.message} {...register('fullName')} />
                  <Input label={t('nav.phone')} placeholder={t('checkout.phonePlaceholder')} error={errors.phone?.message} {...register('phone')} />
                  <div className="sm:col-span-2">
                    <Input label={t('checkout.street')} placeholder={t('checkout.streetPlaceholder')} error={errors.street?.message} {...register('street')} />
                  </div>
                  <Input label={t('checkout.city')} placeholder={t('checkout.cityPlaceholder')} error={errors.city?.message} {...register('city')} />
                  <Select
                    label={t('checkout.state')}
                    placeholder={t('checkout.statePlaceholder')}
                    options={EGYPT_GOVERNORATES.map((g) => ({ value: g, label: g }))}
                    error={errors.state?.message}
                    {...register('state')}
                  />
                </div>
                <div className="flex justify-start pt-2">
                  <Button type="submit" variant="secondary" size="lg" rounded="xl" className="w-full sm:w-auto">{t('common.next')} <ChevronLeft className="w-4 h-4" /></Button>
                </div>
              </motion.form>
            )}

            {currentStep === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-base sm:text-lg font-bold font-cairo text-gray-900 mb-3 sm:mb-4">{t('checkout.paymentMethod')}</h2>
                <div className="space-y-2 sm:space-y-3">
                  {[
                    { id: 'cod', labelKey: 'cod', descKey: 'codDesc', icon: Wallet },
                    { id: 'card', labelKey: 'card', descKey: 'cardDesc', icon: CreditCard },
                    { id: 'vodafone-cash', labelKey: 'vodafoneCash', descKey: 'vodafoneCashDesc', icon: Smartphone },
                    { id: 'fawry', labelKey: 'fawry', descKey: 'fawryDesc', icon: Building2 },
                    { id: 'instapay', labelKey: 'instapay', descKey: 'instapayDesc', icon: Landmark },
                  ].map((method) => {
                    const Icon = method.icon;
                    return (
                      <button key={method.id} type="button" onClick={() => setPaymentMethod(method.id)} className={cn('flex items-center gap-3 sm:gap-4 w-full p-3 sm:p-4 rounded-xl border-2 transition-all text-right', paymentMethod === method.id ? 'border-secondary bg-secondary/5' : 'border-gray-200 hover:border-gray-300')}>
                        <div className={cn('flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl shrink-0', paymentMethod === method.id ? 'bg-secondary text-white' : 'bg-gray-100 text-gray-400')}>
                          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold font-cairo text-gray-900">{t(`checkout.${method.labelKey}`)}</p>
                          <p className="text-xs text-gray-500 font-cairo">{t(`checkout.${method.descKey}`)}</p>
                        </div>
                        {paymentMethod === method.id && <Check className="w-4 h-4 sm:w-5 sm:h-5 text-secondary shrink-0" />}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between pt-4 gap-2 sm:gap-0">
                  <Button variant="ghost" size="lg" rounded="xl" className="flex-1 sm:flex-none" onClick={() => setCurrentStep(1)}>{t('common.previous')}</Button>
                  <Button variant="secondary" size="lg" rounded="xl" className="flex-1 sm:flex-none" onClick={handlePaymentSubmit}>{t('common.next')} <ChevronLeft className="w-4 h-4" /></Button>
                </div>
              </motion.div>
            )}

            {currentStep >= 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-base sm:text-lg font-bold font-cairo text-gray-900 mb-3 sm:mb-4">{t('checkout.reviewOrder')}</h2>
                <div className="space-y-2 sm:space-y-3 mb-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-xl">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                        <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-semibold font-cairo text-gray-900 truncate">{item.product.name}</p>
                        <p className="text-xs text-gray-400 font-cairo">{t('checkout.quantity', { count: item.quantity })}</p>
                      </div>
                      <span className="text-xs sm:text-sm font-bold font-cairo text-gray-900">{formatPrice(item.product.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('checkout.notesPlaceholder')} className="mb-4" rows={2} />
                <div className="flex items-center justify-between pt-2 gap-2 sm:gap-0">
                  <Button variant="ghost" size="lg" rounded="xl" className="flex-1 sm:flex-none" onClick={() => setCurrentStep(2)}>{t('common.previous')}</Button>
                  <Button variant="accent" size="lg" rounded="xl" className="flex-1 sm:flex-none" onClick={handlePlaceOrder} loading={processing}>
                    {t('checkout.confirmOrder')}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-soft sticky top-24 sm:top-28 space-y-2 sm:space-y-3 h-fit">
          <h3 className="text-base font-bold font-cairo text-gray-900">{t('orders.orderSummary')}</h3>
          <div className="space-y-1.5 sm:space-y-2 text-sm font-cairo">
            <div className="flex justify-between"><span className="text-gray-500">{t('cart.subtotal')}</span><span className="text-gray-900 font-semibold">{formatPrice(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">{t('cart.shipping')}</span><span className={actualShipping === 0 ? 'text-success font-semibold' : 'text-gray-900 font-semibold'}>{actualShipping === 0 ? t('common.free') : formatPrice(actualShipping)}</span></div>
            {discount > 0 && <div className="flex justify-between"><span className="text-success">{t('cart.discount')}</span><span className="text-success font-semibold">-{formatPrice(discount)}</span></div>}
            <Divider />
            <div className="flex justify-between"><span className="text-base font-bold text-gray-900">{t('cart.total')}</span><span className="text-lg sm:text-lg font-bold text-gray-900">{formatPrice(total)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
