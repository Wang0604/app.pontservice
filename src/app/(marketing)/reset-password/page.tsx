'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authClient } from '@/lib/auth/client';
import { BrandLogo } from '@/components/brand-logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function ResetPasswordFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!token) {
      setError('链接缺少令牌或已失效，请重新申请密码重置邮件');
      return;
    }
    if (newPassword.length < 8) {
      setError('新密码至少 8 位');
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      setError('两次输入的密码不一致');
      return;
    }
    setLoading(true);
    try {
      const result = await authClient.resetPassword({
        newPassword,
        token,
      });
      if (result.error) throw new Error(result.error.message ?? '密码重置失败');
      setDone(true);
      setTimeout(() => router.push('/login?reset=ok'), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : '密码重置失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>设置新密码</CardTitle>
        <CardDescription>
          {done ? '密码已重置，正在跳转登录页…' : '请设置一个至少 8 位的新密码'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!done && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">新密码</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="至少 8 位"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPasswordConfirm">确认新密码</Label>
              <Input
                id="newPasswordConfirm"
                type="password"
                placeholder="再次输入"
                required
                minLength={8}
                value={newPasswordConfirm}
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading || !token}>
              {loading ? '处理中...' : '保存新密码'}
            </Button>
          </form>
        )}
        <div className="mt-6 text-center text-sm">
          <Link href="/login" className="text-muted-foreground hover:text-primary">
            返回登录
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
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
        <ResetPasswordFlow />
      </Suspense>
    </main>
  );
}
