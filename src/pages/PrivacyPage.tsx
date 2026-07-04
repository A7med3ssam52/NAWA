import { motion } from 'framer-motion';

export function PrivacyPage() {
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
        سياسة الخصوصية
      </h1>
      <div className="w-20 h-1 bg-secondary rounded-full mb-8" />

      <div className="prose prose-sm dark:prose-invert max-w-none font-cairo text-gray-600 dark:text-dark-muted space-y-6 leading-relaxed">
        <p>
          نحن في زاهي نلتزم بحماية خصوصية زوارنا وعملائنا. توضح سياسة الخصوصية هذه كيفية جمع واستخدام وحماية المعلومات الشخصية التي تقدمها عند استخدام موقعنا.
        </p>

        <h2 className="text-lg font-bold text-gray-900 dark:text-dark-text">المعلومات التي نجمعها</h2>
        <p>قد نجمع الأنواع التالية من المعلومات:</p>
        <ul className="list-disc pr-5 space-y-1">
          <li>المعلومات الشخصية: الاسم، البريد الإلكتروني، رقم الهاتف، عنوان التوصيل</li>
          <li>معلومات الدفع: بيانات بطاقات الائتمان (يتم معالجتها بشكل آمن عبر بوابة دفع معتمدة)</li>
          <li>معلومات التصفح: عنوان IP، نوع المتصفح، صفحات الزيارة، مدة التصفح</li>
          <li>سجل الطلبات: المنتجات المشتراة، المبالغ، تواريخ الطلبات</li>
        </ul>

        <h2 className="text-lg font-bold text-gray-900 dark:text-dark-text">كيف نستخدم معلوماتك</h2>
        <p>نستخدم المعلومات التي نجمعها للأغراض التالية:</p>
        <ul className="list-disc pr-5 space-y-1">
          <li>معالجة وتنفيذ الطلبات</li>
          <li>التواصل معك بشأن طلباتك واستفساراتك</li>
          <li>تحسين خدماتنا وتجربة المستخدم</li>
          <li>إرسال عروض ترويجية وتحديثات (بموافقتك)</li>
          <li>الامتثال للمتطلبات القانونية</li>
        </ul>

        <h2 className="text-lg font-bold text-gray-900 dark:text-dark-text">حماية المعلومات</h2>
        <p>
          نستخدم إجراءات أمنية متقدمة لحماية معلوماتك الشخصية من الوصول غير المصرح به أو التعديل أو الكشف. تشمل هذه الإجراءات التشفير، جدران الحماية، وبروتوكولات الأمان SSL.
        </p>

        <h2 className="text-lg font-bold text-gray-900 dark:text-dark-text">مشاركة المعلومات</h2>
        <p>
          نحن لا نبيع أو نؤجر أو نشارك معلوماتك الشخصية مع أطراف ثالثة لأغراض تسويقية دون موافقتك. قد نشارك المعلومات مع شركاء التوصيل وخدمات الدفع لتنفيذ طلباتك فقط.
        </p>

        <h2 className="text-lg font-bold text-gray-900 dark:text-dark-text">ملفات تعريف الارتباط (Cookies)</h2>
        <p>
          نستخدم ملفات تعريف الارتباط لتحسين تجربة التصفح، تخصيص المحتوى، وتحليل حركة المرور. يمكنك التحكم في إعدادات ملفات تعريف الارتباط من خلال إعدادات المتصفح الخاص بك.
        </p>

        <h2 className="text-lg font-bold text-gray-900 dark:text-dark-text">حقوقك</h2>
        <p>لديك الحق في:</p>
        <ul className="list-disc pr-5 space-y-1">
          <li>الوصول إلى بياناتك الشخصية وتصحيحها</li>
          <li>طلب حذف بياناتك الشخصية</li>
          <li>الاعتراض على معالجة بياناتك</li>
          <li>سحب الموافقة في أي وقت</li>
        </ul>

        <h2 className="text-lg font-bold text-gray-900 dark:text-dark-text">التحديثات على سياسة الخصوصية</h2>
        <p>
          قد نقوم بتحديث هذه السياسة من وقت لآخر. سنقوم بإشعارك بأي تغييرات جوهرية عبر البريد الإلكتروني أو من خلال إشعار على موقعنا.
        </p>

        <h2 className="text-lg font-bold text-gray-900 dark:text-dark-text">اتصل بنا</h2>
        <p>
          إذا كان لديك أي استفسار حول سياسة الخصوصية هذه، يرجى التواصل معنا عبر البريد الإلكتروني: info@zahi.store
        </p>

        <p className="text-xs text-gray-400 dark:text-dark-muted">آخر تحديث: يناير ٢٠٢٦</p>
      </div>
    </motion.div>
  );
}
