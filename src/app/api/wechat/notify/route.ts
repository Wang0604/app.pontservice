import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { WeChatPaymentProvider } from '@/lib/payments/wechat';
import { markOrderPaid } from '@/lib/payments/orders';

function success() {
  return NextResponse.json({ code: 'SUCCESS', message: '成功' });
}

function failure(message: string) {
  return NextResponse.json({ code: 'FAIL', message }, { status: 500 });
}

export async function POST(req: Request) {
  const rawBody = await req.text();

  try {
    const provider = new WeChatPaymentProvider();
    if (!provider.verifyNotify(req.headers, rawBody)) {
      console.error('[wechat-notify] invalid signature');
      return failure('签名错误');
    }

    const payload = JSON.parse(rawBody) as {
      id?: string;
      resource?: {
        ciphertext: string;
        nonce: string;
        associated_data?: string;
      };
    };

    if (!payload.resource) return failure('缺少通知资源');
    const transaction = provider.decryptResource(payload.resource);
    const outTradeNo = transaction.out_trade_no;
    if (!outTradeNo) return failure('缺少商户订单号');

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.wechatOutTradeNo, outTradeNo))
      .limit(1);
    if (!order) return failure('订单不存在');

    const paidFen = transaction.amount?.payer_total ?? transaction.amount?.total;
    if (typeof paidFen !== 'number') return failure('缺少支付金额');

    const paidAmountCny = (paidFen / 100).toFixed(2);
    if (Number(order.actualAmountCny).toFixed(2) !== paidAmountCny) {
      console.error('[wechat-notify] amount mismatch', {
        outTradeNo,
        expected: order.actualAmountCny,
        received: paidAmountCny,
      });
      return failure('金额不匹配');
    }

    if (transaction.trade_state === 'SUCCESS') {
      await markOrderPaid({
        orderId: order.id,
        provider: 'wechat',
        tradeNo: transaction.transaction_id,
        paidAmountCny,
        rawPayload: transaction,
        eventId: payload.id ?? `${outTradeNo}-${transaction.transaction_id}`,
      });
    }

    return success();
  } catch (err) {
    console.error('[wechat-notify] failed', err);
    return failure('处理失败');
  }
}
