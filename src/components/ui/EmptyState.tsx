import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        'flex flex-col items-center justify-center py-16 px-6 text-center',
        className
      )}
      role="status"
    >
      {icon && (
        <div className="mb-4 text-gray-300 dark:text-dark-border">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-bold text-gray-900 dark:text-dark-text font-cairo mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-gray-500 dark:text-dark-muted font-cairo max-w-sm mb-6 leading-relaxed">
          {description}
        </p>
      )}
      {action && (
        <Button onClick={action.onClick} variant="secondary" size="md">
          {action.label}
        </Button>
      )}
    </motion.div>
  );
}
