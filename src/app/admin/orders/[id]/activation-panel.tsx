'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function ActivationPanel(props: {
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  customerCompany: string;
  /** 当前订单的实付金额（升级订单 = 差额；首单 = 标价） */
  amountCny: number;
  /** 套餐标准价（升级订单与 amountCny 不同；首单相同） */
  originalAmountCny: number;
  /** 升级订单的抵扣金额，首单为 0 */
  discountAmountCny: number;
  currentStatus: string;
  receiptCount: number;
  planLabel: string;
}) {
  const router = useRouter();
  const [invoiceNumber, setInvoiceNumber] = useState(() => {
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `PONT-INV-${datePart}-001`;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const isUpgrade = props.discountAmountCny > 0;
  const totalForInvoice = isUpgrade ? props.amountCny + props.discountAmountCny : props.amountCny;

  async function handleActivate() {
    if (
      !confirm(
        `确认激活订单 ${props.orderNumber}？\n\n• 套餐：${props.planLabel}\n• 发票金额：¥${totalForInvoice.toLocaleString()}${isUpgrade ? `（含已抵扣 ¥${props.discountAmountCny.toLocaleString()}）` : ''}\n• 将给 ${props.customerEmail} 发放 credits 并发送激活邮件`,
      )
    )
      return;

    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/orders/${props.orderId}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceNumber }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? '激活失败');
      setMessage('激活成功，已给客户发送邮件');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '激活失败');
    } finally {
      setLoading(false);
    }
  }

  async function handleRejectReceipt() {
    const reason = prompt('退回理由？（会记录到对账笔记）');
    if (!reason) return;
    setLoading(true);
    try {
      await fetch(`/api/admin/orders/${props.orderId}/reject-receipt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const canActivate =
    props.currentStatus === 'payment_submitted' || props.currentStatus === 'contract_signed';
  const alreadyActivated = props.currentStatus === 'activated';

  return (
    <Card>
      <CardHeader>
        <CardTitle>对账与激活</CardTitle>
        <CardDescription>
          核对对公账户流水与客户提交的信息一致后，点激活为客户发放 credits 并开具发票。
          {isUpgrade && (
            <span className="mt-1 block text-xs">
              升级订单：发票按套餐标准价开具 ¥{totalForInvoice.toLocaleString()}（含已抵扣 ¥
              {props.discountAmountCny.toLocaleString()} 启动包）。
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>客户</Label>
            <div className="rounded border p-2 text-sm">
              {props.customerCompany} · {props.customerEmail}
            </div>
          </div>
          <div>
            <Label>套餐</Label>
            <div className="rounded border p-2 text-sm">{props.planLabel}</div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>本次实收（差额）</Label>
            <div className="rounded border p-2 font-mono text-sm">
              ¥{props.amountCny.toLocaleString()}
            </div>
          </div>
          <div>
            <Label>开票金额（标准价）</Label>
            <div className="rounded border p-2 font-mono text-sm">
              ¥{totalForInvoice.toLocaleString()}
              {isUpgrade && (
                <span className="ml-2 text-xs text-muted-foreground">
                  含抵扣 ¥{props.discountAmountCny.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="invoiceNumber">发票编号</Label>
          <Input
            id="invoiceNumber"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            disabled={loading || alreadyActivated}
          />
          <p className="text-xs text-muted-foreground">
            建议格式 PONT-INV-YYYYMMDD-XXX，用于税务发票与本单关联
          </p>
        </div>

        {error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {message && <p className="rounded bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}

        <div className="flex flex-wrap gap-3">
          <Button onClick={handleActivate} disabled={loading || !canActivate || alreadyActivated}>
            {alreadyActivated ? '已激活' : loading ? '处理中...' : '对账通过，激活账号'}
          </Button>
          {props.receiptCount > 0 && !alreadyActivated && (
            <Button onClick={handleRejectReceipt} disabled={loading} variant="outline">
              退回打款
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
