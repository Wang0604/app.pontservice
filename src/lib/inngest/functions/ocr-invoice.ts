import { eq } from 'drizzle-orm';
import fs from 'node:fs/promises';
import path from 'node:path';
import { inngest } from '../client';
import { db } from '@/lib/db';
import { toolRuns, files } from '@/lib/db/schema';
import { storageProvider } from '@/lib/providers/storage/r2';
import { deepseekOcrProvider } from '@/lib/providers/ocr/deepseek';
import { anthropicLlmProvider } from '@/lib/providers/llm/anthropic';
import { refundCredits } from '@/lib/credits';

export const OCR_INVOICE_COST = 5;

const PROMPT_FILE = path.join(process.cwd(), 'prompts/ocr-invoice-v1.md');

async function loadPrompt(): Promise<string> {
  return await fs.readFile(PROMPT_FILE, 'utf8');
}

export const ocrInvoiceFunction = inngest.createFunction(
  { id: 'tool-ocr-invoice', retries: 1 },
  { event: 'tool/ocr-invoice.run' },
  async ({ event, step }) => {
    const { runId, userId, fileId } = event.data as {
      runId: string;
      userId: string;
      fileId: string;
    };

    await step.run('mark running', async () => {
      await db
        .update(toolRuns)
        .set({ status: 'running', startedAt: new Date() })
        .where(eq(toolRuns.id, runId));
    });

    try {
      const file = await step.run('load file', async () => {
        const [row] = await db.select().from(files).where(eq(files.id, fileId));
        if (!row) throw new Error('file not found');
        return row;
      });

      const fileUrl = await step.run('presign file url', async () => {
        return await storageProvider.getPresignedDownloadUrl(file.storageKey, 600);
      });

      const ocr = await step.run('deepseek ocr', async () => {
        return await deepseekOcrProvider.parse({ fileUrl, mimeType: file.mimeType });
      });

      const structured = await step.run('llm structure', async () => {
        const promptText = await loadPrompt();
        return await anthropicLlmProvider.chatJson([
          { role: 'system', content: promptText },
          { role: 'user', content: `OCR raw text:\n\n${ocr.text}` },
        ]);
      });

      await step.run('save output', async () => {
        await db
          .update(toolRuns)
          .set({
            status: 'succeeded',
            output: structured as Record<string, unknown>,
            completedAt: new Date(),
          })
          .where(eq(toolRuns.id, runId));
      });

      return { runId, status: 'succeeded' };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);

      await step.run('refund on failure', async () => {
        await db
          .update(toolRuns)
          .set({
            status: 'failed',
            error: message,
            completedAt: new Date(),
          })
          .where(eq(toolRuns.id, runId));

        await refundCredits({
          userId,
          amount: OCR_INVOICE_COST,
          reason: `OCR 工具失败自动退还 (run=${runId})`,
          toolRunId: runId,
        }).catch((e) => console.error('[ocr-invoice] refund failed', e));
      });

      throw err;
    }
  },
);
