import React from 'react';
import { Bot, User, Loader2 } from 'lucide-react';
import { Message } from '../../types/chat';
import { ConversationalMessage } from './ConversationalMessage';
import { TransactionMessage } from './TransactionMessage';
import { ForecastMessage } from './ForecastMessage';
import { InventoryMessage } from './InventoryMessage';
import { DebugResponse } from './DebugResponse';
import { ErrorFallbackMessage } from './ErrorFallbackMessage';
import {
  isUserMessage,
  isAssistantMessage,
  isProcessingMessage,
  isConversationalMessage,
  shouldShowDebugInfo,
  shouldShowErrorFallback
} from '../../utils/chatHelpers';

interface MessageRendererProps {
  message: Message;
  debugMode: boolean;
}

export const MessageRenderer: React.FC<MessageRendererProps> = ({ message, debugMode }) => {
  if (isUserMessage(message)) {
    return (
      <>
        <div className="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm bg-blue-600 text-white">
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-600">
          <User size={14} />
        </div>
      </>
    );
  }

  if (isAssistantMessage(message)) {
    if (isProcessingMessage(message)) {
      return (
        <>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
            <Bot size={14} />
          </div>
          <div className="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm bg-white border border-slate-200 text-slate-800 shadow-sm">
            <div>
              <p className="whitespace-pre-wrap break-words mb-3">{message.content}</p>
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                <span className="text-xs text-slate-500">Processing your request...</span>
              </div>
            </div>
          </div>
        </>
      );
    }

    if (isConversationalMessage(message)) {
      return (
        <>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
            <Bot size={14} />
          </div>
          <div className="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm bg-white border border-slate-200 text-slate-800 shadow-sm">
            <div>
              <p className="whitespace-pre-wrap break-words mb-3">{message.content}</p>
              <ConversationalMessage content={message.content} />
            </div>
          </div>
        </>
      );
    }

    if (message.type === 'transactions' && message.data) {
      return (
        <>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
            <Bot size={14} />
          </div>
          <div className="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm bg-white border border-slate-200 text-slate-800 shadow-sm">
            <div>
              <p className="whitespace-pre-wrap break-words mb-3">{message.content}</p>
              <TransactionMessage data={message.data} />
            </div>
          </div>
        </>
      );
    }

    if (message.type === 'inventory' && message.data) {
      return (
        <>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
            <Bot size={14} />
          </div>
          <div className="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm bg-white border border-slate-200 text-slate-800 shadow-sm">
            <div>
              <p className="whitespace-pre-wrap break-words mb-3">{message.content}</p>
              <InventoryMessage data={message.data} />
            </div>
          </div>
        </>
      );
    }

    if (message.type === 'forecast' && message.data) {
      return (
        <>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
            <Bot size={14} />
          </div>
          <div className="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm bg-white border border-slate-200 text-slate-800 shadow-sm">
            <div>
              <p className="whitespace-pre-wrap break-words mb-3">{message.content}</p>
              <ForecastMessage data={message.data} />
            </div>
          </div>
        </>
      );
    }

    if (shouldShowDebugInfo(message, debugMode)) {
      return (
        <>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
            <Bot size={14} />
          </div>
          <div className="debug-response">
            <DebugResponse content={message.content} parsed={message.debugInfo} />
          </div>
        </>
      );
    }

    if (shouldShowErrorFallback(message)) {
      return (
        <>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
            <Bot size={14} />
          </div>
          <div className="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm bg-white border border-slate-200 text-slate-800 shadow-sm">
            <ErrorFallbackMessage content={message.content} debugInfo={message.debugInfo} />
          </div>
        </>
      );
    }

    return (
      <>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
          <Bot size={14} />
        </div>
        <div className="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm bg-white border border-slate-200 text-slate-800 shadow-sm">
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>
      </>
    );
  }

  return null;
};
