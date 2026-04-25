'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { authClient } from '@/lib/auth/client';
import { normalizeCnPhoneNumber } from '@/lib/auth/phone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type Tab = 'phone' | 'email';

function ForgotPasswordFlow() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('phone');

  // Phone path state
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [debugCode, setDebugCode] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');

  // Email path state
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setError('请输入正确的中国大陆手机号');
      return;
    }
    setLoading(true);
    try {
      const result = await (
        authClient as unknown as {
          phoneNumber: {
            requestPasswordReset: (args: { phoneNumber: string }) => Promise<{
              error: { message?: string } | null;
            }>;
          };
        }
      ).phoneNumber.requestPasswordReset({ phoneNumber: normalized });
      if (result.error) throw new Error(result.error.message ?? '验证码发送失败');
      setOtpSent(true);
      setResendCountdown(60);
      setTimeout(() => pollDebugCode(normalized), 200);
    } catch (err) {
      setError(err instanceof Error ? err.message : '验证码发送失败');
    } finally {
      setLoading(false);
    }
  }

  async function handlePhoneReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const normalized = normalizeCnPhoneNumber(phone);
    if (!normalized) {
      setError('手机号不正确');
      return;
    }
    if (otp.length !== 6) {
      setError('请输入 6 位验证码');
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
      const result = await (
        authClient as unknown as {
          phoneNumber: {
            resetPassword: (args: {
              phoneNumber: string;
              otp: string;
              newPassword: string;
            }) => Promise<{ error: { message?: string } | null }>;
          };
        }
      ).phoneNumber.resetPassword({
        phoneNumber: normalized,
        otp,
        newPassword,
      });
      if (result.error) throw new Error(result.error.message ?? '密码重置失败');
      router.push('/login?reset=ok');
    } catch (err) {
      setError(err instanceof Error ? err.message : '密码重置失败');
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailRequest(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await authClient.requestPasswordReset({
        email,
        redirectTo: '/reset-password',
      });
      if (result.error) throw new Error(result.error.message ?? '发送失败');
      setEmailSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>找回密码</CardTitle>
        <CardDescription>
          {tab === 'phone' ? '通过手机号验证码重置密码' : '我们会发送重置链接到您的邮箱'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 grid grid-cols-2 gap-1 rounded-md bg-muted p-1">
          <button
            type="button"
            onClick={() => {
              setTab('phone');
              setError(null);
              setEmailSent(false);
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
              setOtpSent(false);
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
          <form onSubmit={handlePhoneReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">手机号</Label>
              <div className="flex gap-2">
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
            </div>

            {otpSent && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="otp">短信验证码</Label>
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    pattern="\d{6}"
                    placeholder="6 位"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  />
                  {debugCode && (
                    <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900">
                      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <div>
                        <strong>开发模式</strong>：验证码{' '}
                        <strong className="font-mono">{debugCode}</strong>
                      </div>
                    </div>
                  )}
                </div>

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
                    autoComplete="new-password"
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
                    autoComplete="new-password"
                  />
                </div>
              </>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !otpSent || otp.length !== 6}
            >
              {loading ? '处理中...' : '重置密码'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleEmailRequest} className="space-y-4">
            {emailSent ? (
              <div className="rounded-md border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900">
                <div className="mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <strong>邮件已发送</strong>
                </div>
                <p>
                  如果 <span className="font-mono">{email}</span> 在我们的系统中存在，您将收到一封带有重置链接的邮件。请检查收件箱（含垃圾邮件文件夹）。
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">注册邮箱</Label>
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

                {error && <p className="text-sm text-destructive">{error}</p>}

                <Button type="submit" className="w-full" disabled={loading || !email}>
                  {loading ? '发送中...' : '发送重置链接'}
                </Button>
              </>
            )}
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

export default function ForgotPasswordPage() {
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
        <ForgotPasswordFlow />
      </Suspense>
    </main>
  );
}
