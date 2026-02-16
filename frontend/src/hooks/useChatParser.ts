import { useCallback } from 'react';
import { formatChatResponse } from "../utils/chatParsers";
import { ChatResponse } from "../types/chat";

export const useChatParser = () => {
  const parseResponse = useCallback((content: string): ChatResponse => {
    return formatChatResponse(content);
  }, []);

  return {
    parseResponse,
  };
};
