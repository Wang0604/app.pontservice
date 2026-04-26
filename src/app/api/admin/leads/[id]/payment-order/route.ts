import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { leads, orders } from '@/lib/db/schema';
import { requireAdmin } from '@/lib/auth/helpers';
import { ENTRY_PLAN_ID, getPlan } from '@/lib/pricing';
import { generateOrderNumber } from '@/lib/utils';
import { getAppUrl, getPaymentProvider } from '@/lib/payments';

const schema = z.object({
  amountCny: z.number().positive().optional(),
});

/**
 * 为某个 lead 创建首次"AI 落地启动包"收款订单。
 *
 * 产品规则（重要）：
 * - 首单永远是 ENTRY_PLAN_ID（999）。lead.interestedPlan 仅作为参考记录，不再用来决定订单 plan。
 * - 后续从 999 升级到 2999/9999 走 POST /api/admin/orders/[id]/upgrade，不走这个接口。
 * - amountCny 可由 admin 微调（折扣 / 涨价），默认走启动包标准价。
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await requireAdmin();

  const body = schema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) {
    return NextResponse.json({ error: '参数不对', details: body.error.flatten() }, { status: 400 });
  }

  const [lead] = await db.select().from(leads).where(eq(leads.id, params.id)).limit(1);
  if (!lead) return NextResponse.json({ error: 'lead not found' }, { status: 404 });

  const entryPlan = getPlan(ENTRY_PLAN_ID);
  if (!entryPlan) return NextResponse.json({ error: '启动包套餐缺失' }, { status: 500 });

  const amountCny = body.data.amountCny ?? entryPlan.priceCny;
  const appUrl = getAppUrl();
  const provider = getPaymentProvider();

  const result = await db.transaction(async (tx) => {
    const existingRows = await tx
      .select()
      .from(orders)
      .where(eq(orders.leadId, lead.id))
      .limit(1);

    const existing = existingRows[0];
    if (existing) {
      // 已经有订单：只允许在它仍处于"启动包阶段未支付"时刷新金额；已升级或已支付的不走这里。
      if (existing.planType !== ENTRY_PLAN_ID) {
        return { error: '订单已经升级，请走升级接口或新建 lead' as const };
      }
      if (existing.paymentStatus === 'paid') {
        return { error: '启动包已支付，请走升级接口而不是重新生成首单' as const };
      }
      const [updated] = await tx
        .update(orders)
        .set({
          planType: ENTRY_PLAN_ID,
          amountCny: amountCny.toFixed(2),
          actualAmountCny: amountCny.toFixed(2),
          discountAmountCny: '0',
          priorPaidAmountCny: '0',
          upgradedFromPlan: null,
          paymentMethod: 'wechat_pay',
          paymentProvider: provider.name,
          paymentStatus: 'pending',
          paperworkStatus:
            existing.paperworkStatus === 'activated' ? 'activated' : 'awaiting_payment',
          updatedAt: new Date(),
        })
        .where(eq(orders.id, existing.id))
        .returning();
      return { order: updated };
    }

    const [created] = await tx
      .insert(orders)
      .values({
        orderNumber: generateOrderNumber('PAY'),
        leadId: lead.id,
        planType: ENTRY_PLAN_ID,
        amountCny: amountCny.toFixed(2),
        actualAmountCny: amountCny.toFixed(2),
        discountAmountCny: '0',
        priorPaidAmountCny: '0',
        earlyBird: false,
        paymentMethod: 'wechat_pay',
        paymentProvider: provider.name,
        paymentStatus: 'pending',
        paperworkStatus: 'awaiting_payment',
      })
      .returning();

    await tx
      .update(leads)
      .set({ status: 'approved', updatedAt: new Date() })
      .where(eq(leads.id, lead.id));
    return { order: created };
  });

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }
  const order = result.order;

  const paymentPageUrl = `${appUrl}/pay/${order.id}`;
  const payment = await provider.createPayment({
    orderId: order.id,
    orderNumber: order.orderNumber,
    amountCny: amountCny.toFixed(2),
    subject: `PONT AI ${entryPlan.shortLabel}`,
    notifyUrl: `${appUrl}/api/wechat/notify`,
    paymentPageUrl,
  });

  await db
    .update(orders)
    .set({
      paymentProvider: payment.provider,
      paymentStatus: order.paymentStatus === 'paid' ? 'paid' : 'pending',
      paymentQrCodeUrl: payment.qrCodeUrl,
      paymentExpiresAt: payment.expiresAt,
      wechatOutTradeNo: payment.outTradeNo,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, order.id));

  return NextResponse.json({
    ok: true,
    orderId: order.id,
    paymentPageUrl,
    qrCodeUrl: payment.qrCodeUrl,
    provider: payment.provider,
    plan: ENTRY_PLAN_ID,
  });
}
