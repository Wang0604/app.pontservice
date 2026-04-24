import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { db } from '@/lib/db';
import { files } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth/helpers';
import { storageProvider } from '@/lib/providers/storage/r2';

const schema = z.object({
  filename: z.string().max(200),
  contentType: z.string().max(100),
  sizeBytes: z.number().int().positive().max(10 * 1024 * 1024),
  purpose: z.enum(['ocr-input', 'payment-receipt', 'other']).default('other'),
  orderId: z.string().uuid().optional(),
});

export async function POST(req: NextRequest) {
  const session = await requireUser();

  const body = schema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) {
    return NextResponse.json({ error: '参数不对', details: body.error.flatten() }, { status: 400 });
  }

  const key = `uploads/${session.user.id}/${body.data.purpose}/${randomUUID()}-${sanitizeFilename(body.data.filename)}`;

  const presigned = await storageProvider.getPresignedUploadUrl({
    key,
    contentType: body.data.contentType,
    maxBytes: body.data.sizeBytes,
    expiresInSeconds: 600,
  });

  const expiresAt = body.data.purpose === 'payment-receipt'
    ? null
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await db.insert(files).values({
    userId: session.user.id,
    storageKey: key,
    filename: body.data.filename,
    sizeBytes: body.data.sizeBytes,
    mimeType: body.data.contentType,
    uploadStatus: 'pending',
    purpose: body.data.purpose,
    expiresAt,
  });

  return NextResponse.json({
    ok: true,
    url: presigned.url,
    key: presigned.key,
    headers: presigned.headers,
  });
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100);
}
