import { type SelectHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/utils';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder = 'اختر...', id, dir = 'rtl', ...props }, ref) => {
    const selectId = id || label?.replace(/\s+/g, '-').toLowerCase();

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-dark-text font-cairo"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            dir={dir}
            className={cn(
              'w-full px-4 py-2.5 text-sm font-cairo appearance-none transition-all duration-200',
              'bg-white dark:bg-dark-card border rounded-xl',
              'text-gray-900 dark:text-dark-text',
              'focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-dark-border/30',
              error
                ? 'border-danger focus:ring-danger/30 focus:border-danger'
                : 'border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-gray-600',
              props.value ? 'text-gray-900 dark:text-dark-text' : 'text-gray-400 dark:text-dark-muted',
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${selectId}-error` : undefined}
            {...props}
          >
            <option value="" disabled>
              {placeholder}
            </option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="text-gray-900 dark:bg-dark-card">
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
        </div>
        {error && (
          <p
            id={`${selectId}-error`}
            role="alert"
            className="mt-1.5 text-xs text-danger font-cairo"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
