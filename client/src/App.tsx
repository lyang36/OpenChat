import React, { useState, useEffect } from 'react';
import { Chat, Message } from './types';
import { chatApi } from './api';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import Settings from './components/Settings';

function App() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Load chats on component mount
  useEffect(() => {
    loadChats();
  }, []);

  // Load messages when chat changes
  useEffect(() => {
    if (currentChatId) {
      loadMessages(currentChatId);
    } else {
      setMessages([]);
    }
  }, [currentChatId]);

  const loadChats = async () => {
    try {
      const chatsData = await chatApi.getChats();
      setChats(chatsData);
    } catch (error) {
      console.error('Error loading chats:', error);
    }
  };

  const loadMessages = async (chatId: string) => {
    try {
      const messagesData = await chatApi.getChatMessages(chatId);
      setMessages(messagesData);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleCreateChat = async () => {
    try {
      const newChat = await chatApi.createChat();
      setChats(prev => [newChat, ...prev]);
      setCurrentChatId(newChat.id);
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  const handleSelectChat = (chatId: string) => {
    setCurrentChatId(chatId);
    setSidebarOpen(false); // Close sidebar on mobile after selecting chat
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      await chatApi.deleteChat(chatId);
      setChats(prev => prev.filter(chat => chat.id !== chatId));
      if (currentChatId === chatId) {
        setCurrentChatId(null);
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  const handleUpdateChatTitle = async (chatId: string, title: string) => {
    try {
      await chatApi.updateChatTitle(chatId, title);
      setChats(prev => prev.map(chat => 
        chat.id === chatId ? { ...chat, title } : chat
      ));
    } catch (error) {
      console.error('Error updating chat title:', error);
    }
  };

  const handleSendMessage = async (message: string, file?: File) => {
    if (!currentChatId) return;

    setLoading(true);
    try {
      const response = await chatApi.sendMessage(currentChatId, message, file);
      setMessages(prev => [...prev, response.userMessage, response.assistantMessage]);
      
      // Update chat title if it's the first message
      const currentChat = chats.find(chat => chat.id === currentChatId);
      if (currentChat && currentChat.title === 'New Chat' && message.length > 0) {
        const newTitle = message.length > 50 ? message.substring(0, 50) + '...' : message;
        handleUpdateChatTitle(currentChatId, newTitle);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 relative">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <Sidebar
        chats={chats}
        currentChatId={currentChatId}
        onSelectChat={handleSelectChat}
        onCreateChat={handleCreateChat}
        onDeleteChat={handleDeleteChat}
        onUpdateChatTitle={handleUpdateChatTitle}
        onOpenSettings={() => setShowSettings(true)}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <ChatArea
        messages={messages}
        onSendMessage={handleSendMessage}
        loading={loading}
        currentChatId={currentChatId}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />
      <Settings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}

export default App;
