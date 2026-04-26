'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import {
  DIAGNOSIS_DEPOSIT_CNY,
  ENTRY_PLAN_ID,
  UPGRADE_PLAN_IDS,
  calcUpgradeAmount,
  getPlan,
  type PlanId,
} from '@/lib/pricing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

type Stage = 'no-order' | 'awaiting-deposit' | 'deposit-paid' | 'upgraded' | 'activated';

interface ApprovalPanelProps {
  leadId: string;
  orderId?: string;
  orderNumber?: string;
  currentLeadStatus: string;
  currentPaperworkStatus: string;
  currentPaymentStatus: string;
  currentActualAmountCny: number;
  /** 当前订单的 plan（演进中：起始为 999，升级后为 2999/9999） */
  currentPlan: PlanId;
  /** 升级订单中：标准价；首次订单与 actualAmount 相同 */
  originalAmountCny: number;
  /** 升级订单中：已经抵扣的金额；首次订单为 0 */
  discountAmountCny: number;
  /** 升级订单中：之前已收金额；首次订单为 0 */
  priorPaidAmountCny: number;
  upgradedFromPlan: string | null;
  currentContractId: string | null;
  /** lead 提交时的"意向" plan，仅作为参考显示 */
  leadInterestedPlan: PlanId;
}

function decideStage(props: ApprovalPanelProps): Stage {
  if (!props.orderId) return 'no-order';
  if (props.currentPaperworkStatus === 'activated') return 'activated';
  if (props.currentPlan !== ENTRY_PLAN_ID) return 'upgraded';
  if (props.currentPaymentStatus === 'paid') return 'deposit-paid';
  return 'awaiting-deposit';
}

