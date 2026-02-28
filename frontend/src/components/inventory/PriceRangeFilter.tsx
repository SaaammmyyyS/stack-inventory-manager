import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DollarSign, X } from "lucide-react";

interface PriceRangeFilterProps {
  value: [number, number] | null;
  onChange: (value: [number, number] | null) => void;
}

export function PriceRangeFilter({ value, onChange }: PriceRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [minPrice, setMinPrice] = useState(value?.[0]?.toString() || '');
  const [maxPrice, setMaxPrice] = useState(value?.[1]?.toString() || '');

  const handleApply = () => {
    const min = parseFloat(minPrice);
    const max = parseFloat(maxPrice);
    
    if (!isNaN(min) && !isNaN(max) && min >= 0 && max >= min) {
      onChange([min, max]);
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    setMinPrice('');
    setMaxPrice('');
    onChange(null);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setMinPrice(value?.[0]?.toString() || '');
    setMaxPrice(value?.[1]?.toString() || '');
    setIsOpen(false);
  };

  if (isOpen) {
    return (
      <div className="border rounded-lg p-4 bg-white shadow-sm">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Price Range</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="min-price" className="text-xs text-muted-foreground">
                Min Price
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="min-price"
                  type="number"
                  placeholder="0.00"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="pl-8"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="max-price" className="text-xs text-muted-foreground">
                Max Price
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="max-price"
                  type="number"
                  placeholder="999.99"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="pl-8"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleApply} size="sm" className="flex-1">
              Apply
            </Button>
            <Button onClick={handleClear} variant="outline" size="sm">
              Clear
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="h-9"
      >
        <DollarSign className="h-4 w-4 mr-2" />
        Price Range
      </Button>
      
      {value && (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          ${value[0].toFixed(2)} - ${value[1].toFixed(2)}
        </Badge>
      )}
    </div>
  );
}
