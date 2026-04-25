import Link from 'next/link';
import { getCurrentSession } from '@/lib/auth/helpers';
import { PLANS } from '@/lib/pricing';
import { ApplyForm } from './apply-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function ApplyPage({
  searchParams,
}: {
  searchParams: { plan?: string };
}) {
  const session = await getCurrentSession();
  const user = session?.user;

  const defaultPlan = PLANS.find((p) => p.id === searchParams.plan)?.id ?? '2999';

  return (
    <div className="container max-w-2xl py-12">
      <Link href="/pricing" className="text-sm text-muted-foreground hover:underline">
        ← 返回定价
      </Link>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>申请签约</CardTitle>
          <CardDescription>
            提交后我们会在 1 个工作日内审核，审核通过会发邮件给您附上电子合同链接。
            {user ? (
              <span className="mt-2 block rounded bg-muted px-3 py-2 text-xs">
                已用 {user.email} 登录，表单已为您预填
              </span>
            ) : (
              <span className="mt-2 block rounded bg-muted px-3 py-2 text-xs">
                未登录也能提交，我们会通过邮件联系您；审批通过后自动创建账号
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ApplyForm
            defaultPlan={defaultPlan}
            prefill={
              user
                ? {
                    email: user.email,
                    name: user.name ?? '',
                    companyName:
                      (user as unknown as { companyName?: string | null }).companyName ?? '',
                    phone:
                      (user as unknown as { phoneNumber?: string | null }).phoneNumber ?? '',
                  }
                : undefined
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
