import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { orders, leads } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth/helpers';
import { storageProvider } from '@/lib/providers/storage/r2';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireUser();

  const [order] = await db.select().from(orders).where(eq(orders.id, params.id));
  if (!order) return NextResponse.json({ error: 'order not found' }, { status: 404 });

  const [lead] = order.leadId
    ? await db.select().from(leads).where(eq(leads.id, order.leadId))
    : [undefined];

  const isOwner =
    order.userId === session.user.id ||
    (lead?.email && lead.email.toLowerCase() === session.user.email.toLowerCase());
  const isAdmin = (session.user as unknown as { role?: string }).role === 'admin';
  if (!isOwner && !isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  if (!order.invoiceR2Key) {
    return NextResponse.json({ error: '发票尚未生成' }, { status: 404 });
  }

  const url = await storageProvider.getPresignedDownloadUrl(order.invoiceR2Key, 600);
  return NextResponse.redirect(url, { status: 307 });
}
