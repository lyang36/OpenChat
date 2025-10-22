import React, { useState } from 'react';
import { Chat } from '../types';
import { Plus, MessageSquare, Trash2, Edit2, Check, X, Settings } from 'lucide-react';

interface SidebarProps {
  chats: Chat[];
  currentChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onCreateChat: () => void;
  onDeleteChat: (chatId: string) => void;
  onUpdateChatTitle: (chatId: string, title: string) => void;
  onOpenSettings: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  chats,
  currentChatId,
  onSelectChat,
  onCreateChat,
  onDeleteChat,
  onUpdateChatTitle,
  onOpenSettings,
  isOpen,
  onClose,
}) => {
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleEditStart = (chat: Chat) => {
    setEditingChatId(chat.id);
    setEditTitle(chat.title);
  };

  const handleEditSave = () => {
    if (editingChatId && editTitle.trim()) {
      onUpdateChatTitle(editingChatId, editTitle.trim());
    }
    setEditingChatId(null);
    setEditTitle('');
  };

  const handleEditCancel = () => {
    setEditingChatId(null);
    setEditTitle('');
  };

  return (
    <div className={`
      fixed lg:relative lg:translate-x-0 z-50
      w-64 bg-gray-900 text-white flex flex-col h-full
      transition-transform duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <button
          onClick={onCreateChat}
          className="w-full flex items-center gap-2 px-3 py-3 lg:py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors touch-manipulation"
        >
          <Plus size={16} />
          New Chat
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto p-2">
        {chats.map((chat) => (
          <div
            key={chat.id}
            className={`group relative flex items-center gap-2 p-3 lg:p-2 rounded-lg cursor-pointer transition-colors touch-manipulation ${
              currentChatId === chat.id
                ? 'bg-gray-700'
                : 'hover:bg-gray-800'
            }`}
          >
            <MessageSquare size={16} className="flex-shrink-0" />
            
            {editingChatId === chat.id ? (
              <div className="flex-1 flex items-center gap-1">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="flex-1 bg-gray-600 text-white px-2 py-1 rounded text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleEditSave();
                    if (e.key === 'Escape') handleEditCancel();
                  }}
                  autoFocus
                />
                <button
                  onClick={handleEditSave}
                  className="p-1 hover:bg-gray-600 rounded"
                >
                  <Check size={12} />
                </button>
                <button
                  onClick={handleEditCancel}
                  className="p-1 hover:bg-gray-600 rounded"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <>
                <div
                  className="flex-1 truncate text-sm"
                  onClick={() => onSelectChat(chat.id)}
                >
                  {chat.title}
                </div>
                <div className="hidden group-hover:flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditStart(chat);
                    }}
                    className="p-1 hover:bg-gray-600 rounded"
                  >
                    <Edit2 size={12} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteChat(chat.id);
                    }}
                    className="p-1 hover:bg-gray-600 rounded text-red-400"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-2 px-3 py-3 lg:py-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-300 hover:text-white touch-manipulation"
        >
          <Settings size={16} />
          Settings
        </button>
      </div>
    </div>
  );
};