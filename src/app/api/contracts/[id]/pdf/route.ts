import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { contracts } from '@/lib/db/schema';
import { storageProvider } from '@/lib/providers/storage/r2';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const rows = await db.select().from(contracts).where(eq(contracts.id, params.id)).limit(1);
  if (rows.length === 0) return NextResponse.json({ error: '合同不存在' }, { status: 404 });
  const contract = rows[0];

  if (!contract.pdfR2Key) {
    return NextResponse.json({ error: '合同 PDF 尚未生成，请稍后再试' }, { status: 409 });
  }

  const url = await storageProvider.getPresignedDownloadUrl(contract.pdfR2Key, 600);
  return NextResponse.redirect(url, { status: 307 });
}
