import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowUpCircle, ArrowDownCircle, ClipboardList } from "lucide-react";

interface Props {
  item: { id: string; name: string; type: 'STOCK_IN' | 'STOCK_OUT' } | null;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export default function StockAdjustmentModal({ item, onClose, onSubmit }: Props) {
  if (!item) return null;

  const isStockIn = item.type === 'STOCK_IN';

  return (
    <Dialog open={!!item} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] rounded-[2.5rem] p-8 border-none shadow-2xl">
        <DialogHeader className="space-y-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2 ${
            isStockIn ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'
          }`}>
            {isStockIn ? <ArrowUpCircle size={24} /> : <ArrowDownCircle size={24} />}
          </div>
          <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">
            {isStockIn ? 'Restock Item' : 'Deduct Stock'}
          </DialogTitle>
          <DialogDescription className="text-slate-500 font-medium">
            Updating inventory for <span className="text-slate-900 font-bold">{item.name}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">
              Quantity
            </Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              required
              min="1"
              placeholder="0"
              className="h-14 rounded-2xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-blue-500 font-black text-2xl px-6"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason" className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">
              Reason for Adjustment
            </Label>
            <Select name="reason" required defaultValue="Regular Restock">
              <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-500 font-medium">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-100">
                <SelectItem value="Regular Restock">Regular Restock</SelectItem>
                <SelectItem value="Customer Sale">Customer Sale</SelectItem>
                <SelectItem value="Damaged Goods">Damaged / Waste</SelectItem>
                <SelectItem value="Inventory Correction">Correction</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="flex-1 h-12 font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className={`flex-1 h-12 font-bold rounded-xl shadow-lg transition-all active:scale-95 ${
                isStockIn
                ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'
                : 'bg-orange-600 hover:bg-orange-700 shadow-orange-100'
              }`}
            >
              Confirm
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}