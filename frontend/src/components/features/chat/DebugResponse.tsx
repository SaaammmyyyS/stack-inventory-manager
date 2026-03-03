import React from 'react';
import { DebugResponseData } from '@/types/chat';

interface DebugResponseProps {
  content: string;
  parsed: DebugResponseData;
}

export const DebugResponse: React.FC<DebugResponseProps> = ({ content, parsed }) => (
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
