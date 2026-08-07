import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { ShoppingCart, CreditCard, ClipboardCheck, Check, ChevronLeft, Truck, Tag, Wallet, Smartphone, Building2, Landmark, User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useCart, useAuth } from '@/contexts';
import { orderService } from '@/services';
import { formatPrice, cn } from '@/utils';
import { PAGES, SHIPPING_COST, FREE_SHIPPING_THRESHOLD, EGYPT_GOVERNORATES } from '@/constants';
import { Button, Input, Select, Textarea, Divider } from '@/components/ui';
import { supabase } from '@/lib/supabase';
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
  const queryClient = useQueryClient();
  const { user, isAuthenticated, register: registerUser } = useAuth();
  const { items, subtotal, shippingCost, total, discount, notes, setNotes, clearCart, coupon } = useCart();
  const [currentStep, setCurrentStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [processing, setProcessing] = useState(false);
  const shippingDataRef = useRef<ShippingData | null>(null);
  const [orderPlaced, setOrderPlaced] = useState<{ id: string } | null>(null);
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [regError, setRegError] = useState('');

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
    if (items.length === 0 && !orderPlaced) navigate(PAGES.CART);
  }, [items.length, navigate, orderPlaced]);

  const actualShipping = useMemo(() => subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST, [subtotal]);
  const isGuest = !isAuthenticated;

  const handleShippingSubmit = (data: ShippingData) => {
    shippingDataRef.current = data;
    setCurrentStep(2);
  };

  const handlePaymentSubmit = () => {
    setCurrentStep(3);
  };

  const handlePlaceOrder = async () => {
    if (!shippingDataRef.current) return;
    setProcessing(true);
    const sd = shippingDataRef.current;
    const order = await orderService.create({
      userId: user?.id,
      items: items.map((i) => ({ productId: i.product.id, productName: i.product.name, productImage: i.product.images[0], quantity: i.quantity, price: i.product.price })),
      total,
      subtotal,
      shipping: shippingCost,
      discount,
      couponCode: coupon?.code,
      shippingAddress: {
        id: crypto.randomUUID(),
        label: 'home',
        fullName: sd.fullName,
        phone: sd.phone,
        street: sd.street,
        city: sd.city,
        state: sd.state,
        isDefault: false,
      },
      paymentMethod,
      notes,
    });
    await supabase.from('order_email_logs').insert({
      order_id: order.id, email: user?.email || 'guest@zahieg.com', sent_at: new Date().toISOString(),
    });
    queryClient.invalidateQueries({ queryKey: ['my-orders'] });
    toast.success(t('checkout.emailConfirmationSent'));
    if (isGuest) {
      setOrderPlaced({ id: order.id });
      setCurrentStep(4);
      setRegEmail(sd.fullName.replace(/\s+/g, '').toLowerCase() + '@email.com');
      setProcessing(false);
    } else {
      clearCart();
      navigate(PAGES.ORDER_SUCCESS.replace(':orderId', order.id));
    }
  };

  const handleRegister = async () => {
    if (!regEmail.includes('@')) {
      setRegError('يرجى إدخال بريد إلكتروني صحيح');
      return;
    }
    if (regPassword.length < 6) {
      setRegError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError('كلمة المرور غير متطابقة');
      return;
    }
    setRegistering(true);
    setRegError('');
    const sd = shippingDataRef.current;
    const result = await registerUser(sd?.fullName || '', regEmail, regPassword);
    if (!result.success) {
      setRegError(result.error || 'حدث خطأ أثناء التسجيل');
      setRegistering(false);
      return;
    }
    clearCart();
    navigate(PAGES.ORDER_SUCCESS.replace(':orderId', orderPlaced!.id));
  };

  const handleSkipRegistration = () => {
    clearCart();
    navigate(PAGES.ORDER_SUCCESS.replace(':orderId', orderPlaced!.id));
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
                  <Button variant="accent" size="lg" rounded="xl" className="flex-1 sm:flex-none" onClick={() => setCurrentStep(1)}>{t('common.previous')}</Button>
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
                  <Button variant="accent" size="lg" rounded="xl" className="flex-1 sm:flex-none" onClick={() => setCurrentStep(2)}>{t('common.previous')}</Button>
                  <Button variant="secondary" size="lg" rounded="xl" className="flex-1 sm:flex-none" onClick={handlePlaceOrder} loading={processing}>
                    {t('checkout.confirmOrder')}
                  </Button>
                </div>
              </motion.div>
            )}

            {currentStep === 4 && orderPlaced && (
              <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                {isGuest ? (
                  <>
                    <div className="text-center mb-6">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 mb-4">
                        <Check className="w-10 h-10 text-success" />
                      </div>
                      <h2 className="text-lg font-bold font-cairo text-gray-900 mb-1">{t('orders.orderSuccessTitle')}</h2>
                      <p className="text-sm text-gray-500 font-cairo">{t('checkout.guestRegisterPrompt')}</p>
                    </div>

                    <div className="bg-secondary/5 rounded-2xl border border-secondary/10 p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                          <User className="w-5 h-5 text-secondary" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold font-cairo text-gray-900">إنشاء حساب جديد</h3>
                          <p className="text-xs text-gray-500 font-cairo">سجل الآن لتتبع طلباتك بسهولة</p>
                        </div>
                      </div>

                      {regError && (
                        <div className="mb-3 p-2.5 bg-danger/5 border border-danger/20 rounded-xl text-sm text-danger font-cairo text-center">
                          {regError}
                        </div>
                      )}

                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-cairo font-medium text-gray-700 mb-1">الاسم الكامل</label>
                          <div className="relative">
                            <User className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 pointer-events-none" />
                            <input
                              type="text"
                              value={shippingDataRef.current?.fullName || ''}
                              disabled
                              className="w-full h-11 pr-10 pl-4 text-sm font-cairo bg-gray-100/70 border border-gray-200 rounded-xl text-gray-700 cursor-not-allowed"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-cairo font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
                          <div className="relative">
                            <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 pointer-events-none" />
                            <input
                              type="email"
                              value={regEmail}
                              onChange={(e) => setRegEmail(e.target.value)}
                              placeholder="example@email.com"
                              className="w-full h-11 pr-10 pl-4 text-sm font-cairo bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary/30 transition-all"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-cairo font-medium text-gray-700 mb-1">كلمة المرور</label>
                          <div className="relative">
                            <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 pointer-events-none" />
                            <input
                              type={showPassword ? 'text' : 'password'}
                              value={regPassword}
                              onChange={(e) => setRegPassword(e.target.value)}
                              placeholder="6 أحرف على الأقل"
                              className="w-full h-11 pr-10 pl-10 text-sm font-cairo bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary/30 transition-all"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-cairo font-medium text-gray-700 mb-1">تأكيد كلمة المرور</label>
                          <div className="relative">
                            <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 pointer-events-none" />
                            <input
                              type={showConfirm ? 'text' : 'password'}
                              value={regConfirmPassword}
                              onChange={(e) => setRegConfirmPassword(e.target.value)}
                              placeholder="أعد إدخال كلمة المرور"
                              className="w-full h-11 pr-10 pl-10 text-sm font-cairo bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary/30 transition-all"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirm(!showConfirm)}
                              className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 mt-5">
                        <Button variant="secondary" size="lg" rounded="xl" fullWidth onClick={handleRegister} loading={registering}>
                          <User className="w-4 h-4" />
                          إنشاء حساب جديد
                        </Button>
                        <button
                          onClick={handleSkipRegistration}
                          className="w-full py-2.5 text-sm font-cairo text-gray-400 hover:text-gray-600 transition-colors rounded-xl hover:bg-gray-50"
                        >
                          تخطي إنشاء الحساب
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 mb-4">
                      <Check className="w-10 h-10 text-success" />
                    </div>
                    <h2 className="text-lg font-bold font-cairo text-gray-900 mb-1">{t('orders.orderSuccessTitle')}</h2>
                    <p className="text-sm text-gray-500 font-cairo mb-6">{t('orders.orderSuccessDesc')}</p>
                    <Button variant="secondary" size="lg" rounded="xl" fullWidth onClick={() => {
                      clearCart();
                      navigate(PAGES.ORDER_SUCCESS.replace(':orderId', orderPlaced.id));
                    }}>
                      {t('common.continue')}
                    </Button>
                  </div>
                )}
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
