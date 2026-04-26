import Link from 'next/link';
import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { leads, orders } from '@/lib/db/schema';
import { formatDate } from '@/lib/utils';
import { ENTRY_PLAN_ID, getPlan, getPlanShortLabel, type PlanId } from '@/lib/pricing';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LeadApprovalPanel } from './approval-panel';

export const dynamic = 'force-dynamic';

export default async function AdminLeadDetail({ params }: { params: { id: string } }) {
  const leadRows = await db.select().from(leads).where(eq(leads.id, params.id)).limit(1);
  if (leadRows.length === 0) return notFound();
  const lead = leadRows[0];

  const orderRows = await db.select().from(orders).where(eq(orders.leadId, lead.id)).limit(1);
  const order = orderRows[0];

  // 客户提交时的"意向" plan 仅作为参考记录；实际首单永远是 999 启动包。
  const interestedPlan = (lead.interestedPlan as PlanId) ?? ENTRY_PLAN_ID;
  const currentPlan = (order?.planType as PlanId | undefined) ?? ENTRY_PLAN_ID;
  const currentPlanDef = getPlan(currentPlan);

  const actualAmountCny = order ? parseFloat(order.actualAmountCny) : 0;
  const originalAmountCny = order
    ? parseFloat(order.amountCny ?? order.actualAmountCny ?? '0')
    : 0;
  const discountAmountCny = order ? parseFloat(order.discountAmountCny ?? '0') : 0;
  const priorPaidAmountCny = order ? parseFloat(order.priorPaidAmountCny ?? '0') : 0;

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
              <span className="font-medium">客户提交时的意向：</span>
              {getPlanShortLabel(lead.interestedPlan)}
              <span className="ml-2 text-xs text-muted-foreground">
                （仅作参考，实际首单按 999 启动包走）
              </span>
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
          <CardContent className="text-sm space-y-1.5">
            {order ? (
              <>
                <div className="font-mono text-xs text-muted-foreground">
                  {order.orderNumber}
                </div>
                <div className="pt-1 text-xs uppercase tracking-wide text-muted-foreground">
                  当前 Plan
                </div>
                <div className="font-bold">
                  {currentPlanDef?.shortLabel ?? currentPlan}
                  {order.upgradedFromPlan && (
                    <span className="ml-2 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                      由 {getPlanShortLabel(order.upgradedFromPlan)} 升级
                    </span>
                  )}
                </div>

                <div className="pt-2 text-xs uppercase tracking-wide text-muted-foreground">
                  金额
                </div>
                {discountAmountCny > 0 ? (
                  <div className="font-mono text-xs leading-5">
                    标准价 ¥{originalAmountCny.toLocaleString()}
                    <br />
                    抵扣 -¥{discountAmountCny.toLocaleString()}
                    <br />
                    实付 ¥{actualAmountCny.toLocaleString()}
                    {currentPlanDef?.billingCycle === 'monthly' && ' / 月'}
                  </div>
                ) : (
                  <div className="font-mono">
                    ¥{actualAmountCny.toLocaleString()}
                    {currentPlanDef?.billingCycle === 'monthly' && ' / 月'}
                  </div>
                )}

                <div className="pt-2 text-xs uppercase tracking-wide text-muted-foreground">
                  状态
                </div>
                <div>
                  {order.paperworkStatus} · {order.paymentStatus}
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">无关联订单（点击下方按钮生成首单）</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <LeadApprovalPanel
          leadId={lead.id}
          orderId={order?.id}
          orderNumber={order?.orderNumber}
          currentLeadStatus={lead.status}
          currentPaperworkStatus={order?.paperworkStatus ?? 'draft'}
          currentPaymentStatus={order?.paymentStatus ?? 'unpaid'}
          currentActualAmountCny={actualAmountCny}
          currentPlan={currentPlan}
          originalAmountCny={originalAmountCny}
          discountAmountCny={discountAmountCny}
          priorPaidAmountCny={priorPaidAmountCny}
          upgradedFromPlan={order?.upgradedFromPlan ?? null}
          currentContractId={order?.contractId ?? null}
          leadInterestedPlan={interestedPlan}
        />
      </div>
    </div>
  );
}
