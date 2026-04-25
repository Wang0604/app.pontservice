import Link from 'next/link';
import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { orders, leads, contracts, paymentReceipts } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth/helpers';
import { getPlanShortLabel } from '@/lib/pricing';
import { formatDate, formatYuan } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PaymentReceiptUpload } from './payment-receipt-upload';

export const dynamic = 'force-dynamic';

export default async function OrderDetail({ params }: { params: { id: string } }) {
  const session = await requireUser();

  const [order] = await db.select().from(orders).where(eq(orders.id, params.id));
  if (!order) return notFound();

  const [lead] = order.leadId
    ? await db.select().from(leads).where(eq(leads.id, order.leadId))
    : [undefined];

  const canAccess =
    order.userId === session.user.id ||
    (lead?.email && lead.email.toLowerCase() === session.user.email.toLowerCase());

  if (!canAccess) {
    const isAdmin = (session.user as unknown as { role?: string }).role === 'admin';
    if (!isAdmin) return notFound();
  }

  const [contract] = order.contractId
    ? await db.select().from(contracts).where(eq(contracts.id, order.contractId))
    : [undefined];

  const receipts = await db
    .select()
    .from(paymentReceipts)
    .where(eq(paymentReceipts.orderId, order.id));

  return (
    <div className="container max-w-3xl py-10">
      <Link href="/orders" className="text-sm text-muted-foreground hover:underline">
        ← 我的订单
      </Link>

      <h1 className="mt-4 text-3xl font-bold">订单 {order.orderNumber}</h1>
      <p className="mt-2 text-muted-foreground">
        {getPlanShortLabel(order.planType)} · {formatYuan(parseFloat(order.actualAmountCny))}
      </p>

      <ProgressBar status={order.paperworkStatus} />

      {contract && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>合同</CardTitle>
            <CardDescription>
              状态: {contract.status}
              {contract.signedAt && ` · 签署于 ${formatDate(contract.signedAt)}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href={`/contracts/${contract.id}`}
              className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm hover:bg-accent"
            >
              查看 / 签署合同
            </Link>
          </CardContent>
        </Card>
      )}

      {order.paperworkStatus === 'contract_signed' ||
      order.paperworkStatus === 'awaiting_payment' ||
      order.paperworkStatus === 'payment_submitted' ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>打款说明</CardTitle>
            <CardDescription>
              请用甲方公司对公账户汇款，并在备注填写订单号。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded border bg-muted/40 p-4 text-sm">
              <Row label="户名" value={process.env.BANK_ACCOUNT_NAME ?? '[待配置]'} />
              <Row label="开户行" value={
                process.env.BANK_NAME && process.env.BANK_BRANCH
                  ? `${process.env.BANK_NAME} ${process.env.BANK_BRANCH}`
                  : '[待配置]'
              } />
              <Row label="账号" value={process.env.BANK_ACCOUNT_NUMBER ?? '[待配置]'} mono />
              <Row label="金额" value={formatYuan(parseFloat(order.actualAmountCny))} />
              <Row label="备注" value={order.orderNumber} mono highlight />
            </div>

            <div className="rounded bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-medium">务必在备注中填写订单号</p>
              <p className="mt-1 text-amber-800">
                否则我们可能无法自动关联您的打款。如果忘记填写，请联系我们。
              </p>
            </div>

            <PaymentReceiptUpload
              orderId={order.id}
              orderNumber={order.orderNumber}
              amountCny={parseFloat(order.actualAmountCny)}
              existingReceipts={receipts.length}
            />
          </CardContent>
        </Card>
      ) : null}

      {order.paperworkStatus === 'activated' && (
        <Card className="mt-6 border-emerald-200 bg-emerald-50">
          <CardHeader>
            <CardTitle>已激活</CardTitle>
            <CardDescription>
              {order.activatedAt && `激活时间: ${formatDate(order.activatedAt)}`}
              {order.creditsGranted && ` · ${order.creditsGranted} credits 已到账`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/account" className="rounded-md border px-4 py-2 text-sm hover:bg-accent">
              前往账户
            </Link>
            {order.invoiceR2Key && (
              <Link
                href={`/api/orders/${order.id}/invoice`}
                className="ml-2 rounded-md border px-4 py-2 text-sm hover:bg-accent"
              >
                下载发票
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {receipts.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>打款记录</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead className="border-b text-left text-muted-foreground">
                <tr>
                  <th className="pb-2">时间</th>
                  <th className="pb-2">金额</th>
                  <th className="pb-2">流水号</th>
                  <th className="pb-2">状态</th>
                </tr>
              </thead>
              <tbody>
                {receipts.map((r) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="py-2">{formatDate(r.createdAt)}</td>
                    <td className="py-2">{formatYuan(parseFloat(r.amountCny))}</td>
                    <td className="py-2 font-mono text-xs">{r.bankReference ?? '-'}</td>
                    <td className="py-2">
                      {r.status === 'verified' ? '已核对' : r.status === 'rejected' ? '未通过' : '对账中'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  mono,
  highlight,
}: {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex border-b py-1.5 last:border-0">
      <div className="w-24 text-muted-foreground">{label}</div>
      <div
        className={
          (mono ? 'font-mono ' : '') + (highlight ? 'font-semibold text-primary' : '') + ' flex-1'
        }
      >
        {value}
      </div>
    </div>
  );
}

function ProgressBar({ status }: { status: string }) {
  const steps = [
    { key: 'draft', label: '申请' },
    { key: 'pending_approval', label: '审批' },
    { key: 'contract_sent', label: '签署' },
    { key: 'contract_signed', label: '打款' },
    { key: 'payment_submitted', label: '对账' },
    { key: 'activated', label: '激活' },
  ];
  const currentIdx = steps.findIndex((s) => s.key === status);

  return (
    <div className="mt-8 flex items-center gap-1">
      {steps.map((step, idx) => {
        const done = currentIdx >= idx;
        const active = currentIdx === idx;
        return (
          <div key={step.key} className="flex flex-1 items-center gap-1">
            <div className="flex flex-col items-center">
              <div
                className={
                  done
                    ? active
                      ? 'flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground'
                      : 'flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white'
                    : 'flex h-8 w-8 items-center justify-center rounded-full border bg-muted text-xs text-muted-foreground'
                }
              >
                {idx + 1}
              </div>
              <div className="mt-1 text-xs">{step.label}</div>
            </div>
            {idx < steps.length - 1 && (
              <div className={done ? 'h-0.5 flex-1 bg-emerald-500' : 'h-0.5 flex-1 bg-muted'} />
            )}
          </div>
        );
      })}
    </div>
  );
}
