'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function PaymentReceiptUpload({
  orderId,
  orderNumber,
  amountCny,
  existingReceipts,
}: {
  orderId: string;
  orderNumber: string;
  amountCny: number;
  existingReceipts: number;
}) {
  const router = useRouter();
  const [bankReference, setBankReference] = useState('');
  const [amount, setAmount] = useState<number>(amountCny);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      let receiptKey: string | undefined;

      if (file) {
        const intentRes = await fetch('/api/upload/intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type,
            sizeBytes: file.size,
            purpose: 'payment-receipt',
            orderId,
          }),
        });
        if (!intentRes.ok) throw new Error('获取上传凭证失败');
        const intent = await intentRes.json();

        const putRes = await fetch(intent.url, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type },
        });
        if (!putRes.ok) throw new Error('上传文件失败');

        receiptKey = intent.key;
      }

      const submitRes = await fetch(`/api/orders/${orderId}/receipt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankReference: bankReference || undefined,
          amountCny: amount,
          receiptKey,
        }),
      });
      if (!submitRes.ok) throw new Error((await submitRes.json()).error ?? '提交失败');
      setMessage('已提交打款信息，我们会在 1 个工作日内对账激活');
      setBankReference('');
      setFile(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded border p-4">
      <div>
        <h3 className="font-medium">已完成打款？告诉我们</h3>
        <p className="text-sm text-muted-foreground">
          {existingReceipts > 0
            ? '您已经提交过打款信息，如有更新可再次提交。'
            : '以下信息可以帮助我们更快对账，但不是必须的。'}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="bankReference">银行流水号（可选）</Label>
          <Input
            id="bankReference"
            placeholder="从银行 App 里复制"
            value={bankReference}
            onChange={(e) => setBankReference(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">实际打款金额</Label>
          <Input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(parseFloat(e.target.value))}
            disabled={loading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="file">转账回单（截图或 PDF，可选）</Label>
        <Input
          id="file"
          type="file"
          accept="image/*,.pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          disabled={loading}
        />
        <p className="text-xs text-muted-foreground">最大 10MB，我们仅用于对账，不会对外公开</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {message && <p className="text-sm text-emerald-700">{message}</p>}

      <Button type="submit" disabled={loading}>
        {loading ? '提交中...' : '提交打款信息'}
      </Button>
    </form>
  );
}
