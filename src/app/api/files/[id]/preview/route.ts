import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { files } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth/helpers';
import { storageProvider } from '@/lib/providers/storage/r2';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireUser();

  const [file] = await db.select().from(files).where(eq(files.id, params.id));
  if (!file) return NextResponse.json({ error: 'file not found' }, { status: 404 });

  const isOwner = file.userId === session.user.id;
  const isAdmin = (session.user as unknown as { role?: string }).role === 'admin';
  if (!isOwner && !isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const url = await storageProvider.getPresignedDownloadUrl(file.storageKey, 300);
  return NextResponse.redirect(url, { status: 307 });
}
