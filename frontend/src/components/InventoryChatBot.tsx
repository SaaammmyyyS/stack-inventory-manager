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
  type?: 'text' | 'transactions' | 'inventory';
  data?: any;
};

const WELCOME =
  "I'm your Inventory Management Agent. Ask me about stock levels, recent movements, item forecasts, or to record a stock adjustment.";

const formatChatResponse = (content: string): { type: 'text' | 'transactions' | 'inventory'; content: string; data?: any } => {
  if (!content) return { type: 'text', content: 'No response available.' };

  let jsonContent = '';
  let naturalLanguage = content;

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);

      if (parsed.data && Array.isArray(parsed.data)) {
        const transactions = parsed.data;
        if (transactions.length > 0 && transactions[0].type) {
          return {
            type: 'transactions',
            content: 'Here are the recent stock movements:',
            data: transactions
          };
        }
      }

      if (parsed.items && Array.isArray(parsed.items)) {
        return {
          type: 'inventory',
          content: 'Current inventory status:',
          data: parsed.items
        };
      }

      if (parsed.summary) {
        naturalLanguage = parsed.summary;
      }
    } catch (e) {

    }
  }

  let cleanContent = content
    .replace(/```json[\s\S]*?```/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\{[\s\S]*\}/g, '')
    .replace(/^\s*[\r\n]/gm, '')
    .trim();

  if (naturalLanguage && naturalLanguage !== content) {
    cleanContent = naturalLanguage;
  }

  return { type: 'text', content: cleanContent };
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
        data: formatted.data
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
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                <Bot size={20} strokeWidth={2.5} />
              </div>
              <div>
                <SheetTitle className="text-left text-slate-900">
                  Inventory Assistant
                </SheetTitle>
                <SheetDescription className="text-left text-slate-500">
                  Ask about stock, forecasts, or record movements
                </SheetDescription>
              </div>
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
                  {msg.role === "assistant" && msg.type === 'transactions' && msg.data ? (
                    <div>
                      <p className="whitespace-pre-wrap break-words mb-3">{msg.content}</p>
                      <TransactionMessage data={msg.data} />
                    </div>
                  ) : msg.role === "assistant" && msg.type === 'inventory' && msg.data ? (
                    <div>
                      <p className="whitespace-pre-wrap break-words mb-3">{msg.content}</p>
                      <InventoryMessage data={msg.data} />
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
