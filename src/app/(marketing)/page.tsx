import Link from 'next/link';
import { ArrowRight, ClipboardCheck, FileText, Sparkles, ShieldCheck } from 'lucide-react';

const trustSignals = ['对公合同', '正规发票', '数据归属客户', '人工审核交付'];

const steps = [
  {
    label: '01',
    title: '先做诊断',
    description: '用 60 分钟把业务问题、数据来源、可落地边界讲清楚。',
  },
  {
    label: '02',
    title: '接入工具',
    description: '从 OCR 发票识别开始，按 credits 计费，结果可追踪。',
  },
  {
    label: '03',
    title: '陪跑落地',
    description: '需要时加入月度诊断、Prompt 优化和流程复盘。',
  },
];

export default function HomePage() {
  return (
    <>
      <section className="border-b bg-[radial-gradient(circle_at_top,hsl(var(--card))_0,hsl(var(--background))_46%,hsl(var(--muted))_100%)]">
        <div className="container grid min-h-[640px] items-center gap-12 py-20 lg:grid-cols-[1.08fr_0.92fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border bg-card/90 px-4 py-2 text-sm font-medium text-muted-foreground shadow-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              中小企业 AI 诊断与工具工作台
            </div>
            <h1 className="mt-7 max-w-4xl text-balance text-4xl font-extrabold leading-[1.08] tracking-[-0.045em] text-foreground md:text-6xl">
              先把问题诊断清楚，再让 AI 工具进入业务流程
            </h1>
            <p className="mt-6 max-w-2xl text-pretty text-lg leading-8 text-muted-foreground">
              Pontai 面向中小企业老板：从一次可执行的 999 诊断开始，再用 OCR、SEO / GEO
              等工具和陪跑服务，把合同、发票、对公付款都放进同一套交付流程。
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
              >
                查看三档套餐 <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/diagnosis"
                className="inline-flex items-center justify-center gap-2 rounded-lg border bg-card px-6 py-3 text-sm font-semibold transition hover:bg-accent"
              >
                先做 AI 自测
              </Link>
              <Link
                href="/cases"
                className="inline-flex items-center justify-center gap-2 rounded-lg border bg-card px-6 py-3 text-sm font-semibold transition hover:bg-accent"
              >
                看看案例
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-3 text-sm text-muted-foreground">
              {trustSignals.map((signal) => (
                <span key={signal} className="rounded-full border bg-card/80 px-3 py-1">
                  {signal}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border bg-card/90 p-6 shadow-xl shadow-slate-900/5">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <p className="text-sm font-semibold text-primary">Pontai 工作台</p>
                <p className="mt-1 text-xs text-muted-foreground">诊断、工具、订单状态统一管理</p>
              </div>
              <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
                已激活
              </span>
            </div>
            <div className="mt-6 grid gap-3">
              {steps.map((step) => (
                <div key={step.label} className="rounded-xl border bg-background/80 p-4">
                  <div className="flex items-start gap-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                      {step.label}
                    </span>
                    <div>
                      <h2 className="font-semibold tracking-tight">{step.title}</h2>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-xl bg-primary p-5 text-primary-foreground">
              <p className="text-sm opacity-80">当前入口</p>
              <p className="mt-2 text-2xl font-bold tracking-tight">999 元起步诊断</p>
              <p className="mt-2 text-sm leading-6 opacity-80">
                先判断 AI 是否值得做，再决定买工具包还是增长陪跑。
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-16">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">How it works</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight">不是卖一个聊天机器人，而是交付一个可报销、可复盘的 AI 工作流</h2>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            icon={<Sparkles className="h-6 w-6" />}
            title="AI 工具矩阵"
            description="OCR 发票识别先上线，SEO / GEO 诊断后续接入，同一套 credits 体系。"
          />
          <FeatureCard
            icon={<FileText className="h-6 w-6" />}
            title="999 诊断"
            description="1 小时一对一远程会议，输出一份可执行的 PDF 诊断报告。"
          />
          <FeatureCard
            icon={<ShieldCheck className="h-6 w-6" />}
            title="正规合规"
            description="电子合同、对公账户、正规发票，方便企业采购与财务报销。"
          />
          <FeatureCard
            icon={<ClipboardCheck className="h-6 w-6" />}
            title="人工陪跑"
            description="需要落地时提供月度诊断、Prompt 优化和业务流程复盘。"
          />
        </div>
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
    <div className="rounded-2xl border bg-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-primary">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold tracking-tight">{title}</h3>
      <p className="text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}
