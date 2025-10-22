import axios from 'axios';
import { Chat, Message, ApiResponse, Settings, ACEStats, ACEStrategy } from './types';

const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? '/api' 
  : 'https://app-2-runtime-cpqhovvammucfkds-worker1.prod-runtime.app.kepilot.ai/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const chatApi = {
  // Get all chats
  getChats: async (): Promise<Chat[]> => {
    const response = await api.get('/chats');
    return response.data;
  },

  // Create new chat
  createChat: async (title?: string): Promise<Chat> => {
    const response = await api.post('/chats', { title });
    return response.data;
  },

  // Get chat messages
  getChatMessages: async (chatId: string): Promise<Message[]> => {
    const response = await api.get(`/chats/${chatId}/messages`);
    return response.data;
  },

  // Send message
  sendMessage: async (chatId: string, message: string, file?: File): Promise<ApiResponse> => {
    const formData = new FormData();
    formData.append('message', message);
    if (file) {
      formData.append('file', file);
    }

    const response = await api.post(`/chats/${chatId}/messages`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete chat
  deleteChat: async (chatId: string): Promise<void> => {
    await api.delete(`/chats/${chatId}`);
  },

  // Update chat title
  updateChatTitle: async (chatId: string, title: string): Promise<void> => {
    await api.put(`/chats/${chatId}`, { title });
  },

  // Get settings
  getSettings: async (): Promise<Settings> => {
    const response = await api.get('/settings');
    return response.data;
  },

  // Update settings
  updateSettings: async (settings: Partial<Settings>): Promise<void> => {
    await api.put('/settings', { settings });
  },

  // ACE-related endpoints
  
  // Get ACE statistics for a chat
  getACEStats: async (chatId: string): Promise<ACEStats> => {
    const response = await api.get(`/chats/${chatId}/ace/stats`);
    return response.data;
  },

  // Get learned strategies for a chat
  getACEStrategies: async (chatId: string, limit: number = 10): Promise<{ enabled: boolean; strategies: ACEStrategy[] }> => {
    const response = await api.get(`/chats/${chatId}/ace/strategies?limit=${limit}`);
    return response.data;
  },

  // Clear ACE playbook for a chat
  clearACEPlaybook: async (chatId: string): Promise<void> => {
    await api.delete(`/chats/${chatId}/ace/playbook`);
  },

  // Get ACE status
  getACEStatus: async (): Promise<{ enabled: boolean; initialized: boolean; model: string | null }> => {
    const response = await api.get('/ace/status');
    return response.data;
  },
};