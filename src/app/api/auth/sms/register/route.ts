import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth/server';
import { db } from '@/lib/db';
import { users, verifications } from '@/lib/db/schema';
import { normalizeCnPhoneNumber } from '@/lib/auth/phone';

/**
 * 注册流程的最后一步：
 *   - 客户端先调用 /api/auth/phone-number/send-otp（Better Auth 自带）拿验证码
 *   - 然后把 phoneNumber + otp + email + password + name + companyName 全部 POST 到这里
 *   - 这里：1) 校验 OTP（直接读 verification 表）  2) 用 Better Auth 的 sign-up 创建账号
 *           3) 把 phoneNumber + phoneNumberVerified=true 写到 user 上
 *           4) 返回成功（Better Auth 已经自动登录并写 cookie）
 *
 * 这样合并成一次 RPC 是为了避免「OTP 验完了再去填邮箱」时 OTP 已过期的尴尬。
 */

const schema = z.object({
  phoneNumber: z.string(),
  otp: z.string().regex(/^\d{6}$/, '验证码必须是 6 位数字'),
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(8, '密码至少 8 位'),
  fullName: z.string().min(1, '请填写姓名').max(50),
  companyName: z.string().max(100).optional(),
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
      { error: parsed.error.errors[0]?.message ?? '字段校验失败' },
      { status: 400 },
    );
  }

  const { otp, email, password, fullName, companyName } = parsed.data;

  const phone = normalizeCnPhoneNumber(parsed.data.phoneNumber);
  if (!phone) {
    return NextResponse.json({ error: '手机号格式不正确（请使用中国大陆 11 位号码）' }, { status: 400 });
  }

  // 1) 校验 OTP — 取最新一条（用户多次点「重新发送」会留多条历史）
  const [otpRow] = await db
    .select()
    .from(verifications)
    .where(eq(verifications.identifier, phone))
    .orderBy(desc(verifications.createdAt))
    .limit(1);

  if (!otpRow) {
    return NextResponse.json({ error: '验证码不存在或已过期，请重新发送' }, { status: 400 });
  }
  if (otpRow.expiresAt < new Date()) {
    return NextResponse.json({ error: '验证码已过期，请重新发送' }, { status: 400 });
  }
  // Better Auth 存储格式：`${code}:${attempts}`
  const [storedCode, attemptsStr] = otpRow.value.split(':');
  const attempts = parseInt(attemptsStr ?? '0', 10);
  if (attempts >= 5) {
    await db.delete(verifications).where(eq(verifications.id, otpRow.id));
    return NextResponse.json({ error: '验证次数过多，请重新发送验证码' }, { status: 400 });
  }
  if (storedCode !== otp) {
    await db
      .update(verifications)
      .set({ value: `${storedCode}:${attempts + 1}` })
      .where(eq(verifications.id, otpRow.id));
    return NextResponse.json({ error: '验证码不正确' }, { status: 400 });
  }

  // 通过后顺手清掉同号码的所有过期 / 历史 OTP，避免污染（不影响主流程）
  try {
    await db.delete(verifications).where(eq(verifications.identifier, phone));
  } catch {
    /* ignore */
  }

  // 2) 提前检查这个手机号是否被占用 — Better Auth 创建用户时也会检查 email，但 phoneNumber
  //    我们是事后再写的，所以提前防一手避免出现「账号建好了再回滚」的尴尬。
  const [phoneTaken] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.phoneNumber, phone));
  if (phoneTaken) {
    return NextResponse.json(
      { error: '该手机号已注册，请直接登录或换一个手机号' },
      { status: 400 },
    );
  }

  // 3) 调用 Better Auth 创建账号（会自动登录并下发 session cookie）
  let signUpResp;
  try {
    signUpResp = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name: fullName,
        // 自定义 additionalFields 也通过 body 传 — 用 undefined 而不是 null，
        // 让 JSON 序列化时直接丢掉空字段
        fullName,
        ...(companyName ? { companyName } : {}),
      },
      headers: req.headers,
      asResponse: true,
      returnHeaders: true,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '注册失败';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const signUpJson = (await signUpResp.clone().json().catch(() => null)) as
    | { user?: { id: string }; error?: { message?: string } }
    | null;
  if (!signUpResp.ok || !signUpJson?.user?.id) {
    const message = signUpJson?.error?.message ?? '注册失败，请稍后再试';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const userId = signUpJson.user.id;

  // 4) 把 phoneNumber + phoneNumberVerified=true 写到 user
  await db
    .update(users)
    .set({
      phoneNumber: phone,
      phoneNumberVerified: true,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  // 5) 把 Better Auth 写进来的 Set-Cookie 透传出去（让浏览器拿到 session）
  // OTP 已经在第 1 步通过后整批删掉了，这里不必再 delete。
  const headers = new Headers();
  signUpResp.headers.forEach((v, k) => {
    if (k.toLowerCase() === 'set-cookie') headers.append('set-cookie', v);
  });
  headers.set('content-type', 'application/json');

  return new NextResponse(
    JSON.stringify({ ok: true, userId, redirectTo: '/account' }),
    { status: 200, headers },
  );
}
