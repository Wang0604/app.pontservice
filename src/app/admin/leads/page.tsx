import Link from 'next/link';
import { db } from '@/lib/db';
import { leads } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { formatDate } from '@/lib/utils';
import { getPlanShortLabel } from '@/lib/pricing';

export const dynamic = 'force-dynamic';

const STATUS_LABELS: Record<string, string> = {
  new: '新申请',
  contacted: '已联系',
  approved: '已审批',
  contract_sent: '合同已发',
  contract_signed: '已签署',
  paid: '已付款',
  activated: '已激活',
  lost: '流失',
};

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const statusFilter = searchParams.status;

  const rows = await (statusFilter
    ? db.select().from(leads).where(eq(leads.status, statusFilter)).orderBy(desc(leads.createdAt))
    : db.select().from(leads).orderBy(desc(leads.createdAt)).limit(100));

  return (
    <div className="container py-10">
      <h1 className="mb-6 text-3xl font-bold">客户申请</h1>

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
              <th className="p-3">时间</th>
              <th className="p-3">公司</th>
              <th className="p-3">联系人</th>
              <th className="p-3">套餐</th>
              <th className="p-3">状态</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted-foreground">
                  暂无数据
                </td>
              </tr>
            ) : (
              rows.map((lead) => (
                <tr key={lead.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-3 text-muted-foreground">{formatDate(lead.createdAt)}</td>
                  <td className="p-3 font-medium">{lead.companyName}</td>
                  <td className="p-3">
                    {lead.contactName}
                    <div className="text-xs text-muted-foreground">{lead.email}</div>
                  </td>
                  <td className="p-3">{getPlanShortLabel(lead.interestedPlan)}</td>
                  <td className="p-3">
                    <span className="rounded bg-muted px-2 py-0.5 text-xs">
                      {STATUS_LABELS[lead.status] ?? lead.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <Link
                      href={`/admin/leads/${lead.id}`}
                      className="text-sm text-primary hover:underline"
                    >
                      处理 →
                    </Link>
                  </td>
                </tr>
              ))
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
      href={value ? `/admin/leads?status=${value}` : '/admin/leads'}
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
