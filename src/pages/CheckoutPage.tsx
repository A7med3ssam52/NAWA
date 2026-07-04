import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ShoppingCart, CreditCard, ClipboardCheck, Check, ChevronLeft, Truck, Tag, Wallet, Smartphone, Building2, Landmark } from 'lucide-react';
import { useCart } from '@/contexts';
import { getCouponByCode } from '@/data';
import { formatPrice, cn } from '@/utils';
import { PAGES, TAX_RATE, SHIPPING_COST, FREE_SHIPPING_THRESHOLD, SHIPPING_COST as SHIPPING } from '@/constants';
import { Button, Input, Textarea, Divider } from '@/components/ui';
import toast from 'react-hot-toast';

const shippingSchema = z.object({
  fullName: z.string().min(3, 'الاسم ثلاثي أ字符 على الأقل'),
  phone: z.string().min(10, 'رقم الهاتف غير صحيح'),
  street: z.string().min(5, 'العنوان يجب أن يكون 5 أحرف على الأقل'),
  city: z.string().min(2, 'المدينة مطلوبة'),
  state: z.string().min(2, 'المحافظة مطلوبة'),
  zipCode: z.string().optional(),
});

type ShippingData = z.infer<typeof shippingSchema>;

const steps = [
  { id: 1, label: 'معلومات الشحن', icon: Truck },
  { id: 2, label: 'طريقة الدفع', icon: Wallet },
  { id: 3, label: 'مراجعة الطلب', icon: ClipboardCheck },
  { id: 4, label: 'إتمام الطلب', icon: Check },
];

