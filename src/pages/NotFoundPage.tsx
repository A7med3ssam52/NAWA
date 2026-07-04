import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      dir="rtl"
      className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center"
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h1 className="text-8xl lg:text-9xl font-bold font-cairo text-gray-200 dark:text-dark-border leading-none mb-4">
          404
        </h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="w-16 h-1 bg-secondary rounded-full mx-auto mb-6" />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-xl lg:text-2xl font-bold font-cairo text-gray-900 dark:text-dark-text mb-3"
      >
        عذراً، الصفحة غير موجودة
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-sm text-gray-500 dark:text-dark-muted font-cairo max-w-md mb-8"
      >
        الصفحة التي تبحث عنها قد تكون تم نقلها أو حذفها أو أنها غير متوفرة حالياً
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Button variant="secondary" size="lg" rounded="xl" onClick={() => navigate('/')}>
          <ArrowLeft className="w-5 h-5" />
          العودة إلى الرئيسية
        </Button>
      </motion.div>
    </motion.div>
  );
}
