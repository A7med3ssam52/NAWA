import { cn } from '@/utils';

interface DividerProps {
  text?: string;
  className?: string;
}

export function Divider({ text, className }: DividerProps) {
  if (text) {
    return (
      <div className={cn('flex items-center gap-3', className)} dir="rtl">
        <span className="flex-1 h-px bg-gray-200 dark:bg-dark-border" />
        <span className="text-xs text-gray-400 dark:text-dark-muted font-cairo whitespace-nowrap">
          {text}
        </span>
        <span className="flex-1 h-px bg-gray-200 dark:bg-dark-border" />
      </div>
    );
  }

  return (
    <hr
      className={cn('h-px border-0 bg-gray-200 dark:bg-dark-border', className)}
    />
  );
}
