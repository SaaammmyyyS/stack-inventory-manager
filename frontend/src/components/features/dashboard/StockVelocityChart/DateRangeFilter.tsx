import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { Calendar, ChevronDown, X } from 'lucide-react';
import { DateRange, DateRangeFilterProps } from './types';
import { useDropdownPosition } from '@/hooks/useDropdownPosition';

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
  const { buttonRef, containerRef, position, calculatePosition } = useDropdownPosition();

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

  useEffect(() => {
    if (isOpen) {
      calculatePosition();
    }
  }, [isOpen, calculatePosition]);

  useEffect(() => {
    if (isOpen) {
      const handleResize = () => calculatePosition();
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleResize);
      };
    }
  }, [isOpen, calculatePosition]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (buttonRef.current &&
          !buttonRef.current.contains(event.target as Node) &&
          !(event.target as Element).closest('.date-range-dropdown')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

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
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-3 min-h-[44px] bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label="Select date range"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        id="date-range-button"
      >
        <Calendar className="w-4 h-4" />
        {currentPreset === 'custom' ? (
          <span className="truncate max-w-[120px] sm:max-w-[150px]">
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
        <div
          className="absolute bg-white border border-slate-200 rounded-xl shadow-lg z-50 focus:outline-none date-range-dropdown overflow-x-auto"
          style={position ? {
            top: `${position.top}px`,
            left: `${position.left}px`,
            width: `${position.width}px`
          } : {
            top: '100%',
            left: 0,
            width: '320px'
          }}
          role="menu"
          aria-labelledby="date-range-button"
        >
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
                    className={`w-full text-left px-3 py-3 min-h-[44px] rounded-lg text-sm font-medium transition-colors ${
                      currentPreset === preset.key
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                    role="menuitem"
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
                    className="w-full px-3 py-3 min-h-[44px] border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-3 py-3 min-h-[44px] border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    max={formatDateForInput(new Date())}
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={applyCustomRange}
                    disabled={!customStart || !customEnd}
                    className="flex-1 px-3 py-3 min-h-[44px] bg-blue-600 text-white rounded-lg text-sm font-medium disabled:bg-slate-300 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Apply Range
                  </button>
                  <button
                    onClick={clearFilter}
                    className="px-3 py-3 min-h-[44px] bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
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
