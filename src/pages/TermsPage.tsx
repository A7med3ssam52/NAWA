import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export function TermsPage() {
  const { t, i18n } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
      className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-16"
    >
      <h1 className="text-3xl lg:text-4xl font-bold font-cairo text-gray-900 mb-3">
        {t('terms.title')}
      </h1>
      <div className="w-20 h-1 bg-secondary rounded-full mb-8" />

      <div className="prose prose-sm max-w-none font-cairo text-gray-600 space-y-6 leading-relaxed">
        <p>
          يرجى قراءة هذه الشروط والأحكام بعناية قبل استخدام موقع زاهي. باستخدامك للموقع، فإنك توافق على الالتزام بهذه الشروط.
        </p>

        <h2 className="text-lg font-bold text-gray-900">قبول الشروط</h2>
        <p>
          باستخدامك لموقعنا الإلكتروني، فإنك تقر بأنك قرأت وفهمت وتوافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على أي من هذه الشروط، يرجى عدم استخدام الموقع.
        </p>

        <h2 className="text-lg font-bold text-gray-900">الحسابات والتسجيل</h2>
        <ul className="list-disc pr-5 space-y-1">
          <li>يجب أن تكون عمرك ١٨ عاماً أو أكثر لإنشاء حساب</li>
          <li>أنت مسؤول عن الحفاظ على سرية معلومات حسابك</li>
          <li>يجب تقديم معلومات دقيقة وكاملة عند التسجيل</li>
          <li>نحتفظ بالحق في تعليق أو إلغاء الحسابات المخالفة</li>
        </ul>

        <h2 className="text-lg font-bold text-gray-900">الطلبات والأسعار</h2>
        <ul className="list-disc pr-5 space-y-1">

          <li>نحتفظ بالحق في تعديل الأسعار في أي وقت دون إشعار مسبق</li>
          <li>يتم تأكيد الطلب بعد الدفع أو تأكيد طريقة الدفع</li>
          <li>نحتفظ بالحق في رفض أي طلب لأي سبب</li>
        </ul>

        <h2 className="text-lg font-bold text-gray-900">التوصيل والشحن</h2>
        <ul className="list-disc pr-5 space-y-1">
          <li>نقوم بالتوصيل إلى جميع محافظات مصر</li>
          <li>المدة الزمنية للتوصيل هي ٣-٧ أيام عمل حسب المنطقة</li>
          <li>رسوم التوصيل ٣٠ جنيهاً للطلبات أقل من ٥٠٠ جنيه</li>
          <li>التوصيل مجاني للطلبات التي تتجاوز ٥٠٠ جنيه</li>
        </ul>

        <h2 className="text-lg font-bold text-gray-900">سياسة الإرجاع والاستبدال</h2>
        <ul className="list-disc pr-5 space-y-1">
          <li>يمكن إرجاع المنتجات خلال ١٤ يوماً من تاريخ الاستلام</li>
          <li>يجب أن تكون المنتجات في حالتها الأصلية مع العبوة الأصلية</li>
          <li>المنتجات الشخصية والداخلية لا يمكن إرجاعها لأسباب صحية</li>
          <li>يتم استرداد المبلغ خلال ٥-١٠ أيام عمل بعد استلام المنتج المرتجع</li>
        </ul>

        <h2 className="text-lg font-bold text-gray-900">الملكية الفكرية</h2>
        <p>
          جميع المحتويات على هذا الموقع، بما في ذلك النصوص والصور والشعارات والبرمجيات، هي ملك لزاهي أو مرخصة لنا، ومحمية بموجب قوانين الملكية الفكرية. لا يجوز نسخ أو توزيع أو استخدام أي محتوى دون إذن كتابي مسبق.
        </p>

        <h2 className="text-lg font-bold text-gray-900">حدود المسؤولية</h2>
        <p>
          لا نتحمل المسؤولية عن أي أضرار غير مباشرة أو عرضية أو تبعية ناتجة عن استخدام أو عدم القدرة على استخدام موقعنا أو منتجاتنا. أقصى مسؤولية لنا هي قيمة المنتج المشترى.
        </p>

        <h2 className="text-lg font-bold text-gray-900">تعديل الشروط</h2>
        <p>
          نحتفظ بالحق في تعديل هذه الشروط والأحكام في أي وقت. سيتم إشعارك بالتغييرات الجوهرية عبر البريد الإلكتروني أو من خلال إشعار على الموقع. استمرار استخدامك للموقع بعد التعديلات يعني موافقتك على الشروط المعدلة.
        </p>

        <h2 className="text-lg font-bold text-gray-900">القانون المطبق</h2>
        <p>
          تخضع هذه الشروط والأحكام وتفسر وفقاً لقوانين جمهورية مصر العربية. أي نزاع ينشأ عن هذه الشروط يخضع للاختصاص القضائي للمحاكم المصرية.
        </p>

        <h2 className="text-lg font-bold text-gray-900">اتصل بنا</h2>
        <p>
          لأي استفسار بخصوص هذه الشروط والأحكام، يرجى التواصل معنا عبر البريد الإلكتروني: info@zahi.store
        </p>

        <p className="text-xs text-gray-400">{t('terms.lastUpdated')}</p>
      </div>
    </motion.div>
  );
}
