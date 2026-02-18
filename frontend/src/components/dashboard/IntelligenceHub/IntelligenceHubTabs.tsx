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
    <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
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
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }
            `}
          >
            <Icon size={14} className={isActive ? 'text-white' : 'text-slate-500'} />
            <span>{tab.label}</span>
            {tab.hasContent && !isActive && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}
