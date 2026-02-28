import { StockTransaction } from '@/types/inventory';
import { ArrowUp, ArrowDown, Package, Trash2, RotateCcw } from 'lucide-react';
import { EnhancedTooltipProps, TooltipDataPoint } from './types';

export function EnhancedTooltip({ active, payload, label }: EnhancedTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const data = payload[0].payload as TooltipDataPoint;

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'STOCK_IN':
        return <ArrowUp className="w-4 h-4 text-emerald-600" />;
      case 'STOCK_OUT':
        return <ArrowDown className="w-4 h-4 text-red-600" />;
      case 'DELETED':
        return <Trash2 className="w-4 h-4 text-slate-600" />;
      case 'RESTORED':
        return <RotateCcw className="w-4 h-4 text-blue-600" />;
      default:
        return <Package className="w-4 h-4 text-slate-600" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'STOCK_IN':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'STOCK_OUT':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'DELETED':
        return 'text-slate-700 bg-slate-50 border-slate-200';
      case 'RESTORED':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      default:
        return 'text-slate-700 bg-slate-50 border-slate-200';
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div
      className="bg-white rounded-xl border border-slate-200 shadow-lg p-3 sm:p-4 min-w-[250px] sm:min-w-[280px] max-w-[300px] sm:max-w-[320px]"
      role="tooltip"
      aria-label={`Transaction details for ${label}`}
    >
      <div className="mb-2 sm:mb-3 pb-2 sm:pb-3 border-b border-slate-100">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {label}
          </span>
          <span className="text-base sm:text-lg font-black text-slate-900">
            {data.quantity.toLocaleString()}
          </span>
        </div>
        <div className="text-[9px] sm:text-[10px] text-slate-400">
          Current Stock Level
        </div>
      </div>

      {data.transaction && (
        <div className="space-y-2 sm:space-y-3">
          <div className={`flex items-center justify-between p-2 sm:p-3 rounded-lg border ${getTransactionColor(data.transaction.type)}`}>
            <div className="flex items-center gap-2">
              {getTransactionIcon(data.transaction.type)}
              <span className="text-xs font-black uppercase tracking-wider">
                {data.transaction.type.replace('_', ' ')}
              </span>
            </div>
            <div className="text-right">
              <div className="text-sm font-black">
                {data.changeAmount > 0 ? '+' : ''}{data.changeAmount}
              </div>
              <div className="text-[9px] opacity-75">
                units
              </div>
            </div>
          </div>

          <div className="space-y-1 sm:space-y-2 text-xs">
            {data.transaction.itemName && (
              <div className="flex justify-between">
                <span className="text-slate-500">Item:</span>
                <span className="font-medium text-slate-900 max-w-[120px] sm:max-w-[180px] truncate">
                  {data.transaction.itemName}
                </span>
              </div>
            )}

            {data.transaction.performedBy && (
              <div className="flex justify-between">
                <span className="text-slate-500">By:</span>
                <span className="font-medium text-slate-900">
                  {data.transaction.performedBy}
                </span>
              </div>
            )}

            {data.transaction.reason && (
              <div className="flex justify-between">
                <span className="text-slate-500">Reason:</span>
                <span className="font-medium text-slate-900 max-w-[120px] sm:max-w-[180px] truncate">
                  {data.transaction.reason}
                </span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-slate-500">Time:</span>
              <span className="font-medium text-slate-900">
                {formatDateTime(data.transaction.createdAt)}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Stock Before:</span>
              <span className="font-medium text-slate-900">
                {data.previousQuantity.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Stock After:</span>
              <span className="font-medium text-slate-900">
                {data.quantity.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="pt-1 sm:pt-2 border-t border-slate-100">
            <div className="flex justify-between">
              <span className="text-[8px] sm:text-[9px] text-slate-400 uppercase tracking-wider">
                Transaction ID
              </span>
              <span className="text-[8px] sm:text-[9px] font-mono text-slate-600">
                {data.transaction.id.slice(-8)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
