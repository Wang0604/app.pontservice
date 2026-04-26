import Link from 'next/link';
import { db } from '@/lib/db';
import { orders, leads } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { formatDate, formatYuan } from '@/lib/utils';
import { getPlanShortLabel } from '@/lib/pricing';

export const dynamic = 'force-dynamic';

const STATUS_LABELS: Record<string, string> = {
  draft: '草稿',
  pending_approval: '待审批',
  contract_sent: '合同已发',
  contract_signed: '已签署',
  awaiting_payment: '待付款',
  payment_submitted: '待对账',
  activated: '已激活',
  cancelled: '已取消',
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const statusFilter = searchParams.status;

  const rows = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      planType: orders.planType,
      upgradedFromPlan: orders.upgradedFromPlan,
      amount: orders.actualAmountCny,
      originalAmount: orders.amountCny,
      discountAmount: orders.discountAmountCny,
      paperworkStatus: orders.paperworkStatus,
      paymentStatus: orders.paymentStatus,
      paymentProvider: orders.paymentProvider,
      createdAt: orders.createdAt,
      leadCompany: leads.companyName,
      leadContact: leads.contactName,
      leadEmail: leads.email,
    })
    .from(orders)
    .leftJoin(leads, eq(orders.leadId, leads.id))
    .where(statusFilter ? eq(orders.paperworkStatus, statusFilter) : undefined)
    .orderBy(desc(orders.createdAt))
    .limit(100);

  return (
    <div className="container py-10">
      <h1 className="mb-6 text-3xl font-bold">订单</h1>

      <div className="mb-4 flex flex-wrap gap-2">
        <StatusFilter label="全部" value="" active={!statusFilter} />
        {Object.entries(STATUS_LABELS).map(([value, label]) => (
          <StatusFilter key={value} label={label} value={value} active={statusFilter === value} />
        ))}
      </div>

      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left">
            <tr>
              <th className="p-3">订单号</th>
              <th className="p-3">客户</th>
              <th className="p-3">套餐</th>
              <th className="p-3">金额</th>
              <th className="p-3">支付</th>
              <th className="p-3">状态</th>
              <th className="p-3">时间</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-6 text-center text-muted-foreground">
                  暂无数据
                </td>
              </tr>
            ) : (
              rows.map((o) => {
                const discount = parseFloat(o.discountAmount ?? '0');
                const original = parseFloat(o.originalAmount ?? o.amount);
                const isUpgrade = discount > 0;
                return (
                  <tr key={o.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-3 font-mono text-xs">{o.orderNumber}</td>
                    <td className="p-3">
                      <div>{o.leadCompany ?? '-'}</div>
                      <div className="text-xs text-muted-foreground">
                        {o.leadContact} · {o.leadEmail}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium">{getPlanShortLabel(o.planType)}</div>
                      {o.upgradedFromPlan && (
                        <div className="mt-0.5 inline-flex items-center rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                          由 {getPlanShortLabel(o.upgradedFromPlan)} 升级
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      {isUpgrade ? (
                        <div className="text-xs leading-5">
                          <div className="font-mono">{formatYuan(parseFloat(o.amount))}</div>
                          <div className="text-[10px] text-muted-foreground">
                            标价 {formatYuan(original)} - 抵扣 {formatYuan(discount)}
                          </div>
                        </div>
                      ) : (
                        formatYuan(parseFloat(o.amount))
                      )}
                    </td>
                    <td className="p-3">
                      <div>{o.paymentStatus}</div>
                      <div className="text-xs text-muted-foreground">{o.paymentProvider ?? '-'}</div>
                    </td>
                    <td className="p-3">
                      <span className="rounded bg-muted px-2 py-0.5 text-xs">
                        {STATUS_LABELS[o.paperworkStatus] ?? o.paperworkStatus}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground">{formatDate(o.createdAt)}</td>
                    <td className="p-3 text-right">
                      <Link href={`/admin/orders/${o.id}`} className="text-primary hover:underline">
                        处理 →
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusFilter({ label, value, active }: { label: string; value: string; active: boolean }) {
  return (
    <Link
      href={value ? `/admin/orders?status=${value}` : '/admin/orders'}
      className={
        active
          ? 'rounded-md border-2 border-primary px-3 py-1 text-sm font-medium'
          : 'rounded-md border px-3 py-1 text-sm hover:bg-accent'
      }
    >
      {label}
    </Link>
  );
}
