import Link from 'next/link';
import { db } from '@/lib/db';
import { leads, orders } from '@/lib/db/schema';
import { eq, count, sql } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const [
    [newLeadsCount],
    [pendingApprovalCount],
    [contractSentCount],
    [paymentSubmittedCount],
    [activatedThisMonthCount],
  ] = await Promise.all([
    db.select({ n: count() }).from(leads).where(eq(leads.status, 'new')),
    db.select({ n: count() }).from(orders).where(eq(orders.paperworkStatus, 'pending_approval')),
    db.select({ n: count() }).from(orders).where(eq(orders.paperworkStatus, 'contract_sent')),
    db.select({ n: count() }).from(orders).where(eq(orders.paperworkStatus, 'payment_submitted')),
    db
      .select({ n: count() })
      .from(orders)
      .where(
        sql`${orders.paperworkStatus} = 'activated' AND ${orders.activatedAt} > now() - interval '30 days'`,
      ),
  ]);

  const cards = [
    { label: '新申请', value: newLeadsCount.n, href: '/admin/leads?status=new' },
    { label: '待审批', value: pendingApprovalCount.n, href: '/admin/orders?status=pending_approval' },
    { label: '待签署', value: contractSentCount.n, href: '/admin/orders?status=contract_sent' },
    { label: '待对账', value: paymentSubmittedCount.n, href: '/admin/orders?status=payment_submitted' },
    { label: '近 30 天激活', value: activatedThisMonthCount.n, href: '/admin/orders?status=activated' },
  ];

  return (
    <div className="container py-10">
      <h1 className="mb-6 text-3xl font-bold">Admin 看板</h1>
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        {cards.map((c) => (
          <Link key={c.label} href={c.href}>
            <Card className="transition hover:border-primary">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">{c.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{c.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
