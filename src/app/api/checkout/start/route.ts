import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { leads, orders, users } from '@/lib/db/schema';
import { ENTRY_PLAN_ID, getPlan } from '@/lib/pricing';
import { generateOrderNumber } from '@/lib/utils';
import { getAppUrl, getPaymentProvider } from '@/lib/payments';
import { getCurrentSession } from '@/lib/auth/helpers';
import { emailProvider } from '@/lib/providers/email/resend';
import { leadNotificationEmail } from '@/lib/providers/email/templates';

const schema = z.object({
  companyName: z.string().min(2, '公司名至少 2 个字').max(120),
  contactName: z.string().min(1, '请填写联系人姓名').max(60),
  email: z.string().email('邮箱格式不对'),
  phone: z.string().trim().max(40).optional(),
  useCase: z.string().max(2000).optional(),
  notes: z.string().max(2000).optional(),
  source: z.string().max(40).optional(),
});

/**
 * 公开接口 — 客户在 /pricing/apply 表单点「去支付 ¥999」时调用。
 *
 * 一次性做三件事：
 *   1. 写一条 lead（拿来给后台跟踪和给顾问准备诊断会议）
 *   2. 建一张 999 启动包订单（planType=999，amount=999，paymentStatus=pending）
 *   3. 调用支付 provider 生成微信扫码二维码（stub 模式下退化成 paymentPageUrl）
 *
 * 返回 orderId + paymentPageUrl，前端跳到 /pay/[orderId] 让用户扫码付款。
 *
 * 用户已登录的情况下：把 order.userId / lead.userId 指向当前用户，避免事后还要绑定。
 *
 * 同邮箱重复提交：
 *   - 已有未支付的 999 启动包订单 → 复用（刷新二维码），让用户继续付款
 *   - 已有已支付订单 → 拒绝，请其登录
 */
