import { useEffect, useState, useRef, useCallback } from 'react';
import { Search, Clock, TrendingUp, Package, Grid3X3, X } from 'lucide-react';
import { cn } from '@/utils';
import { products, categories, brands } from '@/data';
import { useLocalStorage } from '@/hooks';

interface SearchSuggestionsProps {
  query: string;
  onSelect: (text: string) => void;
  onClose: () => void;
  standalone?: boolean;
}

const popularSearches = [
  'هواتف ذكية',
  'لاب توب',
  'سماعات',
  'ساعات',
  'حقائب',
];

export function SearchSuggestions({ query, onSelect, onClose, standalone }: SearchSuggestionsProps) {
  const [recentSearches, setRecentSearches] = useLocalStorage<string[]>('recent-searches', []);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const listRef = useRef<HTMLDivElement>(null);

  const searchLower = query.toLowerCase().trim();

  const productSuggestions = searchLower
    ? products
        .filter(
          (p) =>
            p.name.toLowerCase().includes(searchLower) ||
            p.tags.some((t) => t.toLowerCase().includes(searchLower))
        )
        .slice(0, 5)
    : [];

  const categorySuggestions = searchLower
    ? categories.filter((c) => c.name.toLowerCase().includes(searchLower)).slice(0, 3)
    : [];

  const showRecent = !searchLower && recentSearches.length > 0;
  const showPopular = !searchLower && recentSearches.length === 0;
  const showSuggestions = searchLower && (productSuggestions.length > 0 || categorySuggestions.length > 0);

  const removeRecent = useCallback(
    (e: React.MouseEvent, text: string) => {
      e.stopPropagation();
      setRecentSearches((prev) => prev.filter((s) => s !== text));
    },
    [setRecentSearches]
  );

  const handleSelect = useCallback(
    (text: string) => {
      setRecentSearches((prev) => {
        const filtered = prev.filter((s) => s !== text);
        return [text, ...filtered].slice(0, 5);
      });
      onSelect(text);
    },
    [onSelect, setRecentSearches]
  );

  useEffect(() => {
    setSelectedIndex(-1);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const items: string[] = [];
      if (showRecent) items.push(...recentSearches);
      else if (showPopular) items.push(...popularSearches);
      else if (showSuggestions) {
        items.push(
          ...productSuggestions.map((p) => p.name),
          ...categorySuggestions.map((c) => c.name)
        );
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, items.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, -1));
      } else if (e.key === 'Enter' && selectedIndex >= 0 && items[selectedIndex]) {
        e.preventDefault();
        handleSelect(items[selectedIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showRecent, showPopular, showSuggestions, recentSearches, productSuggestions, categorySuggestions, selectedIndex, handleSelect]);

  return (
    <div
      ref={listRef}
      className={cn(
        'animate-fade-in-up',
        standalone
          ? 'bg-transparent'
          : 'absolute top-full right-0 left-0 mt-2 bg-white dark:bg-dark-card rounded-2xl shadow-soft-xl border border-gray-100 dark:border-dark-border overflow-hidden z-50'
      )}
    >
      {/* Recent Searches */}
      {showRecent && (
        <div className="p-2">
          <div className="flex items-center gap-1.5 px-3 py-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-bold font-cairo text-gray-400 dark:text-dark-muted">
              عمليات البحث الأخيرة
            </span>
          </div>
          {recentSearches.map((text, idx) => (
            <button
              key={text}
              onClick={() => handleSelect(text)}
              className={cn(
                'flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-sm font-cairo text-gray-700 dark:text-dark-muted hover:bg-gray-50 dark:hover:bg-dark-border/50 transition-colors text-right',
                selectedIndex === idx && 'bg-gray-50 dark:bg-dark-border/50'
              )}
            >
              <span>{text}</span>
              <button
                onClick={(e) => removeRecent(e, text)}
                className="p-0.5 rounded text-gray-300 hover:text-gray-500 transition-colors"
                aria-label={`حذف ${text}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </button>
          ))}
        </div>
      )}

      {/* Popular Searches */}
      {showPopular && (
        <div className="p-2">
          <div className="flex items-center gap-1.5 px-3 py-2">
            <TrendingUp className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-bold font-cairo text-gray-400 dark:text-dark-muted">
              الأكثر بحثاً
            </span>
          </div>
          {popularSearches.map((text, idx) => (
            <button
              key={text}
              onClick={() => handleSelect(text)}
              className={cn(
                'flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm font-cairo text-gray-700 dark:text-dark-muted hover:bg-gray-50 dark:hover:bg-dark-border/50 transition-colors text-right',
                selectedIndex === idx && 'bg-gray-50 dark:bg-dark-border/50'
              )}
            >
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              {text}
            </button>
          ))}
        </div>
      )}

      {/* Search Suggestions */}
      {showSuggestions && (
        <div className="p-2">
          {productSuggestions.length > 0 && (
            <>
              <div className="flex items-center gap-1.5 px-3 py-2">
                <Package className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-bold font-cairo text-gray-400 dark:text-dark-muted">
                  منتجات
                </span>
              </div>
              {productSuggestions.map((product, idx) => (
                <button
                  key={product.id}
                  onClick={() => handleSelect(product.name)}
                  className={cn(
                    'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-cairo text-gray-700 dark:text-dark-muted hover:bg-gray-50 dark:hover:bg-dark-border/50 transition-colors text-right',
                    selectedIndex === idx && 'bg-gray-50 dark:bg-dark-border/50'
                  )}
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-dark-border/50 overflow-hidden shrink-0">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-dark-text truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-dark-muted">
                      {categories.find((c) => c.id === product.category)?.name}
                    </p>
                  </div>
                </button>
              ))}
            </>
          )}

          {categorySuggestions.length > 0 && (
            <>
              <div className="flex items-center gap-1.5 px-3 py-2 mt-1">
                <Grid3X3 className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-bold font-cairo text-gray-400 dark:text-dark-muted">
                  أقسام
                </span>
              </div>
              {categorySuggestions.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleSelect(cat.name)}
                  className={cn(
                    'flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm font-cairo text-gray-700 dark:text-dark-muted hover:bg-gray-50 dark:hover:bg-dark-border/50 transition-colors text-right'
                  )}
                >
                  <Grid3X3 className="w-4 h-4 text-gray-400 shrink-0" />
                  {cat.name}
                </button>
              ))}
            </>
          )}
        </div>
      )}

      {!showRecent && !showPopular && !showSuggestions && searchLower && (
        <div className="px-3 py-6 text-center text-sm text-gray-400 dark:text-dark-muted font-cairo">
          لا توجد نتائج لـ &quot;{query}&quot;
        </div>
      )}
    </div>
  );
}