export function LeadApprovalPanel(props: ApprovalPanelProps) {
  const router = useRouter();
  const stage = decideStage(props);
  const entryPlan = getPlan(ENTRY_PLAN_ID)!;
  const currentPlanDef = getPlan(props.currentPlan);

  const [depositAmount, setDepositAmount] = useState<number>(
    stage === 'awaiting-deposit' && props.currentActualAmountCny > 0
      ? props.currentActualAmountCny
      : entryPlan.priceCny,
  );
  const [upgradeTarget, setUpgradeTarget] = useState<PlanId>('2999');
  const [upgradeAmount, setUpgradeAmount] = useState<number>(() => {
    return calcUpgradeAmount('2999', DIAGNOSIS_DEPOSIT_CNY).due;
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentPageUrl, setPaymentPageUrl] = useState<string | null>(
    props.orderId ? `/pay/${props.orderId}` : null,
  );

  function applyDepositListPrice() {
    setDepositAmount(entryPlan.priceCny);
  }

  function chooseUpgradeTarget(plan: PlanId) {
    setUpgradeTarget(plan);
    const upgrade = calcUpgradeAmount(plan, DIAGNOSIS_DEPOSIT_CNY);
    setUpgradeAmount(upgrade.due);
  }

  async function handleCreateDepositOrder() {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/leads/${props.leadId}/payment-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountCny: depositAmount }),
      });
      const body = (await res.json()) as {
        error?: string;
        paymentPageUrl?: string;
        provider?: string;
      };
      if (!res.ok || !body.paymentPageUrl) throw new Error(body.error ?? '创建启动包收款单失败');
      setPaymentPageUrl(body.paymentPageUrl);
      setMessage(`启动包收款页已生成（${body.provider === 'stub' ? '测试模式' : '微信支付'}）`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建启动包收款单失败');
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove() {
    if (!props.orderId) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/orders/${props.orderId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountCny: props.currentActualAmountCny || depositAmount }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? '审批失败');
      setMessage('合同 PDF 正在生成。刷新后可点击"发送给客户"');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '审批失败');
    } finally {
      setLoading(false);
    }
  }

  async function handleSendContract() {
    if (!props.orderId) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/orders/${props.orderId}/send-contract`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error((await res.json()).error ?? '发送失败');
      setMessage('合同邮件已发送给客户');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送失败');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpgrade() {
    if (!props.orderId) return;
    if (
      !confirm(
        `确认把订单升级到 ${upgradeTarget} 套餐？\n\n• 自动抵扣已收 ¥${DIAGNOSIS_DEPOSIT_CNY}\n• 客户需补差 ¥${upgradeAmount}\n• 重新生成合同 + 微信收款页`,
      )
    )
      return;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/orders/${props.orderId}/upgrade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetPlan: upgradeTarget, amountCny: upgradeAmount }),
      });
      const body = (await res.json()) as {
        error?: string;
        paymentPageUrl?: string;
        provider?: string;
        breakdown?: { original: number; discount: number; due: number };
      };
      if (!res.ok || !body.paymentPageUrl) throw new Error(body.error ?? '升级失败');
      setPaymentPageUrl(body.paymentPageUrl);
      setMessage(
        `已升级到 ${upgradeTarget}：标准价 ¥${body.breakdown?.original} - 抵扣 ¥${body.breakdown?.discount} = 客户补差 ¥${body.breakdown?.due}。合同 PDF 重新生成中。`,
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '升级失败');
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkLost() {
    if (!confirm('确定标记为流失？此操作可以回滚。')) return;
    setLoading(true);
    try {
      await fetch(`/api/admin/leads/${props.leadId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'lost' }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>客户处理流程</CardTitle>
          <CardDescription>
            产品规则：所有客户 → 999 启动包收款 → 完成免费诊断会议 → 升级到 2999/9999（999 全额抵扣）→ 客户补差 → 激活账号。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StageProgress stage={stage} />
          <ContextRow {...props} />

          {message && (
            <p className="mt-4 rounded bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>
          )}
          {error && <p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        </CardContent>
      </Card>

      {/* 阶段 1：启动包收款 */}
      {(stage === 'no-order' || stage === 'awaiting-deposit') && (
        <Card>
          <CardHeader>
            <CardTitle>① 999 启动包收款</CardTitle>
            <CardDescription>
              首单永远是 999 启动包（AI 落地启动包）。客户支付后才会进入第二阶段诊断 + 升级。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="depositAmount">启动包金额（元）</Label>
                <Input
                  id="depositAmount"
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(parseFloat(e.target.value))}
                  disabled={loading}
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={applyDepositListPrice}
                  >
                    重置为标准价 ¥{entryPlan.priceCny}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  如果跟客户谈过特殊价格（折扣 / 涨价），直接填实际成交价。
                </p>
              </div>
              <div className="space-y-2">
                <Label>启动包内容（合同里会写清楚）</Label>
                <ul className="space-y-1 rounded-md border p-3 text-xs leading-5 text-muted-foreground">
                  <li>• 免费 40-60 分钟 1v1 诊断咨询</li>
                  <li>• 《AI 落地路线图》PDF 报告</li>
                  <li>• 50 credits 工具体验额度</li>
                  <li>• AI 工具抵扣券（升级 2999 / 9999 时全额抵扣）</li>
                </ul>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 border-t pt-4">
              <Button onClick={handleCreateDepositOrder} disabled={loading || depositAmount <= 0}>
                生成 / 刷新启动包收款页
              </Button>
              {paymentPageUrl && (
                <Link href={paymentPageUrl} target="_blank">
                  <Button variant="outline" type="button">
                    打开收款页
                  </Button>
                </Link>
              )}
              <Button
                onClick={handleApprove}
                disabled={loading || !props.orderId}
                variant="outline"
              >
                {props.currentContractId ? '重新生成启动包合同' : '生成启动包合同'}
              </Button>
              {props.currentContractId && (
                <Link href={`/api/contracts/${props.currentContractId}/pdf`} target="_blank">
                  <Button variant="ghost" type="button">
                    预览合同 PDF
                  </Button>
                </Link>
              )}
              <Button
                onClick={handleSendContract}
                disabled={loading || !props.currentContractId}
                variant="ghost"
              >
                发送合同邮件
              </Button>
              <Button onClick={handleMarkLost} disabled={loading} variant="ghost">
                标记流失
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 阶段 2：客户已支付启动包，可以升级到 2999 / 9999 */}
      {stage === 'deposit-paid' && (
        <Card>
          <CardHeader>
            <CardTitle>② 升级到工具包 / 增长包</CardTitle>
            <CardDescription>
              客户已支付 ¥{DIAGNOSIS_DEPOSIT_CNY} 启动包。完成 40-60 分钟免费诊断会议、客户决定继续后，在这里把订单升级到 2999 工具包或 9999 增长包；999 元会自动抵扣，客户只需补差。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 md:grid-cols-2">
              {UPGRADE_PLAN_IDS.map((planId) => {
                const plan = getPlan(planId)!;
                const upgrade = calcUpgradeAmount(planId, DIAGNOSIS_DEPOSIT_CNY);
                const checked = upgradeTarget === planId;
                return (
                  <button
                    key={planId}
                    type="button"
                    onClick={() => chooseUpgradeTarget(planId)}
                    className={
                      checked
                        ? 'flex flex-col gap-2 rounded-xl border-2 border-primary bg-primary/5 p-4 text-left transition'
                        : 'flex flex-col gap-2 rounded-xl border-2 border-muted bg-card p-4 text-left transition hover:border-muted-foreground/50'
                    }
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          checked
                            ? 'flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground'
                            : 'h-5 w-5 shrink-0 rounded-full border-2 border-muted-foreground/30'
                        }
                      >
                        {checked && <Check className="h-3 w-3" />}
                      </span>
                      <span className="font-bold">{plan.shortLabel}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{plan.tagline}</div>
                    <div className="mt-1 text-sm">
                      标准价 <span className="font-mono">¥{upgrade.original}</span>
                      <span className="mx-1 text-muted-foreground">-</span>
                      启动包抵扣 <span className="font-mono">¥{upgrade.discount}</span>
                      <span className="mx-1 text-muted-foreground">=</span>
                      <span className="font-bold">客户补差 ¥{upgrade.due}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="upgradeAmount">客户实际补差（元）</Label>
                <Input
                  id="upgradeAmount"
                  type="number"
                  value={upgradeAmount}
                  onChange={(e) => setUpgradeAmount(parseFloat(e.target.value))}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  默认 = 套餐标准价 - ¥{DIAGNOSIS_DEPOSIT_CNY} 抵扣。如有特殊折扣可手动覆盖。
                </p>
              </div>
              <div className="space-y-2">
                <Label>升级会自动做这些事</Label>
                <ul className="space-y-1 rounded-md border p-3 text-xs leading-5 text-muted-foreground">
                  <li>• 订单 plan 切换为 {upgradeTarget}</li>
                  <li>• 记录 ¥{DIAGNOSIS_DEPOSIT_CNY} 抵扣（discount_amount_cny）</li>
                  <li>• 重新生成合同 PDF（{getPlan(upgradeTarget)?.contractTemplateId}）</li>
                  <li>• 重新生成微信收款页（拿差额）</li>
                  <li>• 状态回到「待付款」</li>
                </ul>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 border-t pt-4">
              <Button
                onClick={handleUpgrade}
                disabled={loading || upgradeAmount < 0}
              >
                <ArrowRight className="mr-1 h-4 w-4" />
                升级到 {upgradeTarget}（补差 ¥{upgradeAmount}）
              </Button>
              {paymentPageUrl && (
                <Link href={paymentPageUrl} target="_blank">
                  <Button variant="outline" type="button">
                    打开当前订单页
                  </Button>
                </Link>
              )}
              <p className="w-full text-xs text-muted-foreground">
                如果客户决定不升级（坚持只买启动包），到「订单详情页」直接按 999 套餐激活即可。
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 阶段 3：升级订单等待补差付款 */}
      {stage === 'upgraded' && (
        <Card>
          <CardHeader>
            <CardTitle>③ 升级补差中</CardTitle>
            <CardDescription>
              订单已升级到 {currentPlanDef?.shortLabel}。等客户付清补差后，到「订单详情页」做最终激活（发 credits + 开发票 + 发激活邮件）。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border p-4 text-sm">
              <div className="grid gap-2 md:grid-cols-3">
                <div>
                  <div className="text-xs text-muted-foreground">套餐</div>
                  <div className="font-semibold">{currentPlanDef?.shortLabel}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">标准价 / 已抵扣</div>
                  <div className="font-mono">
                    ¥{props.originalAmountCny.toLocaleString()} - ¥
                    {props.discountAmountCny.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">客户补差实付</div>
                  <div className="font-mono font-bold">
                    ¥{props.currentActualAmountCny.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 border-t pt-4">
              {paymentPageUrl && (
                <Link href={paymentPageUrl} target="_blank">
                  <Button variant="outline" type="button">
                    打开补差收款页
                  </Button>
                </Link>
              )}
              {props.currentContractId && (
                <Link href={`/api/contracts/${props.currentContractId}/pdf`} target="_blank">
                  <Button variant="outline" type="button">
                    预览升级合同 PDF
                  </Button>
                </Link>
              )}
              <Button onClick={handleSendContract} disabled={loading || !props.currentContractId}>
                重新发送合同邮件
              </Button>
              {props.orderId && (
                <Link href={`/admin/orders/${props.orderId}`}>
                  <Button variant="ghost" type="button">
                    去订单详情激活 →
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 已激活 */}
      {stage === 'activated' && (
        <Card>
          <CardHeader>
            <CardTitle>✓ 已激活</CardTitle>
            <CardDescription>
              客户已经按 {currentPlanDef?.shortLabel} 激活账号。如需后续操作（继续升级、取消订阅、重发激活邮件），到「订单详情页」处理。
            </CardDescription>
          </CardHeader>
          <CardContent>
            {props.orderId && (
              <Link href={`/admin/orders/${props.orderId}`}>
                <Button variant="outline" type="button">
                  打开订单详情 →
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StageProgress({ stage }: { stage: Stage }) {
  const steps: { id: Stage; label: string; sub: string }[] = [
    { id: 'awaiting-deposit', label: '启动包收款', sub: '999 元' },
    { id: 'deposit-paid', label: '免费诊断会议', sub: '40-60 分钟' },
    { id: 'upgraded', label: '升级 + 补差', sub: '抵扣 999' },
    { id: 'activated', label: '激活账号', sub: '发 credits' },
  ];

  const order: Stage[] = [
    'no-order',
    'awaiting-deposit',
    'deposit-paid',
    'upgraded',
    'activated',
  ];
  const currentIdx = order.indexOf(stage);

  return (
    <div className="flex flex-wrap gap-2">
      {steps.map((s) => {
        const idx = order.indexOf(s.id);
        const done = currentIdx > idx;
        const active = currentIdx === idx;
        return (
          <div
            key={s.id}
            className={
              active
                ? 'flex items-center gap-2 rounded-full bg-primary px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-primary-foreground'
                : done
                  ? 'flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-emerald-700'
                  : 'flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground'
            }
          >
            <span
              className={
                active
                  ? 'flex h-4 w-4 items-center justify-center rounded-full bg-primary-foreground text-primary'
                  : done
                    ? 'flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-white'
                    : 'h-4 w-4 rounded-full border border-muted-foreground/30'
              }
            >
              {done && <Check className="h-2.5 w-2.5" />}
            </span>
            <span>{s.label}</span>
            <span className="text-[10px] opacity-70">· {s.sub}</span>
          </div>
        );
      })}
    </div>
  );
}

function ContextRow(props: ApprovalPanelProps) {
  return (
    <div className="mt-5 grid gap-4 rounded-lg border bg-muted/30 p-4 text-xs md:grid-cols-3">
      <div>
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
          当前 Plan
        </div>
        <div className="mt-1 font-bold">
          {getPlan(props.currentPlan)?.shortLabel ?? props.currentPlan}
          {props.upgradedFromPlan && (
            <span className="ml-2 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
              已从 {getPlan(props.upgradedFromPlan)?.shortLabel ?? props.upgradedFromPlan} 升级
            </span>
          )}
        </div>
        {props.leadInterestedPlan !== props.currentPlan && (
          <div className="mt-1 text-[10px] text-muted-foreground">
            客户提交时意向：{getPlan(props.leadInterestedPlan)?.shortLabel ?? props.leadInterestedPlan}
          </div>
        )}
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">订单状态</div>
        <div className="mt-1 font-bold">
          {props.currentPaperworkStatus} · 支付 {props.currentPaymentStatus}
        </div>
        <div className="mt-1 text-[10px] text-muted-foreground">
          Lead 状态：{props.currentLeadStatus}
        </div>
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
          金额结构（元）
        </div>
        <div className="mt-1 font-mono">
          {props.discountAmountCny > 0 ? (
            <>
              标准价 {props.originalAmountCny.toLocaleString()}
              {' - '}抵扣 {props.discountAmountCny.toLocaleString()}
              {' = '}补差 {props.currentActualAmountCny.toLocaleString()}
            </>
          ) : (
            <>本次实付 {props.currentActualAmountCny.toLocaleString()}</>
          )}
        </div>
        {props.priorPaidAmountCny > 0 && (
          <div className="mt-1 text-[10px] text-muted-foreground">
            前序已收 ¥{props.priorPaidAmountCny.toLocaleString()}（启动包阶段）
          </div>
        )}
      </div>
    </div>
  );
}

