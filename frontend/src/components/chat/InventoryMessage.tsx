import React from 'react';
import { Package } from 'lucide-react';
import { InventoryItem } from '../../types/chat';

interface InventoryMessageProps {
  data: InventoryItem[];
}

export const InventoryMessage: React.FC<InventoryMessageProps> = ({ data }) => (
  <div className="space-y-2">
    {data.map((item, index) => (
      <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
        <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
          <Package size={16} />
        </div>
        <div className="flex-1">
          <div className="font-medium text-slate-900">
            {item.name || 'Unknown Item'}
          </div>
          <div className="text-sm text-slate-600">
            {item.quantity} units in stock
            {item.sku && ` • SKU: ${item.sku}`}
          </div>
        </div>
        <div className={`px-2 py-1 rounded text-xs font-medium ${
          item.quantity <= (item.minThreshold || 5)
            ? 'bg-red-100 text-red-700'
            : 'bg-green-100 text-green-700'
        }`}>
          {item.quantity <= (item.minThreshold || 5) ? 'Low Stock' : 'In Stock'}
        </div>
      </div>
    ))}
  </div>
);
