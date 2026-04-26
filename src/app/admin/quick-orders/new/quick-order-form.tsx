'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import QRCode from 'qrcode';
import { Copy, ExternalLink, Infinity as InfinityIcon, RefreshCcw, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DIAGNOSIS_DEPOSIT_CNY, PLANS, type PlanId } from '@/lib/pricing';

interface QuickOrderResult {
  orderId: string;
  orderNumber: string;
  paymentPageUrl: string;
  qrCodeUrl: string;
  provider: string;
  expiresAt?: string;
}

/**
 * 收款模式：
 *  - one_time：999 单次启动包（获客入口，唯一允许的「一次性」付款）
 *  - monthly：2999 / 9999 按月订阅，首月抵扣 999 启动包
 *  - yearly：2999 × 12 / 9999 × 12 包年，自动免 Credits 限制
 */
type PaymentMode = 'one_time' | 'monthly' | 'yearly';

const ENTRY_PLAN: PlanId = '999';

const MONTHLY_PLANS = PLANS.filter((p) => p.billingCycle === 'monthly');

const MODE_TABS: { id: PaymentMode; title: string; subtitle: string; accent: string }[] = [
  {
    id: 'one_time',
    title: '单次付款 · 999 启动包',
    subtitle: '获客入口 · 一次性 ¥999',
    accent: 'sky',
  },
  {
    id: 'monthly',
    title: '月付订阅',
    subtitle: '2999 / 9999 · 按月续费',
    accent: 'slate',
  },
  {
    id: 'yearly',
    title: '包年支付（×12）',
    subtitle: '一次性收 12 个月 · 自动免 Credits',
    accent: 'amber',
  },
];

