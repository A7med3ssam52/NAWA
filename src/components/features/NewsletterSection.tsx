import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Mail } from 'lucide-react';
import { Input, Button } from '@/components/ui';
import toast from 'react-hot-toast';

export function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    toast.success('تم الاشتراك في النشرة البريدية بنجاح!');
    setEmail('');
    setLoading(false);
  };

  return (
    <section dir="rtl" className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-secondary via-secondary/80 to-accent">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03]" aria-hidden="true">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.5 }}
        className="relative z-10 px-6 py-12 lg:py-16 lg:px-16 text-center"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm mb-5">
            <Mail className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl lg:text-3xl font-bold font-cairo text-white mb-2">
            اشترك في النشرة البريدية
          </h2>
          <p className="text-base text-white/80 font-cairo max-w-lg mx-auto mb-6">
            كن أول من يعرف عن أحدث المنتجات والعروض الحصرية والتخفيضات الكبيرة
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2 }}
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row items-center gap-3 max-w-md mx-auto"
        >
          <div className="w-full sm:flex-1">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="أدخل بريدك الإلكتروني"
              className="bg-white/90 dark:bg-dark-card/90 border-white/20 text-gray-900 dark:text-dark-text placeholder-gray-400 h-12"
              dir="rtl"
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            rounded="xl"
            loading={loading}
            className="bg-white dark:bg-dark-card text-secondary hover:bg-white/90 dark:hover:bg-dark-card/90 shadow-lg whitespace-nowrap h-12"
          >
            <Send className="w-4 h-4" />
            اشتراك
          </Button>
        </motion.form>
      </motion.div>
    </section>
  );
}
