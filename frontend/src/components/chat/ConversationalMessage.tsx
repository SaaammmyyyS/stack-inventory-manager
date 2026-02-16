import React from 'react';

interface ConversationalMessageProps {
  content: string;
}

export const ConversationalMessage: React.FC<ConversationalMessageProps> = ({ content }) => (
  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
    <div className="flex items-center gap-2 mb-2">
      <div className="w-2 h-2 rounded-full bg-blue-500" />
      <span className="text-sm font-medium text-blue-800">Assistant Response</span>
    </div>
    <div className="text-sm text-gray-700 whitespace-pre-wrap">{content}</div>
  </div>
);
