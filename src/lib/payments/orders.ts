import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { leads, orders, paymentEvents } from '@/lib/db/schema';

export async function markOrderPaid(params: {
  orderId: string;
  provider: string;
  tradeNo?: string;
  paidAmountCny: string;
  rawPayload?: Record<string, unknown>;
  eventId?: string;
}) {
  return await db.transaction(async (tx) => {
    if (params.eventId) {
      await tx
        .insert(paymentEvents)
        .values({
          eventId: params.eventId,
          provider: params.provider,
          orderId: params.orderId,
          rawPayload: params.rawPayload ?? {},
          processed: true,
          processedAt: new Date(),
        })
        .onConflictDoNothing();
    }

    const [order] = await tx.select().from(orders).where(eq(orders.id, params.orderId)).limit(1);
    if (!order) throw new Error('order not found');

    const now = new Date();
    const [updated] = await tx
      .update(orders)
      .set({
        paymentStatus: 'paid',
        paymentProvider: params.provider,
        wechatTransactionId: params.tradeNo,
        actualAmountCny: params.paidAmountCny,
        paidAt: order.paidAt ?? now,
        paperworkStatus: 'payment_submitted',
        updatedAt: now,
      })
      .where(eq(orders.id, params.orderId))
      .returning();

    if (order.leadId) {
      await tx
        .update(leads)
        .set({ status: 'paid', updatedAt: now })
        .where(eq(leads.id, order.leadId));
    }

    return updated;
  });
}
