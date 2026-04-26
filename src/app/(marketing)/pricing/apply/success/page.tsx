import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ApplySuccessPage() {
  return (
    <div className="container max-w-xl py-20">
      <Card>
        <CardHeader className="items-center text-center">
          <CheckCircle className="mb-2 h-12 w-12 text-emerald-500" />
          <CardTitle className="text-2xl">启动包申请已收到</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">
            我们会在 <strong>1 个工作日内</strong>联系您。请留意企业邮箱与电话——审批通过后顾问会和您约
            40-60 分钟免费 1v1 诊断时间。
          </p>
          <div className="rounded bg-muted p-4 text-left text-sm text-muted-foreground">
            <p className="mb-2 font-medium text-foreground">接下来的标准流程：</p>
            <ol className="list-decimal space-y-1 pl-4">
              <li>我们审核申请并发起 999 启动包电子合同</li>
              <li>您在邮件链接里电子签署，并按订单号对公打款 999 元</li>
              <li>顾问与您约 40-60 分钟免费诊断会议（远程 1v1）</li>
              <li>会后 5 个工作日内交付《AI 落地路线图》PDF</li>
              <li>30 天内可选择升级 2999 工具包 / 9999 增长包，999 元全额抵扣首期</li>
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
