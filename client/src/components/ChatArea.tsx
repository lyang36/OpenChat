import React, { useEffect, useRef } from 'react';
import { Message } from '../types';
import { ChatMessage } from './ChatMessage';
import { MessageInput } from './MessageInput';
import { Loader, Menu } from 'lucide-react';

interface ChatAreaProps {
  messages: Message[];
  onSendMessage: (message: string, file?: File) => void;
  loading?: boolean;
  currentChatId: string | null;
  onToggleSidebar: () => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  onSendMessage,
  loading,
  currentChatId,
  onToggleSidebar,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!currentChatId) {
    return (
      <div className="flex-1 flex flex-col bg-gray-50">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center p-4 bg-white border-b">
          <button
            onClick={onToggleSidebar}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu size={20} />
          </button>
          <h1 className="ml-3 text-lg font-semibold text-gray-800">ChatGPT Clone</h1>
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center px-4">
            <h2 className="text-xl lg:text-2xl font-semibold text-gray-700 mb-2">
              Welcome to ChatGPT Clone
            </h2>
            <p className="text-gray-500 text-sm lg:text-base">
              Select a chat from the sidebar or create a new one to get started.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center p-4 bg-white border-b">
        <button
          onClick={onToggleSidebar}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Menu size={20} />
        </button>
        <h1 className="ml-3 text-lg font-semibold text-gray-800">Chat</h1>
      </div>
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                Start a conversation
              </h3>
              <p className="text-gray-500">
                Send a message to begin chatting with AI.
              </p>
            </div>
          </div>
        ) : (
          <div>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {loading && (
              <div className="flex gap-4 p-4 bg-white">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                    <Loader size={16} className="text-white animate-spin" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-gray-500">AI is thinking...</div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <MessageInput onSendMessage={onSendMessage} disabled={loading} />
    </div>
  );
};