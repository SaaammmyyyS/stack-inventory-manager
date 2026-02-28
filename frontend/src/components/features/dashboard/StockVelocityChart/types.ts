import { StockTransaction } from '@/types/inventory';

export interface ChartDataPoint {
  time: string;
  quantity: number;
  transaction?: StockTransaction;
  previousQuantity: number;
  changeAmount: number;
  changeType: 'increase' | 'decrease';
}

export interface TooltipDataPoint {
  time: string;
  quantity: number;
  transaction?: StockTransaction;
  previousQuantity: number;
  changeAmount: number;
  changeType: 'increase' | 'decrease';
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
  preset?: '7days' | '30days' | '90days' | 'custom';
}

export interface EnhancedTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

export interface DateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

export interface UseChartDataProps {
  transactions: StockTransaction[];
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
}
