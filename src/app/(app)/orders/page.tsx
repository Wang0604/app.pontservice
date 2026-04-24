import Link from 'next/link';
import { db } from '@/lib/db';
import { orders, leads } from '@/lib/db/schema';
import { eq, desc, or } from 'drizzle-orm';
import { requireUser } from '@/lib/auth/helpers';
import { formatDate, formatYuan } from '@/lib/utils';
import { getPlanShortLabel } from '@/lib/pricing';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

const STATUS_LABELS: Record<string, string> = {
  draft: '待审批',
  pending_approval: '审批中',
  contract_sent: '待签署',
  contract_signed: '待打款',
  awaiting_payment: '待打款',
  payment_submitted: '对账中',
  activated: '已激活',
  cancelled: '已取消',
};

export default async function OrdersPage() {
  const session = await requireUser();

  const rows = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      planType: orders.planType,
      actualAmountCny: orders.actualAmountCny,
      paperworkStatus: orders.paperworkStatus,
      activatedAt: orders.activatedAt,
      createdAt: orders.createdAt,
      leadEmail: leads.email,
    })
    .from(orders)
    .leftJoin(leads, eq(orders.leadId, leads.id))
    .where(or(eq(orders.userId, session.user.id), eq(leads.email, session.user.email)))
    .orderBy(desc(orders.createdAt))
    .limit(50);

  return (
    <div className="container max-w-4xl py-10">
      <h1 className="text-3xl font-bold">我的订单</h1>
      <p className="mt-2 text-muted-foreground">
        跟踪每个订单的合同、打款、激活状态。
      </p>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>订单列表</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              还没有订单 ·{' '}
              <Link href="/pricing" className="text-primary hover:underline">
                去定价页申请
              </Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b text-left text-muted-foreground">
                <tr>
                  <th className="pb-2">订单号</th>
                  <th className="pb-2">套餐</th>
                  <th className="pb-2">金额</th>
                  <th className="pb-2">状态</th>
                  <th className="pb-2">时间</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((o) => (
                  <tr key={o.id} className="border-b last:border-0">
                    <td className="py-2 font-mono text-xs">{o.orderNumber}</td>
                    <td className="py-2">{getPlanShortLabel(o.planType)}</td>
                    <td className="py-2">{formatYuan(parseFloat(o.actualAmountCny))}</td>
                    <td className="py-2">{STATUS_LABELS[o.paperworkStatus] ?? o.paperworkStatus}</td>
                    <td className="py-2 text-muted-foreground">{formatDate(o.createdAt)}</td>
                    <td className="py-2 text-right">
                      <Link
                        href={`/orders/${o.id}`}
                        className="text-primary hover:underline"
                      >
                        查看 →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
