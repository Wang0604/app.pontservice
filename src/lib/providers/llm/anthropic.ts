import Anthropic from '@anthropic-ai/sdk';
import type { ILlmProvider, ChatMessage, ChatOptions } from './types';

export class AnthropicLlmProvider implements ILlmProvider {
  readonly id = 'anthropic';
  private client: Anthropic | null = null;

  private getClient() {
    if (!this.client) {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');
      this.client = new Anthropic({ apiKey });
    }
    return this.client;
  }

  async chat(messages: ChatMessage[], opts?: ChatOptions): Promise<string> {
    const system = messages.find((m) => m.role === 'system')?.content;
    const userMessages = messages.filter((m) => m.role !== 'system');

    const res = await this.getClient().messages.create({
      model: opts?.model ?? 'claude-3-5-sonnet-20241022',
      max_tokens: opts?.maxTokens ?? 4096,
      temperature: opts?.temperature ?? 0.2,
      system,
      messages: userMessages.map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
    });

    const textBlock = res.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') throw new Error('no text in Anthropic response');
    return textBlock.text;
  }

  async chatJson<T = unknown>(messages: ChatMessage[], opts?: ChatOptions): Promise<T> {
    const augmented: ChatMessage[] = [
      ...messages,
      {
        role: 'user',
        content: '请仅返回纯 JSON，不要包含 markdown 代码块或任何说明文字。',
      },
    ];
    const text = await this.chat(augmented, opts);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('LLM output did not contain JSON');
    return JSON.parse(jsonMatch[0]) as T;
  }
}

export const anthropicLlmProvider = new AnthropicLlmProvider();
