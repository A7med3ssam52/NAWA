import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ currentPage, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | 'dots')[] = [];
  const delta = 1;

  const rangeStart = Math.max(2, currentPage - delta);
  const rangeEnd = Math.min(totalPages - 1, currentPage + delta);

  pages.push(1);
  if (rangeStart > 2) pages.push('dots');
  for (let i = rangeStart; i <= rangeEnd; i++) pages.push(i);
  if (rangeEnd < totalPages - 1) pages.push('dots');
  if (totalPages > 1) pages.push(totalPages);

  const btnBase =
    'inline-flex items-center justify-center w-9 h-9 rounded-lg text-sm font-cairo font-medium transition-all duration-200';

  return (
    <nav className={cn('flex items-center justify-center gap-1', className)} aria-label="التنقل بين الصفحات" dir="rtl">
      <button
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        className={cn(btnBase, 'text-gray-400 hover:text-gray-600 dark:hover:text-dark-text disabled:opacity-30 disabled:cursor-not-allowed')}
        aria-label="الصفحة الأولى"
      >
        <ChevronsRight className="w-4 h-4" />
      </button>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={cn(btnBase, 'text-gray-400 hover:text-gray-600 dark:hover:text-dark-text disabled:opacity-30 disabled:cursor-not-allowed')}
        aria-label="الصفحة السابقة"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {pages.map((page, idx) =>
        page === 'dots' ? (
          <span key={`dots-${idx}`} className={cn(btnBase, 'text-gray-400 dark:text-dark-muted cursor-default')}>
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={cn(
              btnBase,
              page === currentPage
                ? 'bg-secondary text-white shadow-md shadow-secondary/20'
                : 'text-gray-600 dark:text-dark-muted hover:bg-gray-100 dark:hover:bg-dark-border'
            )}
            aria-current={page === currentPage ? 'page' : undefined}
            aria-label={`الصفحة ${page}`}
          >
            {page}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={cn(btnBase, 'text-gray-400 hover:text-gray-600 dark:hover:text-dark-text disabled:opacity-30 disabled:cursor-not-allowed')}
        aria-label="الصفحة التالية"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <button
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        className={cn(btnBase, 'text-gray-400 hover:text-gray-600 dark:hover:text-dark-text disabled:opacity-30 disabled:cursor-not-allowed')}
        aria-label="آخر صفحة"
      >
        <ChevronsLeft className="w-4 h-4" />
      </button>
    </nav>
  );
}
