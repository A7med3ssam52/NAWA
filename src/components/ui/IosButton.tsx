import { cn } from '@/utils';
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

interface IosButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const IosButton = forwardRef<HTMLButtonElement, IosButtonProps>(
  ({
    className,
    variant = 'primary',
    size = 'md',
    loading,
    disabled,
    children,
    ...props
  }, ref) => {
    const sizes = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-5 py-2.5 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    const variants = {
      primary: 'ios-button-primary',
      secondary: 'ios-button-secondary',
      ghost: 'ios-button-ghost',
      outline: 'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'ios-button-touch',
          'font-semibold',
          'transition-all duration-200',
          'focus:outline-none',
          'focus:ring-2 focus:ring-black/20',
          sizes[size],
          variants[variant],
          (disabled || loading) && 'opacity-50 cursor-not-allowed',
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

IosButton.displayName = 'IosButton';