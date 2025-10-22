import React, { useState, useRef } from 'react';
import { Send, Paperclip, X } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (message: string, file?: File) => void;
  disabled?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, disabled }) => {
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() || selectedFile) {
      onSendMessage(message.trim(), selectedFile || undefined);
      setMessage('');
      setSelectedFile(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="border-t bg-white p-3 lg:p-4">
      {selectedFile && (
        <div className="mb-2 flex items-center gap-2 text-sm text-gray-600 bg-gray-100 p-2 rounded">
          <Paperclip size={14} />
          <span className="flex-1 truncate">{selectedFile.name}</span>
          <button
            onClick={removeFile}
            className="p-1 hover:bg-gray-200 rounded flex-shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          accept=".txt,.pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.csv,.json,.md"
        />
        
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 lg:p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
          disabled={disabled}
        >
          <Paperclip size={18} className="lg:w-5 lg:h-5" />
        </button>
        
        <div className="flex-1 relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="w-full p-3 pr-12 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
            rows={1}
            style={{ minHeight: '44px', maxHeight: '120px' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            disabled={disabled}
          />
          
          <button
            type="submit"
            disabled={disabled || (!message.trim() && !selectedFile)}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-blue-500 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors touch-manipulation"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
};