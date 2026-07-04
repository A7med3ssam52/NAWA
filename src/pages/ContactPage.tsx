import { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Phone, MapPin, Clock, Send } from 'lucide-react';
import { Button, Input, Textarea } from '@/components/ui';
import toast from 'react-hot-toast';

const contactSchema = z.object({
  name: z.string().min(3, 'الاسم ثلاثي أحرف على الأقل'),
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  subject: z.string().min(5, 'عنوان الرسالة 5 أحرف على الأقل'),
  message: z.string().min(10, 'الرسالة 10 أحرف على الأقل'),
});

type ContactData = z.infer<typeof contactSchema>;

export function ContactPage() {
  const [sending, setSending] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ContactData>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async () => {
    setSending(true);
    await new Promise((r) => setTimeout(r, 1000));
    toast.success('تم إرسال رسالتك بنجاح! سنتواصل معك قريباً.');
    reset();
    setSending(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      dir="rtl"
      className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-16"
    >
      <div className="text-center mb-10">
        <h1 className="text-3xl lg:text-4xl font-bold font-cairo text-gray-900 dark:text-dark-text mb-3">
          اتصل بنا
        </h1>
        <p className="text-sm lg:text-base text-gray-500 dark:text-dark-muted font-cairo max-w-lg mx-auto">
          نحن هنا للإجابة على استفساراتك ومساعدتك. تواصل معنا بأي طريقة تناسبك.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-dark-border p-6 shadow-soft space-y-4">
            <Input label="الاسم" placeholder="محمد أحمد" error={errors.name?.message} {...register('name')} />
            <Input label="البريد الإلكتروني" placeholder="example@email.com" error={errors.email?.message} type="email" {...register('email')} />
            <Input label="عنوان الرسالة" placeholder="استفسار عن منتج" error={errors.subject?.message} {...register('subject')} />
            <Textarea label="الرسالة" placeholder="اكتب رسالتك هنا..." rows={5} error={errors.message?.message} {...register('message')} />
            <Button type="submit" variant="secondary" size="lg" fullWidth rounded="xl" loading={sending}>
              <Send className="w-4 h-4" /> إرسال الرسالة
            </Button>
          </form>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-5"
        >
          <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-dark-border p-5 shadow-soft">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-secondary/10 text-secondary">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold font-cairo text-gray-900 dark:text-dark-text">البريد الإلكتروني</p>
                <a href="mailto:info@zahi.store" className="text-xs text-secondary font-cairo hover:underline">info@zahi.store</a>
              </div>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent/10 text-accent">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold font-cairo text-gray-900 dark:text-dark-text">رقم الهاتف</p>
                <a href="tel:+201234567890" className="text-xs text-secondary font-cairo hover:underline" dir="ltr">+20 123 456 7890</a>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-success/10 text-success">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold font-cairo text-gray-900 dark:text-dark-text">العنوان</p>
                <p className="text-xs text-gray-500 dark:text-dark-muted font-cairo">القاهرة، مصر</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-dark-border p-5 shadow-soft">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500">
                <Clock className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold font-cairo text-gray-900 dark:text-dark-text">ساعات العمل</p>
            </div>
            <div className="space-y-2 text-xs font-cairo text-gray-500 dark:text-dark-muted">
              <div className="flex justify-between"><span>السبت - الخميس</span><span>٩:٠٠ ص - ١٠:٠٠ م</span></div>
              <div className="flex justify-between"><span>الجمعة</span><span>١:٠٠ م - ١٠:٠٠ م</span></div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