export function QuickOrderForm({ defaultAppUrl }: { defaultAppUrl: string }) {
  const [mode, setMode] = useState<PaymentMode>('yearly');
  const [planType, setPlanType] = useState<PlanId>('2999');

  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [amountCny, setAmountCny] = useState<number>(2999 * 12);
  const [subject, setSubject] = useState('PONT AI 2999 工具包 · 包年（×12）');
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

  /**
   * 切换收款模式时，把套餐、金额、subject、unlimitedCredits 全部重置成该模式的默认值。
   * 这样切到「包年」时不会沿用上一个 mode 残留下来的不一致状态。
   */
  function switchMode(next: PaymentMode) {
    setMode(next);
    if (next === 'one_time') {
      setPlanType(ENTRY_PLAN);
      setAmountCny(999);
      setSubject('PONT AI 999 启动包');
      setUnlimitedCredits(false);
    } else if (next === 'monthly') {
      const fallback = planType === ENTRY_PLAN ? '2999' : planType;
      setPlanType(fallback);
      const planDef = PLANS.find((p) => p.id === fallback)!;
      setAmountCny(planDef.priceCny);
      setSubject(`PONT AI ${planDef.shortLabel} · 月付`);
      setUnlimitedCredits(false);
    } else {
      const fallback = planType === ENTRY_PLAN ? '2999' : planType;
      setPlanType(fallback);
      const planDef = PLANS.find((p) => p.id === fallback)!;
      setAmountCny(planDef.priceCny * 12);
      setSubject(`PONT AI ${planDef.shortLabel} · 包年（×12）`);
      setUnlimitedCredits(true);
    }
  }

  /** 在「月付 / 包年」模式下切换 2999 ↔ 9999；one_time 模式下 plan 锁定为 999。 */
  function chooseMonthlyPlan(plan: PlanId) {
    if (mode === 'one_time') return;
    setPlanType(plan);
    const planDef = PLANS.find((p) => p.id === plan);
    if (!planDef) return;
    if (mode === 'monthly') {
      setAmountCny(planDef.priceCny);
      setSubject(`PONT AI ${planDef.shortLabel} · 月付`);
    } else {
      setAmountCny(planDef.priceCny * 12);
      setSubject(`PONT AI ${planDef.shortLabel} · 包年（×12）`);
    }
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
    setNotes('');
    switchMode(mode);
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
    <div className="space-y-6">
      <PricingExplainer />

      <Card>
        <CardHeader className="space-y-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Step 1 · 选择收款模式
            </p>
            <CardTitle className="mt-2 text-lg">这一单是哪一种付款？</CardTitle>
            <CardDescription className="mt-1.5">
              选错了模式会影响金额预填、合同抵扣口径、Credits 发放，所以先在这里定清楚。
            </CardDescription>
          </div>
          <div className="grid gap-2 md:grid-cols-3">
            {MODE_TABS.map((t) => {
              const active = mode === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => switchMode(t.id)}
                  disabled={loading || !!result}
                  className={
                    active
                      ? 'flex flex-col items-start gap-1 rounded-xl border-2 border-primary bg-primary/5 p-3.5 text-left transition'
                      : 'flex flex-col items-start gap-1 rounded-xl border-2 border-muted bg-card p-3.5 text-left transition hover:border-muted-foreground/40'
                  }
                >
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    {t.id === 'yearly' && <InfinityIcon className="h-3 w-3 text-amber-600" />}
                    {t.id === 'one_time' && <Zap className="h-3 w-3 text-sky-600" />}
                    {t.id === 'monthly' && <RefreshCcw className="h-3 w-3 text-slate-600" />}
                    {t.id}
                  </div>
                  <div className="text-sm font-bold leading-tight">{t.title}</div>
                  <div className="text-xs leading-snug text-muted-foreground">{t.subtitle}</div>
                </button>
              );
            })}
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Step 2 · 客户信息与金额
          </p>
          <CardTitle className="mt-2 text-lg">填客户资料 + 确认金额</CardTitle>
          <CardDescription>
            提交后会立即生成微信收款二维码，把链接发给客户即可。
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

            {mode !== 'one_time' && (
              <div className="space-y-2">
                <Label>套餐</Label>
                <div className="grid gap-2 md:grid-cols-2">
                  {MONTHLY_PLANS.map((p) => {
                    const checked = planType === p.id;
                    const annual = p.priceCny * 12;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => chooseMonthlyPlan(p.id as PlanId)}
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
                        <div className="text-sm font-bold">{p.shortLabel}</div>
                        <div className="text-xs text-muted-foreground">
                          {mode === 'monthly' ? (
                            <>月付 ¥{p.priceCny.toLocaleString()} / 月</>
                          ) : (
                            <>包年 ¥{annual.toLocaleString()}（{p.priceCny.toLocaleString()} × 12）</>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {mode === 'one_time' && (
              <div className="rounded-lg border-2 border-sky-200 bg-sky-50/60 p-3.5">
                <div className="flex items-center gap-2 text-sm font-bold text-sky-900">
                  <Zap className="h-4 w-4" />
                  套餐已锁定为 999 启动包
                </div>
                <p className="mt-1.5 text-xs leading-5 text-sky-900/85">
                  999 是所有客户的首单获客入口（含 50 credits + 免费 1v1 诊断 + AI 工具抵扣券），
                  不能 ×12，也不会自动给无限 credits。后续客户升级月付 / 包年时由「订单详情页」走升级流程，999 全额抵扣首期。
                </p>
              </div>
            )}

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
                <p className="text-xs text-muted-foreground">
                  切 Tab 会自动重置；如需打折 / 自定义，直接改这里就行。
                </p>
              </div>
              {mode === 'yearly' && currentPlan && (
                <div className="rounded-lg border bg-amber-50/60 px-3 py-2 text-xs leading-5 text-amber-900">
                  <div className="font-bold">包年标准价</div>
                  <div>
                    ¥{currentPlan.priceCny.toLocaleString()} × 12 ={' '}
                    <span className="font-mono font-bold">
                      ¥{(currentPlan.priceCny * 12).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
              {mode === 'monthly' && currentPlan && (
                <div className="rounded-lg border bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-700">
                  <div className="font-bold">月付首期可抵扣</div>
                  <div>
                    {currentPlan.priceCny.toLocaleString()} − {DIAGNOSIS_DEPOSIT_CNY} ={' '}
                    <span className="font-mono font-bold">
                      ¥{(currentPlan.priceCny - DIAGNOSIS_DEPOSIT_CNY).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="subject">收款页 / 微信账单显示标题</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="如：PONT AI 2999 工具包 · 包年（×12）"
                disabled={loading || !!result}
              />
              <p className="text-xs text-muted-foreground">
                客户在微信里看到的账单标题；切换 Tab 时会自动改成对应文案。
              </p>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-lg border bg-amber-50/40 p-3">
              <input
                type="checkbox"
                checked={unlimitedCredits}
                onChange={(e) => setUnlimitedCredits(e.target.checked)}
                disabled={loading || !!result || mode === 'yearly'}
                className="mt-1 h-4 w-4 rounded border-amber-400 text-amber-600 focus:ring-amber-400"
              />
              <span className="text-sm">
                <span className="flex items-center gap-1.5 font-semibold text-amber-900">
                  <Sparkles className="h-3.5 w-3.5" />
                  发放无限 credits（包年默认勾选 · 不可取消）
                </span>
                <span className="mt-1 block text-xs leading-5 text-amber-800/80">
                  {mode === 'yearly'
                    ? '包年模式 = 一次性收 12 个月，话术上「免 Credits 限制」——激活时按 ≈ 10 亿 credits 发放，备注里打 [unlimited_credits] 标签便于追溯。'
                    : '勾上后激活时不再按套餐发放固定 credits（999=50/2999=200/9999=500），改成 ≈ 10 亿（备注会打 [unlimited_credits] 标签）。仅适合种子客户、非标特殊报价。'}
                </span>
              </span>
            </label>

            <div className="space-y-1.5">
              <Label htmlFor="notes">内部备注（仅 admin 可见）</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="如：第一批种子客户，2026-04-26 微信确认包年（×12）。后续发激活邮件时由 XX 跟进。"
                rows={3}
                disabled={loading || !!result}
              />
            </div>

            {error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={loading || !!result}>
                {loading ? '生成中...' : result ? '已生成 ↗' : '生成迅速付款链接'}
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

      <ResultPanel
        result={result}
        qrDataUrl={qrDataUrl}
        fullPaymentUrl={fullPaymentUrl}
        copyHint={copyHint}
        onCopy={copy}
      />
    </div>
  );
}

/**
 * 顶部价格说明面板：把「999 单次 / 月付 + 999 抵扣 / 包年（×12）+ 免 Credits」三条路径
 * 一次性放出来，避免老板在跟客户聊金额时混淆「2,999」和「2,999 × 12 = 35,988」。
 */
function PricingExplainer() {
  const monthlyMid = PLANS.find((p) => p.id === '2999')!;
  const monthlyHigh = PLANS.find((p) => p.id === '9999')!;
  const annualMid = monthlyMid.priceCny * 12;
  const annualHigh = monthlyHigh.priceCny * 12;

  return (
    <Card className="overflow-hidden border-sky-200/70 bg-gradient-to-br from-sky-50/70 via-white to-amber-50/40">
      <CardHeader>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-700">
          Pricing cheat sheet · 给老板看的换算图
        </p>
        <CardTitle className="mt-2 text-base leading-snug">
          999 是入口、月付是结果、包年是「免 Credits」——三条路径在这里看清
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm leading-6">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border-2 border-sky-200 bg-white/85 p-4">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-sky-700">
              <Zap className="h-3 w-3" />
              单次 · 999 启动包
            </div>
            <div className="mt-2 font-mono text-2xl font-black tracking-tight text-slate-900">
              ¥999
            </div>
            <ul className="mt-2 space-y-1 text-xs leading-5 text-slate-700">
              <li>· 50 credits + 免费 1v1 诊断</li>
              <li>· 这是「获客的源头」，不能删</li>
              <li>· 升级月付 / 包年时全额抵扣首期</li>
            </ul>
          </div>
          <div className="rounded-xl border-2 border-slate-200 bg-white/85 p-4">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-700">
              <RefreshCcw className="h-3 w-3" />
              月付 · 2999 / 9999
            </div>
            <div className="mt-2 font-mono text-2xl font-black tracking-tight text-slate-900">
              ¥{monthlyMid.priceCny.toLocaleString()}
              <span className="text-base font-bold text-slate-500"> / 月</span>
            </div>
            <ul className="mt-2 space-y-1 text-xs leading-5 text-slate-700">
              <li>· 200 credits / 月（9999 是 500）</li>
              <li>
                · 已付的 999 抵扣首月：实付{' '}
                <span className="font-mono font-bold">
                  ¥{(monthlyMid.priceCny - DIAGNOSIS_DEPOSIT_CNY).toLocaleString()}
                </span>
              </li>
              <li>· 当月 credits 不累计</li>
            </ul>
          </div>
          <div className="rounded-xl border-2 border-amber-300 bg-white/85 p-4">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700">
              <InfinityIcon className="h-3 w-3" />
              包年 · 一次性 ×12
            </div>
            <div className="mt-2 font-mono text-2xl font-black tracking-tight text-slate-900">
              ¥{annualMid.toLocaleString()}
              <span className="text-base font-bold text-slate-500"> / 年</span>
            </div>
            <ul className="mt-2 space-y-1 text-xs leading-5 text-slate-700">
              <li>
                · {monthlyMid.priceCny.toLocaleString()} × 12 ={' '}
                <span className="font-mono font-bold">¥{annualMid.toLocaleString()}</span>
              </li>
              <li>
                · 9999 包年：
                <span className="font-mono font-bold">¥{annualHigh.toLocaleString()}</span>
              </li>
              <li className="font-bold text-amber-800">
                · 包年自动「免 Credits 限制」（≈ 无限 credits）
              </li>
            </ul>
          </div>
        </div>
        <div className="rounded-lg border border-dashed border-slate-300 bg-white/60 p-3 text-xs leading-6 text-slate-600">
          <span className="font-bold text-slate-900">明天老板要付的那笔：</span>
          选「包年支付（×12）」Tab → 套餐选 2999 →
          金额自动填{' '}
          <span className="font-mono font-bold text-slate-900">¥{annualMid.toLocaleString()}</span>
          （= 2,999 × 12，不是月付 2,999）→「无限 credits」自动勾上→ 生成微信收款链接发过去就行。
        </div>
      </CardContent>
    </Card>
  );
}

function ResultPanel({
  result,
  qrDataUrl,
  fullPaymentUrl,
  copyHint,
  onCopy,
}: {
  result: QuickOrderResult | null;
  qrDataUrl: string | null;
  fullPaymentUrl: string;
  copyHint: string | null;
  onCopy: (text: string, label: string) => void;
}) {
  return (
    <Card className={result ? '' : 'border-dashed bg-muted/30'}>
      <CardHeader>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          Step 3 · 把链接发给客户
        </p>
        <CardTitle className="mt-2 text-lg">
          {result ? '迅速付款链接已生成' : '提交后会显示在这里'}
        </CardTitle>
        <CardDescription>
          {result
            ? '把链接复制发给客户（微信 / 短信 / 邮件都行）。客户打开就能扫码付款。'
            : '点上面「生成迅速付款链接」后，二维码与可复制链接会出现在这里。'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {!result && (
          <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            ⓘ 还没有生成
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

            <div className="grid gap-5 md:grid-cols-[auto_1fr]">
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
                  <p className="text-xs text-muted-foreground">截图发给客户即可</p>
                </div>
              )}

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>支付链接（可发给客户）</Label>
                  <div className="flex gap-2">
                    <Input
                      value={fullPaymentUrl}
                      readOnly
                      className="font-mono text-xs"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => onCopy(fullPaymentUrl, '链接')}
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
                      包年（或勾选了无限 credits）的订单，激活时会自动按 ≈ 10 亿 credits
                      发放，备注里有 [unlimited_credits] 标签便于追溯。
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
