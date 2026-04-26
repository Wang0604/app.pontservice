import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { getPaymentProvider } from '@/lib/payments';
import { markOrderPaid } from '@/lib/payments/orders';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const [order] = await db.select().from(orders).where(eq(orders.id, params.id)).limit(1);
  if (!order) return NextResponse.json({ error: 'order not found' }, { status: 404 });

  let currentOrder = order;
  if (order.paymentStatus !== 'paid' && order.wechatOutTradeNo && order.paymentProvider === 'wechat') {
    try {
      const result = await getPaymentProvider().queryPayment(order.wechatOutTradeNo);
      if (result.status === 'paid' && result.paidAmountCny) {
        currentOrder = await markOrderPaid({
          orderId: order.id,
          provider: 'wechat',
          tradeNo: result.tradeNo,
          paidAmountCny: result.paidAmountCny,
        });
      }
    } catch (err) {
      console.error('[payment-status] query failed', err);
    }
  }

  return NextResponse.json({
    ok: true,
    orderId: currentOrder.id,
    orderNumber: currentOrder.orderNumber,
    paymentStatus: currentOrder.paymentStatus,
    paperworkStatus: currentOrder.paperworkStatus,
    paidAt: currentOrder.paidAt,
    amountCny: currentOrder.actualAmountCny,
  });
}
