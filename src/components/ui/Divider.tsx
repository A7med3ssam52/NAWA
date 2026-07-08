import { cn } from '@/utils';

interface DividerProps {
  text?: string;
  className?: string;
}

export function Divider({ text, className }: DividerProps) {
  if (text) {
    return (
      <div className={cn('flex items-center gap-3', className)} dir="rtl">
        <span className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400 font-cairo whitespace-nowrap">
          {text}
        </span>
        <span className="flex-1 h-px bg-gray-200" />
      </div>
    );
  }

  return (
    <hr
      className={cn('h-px border-0 bg-gray-200', className)}
    />
  );
}
