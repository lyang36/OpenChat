import React from 'react';
import { Message } from '../types';
import { User, Bot, Paperclip } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 lg:gap-4 p-3 lg:p-4 ${isUser ? 'bg-gray-50' : 'bg-white'}`}>
      <div className="flex-shrink-0">
        <div className={`w-7 h-7 lg:w-8 lg:h-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-blue-500' : 'bg-green-500'
        }`}>
          {isUser ? (
            <User size={14} className="lg:w-4 lg:h-4 text-white" />
          ) : (
            <Bot size={14} className="lg:w-4 lg:h-4 text-white" />
          )}
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="prose prose-sm max-w-none">
          {message.file_name && (
            <div className="mb-2 flex items-center gap-2 text-sm text-gray-600 bg-gray-100 p-2 rounded">
              <Paperclip size={14} />
              <span className="truncate">{message.file_name}</span>
            </div>
          )}
          <div className="whitespace-pre-wrap break-words text-sm lg:text-base">
            {message.content}
          </div>
        </div>
        <div className="text-xs text-gray-500 mt-2">
          {new Date(message.created_at).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};