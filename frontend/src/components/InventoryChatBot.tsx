import { useState, useRef, useEffect } from "react";
import { useInventory } from "@/hooks/useInventory";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send, Loader2, Bot, User, TrendingUp, TrendingDown, Package } from "lucide-react";
import { toast } from "sonner";

type Message = {
  role: "user" | "assistant";
  content: string;
  type?: 'text' | 'transactions' | 'inventory' | 'forecast' | 'processing';
  data?: any;
  isProcessing?: boolean;
  debugInfo?: any;
};

const WELCOME =
  "I'm your Inventory Management Agent. Ask me about stock levels, recent movements, item forecasts, or to record a stock adjustment.";

const extractAllJson = (content: string) => {
  const jsonMatches = content.match(/\{[^}]*\}/g) || [];
  const validJsons = [];

  for (const match of jsonMatches) {
    try {
      let fixed = match;
      fixed = fixed.replace(/([{,])([^"])/g, '$1"$2');
      fixed = fixed.replace(/([{,])([^"])/g, '$1"$2');
      fixed = fixed.replace(/,([}\]])/g, '$1');

      const parsed = JSON.parse(fixed);
      validJsons.push(parsed);
    } catch (e) {
      console.warn('JSON parse failed:', match, e);
    }
  }

  return validJsons;
};

const mergeJsonFragments = (fragments: any[]) => {
  const merged: any = {};

  for (const fragment of fragments) {
    if (fragment.data && Array.isArray(fragment.data)) {
      merged.inventory = fragment.data;
    }
    if (fragment.status) merged.status = fragment.status;
    if (fragment.summary_text || fragment.summary) merged.summary = fragment.summary_text || fragment.summary;
    if (fragment.health_score !== undefined) merged.health_score = fragment.health_score;
    if (fragment.urgent_actions) merged.urgent_actions = fragment.urgent_actions;
  }

  return merged;
};

const ErrorFallbackMessage = ({ content, debugInfo }: { content: string; debugInfo?: any }) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
    <div className="flex items-center gap-2 mb-2">
      <div className="w-2 h-2 rounded-full bg-red-500" />
      <h4 className="font-medium text-red-800">Response Parsing Issue</h4>
    </div>
    <p className="text-red-700 text-sm mb-2">
      I received a response but had trouble displaying it properly. Here's what I got:
    </p>
    <details className="text-sm">
      <summary className="cursor-pointer text-red-600 font-medium mb-2">View Raw Response</summary>
      <pre className="bg-white p-2 rounded text-xs overflow-auto max-h-32 border border-red-100">
        {content}
      </pre>
    </details>
    {debugInfo && (
      <details className="text-sm mt-2">
        <summary className="cursor-pointer text-red-600 font-medium mb-2">Debug Information</summary>
        <pre className="bg-white p-2 rounded text-xs overflow-auto max-h-32 border border-red-100">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </details>
    )}
  </div>
);

const DebugResponse = ({ content, parsed }: { content: string; parsed: any }) => (
  <div className="border border-red-200 bg-red-50 p-4 rounded-lg mb-3">
    <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2">
      <span>Debug Mode</span>
      <button
        onClick={() => {
          const messagesElement = document.getElementById('chat-messages');
          if (messagesElement) {
            messagesElement.querySelectorAll('.debug-response').forEach(el => el.remove());
          }
        }}
        className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
      >
        Close Debug
      </button>
    </h4>

    {parsed?.intent && (
      <div className="mb-2 p-2 bg-white rounded border border-gray-200">
        <div className="text-sm font-medium text-gray-700 mb-1">Detected Intent:</div>
        <div className="text-sm text-blue-600 font-mono">{parsed.intent}</div>
        {parsed.entities && Object.keys(parsed.entities).length > 0 && (
          <>
            <div className="text-sm font-medium text-gray-700 mb-1 mt-2">Extracted Entities:</div>
            <div className="text-xs text-gray-600">
              {Object.entries(parsed.entities).map(([key, value]) => (
                <div key={key} className="ml-2">
                  <span className="font-medium">{key}:</span> {value as string}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    )}

    <details className="text-sm">
      <summary className="cursor-pointer text-red-700 font-medium mb-2">Raw Response</summary>
      <pre className="bg-white p-2 rounded text-xs overflow-auto max-h-32 border border-gray-200">
        {content}
      </pre>
    </details>
    <details className="text-sm mt-2">
      <summary className="cursor-pointer text-red-700 font-medium mb-2">Parsed Data</summary>
      <pre className="bg-white p-2 rounded text-xs overflow-auto max-h-32 border border-gray-200">
        {JSON.stringify(parsed, null, 2)}
      </pre>
    </details>
  </div>
);

const formatChatResponse = (content: string): { type: 'text' | 'transactions' | 'inventory' | 'forecast' | 'processing'; content: string; data?: any; isProcessing?: boolean; debugInfo?: any } => {
  if (!content) return { type: 'text', content: 'No response available.' };

  console.log('Raw response content:', content);

  const fencedMatch = content.match(/```json\s*([\s\S\s]*?)\s*```/i);
  if (fencedMatch && fencedMatch[1]) {
    try {
      const parsed = JSON.parse(fencedMatch[1]);
      const debugInfo = { source: 'fenced_json', parsed };
      console.log('Parsed JSON:', parsed);

      if (parsed?.debug?.intent && parsed?.data) {
        const intent = parsed.debug.intent;
        const enhancedDebugInfo = {
          ...debugInfo,
          intent: intent,
          entities: parsed.debug.entities,
          data: parsed.data
        };

        console.log('Detected intent:', intent);
        console.log('Data structure:', JSON.stringify(parsed.data, null, 2));

        switch (intent) {
          case 'FORECAST_QUERIES':
            if (parsed.data?.data && Array.isArray(parsed.data.data)) {
              const forecastData = parsed.data.data;
              console.log('Forecast data detected:', forecastData.length, 'items');

              if (forecastData.length > 0 && forecastData[0]?.itemName) {
                return {
                  type: 'forecast',
                  content: parsed.data.summary || 'Inventory forecasts:',
                  data: forecastData,
                  isProcessing: false,
                  debugInfo: enhancedDebugInfo,
                };
              }
            }

            if (parsed.data?.items && Array.isArray(parsed.data.items)) {
              return {
                type: 'forecast',
                content: parsed.data.summary || 'Inventory forecasts:',
                data: parsed.data.items,
                isProcessing: false,
                debugInfo: enhancedDebugInfo,
              };
            }
            break;

          case 'INVENTORY_QUERIES':
            if (parsed.data?.data && Array.isArray(parsed.data.data)) {
              return {
                type: 'inventory',
                content: parsed.data.summary || 'Current inventory status:',
                data: parsed.data.data,
                isProcessing: false,
                debugInfo: enhancedDebugInfo,
              };
            }

            if (parsed.data?.items && Array.isArray(parsed.data.items)) {
              return {
                type: 'inventory',
                content: parsed.data.summary || 'Current inventory status:',
                data: parsed.data.items,
                isProcessing: false,
                debugInfo: enhancedDebugInfo,
              };
            }
            break;

          case 'LOW_STOCK':
            if (parsed.data?.items && Array.isArray(parsed.data.items)) {
              return {
                type: 'inventory',
                content: parsed.data.summary || 'Low stock items:',
                data: parsed.data.items,
                isProcessing: false,
                debugInfo: enhancedDebugInfo,
              };
            }

            if (parsed.data?.data && Array.isArray(parsed.data.data)) {
              return {
                type: 'inventory',
                content: parsed.data.summary || 'Low stock items:',
                data: parsed.data.data,
                isProcessing: false,
                debugInfo: enhancedDebugInfo,
              };
            }
            break;

          case 'RECENT_TRANSACTIONS':
            if (parsed.data?.data && Array.isArray(parsed.data.data)) {
              return {
                type: 'transactions',
                content: parsed.data.summary || 'Here are the recent stock movements:',
                data: parsed.data.data,
                isProcessing: false,
                debugInfo: enhancedDebugInfo,
              };
            }
            break;

          case 'FILTERED_TRANSACTIONS':
            if (parsed.data?.data && Array.isArray(parsed.data.data)) {
              return {
                type: 'transactions',
                content: parsed.data.summary || 'Filtered transactions:',
                data: parsed.data.data,
                isProcessing: false,
                debugInfo: enhancedDebugInfo,
              };
            }
            break;
        }

        if (typeof parsed.data?.summary === 'string') {
          return { type: 'text', content: parsed.data.summary, isProcessing: false, debugInfo: enhancedDebugInfo };
        }
      }

      if (parsed?.debug && parsed?.data) {
        const enhancedDebugInfo = {
          ...debugInfo,
          intent: parsed.debug.intent,
          entities: parsed.debug.entities,
          data: parsed.data
        };

        if (parsed.data?.data && Array.isArray(parsed.data.data)) {
          const firstItem = parsed.data.data[0];
          if (firstItem?.itemName || firstItem?.daysRemaining !== undefined || firstItem?.healthStatus) {
            return {
              type: 'forecast',
              content: parsed.data.summary || 'Inventory forecasts:',
              data: parsed.data.data,
              isProcessing: false,
              debugInfo: enhancedDebugInfo,
            };
          }

          if (firstItem?.type || firstItem?.amount !== undefined) {
            return {
              type: 'transactions',
              content: parsed.data.summary || 'Here are the recent stock movements:',
              data: parsed.data.data,
              isProcessing: false,
              debugInfo: enhancedDebugInfo,
            };
          }

          if (firstItem?.name || firstItem?.quantity !== undefined) {
            return {
              type: 'inventory',
              content: parsed.data.summary || 'Current inventory status:',
              data: parsed.data.data,
              isProcessing: false,
              debugInfo: enhancedDebugInfo,
            };
          }
        }

        if (parsed.data?.items && Array.isArray(parsed.data.items)) {
          return {
            type: 'inventory',
            content: parsed.data.summary || 'Current inventory status:',
            data: parsed.data.items,
            isProcessing: false,
            debugInfo: enhancedDebugInfo,
          };
        }

        if (parsed.data?.data && Array.isArray(parsed.data.data) && parsed.data.data[0]?.runoutDate) {
          return {
            type: 'inventory',
            content: parsed.data.summary || 'Inventory forecasts:',
            data: parsed.data.data,
            isProcessing: false,
            debugInfo: enhancedDebugInfo,
          };
        }

        if (parsed.data?.data && Array.isArray(parsed.data.data) && parsed.data.data[0]?.itemName) {
          console.log('Forecast detected, data items:', parsed.data.data.length);
          console.log('Data items:', parsed.data.data);
          console.log('Data structure:', JSON.stringify(parsed.data.data, null, 2));
          console.log('Data type:', Array.isArray(parsed.data.data) ? 'array' : typeof parsed.data.data);
          console.log('First item:', parsed.data.data[0]);
          return {
            type: 'forecast',
            content: parsed.data.summary || 'Inventory forecasts:',
            data: parsed.data.data,
            isProcessing: false,
            debugInfo: enhancedDebugInfo,
          };
        }

        if (typeof parsed.data?.summary === 'string') {
          return { type: 'text', content: parsed.data.summary, isProcessing: false, debugInfo: enhancedDebugInfo };
        }
      }

      if (parsed?.data && Array.isArray(parsed.data)) {
        return {
          type: 'transactions',
          content: parsed.summary || 'Here are the recent stock movements:',
          data: parsed.data,
          isProcessing: false,
          debugInfo,
        };
      }

      if (parsed?.items && Array.isArray(parsed.items)) {
        return {
          type: 'inventory',
          content: parsed.summary || 'Current inventory status:',
          data: parsed.items,
          isProcessing: false,
          debugInfo,
        };
      }

      if (typeof parsed?.summary === 'string') {
        return { type: 'text', content: parsed.summary, isProcessing: false, debugInfo };
      }
    } catch (e) {
      console.warn('JSON parsing failed:', e);
    }
  }

  const jsonFragments = extractAllJson(content);
  let parsedData: any = null;
  let debugInfo: any = null;

  if (jsonFragments.length > 0) {
    parsedData = mergeJsonFragments(jsonFragments);
    debugInfo = { fragments: jsonFragments, merged: parsedData };
  }

  const processingKeywords = ['please wait', 'processing', 'fetching', 'analyzing', 'once data is ready'];
  const isProcessingMessage = processingKeywords.some(keyword =>
    content.toLowerCase().includes(keyword.toLowerCase())
  );

  if (isProcessingMessage) {
    return {
      type: 'processing',
      content: content,
      isProcessing: true,
      debugInfo
    };
  }

  if (parsedData) {
    if (parsedData.inventory && Array.isArray(parsedData.inventory)) {
      const transactions = parsedData.inventory;
      if (transactions.length > 0 && (transactions[0].type || transactions[0].amount !== undefined)) {
        return {
          type: 'transactions',
          content: 'Here are the recent stock movements:',
          data: transactions,
          isProcessing: false,
          debugInfo
        };
      }
      if (transactions.length > 0 && (transactions[0].name || transactions[0].quantity !== undefined)) {
        return {
          type: 'inventory',
          content: parsedData.summary || 'Current inventory status:',
          data: transactions,
          isProcessing: false,
          debugInfo
        };
      }
    }
  }

  let cleanContent = content
    .replace(/```json[\s\S]*?```/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\{[\s\S]*\}/g, '')
    .replace(/^\s*[\r\n]/gm, '')
    .trim();

  if (parsedData && parsedData.summary) {
    cleanContent = parsedData.summary;
  }

  const finalDebugInfo = debugInfo || {
    source: 'fallback',
    message: 'No structured data found',
    originalContent: content.substring(0, 200) + (content.length > 200 ? '...' : '')
  };

  return { type: 'text', content: cleanContent, isProcessing: false, debugInfo: finalDebugInfo };
};

const TransactionMessage = ({ data }: { data: any[] }) => (
  <div className="space-y-2">
    {data.map((tx, index) => (
      <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
        <div className={`p-2 rounded-lg ${
          tx.type === 'STOCK_IN' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
        }`}>
          {tx.type === 'STOCK_IN' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
        </div>
        <div className="flex-1">
          <div className="font-medium text-slate-900">
            {tx.itemId || tx.itemName || 'Unknown Item'}
          </div>
          <div className="text-sm text-slate-600">
            {tx.type === 'STOCK_IN' ? 'Added' : 'Removed'} {tx.amount} units
            {tx.performedBy && ` by ${tx.performedBy}`}
            {tx.reason && ` - ${tx.reason}`}
          </div>
        </div>
        <div className={`px-2 py-1 rounded text-xs font-medium ${
          tx.type === 'STOCK_IN' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {tx.type === 'STOCK_IN' ? '+' : '-'}{tx.amount}
        </div>
      </div>
    ))}
  </div>
);

const ForecastMessage = ({ data }: { data: any[] }) => {
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800 text-sm">No forecast data available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((item, index) => {
        if (!item || typeof item !== 'object') {
          console.warn(`Invalid forecast item at index ${index}:`, item);
          return null;
        }

        const itemName = item.itemName || item.name || 'Unknown Item';
        const daysRemaining = item.daysRemaining ?? item.days_remaining ?? null;
        const currentQuantity = item.currentQuantity ?? item.current_quantity ?? 0;
        const sku = item.sku;
        const healthStatus = item.healthStatus ?? item.health_status;
        const suggestedThreshold = item.suggestedThreshold ?? item.suggested_threshold;

        const getStatusInfo = () => {
          if (healthStatus) {
            switch (healthStatus.toUpperCase()) {
              case 'CRITICAL': return { color: 'red', label: 'CRITICAL', days: 4 };
              case 'WARNING': return { color: 'yellow', label: 'WARNING', days: 15 };
              case 'STABLE': return { color: 'green', label: 'STABLE', days: 999 };
              default: return { color: 'gray', label: healthStatus, days: 30 };
            }
          }

          if (daysRemaining !== null) {
            if (daysRemaining <= 4) return { color: 'red', label: 'CRITICAL', days: 4 };
            if (daysRemaining <= 15) return { color: 'yellow', label: 'WARNING', days: 15 };
            if (daysRemaining <= 30) return { color: 'orange', label: 'CAUTION', days: 30 };
            return { color: 'green', label: 'STABLE', days: 999 };
          }

          return { color: 'gray', label: 'UNKNOWN', days: 999 };
        };

        const statusInfo = getStatusInfo();

        return (
          <div key={index} className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className={`px-4 py-3 border-b border-slate-100 bg-${statusInfo.color}-50`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full bg-${statusInfo.color}-500`} />
                  <h3 className="font-semibold text-slate-900">
                    {itemName}
                  </h3>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium bg-${statusInfo.color}-100 text-${statusInfo.color}-700`}>
                  {statusInfo.label}
                </div>
              </div>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <div className="text-sm text-slate-500 mb-1">Current Status</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-slate-900">{currentQuantity}</span>
                    <span className="text-sm text-slate-500">units</span>
                  </div>
                  {sku && (
                    <div className="text-xs text-slate-400 mt-1">SKU: {sku}</div>
                  )}
                </div>

                <div>
                  <div className="text-sm text-slate-500 mb-1">Forecast</div>
                  <div className="flex items-center gap-2">
                    <Package size={16} className="text-slate-400" />
                    <span className={`font-medium text-${statusInfo.color}-600`}>
                      {daysRemaining !== null ? `${daysRemaining} days remaining` : 'No forecast data'}
                    </span>
                  </div>
                  {healthStatus && (
                    <div className="text-xs text-slate-500 mt-1">Status: {healthStatus}</div>
                  )}
                </div>
              </div>

              {suggestedThreshold !== undefined && suggestedThreshold !== null && (
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span className="text-sm font-medium text-slate-700">Suggested Threshold</span>
                    </div>
                    <span className="text-lg font-bold text-blue-600">{suggestedThreshold}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const InventoryMessage = ({ data }: { data: any[] }) => (
  <div className="space-y-2">
    {data.map((item, index) => (
      <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
        <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
          <Package size={16} />
        </div>
        <div className="flex-1">
          <div className="font-medium text-slate-900">
            {item.name || 'Unknown Item'}
          </div>
          <div className="text-sm text-slate-600">
            {item.quantity} units in stock
            {item.sku && ` • SKU: ${item.sku}`}
          </div>
        </div>
        <div className={`px-2 py-1 rounded text-xs font-medium ${
          item.quantity <= (item.minThreshold || 5)
            ? 'bg-red-100 text-red-700'
            : 'bg-green-100 text-green-700'
        }`}>
          {item.quantity <= (item.minThreshold || 5) ? 'Low Stock' : 'In Stock'}
        </div>
      </div>
    ))}
  </div>
);

export function InventoryChatBot() {
  const { api } = useInventory();
  const [open, setOpen] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: WELCOME },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setIsLoading(true);

    try {
      const { data } = await api.post<{ reply: string }>("/api/v1/forecast/chat", {
        message: text,
      });
      const reply = data?.reply ?? "No response.";
      const formatted = formatChatResponse(reply);
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: formatted.content,
        type: formatted.type,
        data: formatted.data,
        isProcessing: formatted.isProcessing,
        debugInfo: formatted.debugInfo,
      }]);
    } catch (e: unknown) {
      const err = e as { response?: { status?: number; data?: { message?: string } } };
      const message = err.response?.data?.message ?? "Could not reach the agent.";
      toast.error("Chat error", { description: message });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Sorry, something went wrong: ${message}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl shadow-blue-200 transition-all hover:scale-105 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label="Open inventory assistant"
      >
        <MessageSquare size={24} strokeWidth={2} />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="flex w-full flex-col border-slate-200 bg-slate-50/95 p-0 sm:max-w-md"
          showCloseButton
        >
          <SheetHeader className="border-b border-slate-200 bg-white px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                  <Bot size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <SheetTitle>AI Inventory Assistant</SheetTitle>
                  <SheetDescription>
                    Ask about stock levels, recent movements, or record adjustments.
                  </SheetDescription>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setDebugMode(!debugMode)}
                className={`gap-2 ${debugMode ? 'border-red-300 text-red-600' : ''}`}
              >
                {debugMode ? 'Debug ON' : 'Debug OFF'}
              </Button>
            </div>
          </SheetHeader>

          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0"
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
              >
                {msg.role === "assistant" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                    <Bot size={14} />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-white border border-slate-200 text-slate-800 shadow-sm"
                  }`}
                >
                  {msg.role === "assistant" && msg.type === 'processing' && msg.isProcessing ? (
                    <div>
                      <p className="whitespace-pre-wrap break-words mb-3">{msg.content}</p>
                      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
                        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                        <span className="text-xs text-slate-500">Processing your request...</span>
                      </div>
                    </div>
                  ) : msg.role === "assistant" && msg.type === 'transactions' && msg.data ? (
                    <div>
                      <p className="whitespace-pre-wrap break-words mb-3">{msg.content}</p>
                      <TransactionMessage data={msg.data} />
                    </div>
                  ) : msg.role === "assistant" && msg.type === 'inventory' && msg.data ? (
                    <div>
                      <p className="whitespace-pre-wrap break-words mb-3">{msg.content}</p>
                      <InventoryMessage data={msg.data} />
                    </div>
                  ) : msg.role === "assistant" && msg.type === 'forecast' && msg.data ? (
                    <div>
                      <p className="whitespace-pre-wrap break-words mb-3">{msg.content}</p>
                      <ForecastMessage data={msg.data} />
                    </div>
                  ) : msg.role === "assistant" && debugMode && msg.debugInfo ? (
                    <div className="debug-response">
                      <DebugResponse content={msg.content} parsed={msg.debugInfo} />
                    </div>
                  ) : msg.role === "assistant" && msg.debugInfo && !msg.data ? (
                    <div>
                      <ErrorFallbackMessage content={msg.content} debugInfo={msg.debugInfo} />
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-600">
                    <User size={14} />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  <Bot size={14} />
                </div>
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                  <span className="text-xs text-slate-500">Thinking...</span>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 bg-white p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about stock or record a movement..."
                className="flex-1 rounded-xl border-slate-200 bg-slate-50"
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !input.trim()}
                className="shrink-0 rounded-xl bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
