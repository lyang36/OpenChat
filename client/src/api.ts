import axios from 'axios';
import { Chat, Message, ApiResponse, Settings } from './types';

const API_BASE_URL = '/api';

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
};