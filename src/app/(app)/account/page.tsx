import { requireUser } from '@/lib/auth/helpers';
import { getBalance, listTransactions, ensureWelcomeCreditsOnce } from '@/lib/credits';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const TYPE_LABELS: Record<string, string> = {
  grant: '发放',
  consume: '消费',
  refund: '退还',
  adjust: '调整',
};

export default async function AccountPage() {
  const session = await requireUser();
  const userId = session.user.id;

  await ensureWelcomeCreditsOnce(userId);

  const [balance, transactions] = await Promise.all([getBalance(userId), listTransactions(userId, 50)]);

  return (
    <div className="container space-y-6 py-10">
      <div>
        <h1 className="text-3xl font-bold">我的账户</h1>
        <p className="text-muted-foreground">
          {session.user.email}
          {(session.user as unknown as { companyName?: string }).companyName
            ? ` · ${(session.user as unknown as { companyName: string }).companyName}`
            : ''}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">当前余额</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{balance?.availableCredits ?? 0}</div>
            <p className="text-xs text-muted-foreground">credits</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">累计获得</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{balance?.totalGranted ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">累计消耗</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{balance?.totalConsumed ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3">
        <Link
          href="/tools"
          className="rounded-md border px-4 py-2 text-sm hover:bg-accent"
        >
          使用工具
        </Link>
        <Link
          href="/pricing"
          className="rounded-md border px-4 py-2 text-sm hover:bg-accent"
        >
          充值 / 升级
        </Link>
        <Link
          href="/orders"
          className="rounded-md border px-4 py-2 text-sm hover:bg-accent"
        >
          我的订单
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Credits 流水</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-muted-foreground">暂无流水</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b text-left text-muted-foreground">
                <tr>
                  <th className="pb-2">时间</th>
                  <th className="pb-2">类型</th>
                  <th className="pb-2">变动</th>
                  <th className="pb-2">说明</th>
                  <th className="pb-2 text-right">余额</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} className="border-b last:border-0">
                    <td className="py-2">{formatDate(t.createdAt)}</td>
                    <td className="py-2">{TYPE_LABELS[t.type] ?? t.type}</td>
                    <td
                      className={
                        t.amount > 0
                          ? 'py-2 font-medium text-emerald-600'
                          : 'py-2 font-medium text-red-600'
                      }
                    >
                      {t.amount > 0 ? '+' : ''}
                      {t.amount}
                    </td>
                    <td className="py-2 text-muted-foreground">{t.reason ?? '-'}</td>
                    <td className="py-2 text-right font-mono">{t.balanceAfter}</td>
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
