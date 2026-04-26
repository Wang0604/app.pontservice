import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { orders, leads, users, paymentReceipts } from '@/lib/db/schema';
import { grantCredits } from '@/lib/credits';
import { getPlan } from '@/lib/pricing';
import { generateInvoicePdf, buildInvoiceData } from '@/lib/invoices/generate';
import { storageProvider } from '@/lib/providers/storage/r2';
import { emailProvider } from '@/lib/providers/email/resend';
import { activationEmail } from '@/lib/providers/email/templates';
import { auth } from '@/lib/auth/server';

/**
 * 「无限 credits」实际发放的额度。Postgres int 上限是 2^31-1 ≈ 21 亿，这里取 10 亿，
 * 既能在表达 ≈ 无限 的同时给后续扣减留 1 亿次的空间。
 */
const UNLIMITED_CREDITS_GRANT = 1_000_000_000;
const UNLIMITED_CREDITS_TAG = '[unlimited_credits]';

export async function activateOrder(params: {
  orderId: string;
  adminUserId: string;
  invoiceNumber: string;
}): Promise<{ ok: true; userId: string; creditsGranted: number; invoiceKey: string }> {
  const [order] = await db.select().from(orders).where(eq(orders.id, params.orderId));
  if (!order) throw new Error('order not found');
  if (order.paperworkStatus === 'activated') throw new Error('already activated');

  const plan = getPlan(order.planType);
  if (!plan) throw new Error(`unknown plan ${order.planType}`);

  const [lead] = order.leadId
    ? await db.select().from(leads).where(eq(leads.id, order.leadId))
    : [undefined];
  if (!lead) throw new Error('lead missing');

  let userId = order.userId ?? null;
  let isNewUser = false;
  if (!userId) {
    const [existingUser] = await db.select().from(users).where(eq(users.email, lead.email));
    if (existingUser) {
      userId = existingUser.id;
    } else {
      userId = `user-${randomUUID()}`;
      isNewUser = true;
      await db.insert(users).values({
        id: userId,
        email: lead.email,
        emailVerified: true,
        name: lead.contactName,
        companyName: lead.companyName,
        // phoneNumber 不自动从 lead 写入：
        //  - phoneNumber 是 unique 的，多个 lead 共用同一个手机号会冲突
        //  - 客户应自己通过登录后的「我的账户」绑定手机号（带短信验证）
        // 先留空，由客户后续自助补全
        role: 'user',
      });
    }
  }

  const isUnlimited =
    (order.notes ?? '').includes(UNLIMITED_CREDITS_TAG) ||
    (lead?.notes ?? '').includes(UNLIMITED_CREDITS_TAG);
  const creditsToGrant = isUnlimited ? UNLIMITED_CREDITS_GRANT : plan.credits;
  const grantReason = isUnlimited
    ? `订单 ${order.orderNumber} 激活发放（种子客户 · 无限 credits · ${plan.shortLabel}）`
    : `订单 ${order.orderNumber} 激活发放（${plan.shortLabel}）`;

  await grantCredits({
    userId,
    amount: creditsToGrant,
    reason: grantReason,
    orderId: order.id,
  });

  // 升级订单的发票金额 = 客户为当前 plan 累计支付的总额（已抵扣金额 + 本次差额）。
  // 对于直接激活的 999 启动包：discount 与 prior_paid 都是 0，invoiceTotal 等于 actualAmountCny。
  const actualAmountCny = parseFloat(order.actualAmountCny);
  const priorPaidCny = parseFloat(order.priorPaidAmountCny ?? '0');
  const invoiceTotal = actualAmountCny + priorPaidCny;
  const isUpgrade = priorPaidCny > 0;

  const invoicePdf = await generateInvoicePdf(
    buildInvoiceData({
      invoiceNumber: params.invoiceNumber,
      buyerName: lead.companyName,
      totalAmount: invoiceTotal,
      itemName: isUpgrade ? `${plan.label}（含启动包抵扣）` : plan.label,
    }),
  );
  const invoiceKey = `invoices/${order.id}/${params.invoiceNumber}.pdf`;
  await storageProvider.putObject({
    key: invoiceKey,
    body: invoicePdf,
    contentType: 'application/pdf',
  });

  await db.transaction(async (tx) => {
    await tx
      .update(orders)
      .set({
        userId,
        paperworkStatus: 'activated',
        activatedAt: new Date(),
        paidAt: order.paidAt ?? new Date(),
        creditsGranted: creditsToGrant,
        invoiceNumber: params.invoiceNumber,
        invoiceR2Key: invoiceKey,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, order.id));

    await tx
      .update(leads)
      .set({ status: 'activated', userId, updatedAt: new Date() })
      .where(eq(leads.id, lead.id));

    await tx
      .update(paymentReceipts)
      .set({ status: 'verified', verifiedBy: params.adminUserId, verifiedAt: new Date() })
      .where(eq(paymentReceipts.orderId, order.id));
  });

  const invoiceBuffer = Buffer.isBuffer(invoicePdf) ? invoicePdf : Buffer.from(invoicePdf);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  try {
    const { subject, html } = activationEmail({
      companyName: lead.companyName,
      orderNumber: order.orderNumber,
      creditsGranted: creditsToGrant,
      loginUrl: `${appUrl}/login`,
    });
    await emailProvider.send({
      to: lead.email,
      subject,
      html,
      attachments: [
        {
          filename: `Invoice-${params.invoiceNumber}.pdf`,
          content: invoiceBuffer,
          contentType: 'application/pdf',
        },
      ],
    });
  } catch (err) {
    console.error('[activate] activation email failed', err);
  }

  // 新用户：触发一封「设置密码」邮件 — 用 Better Auth 的密码重置令牌机制
  // 老板第一次进系统就能直接设置密码，不必走「忘记密码」迂回路径
  if (isNewUser) {
    try {
      await auth.api.requestPasswordReset({
        body: {
          email: lead.email,
          redirectTo: '/reset-password',
        },
      });
    } catch (err) {
      // 不抛 — 客户至少可以走「忘记密码」入口
      console.error('[activate] requestPasswordReset invite failed', err);
    }
  }

  return { ok: true, userId, creditsGranted: creditsToGrant, invoiceKey };
}
