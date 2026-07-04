import { useEffect, useRef, useState, useCallback } from 'react';
import { Search, ArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '@/hooks';
import { PAGES } from '@/constants';
import { SearchSuggestions } from './SearchSuggestions';

interface MobileSearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export function MobileSearchOverlay({ isOpen, onClose, initialQuery = '' }: MobileSearchOverlayProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState(initialQuery);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery);
      setShowSuggestions(true);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, initialQuery]);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setShowSuggestions(false);
    }
  }, [isOpen]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`${PAGES.SEARCH}?q=${encodeURIComponent(query.trim())}`);
      onClose();
    }
  }, [query, navigate, onClose]);

  const handleSelect = useCallback((text: string) => {
    navigate(`${PAGES.SEARCH}?q=${encodeURIComponent(text)}`);
    onClose();
  }, [navigate, onClose]);

  const handleClear = useCallback(() => {
    setQuery('');
    inputRef.current?.focus();
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-white/95 dark:bg-dark-bg/98 backdrop-blur-2xl animate-fade-in"
    >
      {/* Header with search input */}
      <div className="shrink-0 px-3 pt-12 pb-2">
        <div className="relative flex items-center gap-2">
          <button
            onClick={onClose}
            className="shrink-0 p-2 -mr-1 rounded-xl text-gray-500 dark:text-dark-muted hover:bg-gray-100 dark:hover:bg-dark-border/50 transition-colors active:scale-90"
            aria-label="إغلاق"
          >
            <ArrowRight className="w-5 h-5" />
          </button>

          <form onSubmit={handleSubmit} className="flex-1">
            <div className="relative">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="ابحث عن منتجات..."
                className="w-full h-11 pr-10 pl-10 text-sm font-cairo bg-gray-100 dark:bg-dark-border/50 border-2 border-transparent focus:border-secondary/40 rounded-2xl text-gray-900 dark:text-dark-text placeholder-gray-400 dark:placeholder-dark-muted focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all"
                dir="rtl"
              />
              {query && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-dark-text hover:bg-gray-200 dark:hover:bg-dark-border transition-colors"
                  aria-label="مسح"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Suggestions */}
      <div className="flex-1 overflow-y-auto px-3 pb-6">
        {showSuggestions && (
          <div className="pt-3 animate-fade-in-up">
            <SearchSuggestions
              query={debouncedQuery}
              onSelect={handleSelect}
              onClose={onClose}
              standalone
            />
          </div>
        )}
      </div>
    </div>
  );
}
