import { type ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: ReactNode;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav className={cn('flex items-center gap-1', className)} aria-label="مسار التنقل" dir="rtl">
      <ol className="flex items-center gap-1 flex-wrap">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={idx} className="flex items-center gap-1">
              {idx > 0 && (
                <ChevronLeft className="w-4 h-4 text-gray-400 shrink-0" aria-hidden="true" />
              )}
              {item.href && !isLast ? (
                <a
                  href={item.href}
                  className={cn(
                    'inline-flex items-center gap-1 text-sm font-cairo transition-colors',
                    'text-gray-500 hover:text-secondary'
                  )}
                >
                  {item.icon}
                  {item.label}
                </a>
              ) : (
                <span
                  className={cn(
                    'inline-flex items-center gap-1 text-sm font-cairo',
                    isLast
                      ? 'text-gray-900 font-semibold'
                      : 'text-gray-500'
                  )}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.icon}
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
