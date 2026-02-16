import { toast } from "sonner";
import { useInventory } from "./useInventory";
import { formatChatResponse } from "../utils/chatParsers";

export const useChatApi = () => {
  const { api } = useInventory();

  const sendMessage = async (message: string) => {
    try {
      const { data } = await api.post<{ reply: string }>("/api/v1/forecast/chat", {
        message: message.trim(),
      });

      const reply = data?.reply ?? "No response.";
      return formatChatResponse(reply);
    } catch (e: unknown) {
      const err = e as { response?: { status?: number; data?: { message?: string } } };
      const message = err.response?.data?.message ?? "Could not reach the agent.";
      toast.error("Chat error", { description: message });

      return {
        type: 'text' as const,
        content: `Sorry, something went wrong: ${message}`,
        isProcessing: false,
        debugInfo: { source: 'error', message }
      };
    }
  };

  return {
    sendMessage,
  };
};
