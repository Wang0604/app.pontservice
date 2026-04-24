import Link from 'next/link';
import { requireUser } from '@/lib/auth/helpers';
import { getBalance } from '@/lib/credits';
import { OcrTool } from './ocr-tool';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'OCR 发票识别' };

export default async function OcrInvoicePage() {
  const session = await requireUser();
  const balance = await getBalance(session.user.id);

  return (
    <div className="container max-w-3xl py-10">
      <Link href="/tools" className="text-sm text-muted-foreground hover:underline">
        ← 工具
      </Link>

      <h1 className="mt-4 text-3xl font-bold">OCR 发票识别</h1>
      <p className="mt-2 text-muted-foreground">
        上传 PDF / JPG / PNG，自动提取发票信息为结构化 JSON。每次消耗 <strong>5 credits</strong>。
      </p>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>当前余额</CardTitle>
          <CardDescription>
            可用 <strong>{balance?.availableCredits ?? 0}</strong> credits
            {balance && balance.availableCredits < 5 && (
              <span className="ml-2 text-destructive">余额不足，请先充值</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OcrTool userId={session.user.id} disabled={(balance?.availableCredits ?? 0) < 5} />
        </CardContent>
      </Card>
    </div>
  );
}
