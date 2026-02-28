import React from 'react';
import {
  X,
  Clock,
  User,
  Loader2,
  ArrowUpRight,
  ArrowDownLeft,
  RotateCcw,
  Trash2,
  History
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import type { StockTransaction } from '../../hooks/useInventory';

interface Props {
  isOpen: boolean;
  itemName: string;
  isLoading: boolean;
  data: StockTransaction[];
  onClose: () => void;
}

export default function ActivityLogDrawer({ isOpen, itemName, isLoading, data, onClose }: Props) {
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col border-l border-slate-100">
        <div className="p-8 border-b border-slate-50 bg-slate-50/30">
          <SheetHeader className="space-y-1">
            <div className="flex items-center gap-3 text-blue-600 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <History size={20} />
              </div>
              <SheetTitle className="text-2xl font-black text-slate-900 tracking-tight">
                Activity Log
              </SheetTitle>
            </div>
            <SheetDescription className="text-slate-500 font-bold text-base">
              {itemName}
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="flex-1 overflow-y-auto p-8 pt-6">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4">
              <Loader2 className="animate-spin text-blue-500" size={32} />
              <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">
                Fetching History...
              </p>
            </div>
          ) : data.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-6">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <Clock className="text-slate-200" size={32} />
              </div>
              <p className="text-slate-400 font-medium">No history recorded for this item yet.</p>
            </div>
          ) : (
            <div className="space-y-8 relative">
              <div className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-slate-100" />

              {data.map((tx) => (
                <div key={tx.id} className="relative pl-8 group">
                  <div className={`absolute left-0 top-1.5 w-4 h-4 rounded-full border-4 border-white z-10 shadow-sm transition-transform group-hover:scale-125 ${
                    tx.type === 'STOCK_IN' ? 'bg-emerald-500' :
                    tx.type === 'STOCK_OUT' ? 'bg-orange-500' :
                    tx.type === 'DELETED' ? 'bg-red-500' : 'bg-blue-500'
                  }`} />

                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <span className={`font-black text-xs uppercase tracking-tight flex items-center gap-1.5 ${
                        tx.type === 'STOCK_IN' ? 'text-emerald-600' :
                        tx.type === 'STOCK_OUT' ? 'text-orange-600' : 'text-slate-600'
                      }`}>
                        {tx.type === 'STOCK_IN' && <ArrowUpRight size={14} />}
                        {tx.type === 'STOCK_OUT' && <ArrowDownLeft size={14} />}
                        {tx.type === 'DELETED' && <Trash2 size={14} />}
                        {tx.type === 'RESTORED' && <RotateCcw size={14} />}

                        {tx.type.replace('_', ' ')}
                        {tx.quantityChange !== 0 && (
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                            {tx.quantityChange > 0 ? '+' : ''}{tx.quantityChange}
                          </span>
                        )}
                      </span>

                      <span className="text-[10px] text-slate-400 font-bold font-mono bg-slate-50 px-2 py-1 rounded">
                        {new Date(tx.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>

                    <p className="text-slate-700 font-bold text-sm leading-tight">
                      {tx.reason}
                    </p>

                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-black uppercase tracking-widest">
                      <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center">
                        <User size={10} className="text-slate-400" />
                      </div>
                      {tx.performedBy || 'System'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/30">
          <p className="text-[10px] text-slate-400 font-medium text-center leading-relaxed">
            Logs are stored permanently and cannot be modified to ensure inventory integrity.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}