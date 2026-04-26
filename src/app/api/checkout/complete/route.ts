import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { leads, orders, users } from '@/lib/db/schema';
import { auth } from '@/lib/auth/server';
import { getCurrentSession } from '@/lib/auth/helpers';
import { selfServiceActivateOrder } from '@/lib/orders/self-service';
import { getPaymentProvider } from '@/lib/payments';
import { markOrderPaid } from '@/lib/payments/orders';

const schema = z.object({
  orderId: z.string().uuid('orderId 格式不对'),
  email: z.string().email('邮箱格式不对'),
  // 已登录用户走「确认激活」分支时不传 password；未登录用户必传 8+ 位密码
  password: z.string().min(8, '密码至少 8 位').max(128).optional(),
  fullName: z.string().min(1).max(60).optional(),
});

/**
 * 公开接口 — 客户在 /pay/[id] 完成微信支付后调用，用来：
 *   1. 再次确认订单已支付（防止前端绕过）
 *   2. 用客户当场填的邮箱+密码创建 Better Auth 账号（自动登录）
 *   3. 调 selfServiceActivateOrder 把订单 + lead 标记为已激活，把 50 credits 发到账户
 *   4. 把 better-auth 写进来的 Set-Cookie 透传给浏览器
 *
 * 已登录用户也可以直接 POST 这个接口（不传 password、走当前 session.user.id 激活）。
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
      { error: parsed.error.errors[0]?.message ?? '字段校验失败' },
      { status: 400 },
    );
  }
  const { orderId, password } = parsed.data;
  const email = parsed.data.email.toLowerCase();
  const fullName = parsed.data.fullName?.trim() || undefined;

  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
  if (!order) return NextResponse.json({ error: '订单不存在' }, { status: 404 });

  // 给微信支付一个最后的查询机会 — 客户可能刚扫完还没等 webhook 跑过来就提交了表单
  let currentOrder = order;
  if (
    currentOrder.paymentStatus !== 'paid' &&
    currentOrder.wechatOutTradeNo &&
    currentOrder.paymentProvider === 'wechat'
  ) {
    try {
      const result = await getPaymentProvider().queryPayment(currentOrder.wechatOutTradeNo);
      if (result.status === 'paid' && result.paidAmountCny) {
        currentOrder = await markOrderPaid({
          orderId: currentOrder.id,
          provider: 'wechat',
          tradeNo: result.tradeNo,
          paidAmountCny: result.paidAmountCny,
        });
      }
    } catch (err) {
      console.error('[checkout-complete] wechat queryPayment failed', err);
    }
  }

  if (currentOrder.paymentStatus !== 'paid') {
    return NextResponse.json(
      { error: '订单还没支付，请先完成微信扫码付款再设置密码。' },
      { status: 409 },
    );
  }

  const [lead] = currentOrder.leadId
    ? await db.select().from(leads).where(eq(leads.id, currentOrder.leadId))
    : [undefined];
  if (!lead) {
    return NextResponse.json({ error: '订单缺少客户信息，请联系客服。' }, { status: 500 });
  }

  // 已登录路径：不需要再建账号 / 设密码
  const session = await getCurrentSession();
  if (session?.user?.id) {
    if (currentOrder.userId && currentOrder.userId !== session.user.id) {
      return NextResponse.json(
        { error: '订单与当前登录账号不匹配。' },
        { status: 403 },
      );
    }
    try {
      await selfServiceActivateOrder({ orderId: currentOrder.id, userId: session.user.id });
    } catch (err) {
      console.error('[checkout-complete] activate failed (logged-in)', err);
      return NextResponse.json(
        { error: err instanceof Error ? err.message : '激活失败' },
        { status: 500 },
      );
    }
    return NextResponse.json({ ok: true, redirectTo: '/account' });
  }

  // 未登录路径：必须输入密码
  if (!password) {
    return NextResponse.json({ error: '请设置密码以完成账户激活。' }, { status: 400 });
  }

  // 邮箱必须和下单时填的 lead.email 一致 — 否则就是有人拿别人的 orderId 给自己开账号
  if (email !== lead.email.toLowerCase()) {
    return NextResponse.json(
      { error: '邮箱必须和下单时填写的一致。' },
      { status: 400 },
    );
  }

  // 邮箱已被占用就给 409，让前端走登录路径（用同一个邮箱登录后系统会把 order 关联）
  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existingUser) {
    return NextResponse.json(
      {
        error: '该邮箱已注册过，请用密码登录后再回到订单页激活。',
        needLogin: true,
        loginUrl: `/login?redirectTo=${encodeURIComponent(`/pay/${currentOrder.id}`)}`,
      },
      { status: 409 },
    );
  }

  // 调 Better Auth 建账号 + 自动登录
  let signUpResp;
  try {
    signUpResp = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name: fullName ?? lead.contactName,
        fullName: fullName ?? lead.contactName,
        ...(lead.companyName ? { companyName: lead.companyName } : {}),
      },
      headers: req.headers,
      asResponse: true,
      returnHeaders: true,
    });
  } catch (err) {
    console.error('[checkout-complete] signUpEmail failed', err);
    const message = err instanceof Error ? err.message : '创建账号失败';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const signUpJson = (await signUpResp
    .clone()
    .json()
    .catch(() => null)) as { user?: { id: string }; error?: { message?: string } } | null;
  if (!signUpResp.ok || !signUpJson?.user?.id) {
    const message = signUpJson?.error?.message ?? '创建账号失败';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const userId = signUpJson.user.id;

  try {
    await selfServiceActivateOrder({ orderId: currentOrder.id, userId });
  } catch (err) {
    console.error('[checkout-complete] activate failed (new account)', err);
    // 账号建出来了，订单激活失败 — 客户至少能登录后联系客服补激活
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : '订单激活失败，请联系客服',
        accountCreated: true,
      },
      { status: 500 },
    );
  }

  // 透传 Better Auth 的 Set-Cookie，让浏览器拿到 session
  const responseHeaders = new Headers();
  signUpResp.headers.forEach((v, k) => {
    if (k.toLowerCase() === 'set-cookie') responseHeaders.append('set-cookie', v);
  });
  responseHeaders.set('content-type', 'application/json');

  return new NextResponse(
    JSON.stringify({ ok: true, userId, redirectTo: '/account' }),
    { status: 200, headers: responseHeaders },
  );
}
