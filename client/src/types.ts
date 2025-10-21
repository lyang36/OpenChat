export interface Chat {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  chat_id: string;
  role: 'user' | 'assistant';
  content: string;
  file_path?: string;
  file_name?: string;
  created_at: string;
}

export interface ApiResponse {
  userMessage: Message;
  assistantMessage: Message;
}

export interface Settings {
  openai_api_key: string;
  provider: string;
  model: string;
  temperature: string;
  max_tokens: string;
  system_message: string;
}