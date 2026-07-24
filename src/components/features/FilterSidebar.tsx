import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  SlidersHorizontal,
  Star,
  ChevronDown,
  RotateCcw,
  Check,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/utils';
import { FadeInView } from '@/components/ui';
import type { FilterState } from '@/types';
import { categories, brands } from '@/data';
import { useMediaQuery } from '@/hooks';
import { Button, Input, Drawer } from '@/components/ui';

interface FilterSidebarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  className?: string;
}

const discountValues = [10, 20, 30, 50];

const ratingOptions = [4, 3, 2, 1];

function FilterCheckbox({ checked, onChange, label, count }: {
  checked: boolean; onChange: () => void; label: string; count?: number;
}) {
  return (
    <label className="flex items-center gap-2.5 px-1 py-1.5 cursor-pointer group">
      <div
        className={cn(
          'w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all duration-200 shrink-0',
          checked
            ? 'bg-secondary border-secondary text-white shadow-sm shadow-black/20'
            : 'border-gray-300 group-hover:border-gray-400',
        )}
      >
        {checked && (
          <div className="animate-scale-in">
            <Check className="w-3.5 h-3.5" />
          </div>
        )}
      </div>
      <span className="text-sm font-cairo text-gray-700 group-hover:text-gray-900 transition-colors flex-1">
        {label}
      </span>
      {count !== undefined && (
        <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{count}</span>
      )}
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" aria-label={label} />
    </label>
  );
}

