'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { authClient } from '@/lib/auth/client';
import { normalizeCnPhoneNumber, formatCnPhoneForDisplay } from '@/lib/auth/phone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function RegisterFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') ?? '/account';

  const [stage, setStage] = useState<1 | 2>(1);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [debugCode, setDebugCode] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resend countdown timer
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (resendCountdown <= 0) return;
    timerRef.current = setInterval(() => {
      setResendCountdown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [resendCountdown]);

  async function pollDebugCode(normalized: string) {
    // Poll a few times because the SMS provider runs in a background promise
    // and the code may not be cached the instant send-otp returns.
    for (let i = 0; i < 6; i += 1) {
      try {
        const res = await fetch(
          `/api/auth/sms/debug-peek?phone=${encodeURIComponent(normalized)}`,
        );
        if (res.ok) {
          const json = (await res.json()) as { code: string | null };
          if (json.code) {
            setDebugCode(json.code);
            return;
          }
        }
      } catch {
        /* ignore */
      }
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  async function handleSendOtp() {
    setError(null);
    const normalized = normalizeCnPhoneNumber(phone);
    if (!normalized) {
      setError('请输入正确的中国大陆手机号（11 位）');
      return;
    }
    setLoading(true);
    try {
      const result = await (
        authClient as unknown as {
          phoneNumber: {
            sendOtp: (args: { phoneNumber: string }) => Promise<{ error: { message?: string } | null }>;
          };
        }
      ).phoneNumber.sendOtp({ phoneNumber: normalized });
      if (result.error) throw new Error(result.error.message ?? '验证码发送失败');
      setOtpSent(true);
      setResendCountdown(60);
      // try to surface debug code in dev/stub mode
      setTimeout(() => pollDebugCode(normalized), 200);
    } catch (err) {
      setError(err instanceof Error ? err.message : '验证码发送失败');
    } finally {
      setLoading(false);
    }
  }

  function handleStage1Continue(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!normalizeCnPhoneNumber(phone)) {
      setError('请输入正确的中国大陆手机号');
      return;
    }
    if (otp.length !== 6) {
      setError('请输入 6 位验证码');
      return;
    }
    // 不在前端校验 OTP — 直接进 Stage 2，最终注册时一起校验
    setStage(2);
  }

  async function handleSubmitRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== passwordConfirm) {
      setError('两次输入的密码不一致');
      return;
    }
    if (password.length < 8) {
      setError('密码至少 8 位');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/sms/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: phone,
          otp,
          email,
          password,
          fullName,
          companyName: companyName || undefined,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        redirectTo?: string;
      };
      if (!res.ok || !body.ok) {
        throw new Error(body.error ?? '注册失败，请稍后再试');
      }
      router.push(body.redirectTo ?? redirectTo);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败');
      // OTP 错误时回到 Stage 1 让用户重新发码
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('验证码')) {
        setStage(1);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>注册 Pontai</CardTitle>
        <CardDescription>
          {stage === 1
            ? `第 1 步 / 共 2 步 · 验证手机号`
            : `第 2 步 / 共 2 步 · 设置邮箱和密码`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {stage === 1 ? (
          <form onSubmit={handleStage1Continue} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">手机号 *</Label>
              <div className="flex gap-2">
                <Input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  placeholder="13800138000"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={loading || otpSent}
                  autoComplete="tel"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSendOtp}
                  disabled={loading || resendCountdown > 0 || phone.length < 11}
                  className="shrink-0"
                >
                  {resendCountdown > 0 ? `${resendCountdown}s` : otpSent ? '重新发送' : '获取验证码'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                仅支持中国大陆 11 位手机号
              </p>
            </div>

            {otpSent && (
              <div className="space-y-2">
                <Label htmlFor="otp">短信验证码 *</Label>
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  pattern="\d{6}"
                  placeholder="6 位验证码"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  autoFocus
                />
                {debugCode && (
                  <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <div>
                      <strong>开发模式</strong>：当前使用 stub 短信（未接真实短信网关）。
                      验证码 <strong className="font-mono">{debugCode}</strong> — 直接复制使用。
                    </div>
                  </div>
                )}
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !otpSent || otp.length !== 6}
            >
              下一步
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSubmitRegister} className="space-y-4">
            <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
              已验证手机号：<span className="font-mono">{formatCnPhoneForDisplay(normalizeCnPhoneNumber(phone))}</span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">姓名 *</Label>
              <Input
                id="fullName"
                placeholder="张三"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName">公司名称（可选）</Label>
              <Input
                id="companyName"
                placeholder="北京样本科技有限公司"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">邮箱 *</Label>
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
              <p className="text-xs text-muted-foreground">
                用于接收发票、合同和重要通知
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">密码 *</Label>
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

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '正在创建账号...' : '完成注册'}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => {
                setStage(1);
                setError(null);
              }}
            >
              <ArrowLeft className="h-4 w-4" />
              返回上一步
            </Button>
          </form>
        )}

        <div className="mt-6 text-center text-sm">
          <Link
            href={`/login?redirectTo=${encodeURIComponent(redirectTo)}`}
            className="text-muted-foreground hover:text-primary"
          >
            已有账号？登录
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <Link href="/" className="mb-8 text-xl font-semibold">
        Pontai
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
        <RegisterFlow />
      </Suspense>
    </main>
  );
}
