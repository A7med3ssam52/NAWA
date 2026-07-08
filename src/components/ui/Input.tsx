import { type InputHTMLAttributes, forwardRef } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/utils';
import { AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, dir = 'rtl', icon: Icon, ...props }, ref) => {
    const { t, i18n } = useTranslation();
    const inputId = id || label?.replace(/\s+/g, '-').toLowerCase();

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block mb-1.5 text-sm font-medium text-gray-700 font-cairo ios-touch-feedback"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-3 pointer-events-none">
              <Icon className="w-4 h-4 text-gray-400 ios-touch-feedback" />
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            dir={dir}
            className={cn(
              'w-full px-3 sm:px-4 py-3 sm:py-2.5 text-base sm:text-sm font-cairo transition-all duration-200 ios-button-touch',
              'bg-gray-100 border border-transparent focus:border-blue-500/30 rounded-xl',
              'text-gray-900 placeholder-gray-400',
              'focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50',
              Icon && 'pr-9 sm:pr-10',
              error
                ? 'border-red-500 focus:ring-red-500/30 focus:border-red-500'
                : 'border-gray-200 hover:border-gray-300',
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : undefined}
            {...props}
          />
          {error && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none ios-touch-feedback">
              <AlertCircle className="w-4 h-4 text-red-500" />
            </div>
          )}
        </div>
        {error && (
          <p
            id={`${inputId}-error`}
            role="alert"
            className="mt-1.5 text-xs text-red-500 font-cairo flex items-center gap-1 ios-touch-feedback"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
