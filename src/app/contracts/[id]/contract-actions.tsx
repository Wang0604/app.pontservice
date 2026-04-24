'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function ContractActions({
  contractId,
  orderId,
  status,
  hasPdf,
  esignSignUrl,
}: {
  contractId: string;
  orderId: string;
  status: string;
  hasPdf: boolean;
  esignSignUrl: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSign() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/contracts/${contractId}/sign`, { method: 'POST' });
      if (!res.ok) throw new Error((await res.json()).error ?? '签署失败');
      router.push(`/orders/${orderId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '签署失败');
    } finally {
      setLoading(false);
    }
  }

  if (status === 'signed') {
    return (
      <div className="rounded bg-emerald-50 p-4 text-sm text-emerald-700">
        合同已签署成功。请前往订单页查看对公打款信息。
      </div>
    );
  }

  if (status === 'voided') {
    return (
      <div className="rounded bg-red-50 p-4 text-sm text-red-700">
        本合同已作废。如需重新签署，请联系我们。
      </div>
    );
  }

  if (!hasPdf) {
    return null;
  }

  const isStub = !esignSignUrl || esignSignUrl.includes('/sign');
  const thirdPartyUrl = esignSignUrl && !esignSignUrl.includes(`/contracts/${contractId}/sign`)
    ? esignSignUrl
    : null;

  return (
    <div className="space-y-3">
      <div className="rounded bg-muted p-4 text-sm">
        <p className="mb-2 font-medium">签署前请确认以下事项：</p>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          <li>合同金额和交付标准与您的理解一致</li>
          <li>退款条款您能接受</li>
          <li>对公账户信息准备好，合同签署后我们会告知转账信息</li>
        </ul>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {thirdPartyUrl ? (
        <a href={thirdPartyUrl} target="_blank" rel="noopener noreferrer">
          <Button className="w-full" size="lg">
            前往签署（第三方电子签平台）
          </Button>
        </a>
      ) : (
        <Button className="w-full" size="lg" onClick={handleSign} disabled={loading}>
          {loading ? '处理中...' : '我已阅读，确认签署'}
        </Button>
      )}
    </div>
  );
}
