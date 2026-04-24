import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ApplySuccessPage() {
  return (
    <div className="container max-w-xl py-20">
      <Card>
        <CardHeader className="items-center text-center">
          <CheckCircle className="mb-2 h-12 w-12 text-emerald-500" />
          <CardTitle className="text-2xl">申请已收到</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">
            我们会在 <strong>1 个工作日内</strong>联系您。
            请留意企业邮箱，审批通过后会发送电子合同链接。
          </p>
          <div className="rounded bg-muted p-4 text-left text-sm text-muted-foreground">
            <p className="mb-2 font-medium text-foreground">接下来会发生什么？</p>
            <ol className="list-decimal space-y-1 pl-4">
              <li>我们审核您的申请，确认价格和条款（如有早鸟价我们会注明）</li>
              <li>生成电子合同，邮件发给您</li>
              <li>您在邮件链接里查看并电子签署，不用打印</li>
              <li>按合同对公打款（订单号做转账备注）</li>
              <li>我们对账确认后为您激活账号 + 开票</li>
            </ol>
          </div>
          <Link
            href="/"
            className="mt-4 inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm hover:bg-accent"
          >
            返回首页
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
