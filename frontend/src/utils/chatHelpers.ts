import { Message, MessageType } from '@/types/chat';

export const isUserMessage = (message: Message): boolean => {
  return message.role === 'user';
};

export const isAssistantMessage = (message: Message): boolean => {
  return message.role === 'assistant';
};

export const isProcessingMessage = (message: Message): boolean => {
  return message.type === 'processing' && message.isProcessing === true;
};

export const isConversationalMessage = (message: Message): boolean => {
  return message.type === 'conversational';
};

export const isDataMessage = (message: Message): boolean => {
  return ['transactions', 'inventory', 'forecast'].includes(message.type || '');
};

export const hasDebugInfo = (message: Message): boolean => {
  return !!message.debugInfo;
};

export const hasData = (message: Message): boolean => {
  return !!message.data;
};

export const getMessageTypeForRendering = (message: Message): MessageType => {
  if (isProcessingMessage(message)) return 'processing';
  if (isConversationalMessage(message)) return 'conversational';
  if (message.type === 'transactions') return 'transactions';
  if (message.type === 'inventory') return 'inventory';
  if (message.type === 'forecast') return 'forecast';
  return 'text';
};

export const shouldShowDebugInfo = (message: Message, debugMode: boolean): boolean => {
  return debugMode && hasDebugInfo(message);
};

export const shouldShowErrorFallback = (message: Message): boolean => {
  return hasDebugInfo(message) && !hasData(message);
};

export const formatTimestamp = (date?: string): string => {
  if (!date) return '';
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const truncateMessage = (content: string, maxLength: number = 100): string => {
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength) + '...';
};
