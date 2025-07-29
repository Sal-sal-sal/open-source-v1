import React, { useState } from 'react';
import type { ChatMessage } from '../types';
import { User, Bot, ChevronDown, ChevronUp } from 'lucide-react';

interface MessageListProps {
  messages: ChatMessage[];
}

export const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  const [expandedMessages, setExpandedMessages] = useState<Set<number>>(new Set());
  const MAX_PREVIEW_LENGTH = 200; // Максимальная длина предварительного просмотра

  const toggleMessage = (index: number) => {
    const newExpanded = new Set(expandedMessages);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedMessages(newExpanded);
  };

  const isLongMessage = (content: string) => content.length > MAX_PREVIEW_LENGTH;
  const shouldShowToggle = (content: string) => isLongMessage(content);

  return (
    <div 
      className="flex-1 overflow-y-auto p-4 space-y-4 message-list" 
      style={{ 
        maxHeight: '100%', 
        overflow: 'auto',
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(255, 255, 255, 0.3) transparent'
      }}
    >
      {messages.map((message, index) => {
        const isExpanded = expandedMessages.has(index);
        const isLong = shouldShowToggle(message.content);
        const displayContent = isLong && !isExpanded 
          ? message.content.substring(0, MAX_PREVIEW_LENGTH) + '...'
          : message.content;

        return (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} transition-all duration-700 ease-out`}
            style={{
              animationDelay: `${index * 100}ms`,
              animationFillMode: 'both',
              maxWidth: '100%',
              overflow: 'hidden'
            }}
          >
            <div
              className={`
                max-w-[70%] rounded-lg p-4 backdrop-blur-sm transition-all duration-700 ease-out overflow-hidden
                ${message.role === 'user' 
                  ? 'bg-blue-600/80 text-white border border-blue-400/30' 
                  : 'bg-white/20 text-white border border-white/30'
                }
                animate-in slide-in-from-bottom-4 fade-in
              `}
              style={{
                animationDelay: `${index * 100 + 200}ms`,
                animationDuration: '700ms',
                animationFillMode: 'both',
                maxWidth: '70%',
                overflow: 'hidden',
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
                wordBreak: 'break-word',
                boxSizing: 'border-box',
                width: 'fit-content',
                display: 'block',
                minWidth: '0',
                flexShrink: '1'
              }}
            >
              <div 
                className="flex items-start space-x-2" 
                style={{ 
                  maxWidth: '100%', 
                  overflow: 'hidden',
                  width: '100%',
                  boxSizing: 'border-box',
                  minWidth: '0'
                }}
              >
                <div className="flex-shrink-0 mt-1" style={{ flexShrink: '0', minWidth: '20px' }}>
                  {message.role === 'user' ? (
                    <User className="w-5 h-5" />
                  ) : (
                    <Bot className="w-5 h-5" />
                  )}
                </div>
                <div 
                  className="flex-1 min-w-0" 
                  style={{ 
                    maxWidth: '100%', 
                    overflow: 'hidden',
                    flex: '1 1 auto',
                    minWidth: '0',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                >
                  <p 
                    className="text-sm font-medium mb-1 opacity-90 truncate" 
                    style={{ 
                      maxWidth: '100%', 
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      boxSizing: 'border-box'
                    }}
                  >
                    {message.role === 'user' ? 'Вы' : 'AI Учитель'}
                  </p>
                  <div 
                    className="whitespace-pre-wrap break-words overflow-hidden"
                    style={{
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word',
                      wordBreak: 'break-word',
                      maxWidth: '100%',
                      overflow: 'hidden',
                      boxSizing: 'border-box',
                      width: '100%',
                      display: 'block',
                      whiteSpace: 'pre-wrap',
                      minWidth: '0',
                      lineHeight: '1.5'
                    }}
                  >
                    {displayContent}
                  </div>
                  
                  {/* Кнопка разворачивания/сворачивания */}
                  {isLong && (
                    <button
                      onClick={() => toggleMessage(index)}
                      className="mt-2 text-xs text-white/70 hover:text-white/90 transition-colors flex items-center space-x-1"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-3 h-3" />
                          <span>Скрыть</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3 h-3" />
                          <span>Показать больше</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}; 