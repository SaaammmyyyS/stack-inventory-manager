import { useMemo } from 'react';
import { StockTransaction } from '@/types/inventory';
import { ChartDataPoint, UseChartDataProps } from '../types';

export function useChartData({ transactions, dateRange }: UseChartDataProps) {
  return useMemo(() => {
    if (!transactions || transactions.length === 0) return [];

    let filteredTransactions = transactions;
    if (dateRange) {
      filteredTransactions = transactions.filter(transaction => {
        const transactionDate = new Date(transaction.createdAt);
        return transactionDate >= dateRange.startDate && transactionDate <= dateRange.endDate;
      });
    }

    const sorted = [...filteredTransactions].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    let currentLevel = 0;
    const data: ChartDataPoint[] = [];

    sorted.forEach((transaction) => {
      const previousQuantity = currentLevel;
      currentLevel += transaction.quantityChange;

      const dataPoint: ChartDataPoint = {
        time: new Intl.DateTimeFormat('en-US', {
          hour: 'numeric',
          minute: 'numeric'
        }).format(new Date(transaction.createdAt)),
        quantity: currentLevel,
        transaction,
        previousQuantity,
        changeAmount: Math.abs(transaction.quantityChange),
        changeType: transaction.quantityChange > 0 ? 'increase' : 'decrease'
      };

      data.push(dataPoint);
    });

    return data;
  }, [transactions, dateRange]);
}
