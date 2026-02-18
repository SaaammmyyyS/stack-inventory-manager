import { toast } from "sonner";
import { useInventory } from "./useInventory";
import { formatChatResponse } from "../utils/chatParsers";

const validateResponse = (reply: string): { isValid: boolean; issue?: string } => {
  if (!reply || reply.trim() === '') {
    return { isValid: false, issue: 'Empty response' };
  }

  const fencedCount = (reply.match(/```json/g) || []).length;
  const closingCount = (reply.match(/```/g) || []).length;

  if (fencedCount > closingCount) {
    return { isValid: false, issue: 'Unclosed JSON block' };
  }

  const openBraces = (reply.match(/\{/g) || []).length;
  const closeBraces = (reply.match(/\}/g) || []).length;

  if (openBraces > closeBraces) {
    return { isValid: false, issue: 'Incomplete JSON structure' };
  }

  return { isValid: true };
};

export const useChatApi = () => {
  const { api } = useInventory();

  const sendMessage = async (message: string) => {
    try {
      const { data } = await api.post<{ reply: string }>("/api/v1/forecast/chat", {
        message: message.trim(),
      });

      const reply = data?.reply ?? "No response.";

      const validation = validateResponse(reply);
      if (!validation.isValid) {
        console.warn('Response validation failed:', validation.issue, reply.substring(0, 200) + '...');
        toast.error("Response Error", {
          description: `Received incomplete response: ${validation.issue}`
        });

        return {
          type: 'text' as const,
          content: "Sorry, I received an incomplete response. Please try again.",
          isProcessing: false,
          debugInfo: { source: 'validation_error', message: validation.issue }
        };
      }

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
