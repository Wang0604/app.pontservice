import Link from 'next/link';
import { Check } from 'lucide-react';
import { PLANS } from '@/lib/pricing';
import { formatYuan } from '@/lib/utils';

export const metadata = {
  title: '定价',
  description: 'Pontai 三档套餐：999 诊断 / 2999 工具包 / 9999 增长包',
};

export default function PricingPage() {
  return (
    <div className="container py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold">从诊断到落地的三档服务</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          先把问题看清楚，再用工具跑起来。所有套餐都走对公合同、正规发票，
          企业财务报销无阻。
        </p>
      </div>

      <div className="mt-16 grid gap-8 md:grid-cols-3">
        {PLANS.map((plan) => {
          const featured = plan.id === '2999';
          const isMonthly = plan.billingCycle === 'monthly';
          return (
            <div
              key={plan.id}
              className={
                featured
                  ? 'relative flex flex-col rounded-lg border-2 border-primary bg-card p-8 shadow-lg'
                  : 'relative flex flex-col rounded-lg border bg-card p-8'
              }
            >
              {featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                  最多人选
                </div>
              )}
              <h3 className="text-xl font-semibold">{plan.label}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{plan.tagline}</p>

              <div className="mt-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{formatYuan(plan.priceCny)}</span>
                  {isMonthly && (
                    <span className="text-sm text-muted-foreground">/ 月</span>
                  )}
                </div>
                {isMonthly && (
                  <div className="mt-1 text-sm text-muted-foreground">
                    每月 {plan.credits} credits
                  </div>
                )}
              </div>

              <ul className="mt-6 space-y-3 text-sm">
                {plan.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>

              <p className="mt-6 text-xs text-muted-foreground">适合: {plan.recommendedFor}</p>

              <Link
                href={`/pricing/apply?plan=${plan.id}`}
                className={
                  featured
                    ? 'mt-auto inline-flex items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90'
                    : 'mt-auto inline-flex items-center justify-center rounded-md border px-4 py-2.5 text-sm font-medium hover:bg-accent'
                }
                style={{ marginTop: 'auto' }}
              >
                立即申请
              </Link>
            </div>
          );
        })}
      </div>

      <div className="mx-auto mt-16 max-w-2xl rounded-lg border bg-muted/40 p-6">
        <h3 className="font-semibold">这三档怎么选？</h3>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>• 还不确定问题值不值得做，先选 999 诊断</li>
          <li>• 已经确定要用 OCR 和后续 SEO / GEO 工具，选 2999 工具包（月付）</li>
          <li>• 希望有人帮你把工具、Prompt 和业务流程一起跑通，选 9999 增长包（月付）</li>
          <li>• 月付订阅可随时停用，按月发票；999 诊断为一次性服务</li>
          <li>• 企业采购服务需要书面依据，对公打款 + 合同才能走财务报销</li>
        </ul>
      </div>
    </div>
  );
}
