import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'ghost' | 'outline' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  fullWidth?: boolean;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const variants = {
  primary: 'bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-95 ios-touch-feedback',
  secondary: 'bg-secondary text-accent hover:bg-secondary/90 shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/25 active:scale-95 ios-touch-feedback',
  accent: 'bg-accent text-white hover:bg-accent/90 shadow-lg shadow-accent/20 hover:shadow-accent/30 active:scale-95 ios-touch-feedback',
  danger: 'bg-danger text-white hover:bg-danger/90 shadow-lg shadow-danger/20 active:scale-95 ios-touch-feedback',
  ghost: 'bg-transparent text-primary hover:bg-gray-100 ios-touch-feedback',
  outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white active:scale-95 ios-touch-feedback',
  success: 'bg-success text-white hover:bg-success/90 shadow-lg shadow-success/20 active:scale-95 ios-touch-feedback',
};

const sizes = {
  sm: 'py-2 px-3 text-xs gap-1.5',
  md: 'py-3 px-5 text-sm gap-2',
  lg: 'py-4 px-7 text-base gap-2.5',
  xl: 'py-5 px-9 text-lg gap-3',
};

const rounded = {
  sm: 'rounded-lg',
  md: 'rounded-xl',
  lg: 'rounded-2xl',
  xl: 'rounded-3xl',
  full: 'rounded-full',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, fullWidth, rounded: r = 'xl', children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-cairo font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-secondary/40 ios-button-touch',
          variants[variant],
          sizes[size],
          rounded[r],
          fullWidth && 'w-full',
          (disabled || loading) && 'opacity-50 cursor-not-allowed pointer-events-none',
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

Button.displayName = 'Button';
