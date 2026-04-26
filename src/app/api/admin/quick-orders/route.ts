import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { leads, orders } from '@/lib/db/schema';
import { requireAdmin } from '@/lib/auth/helpers';
import { PLAN_IDS, getPlan } from '@/lib/pricing';
import { generateOrderNumber } from '@/lib/utils';
import { getAppUrl, getPaymentProvider } from '@/lib/payments';

/**
 * 「快速收款」：admin 一键给任何客户开一个微信收款链接，无需走 lead → 999 标准链路。
 *
 * 适用场景：
 * - 种子客户、年付、特殊报价、线下成交后补单等任何非标场景。
 * - planType 仍然要从 999/2999/9999 里选一个（决定合同模板和默认 credits 池），
 *   但金额（amountCny）可以任意填。
 * - unlimitedCredits=true 会在 order.notes 里打 [unlimited_credits] 标签，
 *   激活流程识别后会发放一个极大值（≈ 无限）。
 */

const schema = z.object({
  companyName: z.string().min(1, '请填客户公司名'),
  contactName: z.string().min(1, '请填客户联系人'),
  email: z.string().email('邮箱格式不对'),
  phone: z.string().optional().nullable(),
  planType: z.enum(PLAN_IDS),
  amountCny: z.number().positive('金额必须大于 0'),
  subject: z.string().optional().nullable(),
  unlimitedCredits: z.boolean().optional().default(false),
  notes: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  await requireAdmin();

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: '参数不对', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const plan = getPlan(input.planType);
  if (!plan) return NextResponse.json({ error: '套餐缺失' }, { status: 500 });

  const provider = getPaymentProvider();
  const appUrl = getAppUrl();

  const noteParts: string[] = [];
  if (input.unlimitedCredits) noteParts.push('[unlimited_credits]');
  noteParts.push('[quick_order]');
  if (input.notes?.trim()) noteParts.push(input.notes.trim());
  const notes = noteParts.join(' ');

  const subject = input.subject?.trim() || `PONT AI ${plan.shortLabel}`;

  const result = await db.transaction(async (tx) => {
    const [lead] = await tx
      .insert(leads)
      .values({
        companyName: input.companyName,
        contactName: input.contactName,
        email: input.email,
        phone: input.phone ?? null,
        interestedPlan: input.planType,
        notes,
        source: 'quick_order',
        status: 'approved',
      })
      .returning();

    const [order] = await tx
      .insert(orders)
      .values({
        orderNumber: generateOrderNumber('QO'),
        leadId: lead.id,
        planType: input.planType,
        amountCny: input.amountCny.toFixed(2),
        actualAmountCny: input.amountCny.toFixed(2),
        discountAmountCny: '0',
        priorPaidAmountCny: '0',
        earlyBird: false,
        paymentMethod: 'wechat_pay',
        paymentProvider: provider.name,
        paymentStatus: 'pending',
        paperworkStatus: 'awaiting_payment',
        notes,
      })
      .returning();

    return { lead, order };
  });

  const paymentPageUrl = `${appUrl}/pay/${result.order.id}`;

  try {
    const payment = await provider.createPayment({
      orderId: result.order.id,
      orderNumber: result.order.orderNumber,
      amountCny: input.amountCny.toFixed(2),
      subject,
      notifyUrl: `${appUrl}/api/wechat/notify`,
      paymentPageUrl,
    });

    await db
      .update(orders)
      .set({
        paymentProvider: payment.provider,
        paymentQrCodeUrl: payment.qrCodeUrl,
        paymentExpiresAt: payment.expiresAt,
        wechatOutTradeNo: payment.outTradeNo,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, result.order.id));

    return NextResponse.json({
      ok: true,
      orderId: result.order.id,
      orderNumber: result.order.orderNumber,
      paymentPageUrl,
      qrCodeUrl: payment.qrCodeUrl,
      provider: payment.provider,
      expiresAt: payment.expiresAt,
    });
  } catch (err) {
    console.error('[quick-order] create wechat payment failed', err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : '创建微信收款失败',
        orderId: result.order.id,
        paymentPageUrl,
      },
      { status: 502 },
    );
  }
}
