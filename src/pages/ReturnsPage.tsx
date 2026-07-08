import { motion } from 'framer-motion';
import { RotateCcw, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

const returnSteps = [
  { icon: AlertCircle, title: '١. تأكد من الشروط', desc: 'المنتج لم يستخدم وفي نفس الحالة الأصلية، مع الفاتورة والملصقات' },
  { icon: RotateCcw, title: '٢. قدم طلب الإرجاع', desc: 'تواصل معنا عبر صفحة اتصل بنا أو من خلال حسابك في غضون ١٤ يوماً من الاستلام' },
  { icon: RefreshCw, title: '٣. اشحن المنتج', desc: 'سنقوم بترتيب شحن المنتج إلينا على نفقتنا في حالة العيوب الصناعية' },
  { icon: CheckCircle, title: '٤. استرداد المبلغ', desc: 'سنقوم برد المبلغ خلال ٥-١٠ أيام عمل بعد استلام وفحص المنتج' },
];

const eligibleItems = [
  'المنتجات في حالتها الأصلية',
  'المنتجات غير المستخدمة',
  'المنتجات مع الفاتورة الأصلية',
  'الإرجاع خلال ١٤ يوماً من الاستلام',
];

const ineligibleItems = [
  'المنتجات المستخدمة',
  'المنتجات التالفة بسبب سوء الاستخدام',
  'المنتجات بدون فاتورة',
  'الملابس الداخلية والملابس السباحة',
  'المنتجات المخصصة (Customized)',
];

export function ReturnsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      dir="rtl"
      className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-16"
    >
      <h1 className="text-3xl lg:text-4xl font-bold font-cairo text-gray-900 mb-3">
        الإرجاع والاستبدال
      </h1>
      <div className="w-20 h-1 bg-secondary rounded-full mb-8" />

      <p className="text-sm sm:text-base text-gray-600 font-cairo leading-relaxed mb-8">
        في زاهي، رضاك هو أولويتنا. إذا لم تكن راضياً تماماً عن مشترياتك، يمكنك إرجاع المنتج خلال ١٤ يوماً من تاريخ الاستلام.
      </p>

      <h2 className="text-lg font-bold font-cairo text-gray-900 mb-4">خطوات الإرجاع</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
        {returnSteps.map((step) => {
          const Icon = step.icon;
          return (
            <div key={step.title} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-soft">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-secondary/10 text-secondary">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold font-cairo text-gray-900">{step.title}</h3>
              </div>
              <p className="text-sm font-cairo text-gray-600 pr-12">{step.desc}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
          <h3 className="text-sm font-bold font-cairo text-green-800 mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> مؤهل للإرجاع
          </h3>
          <ul className="space-y-1.5 pr-4">
            {eligibleItems.map((item) => (
              <li key={item} className="text-sm font-cairo text-green-700 list-disc">{item}</li>
            ))}
          </ul>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
          <h3 className="text-sm font-bold font-cairo text-red-800 mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> غير مؤهل للإرجاع
          </h3>
          <ul className="space-y-1.5 pr-4">
            {ineligibleItems.map((item) => (
              <li key={item} className="text-sm font-cairo text-red-700 list-disc">{item}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
        <h2 className="text-sm font-bold font-cairo text-blue-800 mb-2">طرق الاسترداد</h2>
        <ul className="space-y-1 pr-4">
          <li className="text-sm font-cairo text-blue-700 list-disc">استرداد المبلغ إلى محفظة زاهي (فوري)</li>
          <li className="text-sm font-cairo text-blue-700 list-disc">استرداد المبلغ إلى بطاقة الائتمان (٣-٥ أيام عمل)</li>
          <li className="text-sm font-cairo text-blue-700 list-disc">تحويل بنكي (٥-١٠ أيام عمل)</li>
          <li className="text-sm font-cairo text-blue-700 list-disc">استبدال المنتج بمنتج آخر (في حدود ١٤ يوماً)</li>
        </ul>
      </div>
    </motion.div>
  );
}
