import { cn } from '@/utils';
import { forwardRef } from 'react';

interface IosCardProps {
  children: React.ReactNode;
  className?: string;
  onPress?: () => void;
  disabled?: boolean;
}

export const IosCard = forwardRef<HTMLDivElement, IosCardProps>(
  ({ children, className, onPress, disabled }, ref) => {
    return (
      <div
        ref={ref}
        onClick={onPress}
        className={cn(
          'ios-card',
          disabled && 'opacity-50',
          onPress && 'active:bg-gray-50 dark:active:bg-gray-800 transition-colors',
          className
        )}
      >
        {children}
      </div>
    );
  }
);

IosCard.displayName = 'IosCard';