import React from 'react';
import { Package } from 'lucide-react';
import { ForecastItem } from '../../types/chat';

interface ForecastMessageProps {
  data: ForecastItem[];
}

export const ForecastMessage: React.FC<ForecastMessageProps> = ({ data }) => {
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800 text-sm">No forecast data available.</p>
      </div>
    );
  }

  const getStatusInfo = (item: ForecastItem) => {
    const healthStatus = item.healthStatus ?? item.health_status;
    const daysRemaining = item.daysRemaining ?? item.days_remaining ?? null;

    if (healthStatus) {
      switch (healthStatus.toUpperCase()) {
        case 'CRITICAL': return { color: 'red', label: 'CRITICAL', days: 4 };
        case 'WARNING': return { color: 'yellow', label: 'WARNING', days: 15 };
        case 'STABLE': return { color: 'green', label: 'STABLE', days: 999 };
        default: return { color: 'gray', label: healthStatus, days: 30 };
      }
    }

    if (daysRemaining !== null) {
      if (daysRemaining <= 4) return { color: 'red', label: 'CRITICAL', days: 4 };
      if (daysRemaining <= 15) return { color: 'yellow', label: 'WARNING', days: 15 };
      if (daysRemaining <= 30) return { color: 'orange', label: 'CAUTION', days: 30 };
      return { color: 'green', label: 'STABLE', days: 999 };
    }

    return { color: 'gray', label: 'UNKNOWN', days: 999 };
  };

  return (
    <div className="space-y-3">
      {data.map((item, index) => {
        if (!item || typeof item !== 'object') {
          return null;
        }

        const itemName = item.itemName || item.name || 'Unknown Item';
        const daysRemaining = item.daysRemaining ?? item.days_remaining ?? null;
        const currentQuantity = item.currentQuantity ?? item.current_quantity ?? 0;
        const sku = item.sku;
        const healthStatus = item.healthStatus ?? item.health_status;
        const suggestedThreshold = item.suggestedThreshold ?? item.suggested_threshold;
        const statusInfo = getStatusInfo(item);

        return (
          <div key={index} className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className={`px-4 py-3 border-b border-slate-100 bg-${statusInfo.color}-50`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full bg-${statusInfo.color}-500`} />
                  <h3 className="font-semibold text-slate-900">
                    {itemName}
                  </h3>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium bg-${statusInfo.color}-100 text-${statusInfo.color}-700`}>
                  {statusInfo.label}
                </div>
              </div>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <div className="text-sm text-slate-500 mb-1">Current Status</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-slate-900">{currentQuantity}</span>
                    <span className="text-sm text-slate-500">units</span>
                  </div>
                  {sku && (
                    <div className="text-xs text-slate-400 mt-1">SKU: {sku}</div>
                  )}
                </div>

                <div>
                  <div className="text-sm text-slate-500 mb-1">Forecast</div>
                  <div className="flex items-center gap-2">
                    <Package size={16} className="text-slate-400" />
                    <span className={`font-medium text-${statusInfo.color}-600`}>
                      {daysRemaining !== null ? `${daysRemaining} days remaining` : 'No forecast data'}
                    </span>
                  </div>
                  {healthStatus && (
                    <div className="text-xs text-slate-500 mt-1">Status: {healthStatus}</div>
                  )}
                </div>
              </div>

              {suggestedThreshold !== undefined && suggestedThreshold !== null && (
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span className="text-sm font-medium text-slate-700">Suggested Threshold</span>
                    </div>
                    <span className="text-lg font-bold text-blue-600">{suggestedThreshold}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
