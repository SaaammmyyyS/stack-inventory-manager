import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, PackagePlus, AlertCircle, DollarSign, BellRing, Info } from "lucide-react";

interface Props {
  isOpen: boolean;
  isPending: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export default function AddProductModal({ isOpen, isPending, error, onClose, onSubmit }: Props) {
  const isDuplicateError = error?.toLowerCase().includes('duplicate') || error?.toLowerCase().includes('already exists');

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const data = {
      name: formData.get('name')?.toString() || '',
      sku: formData.get('sku')?.toString() || '',
      category: formData.get('category')?.toString() || '',
      quantity: Number(formData.get('quantity')) || 0,
      price: Number(formData.get('price')) || 0,
      minThreshold: Number(formData.get('minThreshold')) || 0,
    };

    onSubmit(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[550px] rounded-[2.5rem] p-8 border-none shadow-2xl overflow-y-auto max-h-[90vh]">
        <DialogHeader className="space-y-3">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-2">
            <PackagePlus size={24} />
          </div>
          <DialogTitle className="text-3xl font-black text-slate-900 tracking-tight">
            Add Product
          </DialogTitle>
          <DialogDescription className="text-slate-500 font-medium">
            Enter the details to create a new item in your inventory.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className={`mt-4 p-4 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${
            isDuplicateError ? 'bg-orange-50 border border-orange-100 text-orange-700' : 'bg-red-50 border border-red-100 text-red-600'
          }`}>
            {isDuplicateError ? <Info size={18} className="shrink-0 mt-0.5" /> : <AlertCircle size={18} className="shrink-0 mt-0.5" />}
            <div>
              <p className="text-sm font-black uppercase tracking-tight">
                {isDuplicateError ? 'Duplicate Entry Found' : 'Submission Error'}
              </p>
              <p className="text-xs font-bold opacity-80 leading-relaxed">
                {isDuplicateError ? 'A product with this SKU already exists. Please use a unique identifier.' : error}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-6 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">
                Product Name
              </Label>
              <Input
                id="name"
                name="name"
                required
                placeholder="e.g. MacBook Pro"
                className="h-12 rounded-xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-blue-500 font-medium"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku" className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">
                SKU Number
              </Label>
              <Input
                id="sku"
                name="sku"
                placeholder="ELEC-001"
                className={`h-12 rounded-xl bg-slate-50 border-none focus-visible:ring-2 font-mono ${isDuplicateError ? 'ring-2 ring-orange-400' : 'focus-visible:ring-blue-500'}`}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category" className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">
              Category
            </Label>
            <Input
              id="category"
              name="category"
              placeholder="Electronics"
              className="h-12 rounded-xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-blue-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity" className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">
                Initial Stock
              </Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                required
                min="0"
                placeholder="0"
                className="h-12 rounded-xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-blue-500 font-medium"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price" className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">
                Unit Price
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  required
                  min="0"
                  placeholder="0.00"
                  className="h-12 pl-10 rounded-xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-blue-500 font-medium"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="minThreshold" className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1 flex items-center gap-2">
              <BellRing size={14} className="text-orange-400" />
              Low Stock Alert Threshold
            </Label>
            <Input
              id="minThreshold"
              name="minThreshold"
              type="number"
              min="0"
              placeholder="Alert me when stock is below..."
              className="h-12 rounded-xl bg-orange-50/30 border-dashed border-orange-100 focus-visible:ring-2 focus-visible:ring-orange-400 font-medium"
            />
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
              disabled={isPending}
              className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-100 transition-all active:scale-95"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Item'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}