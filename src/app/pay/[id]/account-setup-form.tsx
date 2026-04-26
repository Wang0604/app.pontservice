'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, KeyRound, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Props {
  orderId: string;
  prefilledEmail: string;
  prefilledFullName: string;
  isLoggedIn: boolean;
}

/**
 * 付款成功后渲染的内嵌组件：
 *
 *   - 已登录用户：显示「确认激活当前账户」按钮，点一下走 /api/checkout/complete
 *     不带 password 的分支，发 50 credits 后跳到 /account。
 *   - 未登录用户：显示邮箱（只读，必须等于下单邮箱）+ 姓名 + 密码两栏，提交后
 *     /api/checkout/complete 会创建账号 + 自动登录 + 激活，再跳到 /account。
 */
export function AccountSetupForm({
  orderId,
  prefilledEmail,
  prefilledFullName,
  isLoggedIn,
}: Props) {
  const router = useRouter();
  const [fullName, setFullName] = useState(prefilledFullName);
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needLoginUrl, setNeedLoginUrl] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNeedLoginUrl(null);

    if (!isLoggedIn) {
      if (password.length < 8) {
        setError('密码至少 8 位');
        return;
      }
      if (password !== passwordConfirm) {
        setError('两次输入的密码不一致');
        return;
      }
    }

    setLoading(true);
    try {
      const requestBody: Record<string, unknown> = {
        orderId,
        email: prefilledEmail,
      };
      if (!isLoggedIn) requestBody.password = password;
      if (fullName) requestBody.fullName = fullName;

      const res = await fetch('/api/checkout/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      const responseBody = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        redirectTo?: string;
        error?: string;
        needLogin?: boolean;
        loginUrl?: string;
      };
      if (!res.ok || !responseBody.ok) {
        if (responseBody.needLogin && responseBody.loginUrl) {
          setNeedLoginUrl(responseBody.loginUrl);
        }
        throw new Error(responseBody.error ?? '激活失败，请稍后再试');
      }
      const target = responseBody.redirectTo ?? '/account';
      window.location.assign(target);
    } catch (err) {
      setError(err instanceof Error ? err.message : '激活失败');
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-900">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          <div>
            <div className="font-bold">支付已确认</div>
            <div className="mt-0.5 text-xs text-emerald-800">
              {isLoggedIn
                ? '点击下方按钮把启动包权益挂到当前登录账户，50 credits 立即到账。'
                : '请设置一个登录密码以激活账户，激活后 50 credits 立即到账并自动跳转工作台。'}
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">登录邮箱</Label>
          <Input
            id="email"
            type="email"
            value={prefilledEmail}
            readOnly
            disabled
            className="bg-muted/50 font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            {isLoggedIn
              ? '已用此邮箱登录'
              : '即下单时填写的邮箱，将作为登录账号；请记牢。'}
          </p>
        </div>

        {!isLoggedIn && (
          <>
            <div className="space-y-2">
              <Label htmlFor="fullName">姓名</Label>
              <Input
                id="fullName"
                placeholder="例如：张先生"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading}
                maxLength={60}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">设置密码 *</Label>
              <Input
                id="password"
                type="password"
                placeholder="至少 8 位"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="passwordConfirm">确认密码 *</Label>
              <Input
                id="passwordConfirm"
                type="password"
                placeholder="再次输入密码"
                required
                minLength={8}
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
              />
            </div>
          </>
        )}

        {error && (
          <div className="space-y-2 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
            <div>{error}</div>
            {needLoginUrl && (
              <Link
                href={needLoginUrl}
                className="inline-flex items-center gap-1 text-xs font-bold text-red-900 underline hover:text-red-700"
              >
                <LogIn className="h-3 w-3" /> 用密码登录后再回到本页激活 →
              </Link>
            )}
          </div>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            '处理中...'
          ) : isLoggedIn ? (
            <>
              确认激活账户
              <ArrowRight className="ml-1 h-4 w-4" />
            </>
          ) : (
            <>
              <KeyRound className="mr-1 h-4 w-4" />
              设置密码并进入工作台
            </>
          )}
        </Button>

        <p
          className="text-center text-xs text-muted-foreground"
          onClick={() => router.refresh()}
        >
          {isLoggedIn ? (
            <>已经激活？<Link href="/account" className="underline hover:text-primary">前往账户</Link></>
          ) : (
            <>
              已经有账号？{' '}
              <Link
                href={`/login?redirectTo=${encodeURIComponent(`/pay/${orderId}`)}`}
                className="underline hover:text-primary"
              >
                用密码登录后再激活
              </Link>
            </>
          )}
        </p>
      </form>
    </div>
  );
}
