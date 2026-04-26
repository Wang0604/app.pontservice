import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { leads, orders, users } from '@/lib/db/schema';
import { getPlan } from '@/lib/pricing';
import { generateOrderNumber } from '@/lib/utils';
import { getAppUrl, getPaymentProvider } from '@/lib/payments';
import { getCurrentSession } from '@/lib/auth/helpers';

/**
 * 公开「迅速付款链接」接口 — 客户在 /pricing/quick-pay 下单时调用。
 *
 * 跟 /api/checkout/start 的区别：
 *  - start：lead 入口，强制 999 启动包，不允许选月数；后续要走免费诊断、人工激活
 *  - quick-pay：客户直接掏钱：可选 999 一次性 或 2999 × N 月（N=1..12）
 *               N=12（包年）→ 自动打 [unlimited_credits] 标签，激活时发≈10 亿 credits
 *
 * 跟 /api/admin/quick-orders 的区别：
 *  - admin/quick-orders 需要 admin 鉴权，给"老板手动给客户开链接"用
 *  - 这里是 PUBLIC 路由，客户自己填表自己付，不需要登录
 *
 * 流程：
 *   1. 写 / 复用 lead（同邮箱复用，避免重复 lead）
 *   2. 建一张订单（planType, actualAmountCny, notes 标签）
 *   3. 调用支付 provider 拿到微信扫码 URL
 *   4. 返回 paymentPageUrl，前端跳到 /pay/[id]
 */
const schema = z.object({
  companyName: z.string().min(2, '公司名至少 2 个字').max(120),
  contactName: z.string().min(1, '请填写联系人姓名').max(60),
  email: z.string().email('邮箱格式不对'),
  phone: z.string().trim().max(40).optional(),
  /** 999 = 启动包一次性；2999 = 工具包按月；月数由 monthCount 决定 */
  planType: z.enum(['999', '2999']),
  /** 月数：999 时强制 1；2999 时 1..12（12 = 包年，免 Credits） */
  monthCount: z.number().int().min(1).max(12),
  notes: z.string().max(2000).optional(),
});

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

  const plan = getPlan(data.planType);
  if (!plan) return NextResponse.json({ error: '套餐配置缺失' }, { status: 500 });

  // 999 永远是一次性，强制 monthCount=1，避免前端误传
  const monthCount = data.planType === '999' ? 1 : data.monthCount;
  const isYearly = data.planType === '2999' && monthCount >= 12;
  const amountCny = data.planType === '999' ? 999 : 2999 * monthCount;

  const session = await getCurrentSession();
  const sessionUserId = session?.user?.id ?? null;
  const sessionUserEmail = session?.user?.email?.toLowerCase() ?? null;

  // 邮箱已注册但当前没登录 → 让 ta 先登录再下单（避免别人借邮箱开通别人的服务）
  if (!sessionUserId) {
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (existingUser) {
      return NextResponse.json(
        {
          error: '该邮箱已注册过，请先登录后再付款。',
          needLogin: true,
          loginUrl: `/login?redirectTo=${encodeURIComponent('/pricing/quick-pay')}`,
        },
        { status: 409 },
      );
    }
  } else if (sessionUserEmail && sessionUserEmail !== email) {
    return NextResponse.json(
      {
        error: `当前登录邮箱是 ${sessionUserEmail}，请使用该邮箱付款，或退出再换邮箱。`,
      },
      { status: 400 },
    );
  }

  // ---- lead：复用同邮箱最近一条；没有就建一条 ----
  const noteTags: string[] = ['[quick_pay]'];
  if (isYearly) noteTags.push('[unlimited_credits]');
  if (data.notes?.trim()) noteTags.push(data.notes.trim());
  const tagNotes = noteTags.join(' ');

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
        interestedPlan: data.planType,
        notes: tagNotes,
        userId: sessionUserId ?? existingLead.userId,
        status: 'approved',
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
        interestedPlan: data.planType,
        notes: tagNotes,
        source: 'quick_pay',
        status: 'approved',
        userId: sessionUserId,
      })
      .returning({ id: leads.id });
    leadId = created.id;
  }

  const appUrl = getAppUrl();
  const provider = getPaymentProvider();

  // 每次「迅速付款链接」都建一张全新订单（不像 /checkout/start 那样复用），
  // 因为 monthCount/planType 每次可能不同，复用会让金额对不上。
  const subjectSuffix =
    data.planType === '999'
      ? ''
      : isYearly
        ? '· 包年（×12，免 Credits）'
        : `· ${monthCount} 个月`;
  const subject = `PONT AI ${plan.shortLabel} ${subjectSuffix}`.trim();

  const [createdOrder] = await db
    .insert(orders)
    .values({
      orderNumber: generateOrderNumber('QP'),
      leadId,
      userId: sessionUserId,
      planType: data.planType,
      amountCny: amountCny.toFixed(2),
      actualAmountCny: amountCny.toFixed(2),
      discountAmountCny: '0',
      priorPaidAmountCny: '0',
      earlyBird: false,
      paymentMethod: 'wechat_pay',
      paymentProvider: provider.name,
      paymentStatus: 'pending',
      paperworkStatus: 'awaiting_payment',
      notes: tagNotes,
    })
    .returning({ id: orders.id, orderNumber: orders.orderNumber });

  const orderId = createdOrder.id;
  const orderNumber = createdOrder.orderNumber;
  const paymentPageUrl = `${appUrl}/pay/${orderId}`;

  let qrCodeUrl: string | null = null;
  let outTradeNo: string | null = null;
  let expiresAt: Date | null = null;
  try {
    const payment = await provider.createPayment({
      orderId,
      orderNumber,
      amountCny: amountCny.toFixed(2),
      subject,
      notifyUrl: `${appUrl}/api/wechat/notify`,
      paymentPageUrl,
    });
    qrCodeUrl = payment.qrCodeUrl;
    outTradeNo = payment.outTradeNo;
    expiresAt = payment.expiresAt;
  } catch (err) {
    console.error('[checkout-quick-pay] createPayment failed', err);
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

  return NextResponse.json({
    ok: true,
    orderId,
    orderNumber,
    amountCny,
    monthCount,
    isYearly,
    paymentPageUrl: `/pay/${orderId}`,
  });
}
