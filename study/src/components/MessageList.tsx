import React from 'react';
import type { ChatMessage } from '../types';
import { User, Bot } from 'lucide-react';

interface MessageListProps {
  messages: ChatMessage[];
}

export const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message, index) => (
        <div
          key={index}
          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`
              max-w-[70%] rounded-lg p-4 
              ${message.role === 'user' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-800'
              }
            `}
          >
            <div className="flex items-start space-x-2">
              <div className="flex-shrink-0 mt-1">
                {message.role === 'user' ? (
                  <User className="w-5 h-5" />
                ) : (
                  <Bot className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">
                  {message.role === 'user' ? 'Вы' : 'AI Учитель'}
                </p>
                <div className="whitespace-pre-wrap break-words">
                  {message.content}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}; 