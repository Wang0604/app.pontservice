import Link from 'next/link';
import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { contracts, leads, orders } from '@/lib/db/schema';
import { getPlanShortLabel } from '@/lib/pricing';
import { formatDate } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ContractActions } from './contract-actions';

export const dynamic = 'force-dynamic';

export default async function ContractPage({ params }: { params: { id: string } }) {
  const [contract] = await db.select().from(contracts).where(eq(contracts.id, params.id));
  if (!contract) return notFound();

  const [order] = await db.select().from(orders).where(eq(orders.id, contract.orderId));
  if (!order) return notFound();

  const [lead] = order.leadId ? await db.select().from(leads).where(eq(leads.id, order.leadId)) : [undefined];

  const STATUS_LABELS: Record<string, string> = {
    draft: '合同生成中',
    approved: '合同已准备好',
    sent: '等待您签署',
    viewing: '您已查看，等待签署',
    signed: '已签署',
    voided: '已作废',
  };

  return (
    <div className="container max-w-3xl py-10">
      <Link href="/" className="text-sm text-muted-foreground hover:underline">
        ← 返回首页
      </Link>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>合同 · 订单 {order.orderNumber}</CardTitle>
          <CardDescription>
            {STATUS_LABELS[contract.status] ?? contract.status} ·
            {getPlanShortLabel(order.planType)} · ¥{parseFloat(order.actualAmountCny).toLocaleString()}
            {order.earlyBird && ' (早鸟价)'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {lead && (
            <div className="rounded bg-muted p-4 text-sm">
              <div><strong>甲方：</strong>{lead.companyName}</div>
              <div><strong>联系人：</strong>{lead.contactName}</div>
              <div><strong>联系邮箱：</strong>{lead.email}</div>
              {contract.sentAt && <div><strong>合同发送时间：</strong>{formatDate(contract.sentAt)}</div>}
            </div>
          )}

          {contract.pdfR2Key ? (
            <div className="rounded border">
              <iframe
                src={`/api/contracts/${contract.id}/pdf`}
                title="合同预览"
                className="h-[600px] w-full rounded"
              />
            </div>
          ) : (
            <div className="rounded bg-muted p-6 text-center text-sm text-muted-foreground">
              合同 PDF 正在生成，通常需要 1 分钟左右。请稍后刷新。
            </div>
          )}

          <ContractActions
            contractId={contract.id}
            orderId={order.id}
            status={contract.status}
            hasPdf={!!contract.pdfR2Key}
            esignSignUrl={contract.esignSignUrl}
          />
        </CardContent>
      </Card>
    </div>
  );
}
