import { motion } from 'framer-motion';
import { Target, Eye, Users, ShoppingBag, Package, HeadphonesIcon, Award } from 'lucide-react';

const stats = [
  { icon: Users, value: '٥٠,٠٠٠+', label: 'عميل سعيد' },
  { icon: ShoppingBag, value: '١٠٠,٠٠٠+', label: 'منتج مباع' },
  { icon: Package, value: '١٠,٠٠٠+', label: 'منتج متوفر' },
  { icon: Award, value: '٩٨%', label: 'رضا العملاء' },
];

const team = [
  { name: 'أحمد محمد', role: 'المؤسس والرئيس التنفيذي', avatar: 'A' },
  { name: 'سارة خالد', role: 'مديرة التسويق', avatar: 'S' },
  { name: 'محمد علي', role: 'مدير التكنولوجيا', avatar: 'M' },
  { name: 'نورة أحمد', role: 'مديرة خدمة العملاء', avatar: 'N' },
];

export function AboutPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      dir="rtl"
      className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-16"
    >
      <section className="text-center mb-12 lg:mb-16">
        <h1 className="text-3xl lg:text-4xl font-bold font-cairo text-gray-900 dark:text-dark-text mb-4">
          من نحن
        </h1>
        <div className="w-20 h-1 bg-secondary rounded-full mx-auto mb-6" />
        <p className="text-sm lg:text-base text-gray-600 dark:text-dark-muted font-cairo leading-relaxed max-w-2xl mx-auto">
          نحن في زاهي نؤمن أن التسوق يجب أن يكون تجربة ممتعة وسهلة. تأسس متجرنا بهدف تقديم أفضل منتجات الموضة الأصلية بأفضل الأسعار، مع خدمة توصيل سريعة وموثوقة إلى جميع أنحاء مصر.
        </p>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12 lg:mb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="p-6 bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-dark-border shadow-soft">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-secondary/10 text-secondary mb-4">
            <Target className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold font-cairo text-gray-900 dark:text-dark-text mb-2">رسالتنا</h3>
          <p className="text-sm text-gray-600 dark:text-dark-muted font-cairo leading-relaxed">
            توفير تجربة تسوق إلكتروني استثنائية من خلال تقديم منتجات عالية الجودة بأسعار تنافسية، مع ضمان رضا العملاء وتقديم أفضل خدمات ما بعد البيع.
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="p-6 bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-dark-border shadow-soft">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-accent/10 text-accent mb-4">
            <Eye className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold font-cairo text-gray-900 dark:text-dark-text mb-2">رؤيتنا</h3>
          <p className="text-sm text-gray-600 dark:text-dark-muted font-cairo leading-relaxed">
            أن نصبح الوجهة الأولى للتسوق الإلكتروني في مصر والمنطقة العربية، ونكون الخيار الأمثل لكل من يبحث عن الجودة والثقة.
          </p>
        </motion.div>
      </div>

      <section className="mb-12 lg:mb-16">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="p-5 bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-dark-border shadow-soft text-center"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-secondary/10 text-secondary mx-auto mb-3">
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-xl font-bold font-cairo text-gray-900 dark:text-dark-text">{stat.value}</p>
                <p className="text-xs text-gray-500 dark:text-dark-muted font-cairo mt-1">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold font-cairo text-gray-900 dark:text-dark-text text-center mb-8">فريقنا</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:gap-6">
          {team.map((member, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="text-center"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-secondary to-accent flex items-center justify-center text-white text-2xl font-bold font-cairo mx-auto mb-3">
                {member.avatar}
              </div>
              <p className="text-sm font-bold font-cairo text-gray-900 dark:text-dark-text">{member.name}</p>
              <p className="text-xs text-gray-500 dark:text-dark-muted font-cairo mt-0.5">{member.role}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </motion.div>
  );
}
