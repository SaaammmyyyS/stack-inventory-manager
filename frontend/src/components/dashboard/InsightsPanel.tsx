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
        return <AlertTriangle className="text-red-400" size={14} />;
      case 'medium':
        return <AlertCircle className="text-yellow-400" size={14} />;
      case 'low':
        return <Info className="text-blue-400" size={14} />;
      default:
        return <Lightbulb className="text-slate-400" size={14} />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return "border-red-500/30 bg-red-500/10";
      case 'medium':
        return "border-yellow-500/30 bg-yellow-500/10";
      case 'low':
        return "border-blue-500/30 bg-blue-500/10";
      default:
        return "border-slate-500/30 bg-slate-500/10";
    }
  };

  const getImpactBadgeColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case 'medium':
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case 'low':
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  };

  if (!analysis || analysis.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 px-2">
          AI Insights & Analysis
        </h5>
        {analysis && analysis.length > 1 && (
          <button
            onClick={toggleAll}
            className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-white/60 transition-colors"
          >
            {allExpanded ? 'Collapse All' : 'Expand All'}
          </button>
        )}
      </div>

      <div
        ref={containerRef}
        className="space-y-3 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
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
                border rounded-xl p-3 backdrop-blur-sm transition-all duration-300
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
                      className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronUp className="text-white/60" size={14} />
                      ) : (
                        <ChevronDown className="text-white/60" size={14} />
                      )}
                    </button>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-bold text-white/90 leading-relaxed">
                      {item.insight}
                    </p>

                    {isExpanded && (
                      <div className="animate-in fade-in duration-300 space-y-2 pt-2 border-t border-white/10">
                        <div className="flex items-start gap-2">
                          <Lightbulb className="text-blue-400 mt-0.5" size={12} />
                          <div>
                            <p className="text-[10px] font-black uppercase text-blue-400/80 mb-1">
                              Recommendation
                            </p>
                            <p className="text-xs text-white/70 leading-relaxed">
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