export function CheckoutPage() {
  const navigate = useNavigate();
  const { items, subtotal, shippingCost, total, discount, notes, setNotes, clearCart } = useCart();
  const [currentStep, setCurrentStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [processing, setProcessing] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ShippingData>({
    resolver: zodResolver(shippingSchema),
  });

  const tax = subtotal * TAX_RATE;
  const actualShipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING;

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
    toast.success('تم إرسال تأكيد الطلب إلى بريدك الإلكتروني');
    clearCart();
    navigate(PAGES.ORDER_SUCCESS.replace(':orderId', orderId));
  };

  if (items.length === 0) {
    navigate(PAGES.CART);
    return null;
  }

  const isGuest = !JSON.parse(localStorage.getItem('auth') || '{}')?.isAuthenticated;

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-8" dir="rtl">
      {steps.map((step, idx) => {
        const StepIcon = step.icon;
        const isActive = currentStep >= step.id;
        const isCurrent = currentStep === step.id;
        return (
          <div key={step.id} className="flex items-center gap-2">
            <div className={cn('flex items-center gap-2')}>
              <div className={cn(
                'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300',
                isActive ? 'bg-secondary border-secondary text-white' : 'border-gray-300 dark:border-dark-muted text-gray-400 dark:text-dark-muted',
                isCurrent && 'ring-2 ring-secondary/30'
              )}>
                <StepIcon className="w-4 h-4" />
              </div>
              <span className={cn('text-xs font-cairo font-medium hidden sm:block', isActive ? 'text-secondary' : 'text-gray-400 dark:text-dark-muted')}>
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className={cn('w-8 h-0.5 transition-colors duration-300', currentStep > step.id ? 'bg-secondary' : 'bg-gray-200 dark:bg-dark-border')} />
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div dir="rtl" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold font-cairo text-gray-900 dark:text-dark-text text-center mb-4 sm:mb-6">
        إتمام الطلب
      </h1>

      {isGuest && (
        <div className="max-w-2xl mx-auto mb-4 p-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl text-center">
          <p className="text-sm font-cairo text-blue-700 dark:text-blue-300">
            أنت تطلب كضيف. يمكنك إنشاء حساب لتتبع طلباتك بسهولة في المستقبل.
          </p>
        </div>
      )}

      {renderStepIndicator()}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-dark-border p-4 sm:p-5 shadow-soft">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.form key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleSubmit(handleShippingSubmit)} className="space-y-3 sm:space-y-4">
                <h2 className="text-base sm:text-lg font-bold font-cairo text-gray-900 dark:text-dark-text mb-3 sm:mb-4">معلومات الشحن</h2>
                <div className="grid grid-cols-1 gap-3 sm:gap-4">
                  <Input label="الاسم الكامل" placeholder="محمد أحمد" error={errors.fullName?.message} {...register('fullName')} />
                  <Input label="رقم الهاتف" placeholder="01234567890" error={errors.phone?.message} {...register('phone')} />
                  <div className="sm:col-span-2">
                    <Input label="العنوان" placeholder="شارع النيل، مبنى ١٢" error={errors.street?.message} {...register('street')} />
                  </div>
                  <Input label="المدينة" placeholder="القاهرة" error={errors.city?.message} {...register('city')} />
                  <Input label="المحافظة" placeholder="القاهرة" error={errors.state?.message} {...register('state')} />
                  <Input label="الرمز البريدي" placeholder="١١٥١١" {...register('zipCode')} />
                </div>
                <div className="flex justify-start pt-2">
                  <Button type="submit" variant="secondary" size="lg" rounded="xl" className="w-full sm:w-auto">التالي <ChevronLeft className="w-4 h-4" /></Button>
                </div>
              </motion.form>
            )}

            {currentStep === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-base sm:text-lg font-bold font-cairo text-gray-900 dark:text-dark-text mb-3 sm:mb-4">طريقة الدفع</h2>
                <div className="space-y-2 sm:space-y-3">
                  {[
                    { id: 'cod', label: 'الدفع عند الاستلام', desc: 'ادفع نقداً عند استلام الطلب', icon: Wallet },
                    { id: 'card', label: 'بطاقة ائتمان', desc: 'ادفع عبر بطاقة الائتمان أو الخصم المباشر', icon: CreditCard },
                    { id: 'vodafone-cash', label: 'فودافون كاش', desc: 'ادفع عبر محفظة فودافون كاش', icon: Smartphone },
                    { id: 'fawry', label: 'فوري', desc: 'ادفع عبر نقاط فوري المنتشرة', icon: Building2 },
                    { id: 'instapay', label: 'انستا باي', desc: 'ادفع فورياً عبر انستا باي', icon: Landmark },
                  ].map((method) => {
                    const Icon = method.icon;
                    return (
                      <button key={method.id} type="button" onClick={() => setPaymentMethod(method.id)} className={cn('flex items-center gap-3 sm:gap-4 w-full p-3 sm:p-4 rounded-xl border-2 transition-all text-right', paymentMethod === method.id ? 'border-secondary bg-secondary/5' : 'border-gray-200 dark:border-dark-border hover:border-gray-300')}>
                        <div className={cn('flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl shrink-0', paymentMethod === method.id ? 'bg-secondary text-white' : 'bg-gray-100 dark:bg-dark-border text-gray-400')}>
                          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold font-cairo text-gray-900 dark:text-dark-text">{method.label}</p>
                          <p className="text-xs text-gray-500 dark:text-dark-muted font-cairo">{method.desc}</p>
                        </div>
                        {paymentMethod === method.id && <Check className="w-4 h-4 sm:w-5 sm:h-5 text-secondary shrink-0" />}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between pt-4 gap-2 sm:gap-0">
                  <Button variant="ghost" size="lg" rounded="xl" className="flex-1 sm:flex-none" onClick={() => setCurrentStep(1)}>السابق</Button>
                  <Button variant="secondary" size="lg" rounded="xl" className="flex-1 sm:flex-none" onClick={handlePaymentSubmit}>التالي <ChevronLeft className="w-4 h-4" /></Button>
                </div>
              </motion.div>
            )}

            {currentStep >= 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-base sm:text-lg font-bold font-cairo text-gray-900 dark:text-dark-text mb-3 sm:mb-4">مراجعة الطلب</h2>
                <div className="space-y-2 sm:space-y-3 mb-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 dark:bg-dark-border/30 rounded-xl">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-gray-100 dark:bg-dark-border shrink-0">
                        <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-semibold font-cairo text-gray-900 dark:text-dark-text truncate">{item.product.name}</p>
                        <p className="text-xs text-gray-400 dark:text-dark-muted font-cairo">الكمية: {item.quantity}</p>
                      </div>
                      <span className="text-xs sm:text-sm font-bold font-cairo text-gray-900 dark:text-dark-text">{formatPrice(item.product.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="ملاحظات إضافية (اختياري)" className="mb-4" rows={2} />
                <div className="flex items-center justify-between pt-2 gap-2 sm:gap-0">
                  <Button variant="ghost" size="lg" rounded="xl" className="flex-1 sm:flex-none" onClick={() => setCurrentStep(2)}>السابق</Button>
                  <Button variant="accent" size="lg" rounded="xl" className="flex-1 sm:flex-none" onClick={handlePlaceOrder} loading={processing}>
                    تأكيد الطلب
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="lg:col-span-1 bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-dark-border p-4 sm:p-5 shadow-soft sticky top-24 sm:top-28 space-y-2 sm:space-y-3 h-fit">
          <h3 className="text-base font-bold font-cairo text-gray-900 dark:text-dark-text">ملخص الطلب</h3>
          <div className="space-y-1.5 sm:space-y-2 text-sm font-cairo">
            <div className="flex justify-between"><span className="text-gray-500 dark:text-dark-muted">المجموع الفرعي</span><span className="text-gray-900 dark:text-dark-text font-semibold">{formatPrice(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500 dark:text-dark-muted">الشحن</span><span className={actualShipping === 0 ? 'text-success font-semibold' : 'text-gray-900 dark:text-dark-text font-semibold'}>{actualShipping === 0 ? 'مجاني' : formatPrice(actualShipping)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500 dark:text-dark-muted">الضريبة</span><span className="text-gray-900 dark:text-dark-text font-semibold">{formatPrice(tax)}</span></div>
            {discount > 0 && <div className="flex justify-between"><span className="text-success">الخصم</span><span className="text-success font-semibold">-{formatPrice(discount)}</span></div>}
            <Divider />
            <div className="flex justify-between"><span className="text-base font-bold text-gray-900 dark:text-dark-text">الإجمالي</span><span className="text-lg sm:text-lg font-bold text-gray-900 dark:text-dark-text">{formatPrice(total)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
