import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronDown, ChevronUp, AlertTriangle, AlertCircle, Info, Lightbulb } from "lucide-react";

interface InsightsPanelProps {
  analysis?: Array<{
    insight: string;
    impact: 'high' | 'medium' | 'low';
    recommendation: string;
  }>;
}

export function InsightsPanel({ analysis }: InsightsPanelProps) {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [allExpanded, setAllExpanded] = useState(false);
  const [containerHeight, setContainerHeight] = useState('auto');
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  useEffect(() => {
    setExpandedItems(new Set());
    setAllExpanded(false);
    setContainerHeight('auto');
  }, [analysis]);

  useEffect(() => {
    if (containerRef.current) {
      const scrollHeight = containerRef.current.scrollHeight;
      const maxHeight = 600;
      setContainerHeight(scrollHeight > maxHeight ? `${maxHeight}px` : 'auto');
    }
  }, [expandedItems, analysis]);

  const scrollToItem = useCallback((index: number) => {
    const itemElement = itemRefs.current.get(index);
    const containerElement = containerRef.current;

    if (itemElement && containerElement) {
      const itemRect = itemElement.getBoundingClientRect();
      const containerRect = containerElement.getBoundingClientRect();

      if (itemRect.bottom > containerRect.bottom || itemRect.top < containerRect.top) {
        itemElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest'
        });
      }
    }
  }, []);

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedItems);
    const isCurrentlyExpanded = newExpanded.has(index);

    if (isCurrentlyExpanded) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }

    setExpandedItems(newExpanded);
    setAllExpanded(newExpanded.size === analysis?.length);

    if (!isCurrentlyExpanded) {
      setTimeout(() => scrollToItem(index), 100);
    }
  };

  const toggleAll = () => {
    if (allExpanded) {
      setExpandedItems(new Set());
      setAllExpanded(false);
    } else {
      const allIndices = analysis?.map((_, i) => i) || [];
      setExpandedItems(new Set(allIndices));
      setAllExpanded(true);

      if (allIndices.length > 0) {
        setTimeout(() => scrollToItem(allIndices[0]), 100);
      }
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'high':
        return <AlertTriangle className="text-red-600" size={14} />;
      case 'medium':
        return <AlertCircle className="text-amber-600" size={14} />;
      case 'low':
        return <Info className="text-blue-600" size={14} />;
      default:
        return <Lightbulb className="text-slate-600" size={14} />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return "border-red-200 bg-red-50";
      case 'medium':
        return "border-amber-200 bg-amber-50";
      case 'low':
        return "border-blue-200 bg-blue-50";
      default:
        return "border-slate-200 bg-slate-50";
    }
  };

  const getImpactBadgeColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return "bg-red-100 text-red-700 border-red-200";
      case 'medium':
        return "bg-amber-100 text-amber-700 border-amber-200";
      case 'low':
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  if (!analysis || analysis.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-2">
          AI Insights & Analysis
        </h5>
        {analysis && analysis.length > 1 && (
          <button
            onClick={toggleAll}
            className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-slate-700 transition-colors"
          >
            {allExpanded ? 'Collapse All' : 'Expand All'}
          </button>
        )}
      </div>

      <div
        ref={containerRef}
        className="space-y-3 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent"
        style={{
          height: containerHeight,
          transition: 'height 0.3s ease-in-out'
        }}
      >
        {analysis.map((item, index) => {
          const isExpanded = expandedItems.has(index);
          return (
            <div
              key={index}
              ref={(el) => {
                if (el) {
                  itemRefs.current.set(index, el);
                }
              }}
              className={`
                border rounded-xl p-3 transition-all duration-300
                ${getImpactColor(item.impact)}
                ${isExpanded ? 'shadow-lg' : 'hover:shadow-md'}
              `}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {getImpactIcon(item.impact)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`inline-block px-2 py-1 rounded-full text-[9px] font-black uppercase border ${getImpactBadgeColor(
                      item.impact
                    )}`}>
                      {item.impact} Impact
                    </span>
                    <button
                      onClick={() => toggleExpanded(index)}
                      className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronUp className="text-slate-500" size={14} />
                      ) : (
                        <ChevronDown className="text-slate-500" size={14} />
                      )}
                    </button>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-800 leading-relaxed">
                      {item.insight}
                    </p>

                    {isExpanded && (
                      <div className="animate-in fade-in duration-300 space-y-2 pt-2 border-t border-slate-200">
                        <div className="flex items-start gap-2">
                          <Lightbulb className="text-blue-600 mt-0.5" size={12} />
                          <div>
                            <p className="text-[10px] font-black uppercase text-blue-700 mb-1">
                              Recommendation
                            </p>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              {item.recommendation}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
