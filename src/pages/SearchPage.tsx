import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { useProducts } from '@/api';
import { useDebounce } from '@/hooks';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { PAGE_SIZE } from '@/constants';
import { ProductGrid } from '@/components/features/ProductGrid';
import { SearchSuggestions } from '@/components/features/SearchSuggestions';
import { Pagination, Input } from '@/components/ui';

export function SearchPage() {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const [query, setQuery] = useState(queryParam);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches] = useLocalStorage<string[]>('recent-searches', []);
  const debouncedQuery = useDebounce(query, 300);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, error, refetch } = useProducts({
    search: debouncedQuery,
    page: 1,
    pageSize: PAGE_SIZE,
  });

  useEffect(() => {
    if (debouncedQuery) {
      setSearchParams({ q: debouncedQuery }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  }, [debouncedQuery, setSearchParams]);

  const handleSearch = (text: string) => {
    setQuery(text);
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12"
    >
      <h1 className="text-2xl lg:text-3xl font-bold font-cairo text-gray-900 mb-6">
        {t('search.title')}
      </h1>

      <div className="relative max-w-2xl mx-auto mb-8">
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={t('common.searchPlaceholder')}
            className="pr-12 pl-10 h-12 text-base"
          />
          {query && (
            <button
              onClick={handleClear}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
              aria-label={t('nav.clearSearch')}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {showSuggestions && (
          <SearchSuggestions query={query} onSelect={handleSearch} onClose={() => setShowSuggestions(false)} />
        )}
      </div>

      {debouncedQuery && data && (
        <p className="text-sm text-gray-500 font-cairo mb-4 text-center">
          {data.total} نتيجة لـ &quot;{debouncedQuery}&quot;
        </p>
      )}

      <ProductGrid
        items={data?.items || []}
        loading={isLoading}
        error={error}
        onRetry={refetch}
      />
    </motion.div>
  );
}
