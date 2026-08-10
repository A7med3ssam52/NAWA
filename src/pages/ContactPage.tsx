import { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Mail, Phone, MapPin, Clock, Send } from 'lucide-react';
import { Button, Input, Textarea } from '@/components/ui';
import toast from 'react-hot-toast';

const createContactSchema = (t: (key: string) => string) => z.object({
  name: z.string().min(3, t('contact.nameMin')),
  email: z.string().email(t('contact.emailInvalid')),
  subject: z.string().min(5, t('contact.subjectMin')),
  message: z.string().min(10, t('contact.messageMin')),
});

type ContactData = z.infer<ReturnType<typeof createContactSchema>>;

export function ContactPage() {
  const { t, i18n } = useTranslation();
  const [sending, setSending] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ContactData>({
    resolver: zodResolver(createContactSchema(t)),
  });

  const onSubmit = async () => {
    setSending(true);
    await new Promise((r) => setTimeout(r, 1000));
    toast.success(t('contact.successMessage'));
    reset();
    setSending(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
      className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-16"
    >
      <div className="text-center mb-10">
        <h1 className="text-3xl lg:text-4xl font-bold font-cairo text-gray-900 mb-3">
          {t('contact.title')}
        </h1>
        <p className="text-sm lg:text-base text-gray-500 font-cairo max-w-lg mx-auto">
          {t('contact.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-soft space-y-4">
            <Input label={t('contact.nameLabel')} placeholder={t('contact.namePlaceholder')} error={errors.name?.message} {...register('name')} />
            <Input label={t('contact.emailLabel')} placeholder={t('contact.emailPlaceholder')} error={errors.email?.message} type="email" {...register('email')} />
            <Input label={t('contact.subjectLabel')} placeholder={t('contact.subjectPlaceholder')} error={errors.subject?.message} {...register('subject')} />
            <Textarea label={t('contact.messageLabel')} placeholder={t('contact.messagePlaceholder')} rows={5} error={errors.message?.message} {...register('message')} />
            <Button type="submit" variant="secondary" size="lg" fullWidth rounded="xl" loading={sending}>
              <Send className="w-4 h-4" /> {t('contact.sendButton')}
            </Button>
          </form>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-5"
        >
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-soft">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-secondary/10 text-secondary">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold font-cairo text-gray-900">{t('nav.email')}</p>
                <a href="mailto:info@nawaeg.com" className="text-xs text-secondary font-cairo hover:underline">info@nawaeg.com</a>
              </div>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent/10 text-accent">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold font-cairo text-gray-900">{t('nav.phone')}</p>
                <a href="tel:+201234567890" className="text-xs text-secondary font-cairo hover:underline" dir="ltr">+20 123 456 7890</a>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-success/10 text-success">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold font-cairo text-gray-900">{t('nav.address')}</p>
                <p className="text-xs text-gray-500 font-cairo">{t('contact.addressValue')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-soft">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500">
                <Clock className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold font-cairo text-gray-900">{t('nav.workingHours')}</p>
            </div>
            <div className="space-y-2 text-xs font-cairo text-gray-500">
              <div className="flex justify-between"><span>{t('nav.satThu')}</span><span>{t('contact.satThuHours')}</span></div>
              <div className="flex justify-between"><span>{t('nav.fri')}</span><span>{t('contact.friHours')}</span></div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
