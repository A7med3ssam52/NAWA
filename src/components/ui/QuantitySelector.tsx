import { type HTMLAttributes } from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/utils';

interface QuantitySelectorProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

const sizes = {
  sm: { button: 'p-1', icon: 'w-3.5 h-3.5', text: 'w-8 text-sm', gap: 'gap-0' },
  md: { button: 'p-1.5', icon: 'w-4 h-4', text: 'w-10 text-base', gap: 'gap-0' },
  lg: { button: 'p-2', icon: 'w-5 h-5', text: 'w-12 text-lg', gap: 'gap-0' },
};

export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 99,
  size = 'md',
  disabled,
  className,
  ...props
}: QuantitySelectorProps) {
  const s = sizes[size];

  return (
    <div
      className={cn(
        'inline-flex items-center border border-gray-200 dark:border-dark-border rounded-xl overflow-hidden bg-white dark:bg-dark-card',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      dir="ltr"
      {...props}
    >
      <button
        type="button"
        onClick={() => onChange(Math.min(value + 1, max))}
        disabled={disabled || value >= max}
        className={cn(
          s.button,
          'text-gray-600 dark:text-dark-muted hover:bg-gray-100 dark:hover:bg-dark-border transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
        )}
        aria-label="زيادة الكمية"
      >
        <Plus className={s.icon} />
      </button>
      <span
        className={cn(
          s.text,
          'text-center font-semibold text-gray-900 dark:text-dark-text font-cairo select-none'
        )}
        aria-live="polite"
        aria-label={`الكمية: ${value}`}
      >
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.max(value - 1, min))}
        disabled={disabled || value <= min}
        className={cn(
          s.button,
          'text-gray-600 dark:text-dark-muted hover:bg-gray-100 dark:hover:bg-dark-border transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
        )}
        aria-label="تقليل الكمية"
      >
        <Minus className={s.icon} />
      </button>
    </div>
  );
}
