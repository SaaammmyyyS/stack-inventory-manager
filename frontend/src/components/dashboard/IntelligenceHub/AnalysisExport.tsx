import { Download, FileText, Share2 } from "lucide-react";
import { InventorySummary } from "../../../types/inventory";

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
    <div className="space-y-4">
      <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-2 mb-4">
        Export & Share Analysis
      </h5>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <button
          onClick={exportToJSON}
          className="flex items-center justify-center gap-2 p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all group border border-slate-200"
        >
          <Download size={16} className="text-blue-600 group-hover:text-blue-700" />
          <div className="text-left">
            <span className="text-xs font-bold text-slate-800 group-hover:text-slate-900 block">
              Export JSON
            </span>
            <span className="text-[10px] text-slate-500">Machine readable</span>
          </div>
        </button>

        <button
          onClick={exportToText}
          className="flex items-center justify-center gap-2 p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all group border border-slate-200"
        >
          <FileText size={16} className="text-emerald-600 group-hover:text-emerald-700" />
          <div className="text-left">
            <span className="text-xs font-bold text-slate-800 group-hover:text-slate-900 block">
              Export Report
            </span>
            <span className="text-[10px] text-slate-500">Human readable</span>
          </div>
        </button>

        <button
          onClick={shareAnalysis}
          className="flex items-center justify-center gap-2 p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all group border border-slate-200"
        >
          <Share2 size={16} className="text-purple-600 group-hover:text-purple-700" />
          <div className="text-left">
            <span className="text-xs font-bold text-slate-800 group-hover:text-slate-900 block">
              Share
            </span>
            <span className="text-[10px] text-slate-500">Quick sharing</span>
          </div>
        </button>
      </div>

      <div className="text-center pt-2">
        <p className="text-[10px] text-slate-500 font-bold">
          Last exported: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}
