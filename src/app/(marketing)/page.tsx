import Link from 'next/link';
import { ArrowRight, FileText, Sparkles, ShieldCheck } from 'lucide-react';

export default function HomePage() {
  return (
    <>
      <section className="container flex flex-col items-center justify-center py-24 text-center">
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
          给中小企业老板的 <br className="hidden md:inline" />
          AI 工具与咨询
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          一次咨询解决一个具体问题，一套工具长期陪跑。
          <br />
          999 元起步，对公打款，合同保障，正规发票。
        </p>
        <div className="mt-10 flex gap-4">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            查看三档套餐 <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/cases"
            className="inline-flex items-center gap-2 rounded-md border px-6 py-3 text-sm font-medium hover:bg-accent"
          >
            看看案例
          </Link>
        </div>
      </section>

      <section className="container grid gap-8 py-16 md:grid-cols-3">
        <FeatureCard
          icon={<Sparkles className="h-6 w-6" />}
          title="AI 工具矩阵"
          description="OCR 发票识别、SEO 诊断等，按月 credits 计费，用多少算多少。"
        />
        <FeatureCard
          icon={<FileText className="h-6 w-6" />}
          title="999 咨询"
          description="1 小时一对一远程，出一份可执行的 PDF 诊断报告。"
        />
        <FeatureCard
          icon={<ShieldCheck className="h-6 w-6" />}
          title="正规合规"
          description="电子合同、对公账户、合规发票，企业报销无障碍。"
        />
      </section>
    </>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border p-6">
      <div className="mb-4 text-primary">{icon}</div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