export async function POST(req: NextRequest) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: '请求格式错误' }, { status: 400 });
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.errors[0]?.message ?? '字段校验失败',
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }
  const data = parsed.data;
  const email = data.email.toLowerCase();

  const session = await getCurrentSession();
  const sessionUserId = session?.user?.id ?? null;
  const sessionUserEmail = session?.user?.email?.toLowerCase() ?? null;

  // 邮箱已注册但当前没登录 → 让用户先登录再来下单（避免别人冒用别人邮箱开通服务）
  if (!sessionUserId) {
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (existingUser) {
      return NextResponse.json(
        {
          error: '该邮箱已注册过，请先登录后再申请启动包。',
          needLogin: true,
          loginUrl: `/login?redirectTo=${encodeURIComponent('/pricing/apply')}`,
        },
        { status: 409 },
      );
    }
  } else if (sessionUserEmail && sessionUserEmail !== email) {
    // 已登录但用了别的邮箱 → 强制使用登录账号的邮箱，避免一个人开多个 lead
    return NextResponse.json(
      {
        error: `当前登录邮箱是 ${sessionUserEmail}，请使用该邮箱申请，或退出后再用别的邮箱。`,
      },
      { status: 400 },
    );
  }

  const entryPlan = getPlan(ENTRY_PLAN_ID);
  if (!entryPlan) {
    return NextResponse.json({ error: '启动包套餐配置缺失' }, { status: 500 });
  }
  const amountCny = entryPlan.priceCny;

  // 复用最近一条同邮箱 lead；没有就新建。这样一个客户多次返回提交也只会有一条 lead。
  const existingLeadRows = await db
    .select()
    .from(leads)
    .where(eq(leads.email, email))
    .orderBy(desc(leads.createdAt))
    .limit(1);
  const existingLead = existingLeadRows[0];

  let leadId: string;
  if (existingLead) {
    leadId = existingLead.id;
    await db
      .update(leads)
      .set({
        companyName: data.companyName,
        contactName: data.contactName,
        phone: data.phone || existingLead.phone,
        useCase: data.useCase || existingLead.useCase,
        notes: data.notes || existingLead.notes,
        userId: sessionUserId ?? existingLead.userId,
        updatedAt: new Date(),
      })
      .where(eq(leads.id, existingLead.id));
  } else {
    const [created] = await db
      .insert(leads)
      .values({
        companyName: data.companyName,
        contactName: data.contactName,
        email,
        phone: data.phone || null,
        interestedPlan: ENTRY_PLAN_ID,
        useCase: data.useCase || null,
        notes: data.notes || null,
        source: data.source ?? 'website',
        status: 'new',
        userId: sessionUserId,
      })
      .returning({ id: leads.id });
    leadId = created.id;
  }

  // 找已有订单（同 lead）。规则：
  //   - 已支付 → 不让重新下单，跳到 /pay/[id] 看状态
  //   - 已升级（planType !== 999） → 已经是老客户，不该走 apply 入口
  //   - 待支付的 999 → 直接复用，刷新一下二维码
  const [existingOrder] = await db
    .select()
    .from(orders)
    .where(eq(orders.leadId, leadId))
    .orderBy(desc(orders.createdAt))
    .limit(1);

  if (existingOrder) {
    if (existingOrder.paymentStatus === 'paid') {
      return NextResponse.json(
        {
          ok: true,
          orderId: existingOrder.id,
          paymentPageUrl: `/pay/${existingOrder.id}`,
          alreadyPaid: true,
          message: '该邮箱已支付过 999 启动包，请直接登录或前往订单页。',
        },
        { status: 200 },
      );
    }
    if (existingOrder.planType !== ENTRY_PLAN_ID) {
      return NextResponse.json(
        { error: '您已经有进行中的升级订单，请联系客服或登录账户查看。' },
        { status: 409 },
      );
    }
  }

  const appUrl = getAppUrl();
  const provider = getPaymentProvider();

  let orderId: string;
  let orderNumber: string;
  if (existingOrder) {
    orderId = existingOrder.id;
    orderNumber = existingOrder.orderNumber;
    await db
      .update(orders)
      .set({
        userId: sessionUserId ?? existingOrder.userId,
        amountCny: amountCny.toFixed(2),
        actualAmountCny: amountCny.toFixed(2),
        paymentMethod: 'wechat_pay',
        paymentProvider: provider.name,
        paymentStatus: 'pending',
        paperworkStatus:
          existingOrder.paperworkStatus === 'activated' ? 'activated' : 'awaiting_payment',
        updatedAt: new Date(),
      })
      .where(eq(orders.id, existingOrder.id));
  } else {
    const [created] = await db
      .insert(orders)
      .values({
        orderNumber: generateOrderNumber('PAY'),
        leadId,
        userId: sessionUserId,
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
      .returning({ id: orders.id, orderNumber: orders.orderNumber });
    orderId = created.id;
    orderNumber = created.orderNumber;
  }

  // 同步 lead 状态：客户已经准备付款，不再是冷 lead
  await db.update(leads).set({ status: 'approved', updatedAt: new Date() }).where(eq(leads.id, leadId));

  const paymentPageUrl = `${appUrl}/pay/${orderId}`;

  let qrCodeUrl: string | null = null;
  let outTradeNo: string | null = null;
  let expiresAt: Date | null = null;
  try {
    const payment = await provider.createPayment({
      orderId,
      orderNumber,
      amountCny: amountCny.toFixed(2),
      subject: `PONT AI ${entryPlan.shortLabel}`,
      notifyUrl: `${appUrl}/api/wechat/notify`,
      paymentPageUrl,
    });
    qrCodeUrl = payment.qrCodeUrl;
    outTradeNo = payment.outTradeNo;
    expiresAt = payment.expiresAt;
  } catch (err) {
    console.error('[checkout-start] createPayment failed', err);
    return NextResponse.json(
      { error: '支付二维码生成失败，请稍后再试或联系客服。' },
      { status: 500 },
    );
  }

  await db
    .update(orders)
    .set({
      paymentProvider: provider.name,
      paymentStatus: 'pending',
      paymentQrCodeUrl: qrCodeUrl,
      paymentExpiresAt: expiresAt,
      wechatOutTradeNo: outTradeNo,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId));

  // 后台通知 — 失败不阻塞客户付款
  try {
    const adminEmails = (process.env.RESEND_ADMIN_EMAIL ?? '')
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean);
    if (adminEmails.length > 0 && !existingLead) {
      const { subject, html } = leadNotificationEmail({
        companyName: data.companyName,
        contactName: data.contactName,
        email,
        phone: data.phone,
        interestedPlan: ENTRY_PLAN_ID,
        useCase: data.useCase,
        leadUrl: `${appUrl}/admin/leads/${leadId}`,
      });
      await emailProvider.send({ to: adminEmails, subject, html });
    }
  } catch (err) {
    console.error('[checkout-start] admin notification failed', err);
  }

  return NextResponse.json({
    ok: true,
    orderId,
    paymentPageUrl: `/pay/${orderId}`,
  });
}
