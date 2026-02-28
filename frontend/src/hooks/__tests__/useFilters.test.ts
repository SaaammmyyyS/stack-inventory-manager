import { renderHook, act } from '@testing-library/react';
import { useFilters } from '../useFilters';

jest.mock('../useDebounce', () => ({
  useDebounce: jest.fn((value: string, delay: number) => {
    return value === '' ? '' : '';
  }),
}));

describe('useFilters', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default filters', () => {
    const { result } = renderHook(() => useFilters());

    expect(result.current.filters.search).toBe('');
    expect(result.current.filters.category).toBe('all');
    expect(result.current.filters.stockStatus).toBe('all');
    expect(result.current.filters.priceRange).toBe(null);
    expect(result.current.pendingSearch).toBe('');
    expect(result.current.isSearchPending).toBe(false);
  });

  it('should update search filter immediately', () => {
    const { result } = renderHook(() => useFilters());

    act(() => {
      result.current.updateFilter('search', 'test query');
    });

    expect(result.current.filters.search).toBe('test query');
  });

  it('should update pending search without triggering API calls', () => {
    const { result } = renderHook(() => useFilters());

    act(() => {
      result.current.updatePendingSearch('test query');
    });

    expect(result.current.pendingSearch).toBe('test query');
    expect(result.current.isSearchPending).toBe(true);
    expect(result.current.filters.search).toBe('');
  });

  it('should trigger search from pending state', () => {
    const { result } = renderHook(() => useFilters());

    act(() => {
      result.current.updatePendingSearch('test query');
    });

    act(() => {
      result.current.triggerSearch();
    });

    expect(result.current.filters.search).toBe('test query');
    expect(result.current.isSearchPending).toBe(false);
  });

  it('should clear pending search correctly', () => {
    const { result } = renderHook(() => useFilters());

    act(() => {
      result.current.updateFilter('search', 'existing search');
      result.current.updatePendingSearch('new search');
      result.current.clearPendingSearch();
    });

    expect(result.current.pendingSearch).toBe('existing search');
    expect(result.current.isSearchPending).toBe(false);
  });

  it('should use immediate search for API params', () => {
    const { result } = renderHook(() => useFilters());

    act(() => {
      result.current.updateFilter('search', 'test query');
    });

    const apiParams = result.current.getApiParams();
    expect(apiParams.search).toBe('test query');
  });

  it('should not include empty search in API params', () => {
    const { result } = renderHook(() => useFilters());

    act(() => {
      result.current.updateFilter('search', '');
    });

    const apiParams = result.current.getApiParams();
    expect(apiParams.search).toBeUndefined();
  });

  it('should handle non-search filters immediately', () => {
    const { result } = renderHook(() => useFilters());

    act(() => {
      result.current.updateFilter('category', 'Electronics');
      result.current.updateFilter('stockStatus', 'in-stock');
      result.current.updateFilter('priceRange', [10, 100]);
    });

    const apiParams = result.current.getApiParams();
    expect(apiParams.category).toBe('Electronics');
    expect(apiParams.stockStatus).toBe('in-stock');
    expect(apiParams.minPrice).toBe(10);
    expect(apiParams.maxPrice).toBe(100);
  });

  it('should reset filters to defaults', () => {
    const { result } = renderHook(() => useFilters());

    act(() => {
      result.current.updateFilter('search', 'test');
      result.current.updateFilter('category', 'Electronics');
      result.current.updateFilter('stockStatus', 'in-stock');
      result.current.updateFilter('priceRange', [10, 100]);
    });

    act(() => {
      result.current.resetFilters();
    });

    expect(result.current.filters.search).toBe('');
    expect(result.current.filters.category).toBe('all');
    expect(result.current.filters.stockStatus).toBe('all');
    expect(result.current.filters.priceRange).toBe(null);
  });

  it('should calculate active filter count correctly', () => {
    const { result } = renderHook(() => useFilters());

    expect(result.current.hasActiveFilters).toBe(false);
    expect(result.current.getFilterCount).toBe(0);

    act(() => {
      result.current.updateFilter('search', 'test');
      result.current.updateFilter('category', 'Electronics');
    });

    expect(result.current.hasActiveFilters).toBe(true);
    expect(result.current.getFilterCount).toBe(2);
  });
});
