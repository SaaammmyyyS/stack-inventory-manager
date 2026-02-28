import { useState, useCallback, useMemo, useEffect } from 'react';

export interface FilterState {
  search: string;
  category: string;
  stockStatus: 'all' | 'in-stock' | 'low-stock' | 'out-of-stock' | 'overstock';
  priceRange: [number, number] | null;
}

export interface FilterOptions {
  search?: string;
  category?: string;
  stockStatus?: string;
  minPrice?: number;
  maxPrice?: number;
}

const DEFAULT_FILTERS: FilterState = {
  search: '',
  category: 'all',
  stockStatus: 'all',
  priceRange: null
};

export function useFilters(initialFilters: Partial<FilterState> = {}) {
  const [filters, setFilters] = useState<FilterState>({
    ...DEFAULT_FILTERS,
    ...initialFilters
  });

  const [pendingSearch, setPendingSearch] = useState(filters.search);
  const [isSearchPending, setIsSearchPending] = useState(false);

  useEffect(() => {
    setPendingSearch(filters.search);
    setIsSearchPending(false);
  }, [filters.search]);

  const triggerSearch = useCallback(() => {
    setFilters(prev => ({ ...prev, search: pendingSearch }));
    setIsSearchPending(false);
  }, [pendingSearch]);

  const updatePendingSearch = useCallback((value: string) => {
    setPendingSearch(value);
    setIsSearchPending(value.trim() !== '' && value !== filters.search);
  }, [filters.search]);

  const clearPendingSearch = useCallback(() => {
    setPendingSearch(filters.search);
    setIsSearchPending(false);
  }, [filters.search]);

  const updateFilter = useCallback(<K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.search.trim() !== '' ||
      filters.category !== 'all' ||
      filters.stockStatus !== 'all' ||
      filters.priceRange !== null
    );
  }, [filters]);

  const getApiParams = useCallback((): FilterOptions => {
    const params: FilterOptions = {};

    if (filters.search.trim()) {
      params.search = filters.search.trim();
    }

    if (filters.category !== 'all') {
      params.category = filters.category;
    }

    if (filters.stockStatus !== 'all') {
      params.stockStatus = filters.stockStatus;
    }

    if (filters.priceRange) {
      params.minPrice = filters.priceRange[0];
      params.maxPrice = filters.priceRange[1];
    }

    return params;
  }, [filters.search, filters.category, filters.stockStatus, filters.priceRange]);

  const getFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search.trim()) count++;
    if (filters.category !== 'all') count++;
    if (filters.stockStatus !== 'all') count++;
    if (filters.priceRange) count++;
    return count;
  }, [filters]);

  const setFiltersFromParams = useCallback((params: FilterOptions) => {
    setFilters({
      search: params.search || '',
      category: params.category || 'all',
      stockStatus: (params.stockStatus as FilterState['stockStatus']) || 'all',
      priceRange: params.minPrice !== undefined && params.maxPrice !== undefined
        ? [params.minPrice, params.maxPrice]
        : null
    });
  }, []);

  return {
    filters,
    pendingSearch,
    isSearchPending,
    triggerSearch,
    updatePendingSearch,
    clearPendingSearch,
    updateFilter,
    resetFilters,
    hasActiveFilters,
    getApiParams,
    getFilterCount,
    setFiltersFromParams
  };
}
