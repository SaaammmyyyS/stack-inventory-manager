import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { TransactionItem } from "@/types/chat";

interface TransactionMessageProps {
  data: TransactionItem[];
}

export const TransactionMessage: React.FC<TransactionMessageProps> = ({ data }) => (
  <div className="space-y-2">
    {data.map((tx, index) => (
      <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
        <div className={`p-2 rounded-lg ${
          tx.type === 'STOCK_IN' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
        }`}>
          {tx.type === 'STOCK_IN' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
        </div>
        <div className="flex-1">
          <div className="font-medium text-slate-900">
            {tx.itemId || tx.itemName || tx.itemname || 'Unknown Item'}
          </div>
          <div className="text-sm text-slate-600">
            {tx.type === 'STOCK_IN' ? 'Added' : 'Removed'} {tx.amount || tx.quantitychange} units
            {tx.performedBy || tx.performedby && ` by ${tx.performedBy || tx.performedby}`}
            {tx.reason && ` - ${tx.reason}`}
          </div>
        </div>
        <div className={`px-2 py-1 rounded text-xs font-medium ${
          tx.type === 'STOCK_IN' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {tx.type === 'STOCK_IN' ? '+' : '-'}{tx.amount || tx.quantitychange}
        </div>
      </div>
    ))}
  </div>
);
