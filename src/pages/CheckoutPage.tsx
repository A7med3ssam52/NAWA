import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { ClipboardCheck, Check, ChevronLeft, Truck, Wallet, Landmark, Mail, Lock, LogIn, Copy, AlertCircle, KeyRound, Tag, Banknote } from 'lucide-react';
import { useCart, useAuth } from '@/contexts';
import { orderService } from '@/services';
import { formatPrice, cn } from '@/utils';
import { PAGES, EGYPT_GOVERNORATES, INSTAPAY_PHONE, WALLET_PHONE, PAYMENT_METHODS } from '@/constants';
import { Button, Input, Select, Textarea, Divider, Spinner, ImageUpload } from '@/components/ui';
import { AccountGateModal } from '@/components/features/AccountGateModal';
import { generateTemporaryPassword, saveGuestCredentials } from '@/lib/guestAccount';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

type ShippingData = {
  fullName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
};

type GuestFlow =
  | { kind: 'created'; email: string; password: string; activated: boolean }
  | { kind: 'exists'; email: string }
  | { kind: 'error'; email: string; message: string };

export function CheckoutPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { items, subtotal, shippingCost, total, discount, notes, setNotes, clearCart, coupon, couponCode } = useCart();
  const [currentStep, setCurrentStep] = useState(() => new URLSearchParams(location.search).get('guest') === '1' ? 1 : 0);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [processing, setProcessing] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState('');
  const [transferDone, setTransferDone] = useState(false);
  const shippingDataRef = useRef<ShippingData | null>(null);
  const [orderPlaced, setOrderPlaced] = useState<{ id: string } | null>(null);
  const [guestFlow, setGuestFlow] = useState<GuestFlow | null>(null);
  const [guestPassword, setGuestPassword] = useState('');
  const [guestConfirmPassword, setGuestConfirmPassword] = useState('');
  const [guestPasswordError, setGuestPasswordError] = useState<string | null>(null);

  const shippingSchema = useMemo(() => z.object({
    fullName: z.string().min(3, t('checkout.fullNameRequired')),
    email: z.string().min(1, t('checkout.emailRequired')).email(t('checkout.emailInvalid')),
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

  useEffect(() => {
    if (!authLoading && isAuthenticated && currentStep === 0) {
      setCurrentStep(1);
    }
  }, [authLoading, isAuthenticated, currentStep]);

  const isGuest = !isAuthenticated;

  const handleShippingSubmit = (data: ShippingData) => {
    shippingDataRef.current = data;
    setCurrentStep(2);
  };

  const handlePaymentSubmit = () => {
    if (!paymentMethod) {
      toast.error(t('checkout.paymentRequired'));
      return;
    }
    if (paymentMethod !== PAYMENT_METHODS.COD && (!transferDone || !receiptUrl)) {
      toast.error(t('checkout.receiptRequired'));
      return;
    }
    setCurrentStep(3);
  };

  const copyText = async (text: string, successKey: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t(successKey));
    } catch {
      // clipboard unavailable — ignore
    }
  };

  const validateGuestPassword = (): string | null => {
    if (!guestPassword) return t('auth.passwordRequired');
    if (guestPassword.length < 6) return t('auth.passwordMin');
    if (guestPassword !== guestConfirmPassword) return t('auth.passwordMismatch');
    return null;
  };

  const createGuestAccount = async (orderId: string, sd: ShippingData) => {
    const password = guestPassword.trim() || generateTemporaryPassword();
    const { error } = await supabase.auth.signUp({
      email: sd.email.trim(),
      password,
      options: { data: { name: sd.fullName } },
    });
    if (error) {
      if (/already (been )?(registered|used)/i.test(error.message)) {
        return { kind: 'exists', email: sd.email.trim() } as GuestFlow;
      }
      return { kind: 'error', email: sd.email.trim(), message: error.message } as GuestFlow;
    }
    const { data: { session } } = await supabase.auth.getSession();
    const activated = !!session?.user;
    if (activated) {
      await supabase.rpc('link_guest_order', { p_order_id: orderId });
    }
    saveGuestCredentials({ email: sd.email.trim(), password, activated });
    return { kind: 'created', email: sd.email.trim(), password, activated } as GuestFlow;
  };

  const handlePlaceOrder = async () => {
    if (!shippingDataRef.current) return;
    if (isGuest) {
      const pwError = validateGuestPassword();
      if (pwError) {
        setGuestPasswordError(pwError);
        return;
      }
    }
    setProcessing(true);
    const sd = shippingDataRef.current;
    try {
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
        paymentPhone: paymentMethod === PAYMENT_METHODS.INSTAPAY ? INSTAPAY_PHONE : paymentMethod === PAYMENT_METHODS.WALLET ? WALLET_PHONE : undefined,
        paymentReceiptUrl: paymentMethod === PAYMENT_METHODS.COD ? undefined : receiptUrl,
        notes,
      });
      await supabase.from('order_email_logs').insert({
        order_id: order.id, email: user?.email || sd.email, sent_at: new Date().toISOString(),
      });
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
      if (!isAuthenticated) {
        const flow = await createGuestAccount(order.id, sd);
        setGuestFlow(flow);
        setOrderPlaced({ id: order.id });
        setCurrentStep(4);
      } else {
        clearCart();
        navigate(PAGES.ORDER_SUCCESS.replace(':orderId', order.id));
      }
    } catch (err) {
      toast.error(t('checkout.orderFailed'));
    } finally {
      setProcessing(false);
    }
  };

  const handleGuestFinish = () => {
    if (!orderPlaced) return;
    clearCart();
    navigate(PAGES.ORDER_SUCCESS.replace(':orderId', orderPlaced.id), {
      state: { guestAccount: guestFlow?.kind === 'created' },
    });
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

  const renderGuestCreated = () => {
    if (!guestFlow || guestFlow.kind !== 'created') return null;
    return (
      <>
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 mb-4">
            <Check className="w-10 h-10 text-success" />
          </div>
          <h2 className="text-lg font-bold font-cairo text-gray-900 mb-1">{t('checkout.accountCreatedTitle')}</h2>
          <p className="text-sm text-gray-500 font-cairo">{t('checkout.accountCreatedDesc')}</p>
        </div>

        <div className="bg-secondary/5 rounded-2xl border border-secondary/10 p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
              <KeyRound className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-cairo text-gray-900">{t('checkout.guestCredentialsTitle')}</h3>
              <p className="text-xs text-gray-500 font-cairo">{t('checkout.guestCredentialsHint')}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 px-3.5 h-11">
            <Mail className="w-4 h-4 text-gray-400 shrink-0" />
            <span dir="ltr" className="flex-1 text-sm font-cairo text-gray-900 truncate">{guestFlow.email}</span>
            <button type="button" onClick={() => copyText(guestFlow.email, 'checkout.copiedEmail')} className="p-1 text-gray-400 hover:text-secondary transition-colors" aria-label={t('checkout.copyEmail')}>
              <Copy className="w-4 h-4" />
            </button>
          </div>

          {!guestFlow.activated && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-cairo text-amber-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {t('checkout.emailActivationNote')}
            </div>
          )}

          <p className="text-xs text-gray-400 font-cairo leading-relaxed">{t('checkout.chosenPasswordNote')}</p>
        </div>

        <Button variant="secondary" size="lg" rounded="xl" fullWidth className="mt-5" onClick={handleGuestFinish}>
          {t('checkout.continueToOrder')}
        </Button>
      </>
    );
  };

  const renderGuestExisting = () => {
    if (!guestFlow || guestFlow.kind !== 'exists') return null;
    return (
      <>
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary/10 mb-4">
            <Mail className="w-10 h-10 text-secondary" />
          </div>
          <h2 className="text-lg font-bold font-cairo text-gray-900 mb-1">{t('checkout.accountExistsTitle')}</h2>
          <p className="text-sm text-gray-500 font-cairo">{t('checkout.accountExistsDesc')}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs font-cairo text-blue-700 mb-5 text-center">
          {guestFlow.email}
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" size="lg" rounded="xl" fullWidth onClick={() => navigate(PAGES.LOGIN, { state: { from: PAGES.CHECKOUT } })}>
            <LogIn className="w-4 h-4" />
            {t('checkout.visitLogin')}
          </Button>
          <Button variant="secondary" size="lg" rounded="xl" fullWidth onClick={handleGuestFinish}>
            {t('checkout.continueToOrder')}
          </Button>
        </div>
      </>
    );
  };

  const renderGuestError = () => {
    if (!guestFlow || guestFlow.kind !== 'error') return null;
    return (
      <>
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-danger/10 mb-4">
            <AlertCircle className="w-10 h-10 text-danger" />
          </div>
          <h2 className="text-lg font-bold font-cairo text-gray-900 mb-1">{t('checkout.accountErrorTitle')}</h2>
          <p className="text-sm text-gray-500 font-cairo">{t('checkout.accountErrorDesc')}</p>
        </div>
        {guestFlow.message && (
          <div className="bg-danger/5 border border-danger/20 rounded-2xl p-3 text-xs font-cairo text-danger text-center mb-5" dir="ltr">
            {guestFlow.message}
          </div>
        )}
        <Button variant="secondary" size="lg" rounded="xl" fullWidth onClick={handleGuestFinish}>
          {t('checkout.continueToOrder')}
        </Button>
      </>
    );
  };

  return (
    <div dir={i18n.language === 'ar' ? 'rtl' : 'ltr'} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold font-cairo text-gray-900 text-center mb-4 sm:mb-6">
        {t('checkout.title')}
      </h1>

      <AccountGateModal
        isOpen={currentStep === 0 && !authLoading && isGuest}
        onClose={() => navigate(PAGES.CART)}
        onLogin={() => navigate(PAGES.LOGIN, { state: { from: PAGES.CHECKOUT } })}
        onContinueGuest={() => setCurrentStep(1)}
      />

      {isGuest && currentStep > 0 && (
        <div className="max-w-2xl mx-auto mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-center">
          <p className="text-sm font-cairo text-blue-700">
            {t('checkout.guestOrder')}
          </p>
        </div>
      )}

      {authLoading ? (
        <div className="flex justify-center py-24"><Spinner size="lg" /></div>
      ) : (
        <>
          {renderStepIndicator()}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-soft">
              <AnimatePresence mode="wait">
                {currentStep === 1 && (
                  <motion.form key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleSubmit(handleShippingSubmit)} className="space-y-3 sm:space-y-4">
                    <h2 className="text-base sm:text-lg font-bold font-cairo text-gray-900 mb-3 sm:mb-4">{t('checkout.shippingInfo')}</h2>
                    <div className="grid grid-cols-1 gap-3 sm:gap-4">
                      <Input label={t('checkout.fullName')} placeholder={t('checkout.fullNamePlaceholder')} error={errors.fullName?.message} {...register('fullName')} />
                      <Input label={t('checkout.email')} placeholder={t('checkout.emailPlaceholder')} error={errors.email?.message} {...register('email')} />
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
                    {isGuest && (
                      <p className="text-xs text-gray-400 font-cairo">{t('checkout.guestEmailHint')}</p>
                    )}
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
                        { id: PAYMENT_METHODS.INSTAPAY, labelKey: 'instapay', descKey: 'instapayDesc', icon: Landmark },
                        { id: PAYMENT_METHODS.WALLET, labelKey: 'wallet', descKey: 'walletDesc', icon: Wallet },
                        { id: PAYMENT_METHODS.COD, labelKey: 'cod', descKey: 'codDesc', icon: Banknote },
                      ].map((method) => {
                        const Icon = method.icon;
                        return (
                          <button key={method.id} type="button" onClick={() => { setPaymentMethod(method.id); setTransferDone(false); setReceiptUrl(''); }} className={cn('flex items-center gap-3 sm:gap-4 w-full p-3 sm:p-4 rounded-xl border-2 transition-all text-right', paymentMethod === method.id ? 'border-secondary bg-secondary/5' : 'border-gray-200 hover:border-gray-300')}>
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
                    {paymentMethod && paymentMethod !== PAYMENT_METHODS.COD && (
                      <div className="mt-3 p-4 bg-secondary/5 rounded-xl border border-secondary/20 space-y-3">
                        <p className="text-sm font-bold font-cairo text-gray-900">{t('checkout.transferToNumber')}</p>
                        <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 px-3.5 h-11">
                          <span dir="ltr" className="flex-1 text-sm font-cairo text-gray-900">{paymentMethod === PAYMENT_METHODS.INSTAPAY ? INSTAPAY_PHONE : WALLET_PHONE}</span>
                          <button type="button" onClick={() => copyText(paymentMethod === PAYMENT_METHODS.INSTAPAY ? INSTAPAY_PHONE : WALLET_PHONE, 'checkout.copiedNumber')} className="p-1 text-gray-400 hover:text-secondary transition-colors" aria-label={t('checkout.copyNumber')}>
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                        {transferDone ? (
                          <div className="space-y-2">
                            <p className="text-xs font-cairo text-gray-500">{t('checkout.uploadReceipt')}</p>
                            <ImageUpload bucket="receipts" max={1} value={receiptUrl ? [receiptUrl] : []} onChange={(urls) => setReceiptUrl(urls[0] || '')} />
                          </div>
                        ) : (
                          <Button variant="secondary" size="md" rounded="xl" fullWidth onClick={() => setTransferDone(true)}>
                            {t('checkout.done')}
                          </Button>
                        )}
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-4 gap-2 sm:gap-0">
                      <Button variant="accent" size="lg" rounded="xl" className="flex-1 sm:flex-none" onClick={() => setCurrentStep(1)}>{t('common.previous')}</Button>
                      <Button variant="secondary" size="lg" rounded="xl" className="flex-1 sm:flex-none" onClick={handlePaymentSubmit}>{t('common.next')} <ChevronLeft className="w-4 h-4" /></Button>
                    </div>
                  </motion.div>
                )}

                {currentStep === 3 && (
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
                    {couponCode && discount > 0 && (
                      <div className="flex items-center justify-between mb-4 p-3 bg-success/10 rounded-xl border border-success/20">
                        <span className="flex items-center gap-2 text-sm font-cairo text-success font-semibold">
                          <Tag className="w-4 h-4" />
                          {t('orders.couponCode', { code: couponCode })}
                        </span>
                        <span className="text-sm font-bold font-cairo text-success">-{formatPrice(discount)}</span>
                      </div>
                    )}
                    {isGuest && (
                      <div className="bg-secondary/5 rounded-2xl border border-secondary/10 p-4 sm:p-5 space-y-3 sm:space-y-4 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
                            <KeyRound className="w-5 h-5 text-secondary" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold font-cairo text-gray-900">{t('checkout.choosePasswordTitle')}</h3>
                            <p className="text-xs text-gray-500 font-cairo">{t('checkout.choosePasswordHint')}</p>
                          </div>
                        </div>
                        <Input
                          type="password"
                          dir="ltr"
                          icon={Lock}
                          label={t('auth.passwordLabel')}
                          placeholder="••••••••"
                          value={guestPassword}
                          error={guestPasswordError || undefined}
                          onChange={(e) => {
                            setGuestPassword(e.target.value);
                            if (guestPasswordError) setGuestPasswordError(null);
                          }}
                        />
                        <Input
                          type="password"
                          dir="ltr"
                          icon={Lock}
                          label={t('auth.confirmPasswordLabel')}
                          placeholder="••••••••"
                          value={guestConfirmPassword}
                          onChange={(e) => {
                            setGuestConfirmPassword(e.target.value);
                            if (guestPasswordError) setGuestPasswordError(null);
                          }}
                        />
                        <p className="text-xs text-gray-400 font-cairo">{t('checkout.choosePasswordNote')}</p>
                      </div>
                    )}
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
                    {guestFlow ? (
                      guestFlow.kind === 'created' ? renderGuestCreated() : guestFlow.kind === 'exists' ? renderGuestExisting() : renderGuestError()
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
                <div className="flex justify-between"><span className="text-gray-500">{t('cart.shipping')}</span><span className={shippingCost === 0 ? 'text-success font-semibold' : 'text-gray-900 font-semibold'}>{shippingCost === 0 ? t('common.free') : formatPrice(shippingCost)}</span></div>
                {discount > 0 && <div className="flex justify-between"><span className="text-success">{t('cart.discount')}</span><span className="text-success font-semibold">-{formatPrice(discount)}</span></div>}
                <Divider />
                <div className="flex justify-between"><span className="text-base font-bold text-gray-900">{t('cart.total')}</span><span className="text-lg sm:text-lg font-bold text-gray-900">{formatPrice(total)}</span></div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}