export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export interface ILlmProvider {
  readonly id: string;
  chat(messages: ChatMessage[], opts?: ChatOptions): Promise<string>;
  chatJson<T = unknown>(messages: ChatMessage[], opts?: ChatOptions): Promise<T>;
}
