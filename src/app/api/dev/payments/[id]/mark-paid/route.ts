import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { getPaymentProviderName } from '@/lib/payments';
import { markOrderPaid } from '@/lib/payments/orders';

export async function POST(_: Request, { params }: { params: { id: string } }) {
  if (getPaymentProviderName() !== 'stub') {
    return NextResponse.json({ error: 'stub payments are disabled' }, { status: 404 });
  }

  const [order] = await db.select().from(orders).where(eq(orders.id, params.id)).limit(1);
  if (!order) return NextResponse.json({ error: 'order not found' }, { status: 404 });

  const updated = await markOrderPaid({
    orderId: order.id,
    provider: 'stub',
    tradeNo: `STUB-${Date.now()}`,
    paidAmountCny: order.actualAmountCny,
    rawPayload: { source: 'stub-mark-paid' },
    eventId: `stub-${order.id}-${Date.now()}`,
  });

  return NextResponse.json({ ok: true, order: updated });
}
