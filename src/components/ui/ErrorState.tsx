import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '@/utils';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'عذراً، حدث خطأ ما',
  description = 'نواجه بعض المشاكل في تحميل هذه البيانات. يرجى المحاولة مرة أخرى.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex flex-col items-center justify-center py-16 px-6 text-center',
        className
      )}
      role="alert"
    >
      <div className="mb-4 p-4 rounded-full bg-danger/10">
        <AlertTriangle className="w-10 h-10 text-danger" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-dark-text font-cairo mb-2">
        {title}
      </h3>
      <p className="text-sm text-gray-500 dark:text-dark-muted font-cairo max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="secondary" size="md">
          <RefreshCw className="w-4 h-4 ml-1.5" />
          إعادة المحاولة
        </Button>
      )}
    </motion.div>
  );
}
