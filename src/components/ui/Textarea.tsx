import { type TextareaHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/utils';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, dir = 'rtl', ...props }, ref) => {
    const textareaId = id || label?.replace(/\s+/g, '-').toLowerCase();

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-dark-text font-cairo"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          dir={dir}
          className={cn(
            'w-full px-4 py-2.5 text-sm font-cairo transition-all duration-200 resize-y min-h-[100px]',
            'bg-white dark:bg-dark-card border rounded-xl',
            'text-gray-900 dark:text-dark-text placeholder-gray-400 dark:placeholder-dark-muted',
            'focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-dark-border/30',
            error
              ? 'border-danger focus:ring-danger/30 focus:border-danger'
              : 'border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-gray-600',
            className
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${textareaId}-error` : undefined}
          {...props}
        />
        {error && (
          <p
            id={`${textareaId}-error`}
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

Textarea.displayName = 'Textarea';
