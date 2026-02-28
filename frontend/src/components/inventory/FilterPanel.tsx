import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, X, ChevronDown, ChevronUp, Search } from "lucide-react";
import { StockStatusFilter } from "./StockStatusFilter";
import { PriceRangeFilter } from "./PriceRangeFilter";
import { useFilters, FilterState } from "@/hooks/useFilters";

interface FilterPanelProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  categories: string[];
  isLoading?: boolean;
  pendingSearch?: string;
  onUpdatePendingSearch?: (value: string) => void;
  onTriggerSearch?: () => void;
  isSearchPending?: boolean;
}

export function FilterPanel({
  filters,
  onFiltersChange,
  categories,
  isLoading,
  pendingSearch = '',
  onUpdatePendingSearch,
  onTriggerSearch,
  isSearchPending = false
}: FilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleReset = () => {
    onFiltersChange({
      search: '',
      category: 'all',
      stockStatus: 'all',
      priceRange: null
    });
  };

  const activeFilterCount = [
    filters.search.trim(),
    filters.category !== 'all' ? filters.category : '',
    filters.stockStatus !== 'all' ? filters.stockStatus : '',
    filters.priceRange ? 'price' : ''
  ].filter(Boolean).length;

  return (
    <div className="bg-white border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <h3 className="font-medium">Filters</h3>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {activeFilterCount} active
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              disabled={isLoading}
            >
              Reset All
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Search</label>
          <div className="flex gap-2">
            <Input
              placeholder="Search by name or SKU..."
              value={pendingSearch}
              onChange={(e) => onUpdatePendingSearch?.(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onTriggerSearch?.();
                } else if (e.key === 'Escape') {
                  onUpdatePendingSearch?.(filters.search);
                }
              }}
              disabled={isLoading}
              className={isSearchPending ? 'border-orange-300 focus:border-orange-400' : ''}
              aria-label="Search inventory (press Enter to search, Escape to clear)"
            />
            <Button
              onClick={onTriggerSearch}
              disabled={!isSearchPending || isLoading}
              size="sm"
              variant={isSearchPending ? "default" : "outline"}
              aria-label="Apply search"
            >
              <Search className="h-4 w-4" />
            </Button>
            {filters.search && (
              <Button
                onClick={() => onFiltersChange({ ...filters, search: '' })}
                size="sm"
                variant="ghost"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          {isSearchPending && (
            <div className="text-xs text-orange-500 font-medium">
              Press Enter or click search to apply
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Category</label>
          <Select
            value={filters.category}
            onValueChange={(value) => handleFilterChange('category', value)}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Stock Status</label>
              <StockStatusFilter
                value={filters.stockStatus}
                onChange={(value) => handleFilterChange('stockStatus', value as FilterState['stockStatus'])}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Price Range</label>
              <PriceRangeFilter
                value={filters.priceRange}
                onChange={(value) => handleFilterChange('priceRange', value)}
              />
            </div>

          </div>
        </div>
      )}

      {activeFilterCount > 0 && (
        <div className="border-t pt-4">
          <div className="flex flex-wrap gap-2">
            {filters.search.trim() && (
              <Badge variant="outline" className="gap-1">
                Search: "{filters.search}"
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleFilterChange('search', '')}
                />
              </Badge>
            )}

            {filters.category !== 'all' && (
              <Badge variant="outline" className="gap-1">
                Category: {filters.category}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleFilterChange('category', 'all')}
                />
              </Badge>
            )}

            {filters.stockStatus !== 'all' && (
              <Badge variant="outline" className="gap-1">
                Stock: {filters.stockStatus.replace('-', ' ')}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleFilterChange('stockStatus', 'all')}
                />
              </Badge>
            )}

            {filters.priceRange && (
              <Badge variant="outline" className="gap-1">
                Price: ${filters.priceRange[0].toFixed(2)} - ${filters.priceRange[1].toFixed(2)}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleFilterChange('priceRange', null)}
                />
              </Badge>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
