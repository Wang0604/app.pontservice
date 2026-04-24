import type { IOcrProvider, OcrInput, OcrResult } from './types';

/**
 * DeepSeek OCR provider.
 * Uses DeepSeek's vision-capable model to extract text from images/PDFs.
 *
 * For PDF input we rely on the model's ability to accept the file via URL.
 * If DeepSeek API doesn't support PDF natively, fall back to 
 * converting to images before sending.
 */
export class DeepSeekOcrProvider implements IOcrProvider {
  readonly id = 'deepseek-ocr';

  async parse(input: OcrInput): Promise<OcrResult> {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) throw new Error('DEEPSEEK_API_KEY not set');

    const res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: '你是一个精确的 OCR 助手。请提取图片或 PDF 中的所有文字，保持原始顺序，不要做任何解读或总结。',
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: '请提取这张图片/文档的所有文字' },
              { type: 'image_url', image_url: { url: input.fileUrl } },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 8000,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`DeepSeek OCR failed: ${res.status} ${errText}`);
    }

    const json = (await res.json()) as {
      choices: Array<{ message: { content: string } }>;
    };

    return {
      text: json.choices[0]?.message.content ?? '',
      rawResponse: json,
    };
  }
}

export const deepseekOcrProvider = new DeepSeekOcrProvider();
