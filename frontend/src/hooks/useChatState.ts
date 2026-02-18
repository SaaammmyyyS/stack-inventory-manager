import { useState, useRef, useEffect } from 'react';
import { Message, ChatState } from '@/types/chat';

export const useChatState = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "I'm your Inventory Management Agent. Ask me about stock levels, recent movements, item forecasts, or to record a stock adjustment." },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [open, setOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const addMessage = (message: Message) => {
    setMessages(prev => [...prev, message]);
  };

  const addUserMessage = (content: string) => {
    addMessage({ role: "user", content });
  };

  const addAssistantMessage = (message: Omit<Message, 'role'>) => {
    addMessage({ role: "assistant", ...message });
  };

  const clearMessages = () => {
    setMessages([
      { role: "assistant", content: "I'm your Inventory Management Agent. Ask me about stock levels, recent movements, item forecasts, or to record a stock adjustment." },
    ]);
  };

  const toggleDebugMode = () => {
    setDebugMode(prev => !prev);
  };

  const resetInput = () => {
    setInput("");
  };

  return {
    messages,
    input,
    isLoading,
    debugMode,
    open,
    scrollRef,
    
    setInput,
    setIsLoading,
    setOpen,
    addMessage,
    addUserMessage,
    addAssistantMessage,
    clearMessages,
    toggleDebugMode,
    resetInput,
  };
};
