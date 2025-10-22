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
  ace?: {
    enabled: boolean;
    stats?: {
      reflection: string | null;
      learned_strategies: number;
      playbook_size: number;
    };
    context_comparison?: {
      ace_context_length: number;
      regular_context_length: number;
      reduction_percentage: number;
      tokens_saved: number;
    };
  };
}

export interface Settings {
  openai_api_key: string;
  provider: string;
  model: string;
  temperature: string;
  max_tokens: string;
  system_message: string;
  ace_enabled: string;
  ace_model: string;
}

export interface ACEStats {
  enabled: boolean;
  stats?: {
    total_strategies: number;
    helpful_strategies: number;
    harmful_strategies: number;
    neutral_strategies: number;
    last_updated: string;
  };
}

export interface ACEStrategy {
  content: string;
  type: 'helpful' | 'harmful' | 'neutral';
}