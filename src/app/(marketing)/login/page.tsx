'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signIn, authClient } from '@/lib/auth/client';
import { normalizeCnPhoneNumber } from '@/lib/auth/phone';
import { BrandLogo } from '@/components/brand-logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type Tab = 'phone' | 'email';

function LoginFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') ?? '/account';

  const [tab, setTab] = useState<Tab>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePhoneLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const normalized = normalizeCnPhoneNumber(phone);
    if (!normalized) {
      setError('请输入正确的中国大陆手机号（11 位）');
      return;
    }
    if (password.length < 8) {
      setError('密码至少 8 位');
      return;
    }
    setLoading(true);
    try {
      // better-auth phoneNumber plugin: authClient.signIn.phoneNumber
      const result = await (
        authClient.signIn as unknown as {
          phoneNumber: (args: { phoneNumber: string; password: string }) => Promise<{
            error: { message?: string } | null;
          }>;
        }
      ).phoneNumber({
        phoneNumber: normalized,
        password,
      });
      if (result.error) throw new Error(result.error.message ?? '登录失败');
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '手机号或密码不正确');
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('密码至少 8 位');
      return;
    }
    setLoading(true);
    try {
      const result = await signIn.email({ email, password });
      if (result.error) throw new Error(result.error.message ?? '登录失败');
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '邮箱或密码不正确');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>登录 Pontai</CardTitle>
        <CardDescription>
          {tab === 'phone' ? '使用手机号 + 密码登录（推荐）' : '使用企业邮箱 + 密码登录'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 grid grid-cols-2 gap-1 rounded-md bg-muted p-1">
          <button
            type="button"
            onClick={() => {
              setTab('phone');
              setError(null);
            }}
            className={
              tab === 'phone'
                ? 'rounded-sm bg-background px-3 py-1.5 text-sm font-medium shadow-sm'
                : 'rounded-sm px-3 py-1.5 text-sm text-muted-foreground'
            }
          >
            手机号
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('email');
              setError(null);
            }}
            className={
              tab === 'email'
                ? 'rounded-sm bg-background px-3 py-1.5 text-sm font-medium shadow-sm'
                : 'rounded-sm px-3 py-1.5 text-sm text-muted-foreground'
            }
          >
            邮箱
          </button>
        </div>

        {tab === 'phone' ? (
          <form onSubmit={handlePhoneLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">手机号</Label>
              <Input
                id="phone"
                type="tel"
                inputMode="numeric"
                placeholder="13800138000"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
                autoComplete="tel"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                placeholder="至少 8 位"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="current-password"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '登录中...' : '登录'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">企业邮箱</Label>
              <Input
                id="email"
                type="email"
                placeholder="[email protected]"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                placeholder="至少 8 位"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="current-password"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '登录中...' : '登录'}
            </Button>
          </form>
        )}

        <div className="mt-6 flex items-center justify-between text-sm">
          <Link href="/forgot-password" className="text-muted-foreground hover:text-primary">
            忘记密码？
          </Link>
          <Link href={`/register?redirectTo=${encodeURIComponent(redirectTo)}`} className="font-medium hover:text-primary">
            还没有账号？立即注册
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <Link href="/" className="mb-8 transition-opacity hover:opacity-85" aria-label="Pontai 首页">
        <BrandLogo imageClassName="h-11" />
      </Link>
      <Suspense
        fallback={
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>加载中...</CardTitle>
            </CardHeader>
          </Card>
        }
      >
        <LoginFlow />
      </Suspense>
    </main>
  );
}
