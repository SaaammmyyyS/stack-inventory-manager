import React from 'react';
import { DebugInfo } from "@/types/chat";

interface ErrorFallbackMessageProps {
  content: string;
  debugInfo?: DebugInfo;
}

export const ErrorFallbackMessage: React.FC<ErrorFallbackMessageProps> = ({ content, debugInfo }) => (
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
