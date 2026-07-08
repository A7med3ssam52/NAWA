import { motion } from 'framer-motion';
import { Smartphone, Building2, CreditCard, Wallet, Banknote, Landmark } from 'lucide-react';

const paymentMethods = [
  {
    id: 'vodafone-cash',
    name: 'فودافون كاش',
    desc: 'ادفع بسهولة عبر محفظة فودافون كاش من أي رقم فودافون',
    icon: Smartphone,
    color: '#E60000',
    bg: 'bg-red-50',
    details: ['التحويل المباشر عبر تطبيق فودافون كاش', 'متوفر 24 ساعة طوال الأسبوع', 'رسوم بسيطة حسب قيمة الطلب'],
  },
  {
    id: 'fawry',
    name: 'فوري',
    desc: 'ادفع نقداً عبر أكثر من ١٠٠,٠٠٠ نقطة دفع فوري في جميع أنحاء مصر',
    icon: Building2,
    color: '#00A651',
    bg: 'bg-green-50',
    details: ['أقرب نقطة دفع فوري لك', 'الدفع نقداً بدون بطاقة', 'تأكيد فوري للدفع'],
  },
  {
    id: 'instapay',
    name: 'انستا باي',
    desc: 'ادفع فوراً عبر تطبيق انستا باي المرتبط بحسابك البنكي',
    icon: Landmark,
    color: '#4A148C',
    bg: 'bg-purple-50',
    details: ['مرتبط بجميع البنوك المصرية', 'تحويل فوري بدون رسوم', 'متوفر عبر تطبيق البنك أو انستا باي'],
  },
  {
    id: 'visa-mastercard',
    name: 'بطاقات الائتمان والخصم',
    desc: 'ادفع عبر فيزا، ماستركارد، أو مدى بأمان تام',
    icon: CreditCard,
    color: '#1A1F71',
    bg: 'bg-blue-50',
    details: ['فيزا - ماستركارد - مدى', 'معاملات مشفرة وآمنة 100%', 'قبول فوري للدفع'],
  },
  {
    id: 'valu',
    name: 'ValU',
    desc: 'قسّم مشترياتك على دفعات شهرية ميسرة بدون فوائد',
    icon: Banknote,
    color: '#1B9CFC',
    bg: 'bg-sky-50',
    details: ['تقسيط حتى ٦٠ شهراً', 'موافقة فورية', 'بدون مقدم أو فوائد'],
  },
  {
    id: 'cod',
    name: 'الدفع عند الاستلام',
    desc: 'ادفع نقداً عند استلام طلبك في المنزل',
    icon: Wallet,
    color: '#F59E0B',
    bg: 'bg-amber-50',
    details: ['الدفع نقداً عند الاستلام', 'متوفر في جميع المحافظات', 'يمكنك فحص المنتج قبل الدفع'],
  },
];

export function PaymentPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      dir="rtl"
      className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-16"
    >
      <div className="text-center mb-12">
        <h1 className="text-3xl lg:text-4xl font-bold font-cairo text-gray-900 mb-3">
          طرق الدفع
        </h1>
        <p className="text-sm lg:text-base text-gray-500 font-cairo max-w-xl mx-auto">
          نوفر لك طرق دفع مريحة وآمنة تناسب احتياجاتك. اختر ما يناسبك من الطرق التالية
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {paymentMethods.map((method, idx) => {
          const Icon = method.icon;
          return (
            <motion.div
              key={method.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.08 }}
              className="bg-white rounded-2xl border border-gray-100 p-6 shadow-soft hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex items-center justify-center w-14 h-14 rounded-2xl shrink-0 ${method.bg}`}
                  style={{ color: method.color }}
                >
                  <Icon className="w-7 h-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold font-cairo text-gray-900 mb-1">
                    {method.name}
                  </h3>
                  <p className="text-sm text-gray-500 font-cairo mb-4">
                    {method.desc}
                  </p>
                  <ul className="space-y-1.5">
                    {method.details.map((detail) => (
                      <li key={detail} className="flex items-center gap-2 text-xs text-gray-600 font-cairo">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: method.color }} />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-12 bg-gradient-to-l from-secondary/10 via-accent/10 to-secondary/10 rounded-2xl p-6 lg:p-8 text-center border border-gray-100">
        <h2 className="text-lg font-bold font-cairo text-gray-900 mb-3">
          الدفع آمن ومشفر 100%
        </h2>
        <p className="text-sm text-gray-500 font-cairo max-w-lg mx-auto">
          جميع معاملاتك المالية مشفرة ومحمية باستخدام أحدث تقنيات الأمان. نحن لا نخزن أي معلومات بطاقة ائتمان على خوادمنا.
        </p>
        <div className="flex items-center justify-center gap-3 mt-4">
          <CreditCard className="w-5 h-5 text-secondary" />
          <span className="text-xs text-gray-400 font-cairo">
            مدعوم بواسطة Paymob - بوابة دفع مصرية معتمدة
          </span>
        </div>
      </div>
    </motion.div>
  );
}
