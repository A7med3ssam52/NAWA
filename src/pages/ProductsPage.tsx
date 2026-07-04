import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProducts } from '@/api';
import { SORT_OPTIONS, PAGE_SIZE } from '@/constants';
import type { FilterState } from '@/types';
import { ProductGrid } from '@/components/features/ProductGrid';
import { FilterSidebar } from '@/components/features/FilterSidebar';
import { Pagination, Select } from '@/components/ui';

const defaultFilters: FilterState = {
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
  pageSize: PAGE_SIZE,
};

export function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<FilterState>(() => ({
    ...defaultFilters,
    search: searchParams.get('search') || '',
    sort: searchParams.get('sort') || 'newest',
    page: Number(searchParams.get('page')) || 1,
  }));

  useEffect(() => {
    const params: Record<string, string> = {};
    if (filters.search) params.search = filters.search;
    if (filters.sort !== 'newest') params.sort = filters.sort;
    if (filters.page > 1) params.page = String(filters.page);
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  const { data, isLoading, error, refetch } = useProducts(filters);

  const handleFilterChange = useCallback((newFilters: FilterState) => {
    setFilters({ ...newFilters, page: 1 });
  }, []);

  const handleSortChange = useCallback((sort: string) => {
    setFilters((prev) => ({ ...prev, sort, page: 1 }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const totalPages = data?.totalPages || 1;

  return (
    <div dir="rtl" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 animate-fade-in-up"
    >
      <div className="flex items-center justify-between mb-6 lg:mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold font-cairo text-gray-900 dark:text-dark-text">
          جميع المنتجات
        </h1>
        <div className="w-48">
          <Select
            options={SORT_OPTIONS}
            value={filters.sort}
            onChange={(e) => handleSortChange(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        <FilterSidebar filters={filters} onFilterChange={handleFilterChange} />

        <div className="flex-1 min-w-0">

          {data && (
            <p className="text-sm text-gray-500 dark:text-dark-muted font-cairo mb-4">
              {data.total} منتج
            </p>
          )}

          <ProductGrid
            items={data?.items || []}
            loading={isLoading}
            error={error}
            onRetry={refetch}
          />

          {totalPages > 1 && (
            <div className="mt-8 lg:mt-10">
              <Pagination
                currentPage={filters.page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
