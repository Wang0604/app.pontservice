import type { ILlmProvider, ChatMessage, ChatOptions } from './types';

/**
 * DeepSeek Chat provider via OpenAI-compatible REST API.
 * Endpoint: https://api.deepseek.com/chat/completions
 */
export class DeepSeekLlmProvider implements ILlmProvider {
  readonly id = 'deepseek';

  private getApiKey() {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) throw new Error('DEEPSEEK_API_KEY not set');
    return apiKey;
  }

  async chat(messages: ChatMessage[], opts?: ChatOptions): Promise<string> {
    const res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.getApiKey()}`,
      },
      body: JSON.stringify({
        model: opts?.model ?? 'deepseek-chat',
        messages,
        temperature: opts?.temperature ?? 0.2,
        max_tokens: opts?.maxTokens ?? 4096,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`DeepSeek chat failed: ${res.status} ${errText}`);
    }
    const json = (await res.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    return json.choices[0]?.message.content ?? '';
  }

  async chatJson<T = unknown>(messages: ChatMessage[], opts?: ChatOptions): Promise<T> {
    const res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.getApiKey()}`,
      },
      body: JSON.stringify({
        model: opts?.model ?? 'deepseek-chat',
        messages,
        temperature: opts?.temperature ?? 0.2,
        max_tokens: opts?.maxTokens ?? 4096,
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`DeepSeek chat failed: ${res.status} ${errText}`);
    }
    const json = (await res.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    return JSON.parse(json.choices[0]?.message.content ?? '{}') as T;
  }
}

export const deepseekLlmProvider = new DeepSeekLlmProvider();
