import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, AlertTriangle, XCircle, TrendingUp } from "lucide-react";

const stockStatusOptions = [
  {
    value: 'all',
    label: 'All Stock',
    icon: Package,
    color: 'bg-slate-100 text-slate-700 border-slate-200'
  },
  {
    value: 'in-stock',
    label: 'In Stock',
    icon: Package,
    color: 'bg-green-100 text-green-700 border-green-200'
  },
  {
    value: 'low-stock',
    label: 'Low Stock',
    icon: AlertTriangle,
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200'
  },
  {
    value: 'out-of-stock',
    label: 'Out of Stock',
    icon: XCircle,
    color: 'bg-red-100 text-red-700 border-red-200'
  },
  {
    value: 'overstock',
    label: 'Overstock',
    icon: TrendingUp,
    color: 'bg-blue-100 text-blue-700 border-blue-200'
  }
];

interface StockStatusFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export function StockStatusFilter({ value, onChange }: StockStatusFilterProps) {
  const selectedOption = stockStatusOptions.find(option => option.value === value);

  return (
    <div className="flex items-center gap-2">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Stock Status" />
        </SelectTrigger>
        <SelectContent>
          {stockStatusOptions.map((option) => {
            const Icon = option.icon;
            return (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span>{option.label}</span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      
      {selectedOption && selectedOption.value !== 'all' && (
        <Badge 
          variant="outline" 
          className={`${selectedOption.color} border-current`}
        >
          <selectedOption.icon className="h-3 w-3 mr-1" />
          {selectedOption.label}
        </Badge>
      )}
    </div>
  );
}
