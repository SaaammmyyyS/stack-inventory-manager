import { useState, useCallback, useMemo } from 'react';

export interface DateRange {
  startDate: Date;
  endDate: Date;
  preset?: '7days' | '30days' | '90days' | 'custom';
}

export function useDateFilter() {
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);

    return {
      startDate,
      endDate,
      preset: '30days'
    };
  });

  const setPresetRange = useCallback((days: number, preset: DateRange['preset']) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    setDateRange({
      startDate,
      endDate,
      preset
    });
  }, []);

  const setCustomRange = useCallback((startDate: Date, endDate: Date) => {
    setDateRange({
      startDate,
      endDate,
      preset: 'custom'
    });
  }, []);

  const clearFilter = useCallback(() => {
    setPresetRange(30, '30days');
  }, [setPresetRange]);

  const filterState = useMemo(() => ({
    dateRange,
    setPresetRange,
    setCustomRange,
    clearFilter,
    setDateRange
  }), [dateRange, setPresetRange, setCustomRange, clearFilter]);

  return filterState;
}
