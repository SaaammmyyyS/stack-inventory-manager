import { Download, FileText, Share2 } from "lucide-react";
import { InventorySummary } from "../../types/inventory";

interface AnalysisExportProps {
  analysis: InventorySummary;
  tenantId: string;
}

export function AnalysisExport({ analysis, tenantId }: AnalysisExportProps) {
  const exportToJSON = () => {
    const exportData = {
      tenantId,
      timestamp: new Date().toISOString(),
      analysis: {
        status: analysis.status,
        summary: analysis.summary,
        healthScore: analysis.healthScore,
        urgentActions: analysis.urgentActions,
        data: analysis.data || [],
        insights: analysis.analysis || []
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inventory-analysis-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToText = () => {
    let content = `INVENTORY ANALYSIS REPORT\n`;
    content += `Generated: ${new Date().toLocaleString()}\n`;
    content += `Tenant ID: ${tenantId}\n`;
    content += `Status: ${analysis.status}\n`;
    content += `Health Score: ${analysis.healthScore}/100\n\n`;

    content += `SUMMARY\n${'='.repeat(50)}\n${analysis.summary}\n\n`;

    content += `CRITICAL ACTIONS\n${'='.repeat(50)}\n`;
    analysis.urgentActions?.forEach((action, i) => {
      content += `${i + 1}. ${action}\n`;
    });

    if (analysis.data && analysis.data.length > 0) {
      content += `\nTRANSACTION METRICS\n${'='.repeat(50)}\n`;
      analysis.data.forEach((metric) => {
        content += `${metric.type}: ${metric.value}\n`;
        content += `  ${metric.description}\n\n`;
      });
    }

    if (analysis.analysis && analysis.analysis.length > 0) {
      content += `\nAI INSIGHTS\n${'='.repeat(50)}\n`;
      analysis.analysis.forEach((insight, i) => {
        content += `${i + 1}. [${insight.impact.toUpperCase()} IMPACT]\n`;
        content += `   Insight: ${insight.insight}\n`;
        content += `   Recommendation: ${insight.recommendation}\n\n`;
      });
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inventory-analysis-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const shareAnalysis = async () => {
    const shareText = `Inventory Analysis Report\nHealth Score: ${analysis.healthScore}/100\nStatus: ${analysis.status}\n\n${analysis.summary}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Inventory Analysis Report',
          text: shareText,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(shareText).then(() => {
        alert('Analysis copied to clipboard!');
      });
    }
  };

  return (
    <div className="flex gap-2 pt-2 border-t border-white/10">
      <button
        onClick={exportToJSON}
        className="flex-1 flex items-center justify-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors group"
      >
        <Download size={14} className="text-blue-400 group-hover:text-blue-300" />
        <span className="text-xs font-bold text-white/70 group-hover:text-white/90">
          Export JSON
        </span>
      </button>

      <button
        onClick={exportToText}
        className="flex-1 flex items-center justify-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors group"
      >
        <FileText size={14} className="text-green-400 group-hover:text-green-300" />
        <span className="text-xs font-bold text-white/70 group-hover:text-white/90">
          Export Report
        </span>
      </button>

      <button
        onClick={shareAnalysis}
        className="flex-1 flex items-center justify-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors group"
      >
        <Share2 size={14} className="text-purple-400 group-hover:text-purple-300" />
        <span className="text-xs font-bold text-white/70 group-hover:text-white/90">
          Share
        </span>
      </button>
    </div>
  );
}
