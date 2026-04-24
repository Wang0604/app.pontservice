import Link from 'next/link';
import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { leads, orders } from '@/lib/db/schema';
import { formatDate } from '@/lib/utils';
import { getPlan, getPlanShortLabel } from '@/lib/pricing';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LeadApprovalPanel } from './approval-panel';

export const dynamic = 'force-dynamic';

export default async function AdminLeadDetail({ params }: { params: { id: string } }) {
  const leadRows = await db.select().from(leads).where(eq(leads.id, params.id)).limit(1);
  if (leadRows.length === 0) return notFound();
  const lead = leadRows[0];

  const orderRows = await db
    .select()
    .from(orders)
    .where(eq(orders.leadId, lead.id))
    .limit(1);
  const order = orderRows[0];
  const plan = getPlan(lead.interestedPlan);

  return (
    <div className="container max-w-4xl py-10">
      <Link href="/admin/leads" className="text-sm text-muted-foreground hover:underline">
        ← 返回申请列表
      </Link>

      <h1 className="mt-4 text-3xl font-bold">{lead.companyName}</h1>
      <p className="text-muted-foreground">
        {lead.contactName} · {lead.email}
        {lead.phone && ` · ${lead.phone}`}
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>申请详情</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <span className="font-medium">意向套餐：</span>
              {getPlanShortLabel(lead.interestedPlan)}
              {plan && (
                <span className="text-muted-foreground">
                  （原价 ¥{plan.listPriceCny} / 早鸟价 ¥{plan.earlyBirdPriceCny}）
                </span>
              )}
            </div>
            <div>
              <span className="font-medium">提交时间：</span>
              {formatDate(lead.createdAt)}
            </div>
            <div>
              <span className="font-medium">当前状态：</span>
              {lead.status}
            </div>
            {lead.useCase && (
              <div>
                <div className="font-medium">使用场景：</div>
                <p className="whitespace-pre-wrap rounded bg-muted p-3 text-sm">{lead.useCase}</p>
              </div>
            )}
            {lead.notes && (
              <div>
                <div className="font-medium">备注：</div>
                <p className="whitespace-pre-wrap text-sm">{lead.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>订单</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {order ? (
              <>
                <div className="mb-2 font-mono text-xs text-muted-foreground">
                  {order.orderNumber}
                </div>
                <div>
                  金额: ¥{parseFloat(order.actualAmountCny).toLocaleString()}
                  {order.earlyBird && ' (早鸟)'}
                </div>
                <div>状态: {order.paperworkStatus}</div>
              </>
            ) : (
              <p className="text-muted-foreground">无关联订单</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <LeadApprovalPanel
          leadId={lead.id}
          orderId={order?.id}
          currentLeadStatus={lead.status}
          currentPaperworkStatus={order?.paperworkStatus ?? 'draft'}
          currentAmount={parseFloat(order?.actualAmountCny ?? '0')}
          currentEarlyBird={order?.earlyBird ?? false}
          currentContractId={order?.contractId ?? null}
          planId={lead.interestedPlan as '999' | '2999' | '36000'}
        />
      </div>
    </div>
  );
}
