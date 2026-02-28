import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "../../ui/sheet";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { MessageSquare, Send, Loader2, Bot } from "lucide-react";
import { useChatState } from "../../../hooks/useChatState";
import { useChatApi } from "../../../hooks/useChatApi";
import { MessageRenderer } from "./MessageRenderer";

export function InventoryChatBot() {
  const {
    messages,
    input,
    isLoading,
    debugMode,
    open,
    scrollRef,
    setInput,
    setIsLoading,
    setOpen,
    addUserMessage,
    addAssistantMessage,
    toggleDebugMode,
    resetInput,
  } = useChatState();

  const { sendMessage } = useChatApi();

  const handleSendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    resetInput();
    addUserMessage(text);
    setIsLoading(true);

    try {
      const response = await sendMessage(text);
      addAssistantMessage({
        content: response.content,
        type: response.type,
        data: response.data,
        isProcessing: response.isProcessing,
        debugInfo: response.debugInfo,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSendMessage();
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
                onClick={toggleDebugMode}
                className={`gap-2 ${debugMode ? 'border-red-300 text-red-600' : ''}`}
              >
                {debugMode ? 'Debug ON' : 'Debug OFF'}
              </Button>
            </div>
          </SheetHeader>

          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0"
            id="chat-messages"
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
              >
                <MessageRenderer message={msg} debugMode={debugMode} />
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
            <form onSubmit={handleSubmit} className="flex gap-2">
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
