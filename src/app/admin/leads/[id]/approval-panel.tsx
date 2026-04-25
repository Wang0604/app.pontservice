'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PLANS, type PlanId } from '@/lib/pricing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export function LeadApprovalPanel(props: {
  leadId: string;
  orderId?: string;
  currentLeadStatus: string;
  currentPaperworkStatus: string;
  currentAmount: number;
  currentContractId: string | null;
  planId: PlanId;
}) {
  const router = useRouter();
  const plan = PLANS.find((p) => p.id === props.planId);

  const [amount, setAmount] = useState<number>(props.currentAmount || plan?.priceCny || 0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function applyListPrice() {
    if (!plan) return;
    setAmount(plan.priceCny);
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
        body: JSON.stringify({ amountCny: amount }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? '审批失败');
      setMessage('已审批通过，合同 PDF 正在生成。刷新后可点击"发送给客户"');
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

  const canApprove = props.currentPaperworkStatus === 'draft' || props.currentPaperworkStatus === 'pending_approval';
  const canSend = props.currentPaperworkStatus === 'pending_approval' && props.currentContractId;
  const isMonthly = plan?.billingCycle === 'monthly';

  return (
    <Card>
      <CardHeader>
        <CardTitle>审批与合同</CardTitle>
        <CardDescription>
          审批通过后系统会异步生成合同 PDF。确认无误后点"发送给客户"通过邮件通知。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="amount">
              最终价格（元）{isMonthly && <span className="text-muted-foreground"> · 按月</span>}
            </Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value))}
              disabled={loading || !canApprove}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={applyListPrice}
                disabled={!canApprove}
              >
                重置为标准价 ¥{plan?.priceCny}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              如果跟客户谈过特殊价格（折扣 / 涨价），直接填实际成交价即可。
            </p>
          </div>
          <div className="space-y-2">
            <Label>当前状态</Label>
            <div className="rounded-md border p-3 text-sm">
              <div>
                Lead 状态: <strong>{props.currentLeadStatus}</strong>
              </div>
              <div>
                合同状态: <strong>{props.currentPaperworkStatus}</strong>
              </div>
              <div>
                计费周期: <strong>{isMonthly ? '按月订阅' : '一次性'}</strong>
              </div>
            </div>
          </div>
        </div>

        {message && <p className="rounded bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}
        {error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <div className="flex flex-wrap gap-3">
          <Button onClick={handleApprove} disabled={loading || !canApprove}>
            {props.currentContractId ? '重新生成合同' : '审批通过 + 生成合同'}
          </Button>
          {props.currentContractId && (
            <Link href={`/api/contracts/${props.currentContractId}/pdf`} target="_blank">
              <Button variant="outline" type="button">
                预览合同 PDF
              </Button>
            </Link>
          )}
          <Button onClick={handleSendContract} disabled={loading || !canSend} variant="default">
            发送给客户
          </Button>
          <Button onClick={handleMarkLost} disabled={loading} variant="ghost">
            标记流失
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
