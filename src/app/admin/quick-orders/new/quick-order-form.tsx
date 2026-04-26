'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import QRCode from 'qrcode';
import { Copy, ExternalLink, RefreshCcw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PLANS, type PlanId } from '@/lib/pricing';

interface QuickOrderResult {
  orderId: string;
  orderNumber: string;
  paymentPageUrl: string;
  qrCodeUrl: string;
  provider: string;
  expiresAt?: string;
}

const PLAN_OPTIONS = PLANS.map((p) => ({
  id: p.id as PlanId,
  label: p.shortLabel,
  price: p.priceCny,
  credits: p.credits,
  cycle: p.billingCycle,
}));

export function QuickOrderForm({ defaultAppUrl }: { defaultAppUrl: string }) {
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [planType, setPlanType] = useState<PlanId>('2999');
  const [amountCny, setAmountCny] = useState<number>(2999);
  const [subject, setSubject] = useState('');
  const [unlimitedCredits, setUnlimitedCredits] = useState(true);
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QuickOrderResult | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copyHint, setCopyHint] = useState<string | null>(null);

  useEffect(() => {
    if (!result?.qrCodeUrl) {
      setQrDataUrl(null);
      return;
    }
    QRCode.toDataURL(result.qrCodeUrl, { margin: 1, width: 280 })
      .then((url) => setQrDataUrl(url))
      .catch(() => setQrDataUrl(null));
  }, [result?.qrCodeUrl]);

  const currentPlan = PLANS.find((p) => p.id === planType);
  const isMonthlyPlan = currentPlan?.billingCycle === 'monthly';

  function applySuggestedSubject(plan: PlanId, amount: number) {
    const planDef = PLANS.find((p) => p.id === plan);
    if (!planDef) return;
    if (planDef.billingCycle === 'monthly' && amount > planDef.priceCny * 6) {
      setSubject(`PONT AI ${planDef.shortLabel} · 年付（种子客户）`);
    } else {
      setSubject(`PONT AI ${planDef.shortLabel}`);
    }
  }

  function choosePlan(plan: PlanId) {
    setPlanType(plan);
    const planDef = PLANS.find((p) => p.id === plan);
    if (!planDef) return;
    setAmountCny(planDef.priceCny);
    applySuggestedSubject(plan, planDef.priceCny);
  }

  function applyAnnualPreset() {
    const planDef = PLANS.find((p) => p.id === planType);
    if (!planDef || planDef.billingCycle !== 'monthly') return;
    const annual = planDef.priceCny * 12;
    setAmountCny(annual);
    applySuggestedSubject(planType, annual);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/admin/quick-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: companyName.trim(),
          contactName: contactName.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          planType,
          amountCny,
          subject: subject.trim() || undefined,
          unlimitedCredits,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? `创建失败 (${res.status})`);
      setResult(data as QuickOrderResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败');
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setResult(null);
    setQrDataUrl(null);
    setCompanyName('');
    setContactName('');
    setEmail('');
    setPhone('');
    setPlanType('2999');
    setAmountCny(2999);
    setSubject('');
    setUnlimitedCredits(true);
    setNotes('');
  }

  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyHint(`${label} 已复制`);
      setTimeout(() => setCopyHint(null), 1500);
    } catch {
      setCopyHint('复制失败，请手动选中文本');
    }
  }

  const fullPaymentUrl = result?.paymentPageUrl?.startsWith('http')
    ? result.paymentPageUrl
    : `${defaultAppUrl}${result?.paymentPageUrl ?? ''}`;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>客户与金额</CardTitle>
          <CardDescription>
            任意金额、任意套餐、不走标准 lead 流程，立刻生成微信收款链接发给客户。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="companyName">客户公司</Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="如：深圳某某科技有限公司"
                  required
                  disabled={loading || !!result}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contactName">客户姓名</Label>
                <Input
                  id="contactName"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="如：张老板"
                  required
                  disabled={loading || !!result}
                />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="email">邮箱（用于发激活邮件）</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="customer@example.com"
                  required
                  disabled={loading || !!result}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">手机（可选）</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="13800001234"
                  disabled={loading || !!result}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>套餐类型</Label>
              <div className="grid gap-2 md:grid-cols-3">
                {PLAN_OPTIONS.map((p) => {
                  const checked = planType === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => choosePlan(p.id)}
                      disabled={loading || !!result}
                      className={
                        checked
                          ? 'flex flex-col items-start gap-1 rounded-lg border-2 border-primary bg-primary/5 p-3 text-left transition'
                          : 'flex flex-col items-start gap-1 rounded-lg border-2 border-muted bg-card p-3 text-left transition hover:border-muted-foreground/50'
                      }
                    >
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">
                        Plan {p.id}
                      </div>
                      <div className="text-sm font-bold">{p.label}</div>
                      <div className="text-xs text-muted-foreground">
                        标准价 ¥{p.price.toLocaleString()}
                        {p.cycle === 'monthly' ? ' /月' : ' · 一次性'}
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                999 启动包是一次性付费；2999 / 9999 是按月订阅，可以「按年付」一次性收 12 个月。
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
              <div className="space-y-1.5">
                <Label htmlFor="amountCny">实际收款金额（元）</Label>
                <Input
                  id="amountCny"
                  type="number"
                  min={1}
                  step="0.01"
                  value={amountCny}
                  onChange={(e) => setAmountCny(parseFloat(e.target.value) || 0)}
                  required
                  disabled={loading || !!result}
                />
              </div>
              {isMonthlyPlan ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={applyAnnualPreset}
                  disabled={loading || !!result}
                  title={`一次按 12 个月收：¥${(currentPlan?.priceCny ?? 0) * 12}`}
                >
                  按年付（×12）
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  disabled
                  title="999 是一次性付费，没有 ×12 概念"
                >
                  仅一次付费
                </Button>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="subject">收款页 / 微信账单显示标题</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={`如：PONT AI ${PLANS.find((p) => p.id === planType)?.shortLabel} · 年付（种子客户）`}
                disabled={loading || !!result}
              />
              <p className="text-xs text-muted-foreground">
                留空会自动用「PONT AI {PLANS.find((p) => p.id === planType)?.shortLabel}」。
              </p>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-lg border bg-amber-50/40 p-3">
              <input
                type="checkbox"
                checked={unlimitedCredits}
                onChange={(e) => setUnlimitedCredits(e.target.checked)}
                disabled={loading || !!result}
                className="mt-1 h-4 w-4 rounded border-amber-400 text-amber-600 focus:ring-amber-400"
              />
              <span className="text-sm">
                <span className="flex items-center gap-1.5 font-semibold text-amber-900">
                  <Sparkles className="h-3.5 w-3.5" />
                  种子客户：发放无限 credits
                </span>
                <span className="mt-1 block text-xs leading-5 text-amber-800/80">
                  勾选后，激活时不再按套餐发放固定额度，会发一个超大值（≈ 无限），
                  并在订单备注里打 [unlimited_credits] 标签便于追溯。
                </span>
              </span>
            </label>

            <div className="space-y-1.5">
              <Label htmlFor="notes">内部备注（仅 admin 可见）</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="如：第一批种子客户，2026-04-26 微信确认年付。后续发激活邮件时由 XX 跟进。"
                rows={3}
                disabled={loading || !!result}
              />
            </div>

            {error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}

            <div className="flex gap-3">
              <Button type="submit" disabled={loading || !!result}>
                {loading ? '生成中...' : result ? '已生成 ↗' : '生成微信收款链接'}
              </Button>
              {result && (
                <Button type="button" variant="ghost" onClick={handleReset}>
                  <RefreshCcw className="mr-1 h-4 w-4" />
                  再开一单
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className={result ? '' : 'border-dashed bg-muted/30'}>
        <CardHeader>
          <CardTitle>{result ? '收款链接已生成' : '提交后会显示在这里'}</CardTitle>
          <CardDescription>
            {result
              ? '把链接复制发给客户（微信 / 短信 / 邮件都行）。客户打开就能扫码付款。'
              : '左边填好后点「生成微信收款链接」，右边会立即显示二维码和可复制的链接。'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {!result && (
            <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              ⓘ 没有数据
            </p>
          )}

          {result && (
            <>
              <div className="rounded-lg border p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">订单号</span>
                  <span className="font-mono">{result.orderNumber}</span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">支付方式</span>
                  <span>
                    {result.provider === 'wechat'
                      ? '微信支付（Native）'
                      : `测试模式（${result.provider}）`}
                  </span>
                </div>
                {result.expiresAt && (
                  <div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span>二维码有效期至</span>
                    <span>{new Date(result.expiresAt).toLocaleString('zh-CN')}</span>
                  </div>
                )}
              </div>

              {qrDataUrl && (
                <div className="flex flex-col items-center gap-2 rounded-lg border p-4">
                  <Image
                    src={qrDataUrl}
                    alt="微信支付二维码"
                    width={240}
                    height={240}
                    unoptimized
                    className="rounded border p-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    把这张二维码截图发给客户，客户用微信扫码即可支付。
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label>支付链接（可发给客户）</Label>
                <div className="flex gap-2">
                  <Input value={fullPaymentUrl} readOnly className="font-mono text-xs" />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => copy(fullPaymentUrl, '链接')}
                    title="复制链接"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Link href={fullPaymentUrl} target="_blank">
                    <Button type="button" variant="outline" size="icon" title="打开支付页">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
                {copyHint && <p className="text-xs text-emerald-700">{copyHint}</p>}
                <p className="text-xs text-muted-foreground">
                  客户打开后会看到一张微信支付二维码（同上）和金额，扫码付款后状态会自动更新。
                </p>
              </div>

              <div className="rounded-md border bg-emerald-50/50 p-3 text-xs leading-5 text-emerald-900">
                <div className="font-semibold">客户付款后会发生什么</div>
                <ol className="ml-4 mt-1 list-decimal space-y-0.5">
                  <li>微信回调到 /api/wechat/notify，订单自动标记为「已支付」。</li>
                  <li>
                    在{' '}
                    <Link href={`/admin/orders/${result.orderId}`} className="underline">
                      订单详情页
                    </Link>{' '}
                    点「对账通过、激活账号」即可发 credits + 开发票 + 发激活邮件。
                  </li>
                  <li>
                    若勾选了无限 credits，激活时会自动按超大值发放（备注里有 [unlimited_credits]
                    标签）。
                  </li>
                </ol>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
