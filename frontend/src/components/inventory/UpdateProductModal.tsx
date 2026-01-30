import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, PackageOpen, Info, AlertCircle } from 'lucide-react';
import { InventoryItem } from '@/types/inventory';

interface UpdateProductModalProps {
  isOpen: boolean;
  isPending: boolean;
  error?: string | null;
  item: InventoryItem | null;
  onClose: () => void;
  onSubmit: (data: Partial<InventoryItem>) => void;
}

export function UpdateProductModal({ isOpen, isPending, error, item, onClose, onSubmit }: UpdateProductModalProps) {
  const { register, handleSubmit, reset, setValue, watch } = useForm();
  const currentCategory = watch('category');

  const isDuplicateError = error?.toLowerCase().includes('duplicate') || error?.toLowerCase().includes('already exists');

  useEffect(() => {
    if (item) {
      reset({
        name: item.name,
        sku: item.sku,
        category: item.category,
        price: item.price,
        minThreshold: item.minThreshold
      });
    }
  }, [item, reset]);

  const onFormSubmit = (data: any) => {
    const formattedData = {
      ...data,
      price: Number(data.price),
      minThreshold: Number(data.minThreshold)
    };
    onSubmit(formattedData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-[2.5rem] max-w-md p-8 border-none shadow-2xl">
        <DialogHeader className="space-y-3">
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mb-2">
            <PackageOpen size={24} />
          </div>
          <DialogTitle className="text-2xl font-black tracking-tight text-slate-900">Update Product</DialogTitle>
          <DialogDescription className="text-slate-500 font-medium">
            Modify the details for <strong>{item?.name || 'this product'}</strong>.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className={`mt-4 p-4 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${
            isDuplicateError ? 'bg-orange-50 border border-orange-100 text-orange-700' : 'bg-red-50 border border-red-100 text-red-600'
          }`}>
            {isDuplicateError ? <Info size={18} className="shrink-0 mt-0.5" /> : <AlertCircle size={18} className="shrink-0 mt-0.5" />}
            <div>
              <p className="text-sm font-black uppercase tracking-tight">
                {isDuplicateError ? 'SKU Conflict' : 'Update Failed'}
              </p>
              <p className="text-xs font-bold opacity-80 leading-relaxed">
                {isDuplicateError ? 'This SKU is already assigned to another product.' : error}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5 pt-4">
          <div className="space-y-2">
            <Label className="font-bold text-xs uppercase tracking-widest text-slate-400 ml-1">Product Name</Label>
            <Input {...register('name', { required: true })} className="h-12 rounded-xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-blue-500" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-bold text-xs uppercase tracking-widest text-slate-400 ml-1">SKU</Label>
              <Input {...register('sku')} className={`h-12 rounded-xl bg-slate-50 border-none font-mono focus-visible:ring-2 ${isDuplicateError ? 'ring-2 ring-orange-400' : 'focus-visible:ring-blue-500'}`} />
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-xs uppercase tracking-widest text-slate-400 ml-1">Category</Label>
              <Select
                value={currentCategory}
                onValueChange={(v) => setValue('category', v)}
              >
                <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-blue-500">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100">
                  <SelectItem value="Electronics">Electronics</SelectItem>
                  <SelectItem value="Furniture">Furniture</SelectItem>
                  <SelectItem value="Office">Office</SelectItem>
                  <SelectItem value="General">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-bold text-xs uppercase tracking-widest text-slate-400 ml-1">Price ($)</Label>
              <Input type="number" step="0.01" {...register('price')} className="h-12 rounded-xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-blue-500" />
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-xs uppercase tracking-widest text-slate-400 ml-1">Low Stock Alert</Label>
              <Input type="number" {...register('minThreshold')} className="h-12 rounded-xl bg-orange-50/50 border-none focus-visible:ring-2 focus-visible:ring-orange-400" />
            </div>
          </div>

          <DialogFooter className="pt-6 gap-3">
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1 h-12 font-bold text-slate-400">
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 font-bold rounded-xl shadow-lg shadow-blue-100 transition-all active:scale-95">
              {isPending ? <Loader2 className="animate-spin h-4 w-4" /> : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}