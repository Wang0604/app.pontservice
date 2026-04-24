import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { toolRuns, files } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth/helpers';
import { consumeCredits } from '@/lib/credits';
import { inngest } from '@/lib/inngest/client';
import { OCR_INVOICE_COST } from '@/lib/inngest/functions/ocr-invoice';

const schema = z.object({
  fileKey: z.string(),
  filename: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await requireUser();

  const body = schema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: '参数不对' }, { status: 400 });

  const [file] = await db
    .select()
    .from(files)
    .where(eq(files.storageKey, body.data.fileKey))
    .limit(1);
  if (!file) return NextResponse.json({ error: '文件不存在' }, { status: 404 });
  if (file.userId !== session.user.id)
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  await db.update(files).set({ uploadStatus: 'uploaded' }).where(eq(files.id, file.id));

  try {
    await consumeCredits({
      userId: session.user.id,
      amount: OCR_INVOICE_COST,
      reason: 'OCR 发票识别',
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '余额不足' },
      { status: 402 },
    );
  }

  const [run] = await db
    .insert(toolRuns)
    .values({
      userId: session.user.id,
      toolSlug: 'ocr-invoice',
      status: 'pending',
      input: { fileKey: body.data.fileKey, filename: body.data.filename },
      creditsCost: OCR_INVOICE_COST,
    })
    .returning();

  await inngest.send({
    name: 'tool/ocr-invoice.run',
    data: { runId: run.id, userId: session.user.id, fileId: file.id },
  });

  return NextResponse.json({ ok: true, runId: run.id });
}
