import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { Calendar, ChevronDown, X } from 'lucide-react';
import { DateRange, DateRangeFilterProps } from './types';

const PRESET_RANGES = [
  { key: '7days', label: 'Last 7 days', days: 7, preset: '7days' as const },
  { key: '30days', label: 'Last 30 days', days: 30, preset: '30days' as const },
  { key: '90days', label: 'Last 90 days', days: 90, preset: '90days' as const },
] as const;

export function DateRangeFilter({ value, onChange, className = '' }: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const timeoutRef = useRef<NodeJS.Timeout>();

  const debouncedOnChange = useCallback((range: DateRange) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      onChange(range);
    }, 300);
  }, [onChange]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handlePresetClick = useCallback((days: number, preset: DateRange['preset']) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const newRange: DateRange = {
      startDate,
      endDate,
      preset
    };

    setCustomStart('');
    setCustomEnd('');
    setIsOpen(false);
    debouncedOnChange(newRange);
  }, [debouncedOnChange]);

  const handleCustomDateChange = useCallback((field: 'start' | 'end', date: string) => {
    if (field === 'start') {
      setCustomStart(date);
    } else {
      setCustomEnd(date);
    }
  }, []);

  const applyCustomRange = useCallback(() => {
    if (!customStart || !customEnd) return;

    const startDate = new Date(customStart);
    const endDate = new Date(customEnd);

    if (startDate > endDate) {
      return;
    }

    const newRange: DateRange = {
      startDate,
      endDate,
      preset: 'custom'
    };

    setIsOpen(false);
    debouncedOnChange(newRange);
  }, [customStart, customEnd, debouncedOnChange]);

  const clearFilter = useCallback(() => {
    setCustomStart('');
    setCustomEnd('');
    setIsOpen(false);

    handlePresetClick(30, '30days');
  }, [handlePresetClick]);

  const currentPreset = useMemo(() => {
    if (!value || !value.startDate || !value.endDate) return '30days';

    const daysDiff = Math.ceil((value.endDate.getTime() - value.startDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff <= 7) return '7days';
    if (daysDiff <= 30) return '30days';
    if (daysDiff <= 90) return '90days';
    return 'custom';
  }, [value]);

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const formatDateDisplay = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label="Select date range"
        aria-expanded={isOpen}
      >
        <Calendar className="w-4 h-4" />
        {currentPreset === 'custom' ? (
          <span className="truncate max-w-[150px]">
            {formatDateDisplay(value.startDate)} - {formatDateDisplay(value.endDate)}
          </span>
        ) : (
          <span>
            {PRESET_RANGES.find(r => r.key === currentPreset)?.label || 'Custom range'}
          </span>
        )}
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-50 focus:outline-none">
          <div className="p-4">
            <div className="mb-4">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">
                Quick Ranges
              </h4>
              <div className="space-y-1">
                {PRESET_RANGES.map((preset) => (
                  <button
                    key={preset.key}
                    onClick={() => handlePresetClick(preset.days, preset.preset)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      currentPreset === preset.key
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">
                Custom Range
              </h4>
              <div className="space-y-3">
                <div>
                  <label htmlFor="start-date" className="block text-xs font-medium text-slate-700 mb-1">
                    Start Date
                  </label>
                  <input
                    id="start-date"
                    type="date"
                    value={customStart}
                    onChange={(e) => handleCustomDateChange('start', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    max={formatDateForInput(new Date())}
                  />
                </div>
                <div>
                  <label htmlFor="end-date" className="block text-xs font-medium text-slate-700 mb-1">
                    End Date
                  </label>
                  <input
                    id="end-date"
                    type="date"
                    value={customEnd}
                    onChange={(e) => handleCustomDateChange('end', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    max={formatDateForInput(new Date())}
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={applyCustomRange}
                    disabled={!customStart || !customEnd}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:bg-slate-300 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Apply Range
                  </button>
                  <button
                    onClick={clearFilter}
                    className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
          aria-label="Close date range picker"
        />
      )}
    </div>
  );
}
