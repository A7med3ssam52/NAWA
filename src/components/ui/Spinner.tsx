import { Loader2 } from 'lucide-react';
import { cn } from '@/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizes = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <Loader2
      className={cn('animate-spin text-secondary', sizes[size], className)}
      role="status"
      aria-label="جار التحميل"
    />
  );
}

export function PageSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Spinner size="xl" />
    </div>
  );
}
