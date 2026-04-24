'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PLANS } from '@/lib/pricing';
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
  currentEarlyBird: boolean;
  currentContractId: string | null;
  planId: '999' | '2999' | '36000';
}) {
  const router = useRouter();
  const plan = PLANS.find((p) => p.id === props.planId);

  const [amount, setAmount] = useState<number>(props.currentAmount || plan?.listPriceCny || 0);
  const [earlyBird, setEarlyBird] = useState(props.currentEarlyBird);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function applyEarlyBird() {
    if (!plan) return;
    setEarlyBird(true);
    setAmount(plan.earlyBirdPriceCny);
  }

  function applyListPrice() {
    if (!plan) return;
    setEarlyBird(false);
    setAmount(plan.listPriceCny);
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
        body: JSON.stringify({ amountCny: amount, earlyBird }),
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
            <Label htmlFor="amount">最终价格（元）</Label>
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
                onClick={applyEarlyBird}
                disabled={!canApprove}
              >
                用早鸟价 ¥{plan?.earlyBirdPriceCny}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={applyListPrice}
                disabled={!canApprove}
              >
                用原价 ¥{plan?.listPriceCny}
              </Button>
            </div>
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
                早鸟: <strong>{earlyBird ? '是' : '否'}</strong>
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
