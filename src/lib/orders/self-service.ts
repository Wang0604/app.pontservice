import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { orders, leads } from '@/lib/db/schema';
import { grantCredits } from '@/lib/credits';
import { getPlan } from '@/lib/pricing';

/**
 * 自助激活：客户在 /pay/[id] 完成微信支付 + 自助设置密码后调用。
 *
 * 跟 `activateOrder` 的区别：
 *   - 不生成 PDF 发票（发票由后台财务统一开具）
 *   - 不发激活邮件（用户自己刚在浏览器里设置完密码、已登录，不需要邮件指引）
 *   - 不写 paymentReceipts（自助流程不依赖人工对账，wechat webhook 已经把 paid 写好）
 *   - 不发"设置密码"提醒邮件（用户自己已经设置了）
 *
 * 必须由调用方先：
 *   1) 确认 order.paymentStatus === 'paid'
 *   2) 已经把 user 创建好（通过 better-auth signUpEmail 或拿到当前 session.user.id）
 *   3) 把 userId 传进来
 *
 * 这个函数只负责把"订单和 lead 标记为已激活" + "把套餐 credits 发到账户"。
 */
export async function selfServiceActivateOrder(params: {
  orderId: string;
  userId: string;
}): Promise<{ ok: true; creditsGranted: number }> {
  const [order] = await db.select().from(orders).where(eq(orders.id, params.orderId));
  if (!order) throw new Error('order not found');
  if (order.paymentStatus !== 'paid') throw new Error('order is not paid');
  if (order.paperworkStatus === 'activated') {
    return { ok: true, creditsGranted: order.creditsGranted ?? 0 };
  }

  const plan = getPlan(order.planType);
  if (!plan) throw new Error(`unknown plan ${order.planType}`);

  const creditsToGrant = plan.credits;
  await grantCredits({
    userId: params.userId,
    amount: creditsToGrant,
    reason: `订单 ${order.orderNumber} 激活发放（${plan.shortLabel}）`,
    orderId: order.id,
  });

  await db.transaction(async (tx) => {
    const now = new Date();
    await tx
      .update(orders)
      .set({
        userId: params.userId,
        paperworkStatus: 'activated',
        activatedAt: now,
        creditsGranted: creditsToGrant,
        updatedAt: now,
      })
      .where(eq(orders.id, order.id));

    if (order.leadId) {
      await tx
        .update(leads)
        .set({ status: 'activated', userId: params.userId, updatedAt: now })
        .where(eq(leads.id, order.leadId));
    }
  });

  return { ok: true, creditsGranted: creditsToGrant };
}
