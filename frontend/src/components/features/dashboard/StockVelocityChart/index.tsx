import { useMemo, useEffect, useState } from 'react';
import {
  XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, AreaChart, Area, Tooltip
} from 'recharts';
import { Activity, Calendar } from 'lucide-react';
import { useContainerDimensions } from '@/hooks/useContainerDimensions';
import { useDateFilter } from './hooks/useDateFilter';
import { useChartData } from './hooks/useChartData';
import { EnhancedTooltip } from './EnhancedTooltip';
import { DateRangeFilter } from './DateRangeFilter';
import { StockTransaction } from '@/types/inventory';
import { DateRange } from './types';

interface Props {
  transactions: StockTransaction[];
  onDateRangeChange?: (dateRange: DateRange) => void;
}

const calculateDaysFromRange = (startDate: Date, endDate: Date): number => {
  if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return 30;
  }

  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(1, days);
};

export function StockVelocityChart({ transactions, onDateRangeChange }: Props) {
  const { containerRef, dimensions, isMeasured } = useContainerDimensions();
  const { dateRange, setPresetRange, setCustomRange } = useDateFilter();
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastNotifiedRange, setLastNotifiedRange] = useState<DateRange | null>(null);

  const chartData = useChartData({
    transactions,
    dateRange: {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    }
  });

  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.createdAt);
      return transactionDate >= dateRange.startDate && transactionDate <= dateRange.endDate;
    });
  }, [transactions, dateRange]);

  const handleDateRangeChange = (newRange: DateRange) => {
    if (!newRange || !newRange.startDate || !newRange.endDate) return;

    if (newRange.preset === 'custom') {
      setCustomRange(newRange.startDate, newRange.endDate);
    } else {
      const days = calculateDaysFromRange(newRange.startDate, newRange.endDate);
      setPresetRange(days, newRange.preset);
    }
  };

  useEffect(() => {
    if (!onDateRangeChange || !dateRange) return;

    if (isInitialized && lastNotifiedRange &&
        lastNotifiedRange.startDate.getTime() === dateRange.startDate.getTime() &&
        lastNotifiedRange.endDate.getTime() === dateRange.endDate.getTime()) {
      return;
    }

    onDateRangeChange(dateRange);
    setLastNotifiedRange(dateRange);

    if (!isInitialized) {
      setIsInitialized(true);
    }
  }, [dateRange, onDateRangeChange, isInitialized, lastNotifiedRange]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-sm h-full flex flex-col min-h-[400px] sm:min-h-[500px]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-6 sm:mb-10 shrink-0">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="p-2 sm:p-3 bg-blue-50 text-blue-600 rounded-xl sm:rounded-2xl">
            <Activity size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h4 className="text-lg sm:text-xl font-black text-slate-900 leading-none">Stock Velocity</h4>
            <p className="text-[9px] sm:text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 sm:mt-1.5">Net Inventory Flow</p>
          </div>
        </div>

        <DateRangeFilter
          value={dateRange}
          onChange={handleDateRangeChange}
          className="shrink-0"
        />
      </div>

      <div ref={containerRef} className="flex-1 w-full min-h-[300px] sm:min-h-[400px] relative mobile-chart-container stock-velocity-mobile">
        {isMeasured && chartData.length > 0 && dimensions.width > 0 && dimensions.height > 0 ? (
          <ResponsiveContainer width={dimensions.width} height={dimensions.height}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorQty" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="time"
                fontSize={10}
                tickMargin={15}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontWeight: 800 }}
              />
              <YAxis
                fontSize={10}
                axisLine={false}
                tickLine={false}
                tickMargin={10}
                tick={{ fill: '#94a3b8', fontWeight: 800 }}
              />
              <Tooltip
                content={<EnhancedTooltip />}
                wrapperStyle={{ outline: 'none' }}
              />
              <Area
                type="monotone"
                dataKey="quantity"
                stroke="#2563eb"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorQty)"
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : !isMeasured ? (
          <div className="h-full w-full flex items-center justify-center">
            <div className="animate-pulse text-slate-400 text-xs font-black uppercase tracking-widest">Measuring Container...</div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-full w-full flex flex-col items-center justify-center gap-4">
            <div className="text-slate-400 text-xs font-black uppercase tracking-widest">No activity data for selected period</div>
            <div className="text-slate-300 text-[10px] font-medium">
              Try selecting a different date range
            </div>
          </div>
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <div className="text-slate-400 text-xs font-black uppercase tracking-widest">Waiting for container dimensions...</div>
          </div>
        )}
      </div>

      {filteredTransactions.length > 0 && (
        <div className="mt-6 pt-6 border-t border-slate-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="text-center">
              <div className="text-2xl font-black text-slate-900">
                {filteredTransactions.length}
              </div>
              <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
                Transactions
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-slate-900">
                {chartData.length > 0 ? chartData[chartData.length - 1].quantity.toLocaleString() : '0'}
              </div>
              <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
                Current Level
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-slate-900">
                {dateRange.preset === 'custom' ? 'Custom' :
                 dateRange.preset === '7days' ? '7 Days' :
                 dateRange.preset === '30days' ? '30 Days' : '90 Days'}
              </div>
              <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
                Period
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
