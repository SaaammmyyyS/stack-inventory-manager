import React from 'react';
import { Minimize, Maximize2, Layout } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface DensitySelectorProps {
  density: 'compact' | 'comfortable' | 'spacious';
  onDensityChange: (mode: 'compact' | 'comfortable' | 'spacious') => void;
}

const DensitySelector: React.FC<DensitySelectorProps> = ({
  density,
  onDensityChange
}) => {
  const densityOptions = [
    {
      value: 'compact' as const,
      label: 'Compact',
      description: '25 items',
      icon: Minimize,
      items: 25
    },
    {
      value: 'comfortable' as const,
      label: 'Comfortable',
      description: '10 items',
      icon: Layout,
      items: 10
    },
    {
      value: 'spacious' as const,
      label: 'Spacious',
      description: '8 items',
      icon: Maximize2,
      items: 8
    }
  ];

  return (
    <div className="flex bg-slate-100/50 p-1 rounded-2xl border border-slate-200">
      {densityOptions.map((option) => {
        const Icon = option.icon;
        const isActive = density === option.value;
        
        return (
          <Button
            key={option.value}
            variant={isActive ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onDensityChange(option.value)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-xs transition-all ${
              isActive
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                : 'text-slate-500 hover:text-slate-700'
            }`}
            aria-label={`Switch to ${option.label} density mode`}
            title={`${option.label}: ${option.description} per page`}
          >
            <Icon size={14} />
            <span className="hidden sm:inline">{option.label}</span>
            <span className="sm:hidden">{option.items}</span>
          </Button>
        );
      })}
    </div>
  );
};

export default DensitySelector;
