import Link from 'next/link';
import { FileText, Search } from 'lucide-react';
import { requireUser } from '@/lib/auth/helpers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = { title: '工具' };

export default async function ToolsPage() {
  await requireUser();

  const tools = [
    {
      slug: 'ocr-invoice',
      name: 'OCR 发票识别',
      description: '上传 PDF / 图片，提取结构化发票数据',
      credits: 5,
      icon: <FileText className="h-6 w-6" />,
      available: true,
    },
    {
      slug: 'seo-audit',
      name: 'SEO 诊断',
      description: '输入网址，生成技术 SEO 检测报告（Week 11+ 上线）',
      credits: 10,
      icon: <Search className="h-6 w-6" />,
      available: false,
    },
  ];

  return (
    <div className="container max-w-5xl py-10">
      <h1 className="text-3xl font-bold">工具矩阵</h1>
      <p className="mt-2 text-muted-foreground">按次计费，credits 用完即停。</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {tools.map((tool) => (
          <Card
            key={tool.slug}
            className={tool.available ? '' : 'opacity-60'}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="text-primary">{tool.icon}</div>
                <div>
                  <CardTitle>{tool.name}</CardTitle>
                  <CardDescription>每次消耗 {tool.credits} credits</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">{tool.description}</p>
              {tool.available ? (
                <Link
                  href={`/tools/${tool.slug}`}
                  className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
                >
                  开始使用
                </Link>
              ) : (
                <span className="text-xs text-muted-foreground">敬请期待</span>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
