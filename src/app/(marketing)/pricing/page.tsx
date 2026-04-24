import Link from 'next/link';
import { Check } from 'lucide-react';
import { PLANS } from '@/lib/pricing';
import { formatYuan } from '@/lib/utils';

export const metadata = {
  title: '定价',
  description: 'Pontai 三档套餐：999 咨询 / 2999 工具包 / 36000 年付',
};

export default function PricingPage() {
  return (
    <div className="container py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold">三档套餐</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          按需选择。所有套餐都走对公合同、正规发票，企业财务报销无阻。
          前 10 位签约客户享早鸟价。
        </p>
      </div>

      <div className="mt-16 grid gap-8 md:grid-cols-3">
        {PLANS.map((plan) => {
          const hasDiscount = plan.earlyBirdPriceCny < plan.listPriceCny;
          const featured = plan.id === '2999';
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
                {hasDiscount ? (
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground line-through">
                      原价 {formatYuan(plan.listPriceCny)}
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold">{formatYuan(plan.earlyBirdPriceCny)}</span>
                      <span className="rounded bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                        早鸟价
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-4xl font-bold">{formatYuan(plan.listPriceCny)}</div>
                )}
                {plan.durationMonths > 0 && (
                  <div className="mt-1 text-sm text-muted-foreground">
                    {plan.durationMonths} 个月 / {plan.credits} credits
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
        <h3 className="font-semibold">为什么要走合同？</h3>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>• 企业采购服务需要书面依据，对公打款 + 合同才能走财务报销</li>
          <li>• 合同明确了交付标准、SLA、退款条款，双方都有保障</li>
          <li>• 我们提供 3% 增值税普通发票（一般纳税人可开专票）</li>
          <li>• 合同用电子签署，不需要打印盖章</li>
        </ul>
      </div>
    </div>
  );
}
