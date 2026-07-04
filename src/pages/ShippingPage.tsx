import { motion } from 'framer-motion';
import { Truck, Package, Clock, Shield } from 'lucide-react';

const shippingInfo = [
  {
    icon: Truck,
    title: 'طرق الشحن',
    items: [
      'الشحن السريع (٢-٤ أيام عمل)',
      'الشحن العادي (٥-٧ أيام عمل)',
      'الشحن المجاني للطلبات فوق ٥٠٠ ج.م',
    ],
  },
  {
    icon: Package,
    title: 'تكلفة الشحن',
    items: [
      'الشحن العادي: ٣٠ ج.م',
      'الشحن السريع: ٦٠ ج.م',
      'الشحن مجاني للطلبات فوق ٥٠٠ ج.م',
    ],
  },
  {
    icon: Clock,
    title: 'مدة التوصيل',
    items: [
      'القاهرة والجيزة: ١-٢ يوم عمل',
      'المحافظات: ٣-٥ أيام عمل',
      'المناطق النائية: ٥-٧ أيام عمل',
    ],
  },
  {
    icon: Shield,
    title: 'تتبع الطلب',
    items: [
      'يمكنك تتبع طلبك من خلال حسابك',
      'سيتم إرسال رمز التتبع عبر البريد الإلكتروني',
      'يمكنك التواصل معنا لمعرفة حالة طلبك',
    ],
  },
];

export function ShippingPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      dir="rtl"
      className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-16"
    >
      <h1 className="text-3xl lg:text-4xl font-bold font-cairo text-gray-900 dark:text-dark-text mb-3">
        الشحن والتوصيل
      </h1>
      <div className="w-20 h-1 bg-secondary rounded-full mb-8" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-12">
        {shippingInfo.map((section) => {
          const Icon = section.icon;
          return (
            <div key={section.title} className="bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-dark-border p-5 shadow-soft">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-secondary/10 text-secondary">
                  <Icon className="w-5 h-5" />
                </div>
                <h2 className="text-base font-bold font-cairo text-gray-900 dark:text-dark-text">{section.title}</h2>
              </div>
              <ul className="space-y-2 pr-2">
                {section.items.map((item) => (
                  <li key={item} className="text-sm font-cairo text-gray-600 dark:text-dark-muted flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-secondary shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-5">
        <h2 className="text-base font-bold font-cairo text-amber-800 dark:text-amber-300 mb-2">ملاحظات هامة</h2>
        <ul className="space-y-1 pr-4">
          <li className="text-sm font-cairo text-amber-700 dark:text-amber-400 list-disc">قد تختلف مدة التوصيل بناءً على الظروف العامة وحالة الطقس</li>
          <li className="text-sm font-cairo text-amber-700 dark:text-amber-400 list-disc">يجب أن يكون عنوان التوصيل صحيح وكامل لضمان وصول الطلب</li>
          <li className="text-sm font-cairo text-amber-700 dark:text-amber-400 list-disc">في حالة عدم الاستلام، سيتم إعادة المنتج إلينا وتطبيق رسوم إرجاع</li>
        </ul>
      </div>
    </motion.div>
  );
}
