import { type HTMLAttributes } from 'react';
import { cn } from '@/utils';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'danger' | 'warning' | 'info' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
}

const variantStyles = {
  success:
    'bg-success/10 text-success dark:bg-success/20 border-success/20',
  danger:
    'bg-danger/10 text-danger dark:bg-danger/20 border-danger/20',
  warning:
    'bg-accent/10 text-accent dark:bg-accent/20 border-accent/20',
  info:
    'bg-secondary/10 text-secondary dark:bg-secondary/20 border-secondary/20',
  secondary:
    'bg-gray-100 text-gray-600 dark:bg-dark-border/50 dark:text-dark-muted border-gray-200 dark:border-dark-border',
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

const dotColors = {
  success: 'bg-success',
  danger: 'bg-danger',
  warning: 'bg-accent',
  info: 'bg-secondary',
  secondary: 'bg-gray-400 dark:bg-dark-muted',
};

export function Badge({
  className,
  variant = 'secondary',
  size = 'md',
  dot,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-cairo font-medium rounded-full border transition-colors duration-200',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant])}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
