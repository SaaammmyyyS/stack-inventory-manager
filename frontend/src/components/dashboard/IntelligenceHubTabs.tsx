import { useState } from "react";
import { Sparkles, BarChart3, Lightbulb, Download } from "lucide-react";

interface IntelligenceHubTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  hasInsights?: boolean;
  hasMetrics?: boolean;
}

export function IntelligenceHubTabs({ 
  activeTab, 
  onTabChange, 
  hasInsights = false, 
  hasMetrics = false 
}: IntelligenceHubTabsProps) {
  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: Sparkles,
      description: 'Health score & summary'
    },
    {
      id: 'insights',
      label: 'Insights',
      icon: Lightbulb,
      description: 'AI analysis',
      hasContent: hasInsights
    },
    {
      id: 'metrics',
      label: 'Metrics',
      icon: BarChart3,
      description: 'Transaction data',
      hasContent: hasMetrics
    },
    {
      id: 'export',
      label: 'Export',
      icon: Download,
      description: 'Share & download'
    }
  ];

  return (
    <div className="flex gap-1 p-1 bg-white/5 rounded-xl backdrop-blur-sm">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-lg font-black text-xs 
              uppercase tracking-wider transition-all duration-200 relative
              ${isActive 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'text-white/60 hover:text-white hover:bg-white/10'
              }
            `}
          >
            <Icon size={14} className={isActive ? 'text-white' : 'text-blue-400'} />
            <span>{tab.label}</span>
            {tab.hasContent && !isActive && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}
