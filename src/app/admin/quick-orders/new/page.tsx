import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireAdmin } from '@/lib/auth/helpers';
import { getAppUrl, getPaymentProviderName } from '@/lib/payments';
import { QuickOrderForm } from './quick-order-form';

export const dynamic = 'force-dynamic';

export default async function QuickOrderNewPage() {
  await requireAdmin();
  const appUrl = getAppUrl();
  const provider = getPaymentProviderName();

  return (
    <div className="container py-10">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <Link
            href="/admin"
            className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-3 w-3" />
            返回看板
          </Link>
          <h1 className="text-3xl font-bold">快速收款</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            适合年付、种子客户、特殊报价等场景。一键生成微信收款链接，发给客户即可。
          </p>
        </div>
        <div className="text-right text-xs">
          <div className="text-muted-foreground">当前支付通道</div>
          <div className="mt-0.5 font-mono text-sm">
            {provider === 'wechat' ? '✓ 微信支付（生产）' : `⚠ ${provider}（测试）`}
          </div>
        </div>
      </div>
      <QuickOrderForm defaultAppUrl={appUrl} />
    </div>
  );
}
