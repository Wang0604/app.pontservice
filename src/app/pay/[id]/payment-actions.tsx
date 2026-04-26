'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function PaymentActions({
  orderId,
  initialStatus,
  provider,
}: {
  orderId: string;
  initialStatus: string;
  provider: string | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);

  const refreshStatus = useCallback(async () => {
    const res = await fetch(`/api/orders/${orderId}/payment-status`, { cache: 'no-store' });
    if (!res.ok) return;
    const body = (await res.json()) as { paymentStatus: string };
    setStatus(body.paymentStatus);
    if (body.paymentStatus === 'paid') router.refresh();
  }, [orderId, router]);

  async function markStubPaid() {
    setLoading(true);
    try {
      await fetch(`/api/dev/payments/${orderId}/mark-paid`, { method: 'POST' });
      await refreshStatus();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (status === 'paid') return;
    const timer = setInterval(refreshStatus, 3000);
    return () => clearInterval(timer);
  }, [refreshStatus, status]);

  if (status === 'paid') {
    return <p className="rounded bg-emerald-50 p-3 text-sm text-emerald-700">支付已确认。</p>;
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        当前状态：{status === 'pending' ? '等待支付' : status}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={refreshStatus} disabled={loading}>
          刷新支付状态
        </Button>
        {provider === 'stub' && (
          <Button type="button" onClick={markStubPaid} disabled={loading}>
            {loading ? '确认中...' : '模拟已支付（测试）'}
          </Button>
        )}
      </div>
    </div>
  );
}
