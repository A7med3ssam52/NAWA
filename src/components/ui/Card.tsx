import { type ReactNode, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils';

interface CardProps {
  glass?: boolean;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  children?: ReactNode;
}

const paddings = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, glass, hover, padding = 'md', children }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        whileHover={hover ? { y: -4, transition: { duration: 0.2 } } : undefined}
        className={cn(
          'rounded-2xl border transition-all duration-300',
          glass
            ? 'bg-white/70 backdrop-blur-xl border-white/20 shadow-soft'
            : 'bg-white border-gray-100 shadow-soft hover:shadow-soft-lg',
          hover && 'cursor-pointer',
          paddings[padding],
          className
        )}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';
