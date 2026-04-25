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
    <div className="container max-w-6xl py-10">
      <div className="rounded-2xl border bg-card/90 p-6 shadow-sm md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Workspace</p>
        <div className="mt-3 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">AI 工具工作台</h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              把每次工具调用都放进 credits 体系里：先从 OCR 发票识别开始，后续接入 SEO / GEO
              诊断时保持同一套使用习惯。
            </p>
          </div>
          <div className="rounded-xl border bg-background/80 px-4 py-3 text-sm text-muted-foreground">
            按次计费，credits 用完即停
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {tools.map((tool) => (
          <Card
            key={tool.slug}
            className={tool.available ? 'bg-card/95' : 'bg-muted/60 opacity-75'}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-primary">
                  {tool.icon}
                </div>
                <div>
                  <CardTitle className="text-xl">{tool.name}</CardTitle>
                  <CardDescription>每次消耗 {tool.credits} credits</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-5 text-sm leading-6 text-muted-foreground">{tool.description}</p>
              {tool.available ? (
                <Link
                  href={`/tools/${tool.slug}`}
                  className="inline-flex items-center gap-1 rounded-lg border bg-card px-4 py-2 text-sm font-medium hover:bg-accent"
                >
                  开始使用
                </Link>
              ) : (
                <span className="rounded-full border bg-background/70 px-3 py-1 text-xs text-muted-foreground">
                  敬请期待
                </span>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