export function FilterSidebar({ filters, onFilterChange, className }: FilterSidebarProps) {
  const { t, i18n } = useTranslation();
  const isMobile = useMediaQuery('(max-width: 1023px)');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['category', 'brand', 'price', 'rating', 'discount'])
  );

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  };

  const updateFilter = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    const updated = { ...localFilters, [key]: value, page: 1 };
    setLocalFilters(updated);
    onFilterChange(updated);
  };

  const toggleArrayFilter = (key: 'category' | 'brand', value: string) => {
    const current = localFilters[key];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    updateFilter(key, updated);
  };

  const clearFilters = () => {
    const cleared: FilterState = {
      category: [],
      brand: [],
      priceMin: 0,
      priceMax: 0,
      rating: null,
      discount: null,
      inStock: false,
      sort: 'newest',
      search: '',
      page: 1,
      pageSize: 12,
    };
    setLocalFilters(cleared);
    onFilterChange(cleared);
  };

  const hasActiveFilters =
    localFilters.category.length > 0 ||
    localFilters.brand.length > 0 ||
    localFilters.priceMin > 0 ||
    localFilters.priceMax > 0 ||
    localFilters.rating !== null ||
    localFilters.discount !== null ||
    localFilters.inStock;

  const activeCount = [
    localFilters.category.length,
    localFilters.brand.length,
    localFilters.priceMin > 0 || localFilters.priceMax > 0 ? 1 : 0,
    localFilters.rating !== null ? 1 : 0,
    localFilters.discount !== null ? 1 : 0,
    localFilters.inStock ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const discountOptions = discountValues.map((v) => ({
    value: v,
    label: t('products.filterMinDiscount', { value: v }),
  }));

  const FilterContent = () => (
    <div className="space-y-1" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-secondary/10">
            <SlidersHorizontal className="w-5 h-5 text-secondary" />
          </div>
          <div>
            <span className="text-base font-bold font-cairo text-gray-900">{t('products.filters')}</span>
            {hasActiveFilters && (
              <span className="text-xs text-gray-400 font-cairo mr-2">
                ({t('products.activeCount', { count: activeCount })})
              </span>
            )}
          </div>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs font-medium font-cairo text-danger hover:text-danger/80 transition-all hover:underline underline-offset-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {t('products.reset')}
          </button>
        )}
      </div>

      {/* القسم */}
      <FilterSection
        title={t('products.category').replace(':', '')}
        section="category"
        expanded={expandedSections.has('category')}
        onToggle={() => toggleSection('category')}
      >
        <div className="space-y-0.5">
          {categories.map((cat) => (
            <FilterCheckbox
              key={cat.id}
              checked={localFilters.category.includes(cat.id)}
              onChange={() => toggleArrayFilter('category', cat.id)}
              label={cat.name}
              count={cat.productsCount}
            />
          ))}
        </div>
      </FilterSection>

      {/* Brand Filter */}
      <FilterSection
        title={t('products.brand')}
        section="brand"
        expanded={expandedSections.has('brand')}
        onToggle={() => toggleSection('brand')}
      >
        <div className="space-y-0.5 max-h-48 overflow-y-auto scrollbar-thin">
          {brands.map((brand) => (
            <FilterCheckbox
              key={brand.id}
              checked={localFilters.brand.includes(brand.id)}
              onChange={() => toggleArrayFilter('brand', brand.id)}
              label={brand.name}
              count={brand.productsCount}
            />
          ))}
        </div>
      </FilterSection>

      {/* Price Filter */}
      <FilterSection
        title={t('products.priceRange')}
        section="price"
        expanded={expandedSections.has('price')}
        onToggle={() => toggleSection('price')}
      >
        <div className="flex items-center gap-2 px-1">
          <div className="relative flex-1">
            <Input
              type="number"
              value={localFilters.priceMin || ''}
              onChange={(e) => updateFilter('priceMin', Number(e.target.value) || 0)}
              placeholder={t('products.from')}
              dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
              className="text-sm h-10 pr-3"
              min={0}
            />
          </div>
          <div className="w-6 h-px bg-gray-300 shrink-0" />
          <div className="relative flex-1">
            <Input
              type="number"
              value={localFilters.priceMax || ''}
              onChange={(e) => updateFilter('priceMax', Number(e.target.value) || 0)}
              placeholder={t('products.to')}
              dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
              className="text-sm h-10 pr-3"
              min={0}
            />
          </div>
        </div>
      </FilterSection>

      {/* Rating Filter */}
      <FilterSection
        title={t('compare.rating')}
        section="rating"
        expanded={expandedSections.has('rating')}
        onToggle={() => toggleSection('rating')}
      >
        <div className="space-y-0.5">
          {ratingOptions.map((rating) => (
            <button
              key={rating}
              onClick={() => updateFilter('rating', localFilters.rating === rating ? null : rating)}
              className={cn(
                'flex items-center gap-2.5 w-full px-1 py-2 rounded-xl text-sm font-cairo transition-all duration-200 group',
                localFilters.rating === rating
                  ? 'text-accent bg-accent/5'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50',
              )}
            >
              <div className={cn(
                'p-1 rounded-lg transition-colors',
                localFilters.rating === rating ? 'bg-accent/10' : 'group-hover:bg-gray-100',
              )}>
                <div className="flex items-center gap-0.5" dir="ltr">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        'w-4 h-4 transition-all',
                        i < rating
                          ? 'fill-accent text-accent'
                          : 'text-gray-200',
                      )}
                    />
                  ))}
                </div>
              </div>
              <span className="text-xs text-gray-400">{t('products.andAbove')}</span>
              {localFilters.rating === rating && (
                <div className="mr-auto animate-scale-in">
                  <Check className="w-3.5 h-3.5 text-accent" />
                </div>
              )}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Discount Filter */}
      <FilterSection
        title={t('products.discountPercent')}
        section="discount"
        expanded={expandedSections.has('discount')}
        onToggle={() => toggleSection('discount')}
      >
        <div className="space-y-0.5">
          {discountOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => updateFilter('discount', localFilters.discount === option.value ? null : option.value)}
              className={cn(
                'flex items-center gap-2.5 w-full px-1 py-2 rounded-xl text-sm font-cairo transition-all duration-200 group',
                localFilters.discount === option.value
                  ? 'text-success bg-success/5'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50',
              )}
            >
              <div
                className={cn(
                  'w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all shrink-0',
                  localFilters.discount === option.value
                    ? 'bg-success border-success text-white shadow-sm shadow-black/20'
                    : 'border-gray-300 group-hover:border-gray-400',
                )}
              >
                {localFilters.discount === option.value && (
                  <div className="animate-scale-in">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
              {option.label}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* In Stock Filter */}
      <div className="px-1 pt-3 pb-1">
        <FilterCheckbox
          checked={localFilters.inStock}
          onChange={() => updateFilter('inStock', !localFilters.inStock)}
          label={t('products.inStockOnly')}
        />
      </div>

      {/* Mobile Apply Button */}
      {isMobile && (
        <div className="pt-4 sticky bottom-0 bg-white pb-2">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            rounded="xl"
            onClick={() => setDrawerOpen(false)}
          >
            {t('products.applyFilters')}
          </Button>
        </div>
      )}
    </div>
  );

  // Desktop: Inline sidebar
  if (!isMobile) {
    return (
      <div
        className={cn(
          'w-64 shrink-0 bg-white rounded-2xl border border-gray-100 p-4 shadow-soft h-fit sticky top-28',
          className,
        )}
      >
        <FilterContent />
      </div>
    );
  }

  // Mobile: Drawer
  return (
    <>
      <button
        onClick={() => setDrawerOpen(true)}
        className={cn(
          'flex items-center gap-2 px-4 py-2.5 rounded-xl font-cairo text-sm transition-all duration-200',
          hasActiveFilters
            ? 'bg-secondary text-white border-transparent shadow-md shadow-black/20'
            : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:shadow-sm',
          className,
        )}
        aria-label={t('products.openFilters')}
      >
        <SlidersHorizontal className="w-4 h-4" />
        {t('products.filters')}
        {hasActiveFilters && (
          <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-xs font-bold">
            {activeCount}
          </span>
        )}
      </button>

      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={t('products.filters')}
      >
        <FilterContent />
      </Drawer>
    </>
  );
}

// Section sub-component
interface FilterSectionProps {
  title: string;
  section: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function FilterSection({
  title,
  expanded,
  onToggle,
  children,
}: FilterSectionProps) {
  return (
    <div className="border-b border-gray-100 pb-1">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full py-3 px-1 text-sm font-bold font-cairo text-gray-900 hover:text-secondary transition-colors"
        aria-expanded={expanded}
      >
        {title}
        <div className={cn('transition-transform duration-200', expanded && 'rotate-180')}>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
      </button>
      <div
        className={cn(
          'overflow-hidden transition-all duration-200 ease-in-out',
          expanded ? 'max-h-96 opacity-100 pb-3' : 'max-h-0 opacity-0'
        )}
      >
        {children}
      </div>
    </div>
  );
}
