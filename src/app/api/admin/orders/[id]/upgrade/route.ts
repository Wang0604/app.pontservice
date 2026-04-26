import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { contracts, leads, orders } from '@/lib/db/schema';
import { requireAdmin } from '@/lib/auth/helpers';
import {
  DIAGNOSIS_DEPOSIT_CNY,
  ENTRY_PLAN_ID,
  UPGRADE_PLAN_IDS,
  calcUpgradeAmount,
  getPlan,
} from '@/lib/pricing';
import { getAppUrl, getPaymentProvider } from '@/lib/payments';
import { inngest } from '@/lib/inngest/client';

const schema = z.object({
  /** 升级目标套餐：2999 或 9999 */
  targetPlan: z.enum(['2999', '9999']),
  /** admin 可手动覆盖的最终实付（差额）；不传则按 priceCny - 999 自动计算 */
  amountCny: z.number().nonnegative().optional(),
});

/**
 * 在同一订单内把 999 启动包升级为 2999 工具包 / 9999 增长包。
 *
 * 业务规则：
 * 1. 原订单必须是 ENTRY_PLAN_ID（999）且支付状态为 paid。
 * 2. 系统记录抵扣金额（discount_amount_cny = 999）和已收金额（prior_paid_amount_cny = 999）。
 * 3. actualAmountCny 重置为差额（默认 priceCny - 999）。
 * 4. 重置 paymentStatus 为 pending，重新生成微信收款单（用于二次收款）。
 * 5. 之前的 wechatOutTradeNo 保留为已结算的历史，新订单生成新的 trade no（订单号本身不变，
 *    所以 wechatOutTradeNo 直接用 `${orderNumber}-UP1` 这种带后缀的方式）。
 * 6. 重新生成合同：换 templateId、走 inngest 重新渲染 PDF。
 * 7. paperworkStatus 重置为 awaiting_payment，等客户付清差额后才能激活。
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();

  const body = schema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) {
    return NextResponse.json({ error: '参数不对', details: body.error.flatten() }, { status: 400 });
  }
  const { targetPlan } = body.data;
  if (!UPGRADE_PLAN_IDS.includes(targetPlan)) {
    return NextResponse.json({ error: '不支持的升级目标' }, { status: 400 });
  }

  const targetPlanDef = getPlan(targetPlan);
  if (!targetPlanDef) {
    return NextResponse.json({ error: '套餐配置缺失' }, { status: 500 });
  }

  const appUrl = getAppUrl();
  const provider = getPaymentProvider();

  const result = await db.transaction(async (tx) => {
    const [order] = await tx.select().from(orders).where(eq(orders.id, params.id));
    if (!order) return { error: '订单不存在', status: 404 } as const;

    if (order.planType !== ENTRY_PLAN_ID) {
      return { error: '只有 999 启动包订单可以升级', status: 409 } as const;
    }
    if (order.paymentStatus !== 'paid') {
      return { error: '客户尚未支付 999 启动包，无法触发升级', status: 409 } as const;
    }
    if (order.paperworkStatus === 'activated') {
      return { error: '订单已经激活，请新建升级 lead 而不是在原订单上升级', status: 409 } as const;
    }

    const upgrade = calcUpgradeAmount(targetPlan, DIAGNOSIS_DEPOSIT_CNY);
    const dueAmountCny = body.data.amountCny ?? upgrade.due;

    // 升级订单需要重新走收款，所以 wechatOutTradeNo 必须换。
    // 我们用 `${orderNumber}-UP{n}` 方式生成，确保唯一性。
    const upgradeSuffix = `-UP-${Date.now().toString(36)}`;
    const newOutTradeNo = `${order.orderNumber}${upgradeSuffix}`.slice(0, 32);

    // 1) 改 order：plan、金额、抵扣明细、状态
    const [updatedOrder] = await tx
      .update(orders)
      .set({
        planType: targetPlan,
        upgradedFromPlan: ENTRY_PLAN_ID,
        amountCny: targetPlanDef.priceCny.toFixed(2),
        actualAmountCny: dueAmountCny.toFixed(2),
        discountAmountCny: upgrade.discount.toFixed(2),
        priorPaidAmountCny: upgrade.discount.toFixed(2),
        paymentMethod: 'wechat_pay',
        paymentProvider: provider.name,
        paymentStatus: 'pending',
        paperworkStatus: 'awaiting_payment',
        wechatOutTradeNo: newOutTradeNo,
        wechatTransactionId: null,
        paymentQrCodeUrl: null,
        paymentExpiresAt: null,
        // 升级即重新签合同；clear contractId 让下方插入新合同
        contractId: null,
        // paidAt 保留为 999 阶段的支付时间，等客户付清差额后由 markOrderPaid 覆盖
        updatedAt: new Date(),
      })
      .where(eq(orders.id, order.id))
      .returning();

    // 2) 关闭旧合同 + 创建新合同（draft 状态），由 inngest 异步生成 PDF
    if (order.contractId) {
      await tx
        .update(contracts)
        .set({ status: 'voided', updatedAt: new Date() })
        .where(eq(contracts.id, order.contractId));
    }

    const [newContract] = await tx
      .insert(contracts)
      .values({
        orderId: order.id,
        templateId: targetPlanDef.contractTemplateId,
        variables: {},
        status: 'draft',
        approvedBy: session.user.id,
        approvedAt: new Date(),
      })
      .returning();

    await tx
      .update(orders)
      .set({ contractId: newContract.id, updatedAt: new Date() })
      .where(eq(orders.id, order.id));

    // 3) lead 状态回退到 approved（待付款 + 待激活），不再保留 paid
    if (order.leadId) {
      await tx
        .update(leads)
        .set({ status: 'approved', updatedAt: new Date() })
        .where(eq(leads.id, order.leadId));
    }

    return {
      order: updatedOrder,
      contractId: newContract.id,
      upgrade,
      newOutTradeNo,
    };
  });

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status ?? 500 });
  }

  // 4) 重新生成合同 PDF
  await inngest.send({
    name: 'contract/generate.requested',
    data: { contractId: result.contractId },
  });

  // 5) 创建微信支付收款单（差额）
  const paymentPageUrl = `${appUrl}/pay/${result.order.id}`;
  const payment = await provider.createPayment({
    orderId: result.order.id,
    orderNumber: result.newOutTradeNo,
    amountCny: result.order.actualAmountCny,
    subject: `PONT AI ${targetPlanDef.shortLabel}（升级补差）`,
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
    targetPlan,
    paymentPageUrl,
    qrCodeUrl: payment.qrCodeUrl,
    provider: payment.provider,
    breakdown: {
      original: result.upgrade.original,
      discount: result.upgrade.discount,
      due: parseFloat(result.order.actualAmountCny),
    },
    contractId: result.contractId,
  });
}
