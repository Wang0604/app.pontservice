import Link from 'next/link';
import {
  ArrowRight,
  ClipboardCheck,
  FileText,
  ReceiptText,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

const trustSignals = ['对公合同', '正规发票', '数据归属客户', '人工审核交付'];

const plans = [
  {
    step: '01',
    price: '999',
    title: '诊断',
    subtitle: '先支付诊断费',
    description: '60 分钟远程诊断，输出可执行报告，判断哪条 AI 路径最值得做。',
    href: '/pricing/apply?plan=999',
    cta: '预约诊断',
  },
  {
    step: '03A',
    price: '2999',
    title: '工具包',
    subtitle: '固定化业务 / 工具订阅',
    description: '适合已经明确要用 OCR、SEO / GEO 工具的客户，按月发放 credits。',
    href: '/pricing/apply?plan=2999',
    cta: '申请工具包',
  },
  {
    step: '03B',
    price: '9999',
    title: '增长陪跑',
    subtitle: '陪跑落地 / 流程优化',
    description: '适合需要人一起拆流程、调 Prompt、做月度复盘的客户。',
    href: '/pricing/apply?plan=9999',
    cta: '申请陪跑',
  },
];

const steps = [
  {
    label: '01',
    title: '先做诊断',
    description: '用 60 分钟把业务问题、数据来源、可落地边界讲清楚。',
  },
  {
    label: '02',
    title: '抵扣升级',
    description: '诊断后继续购买工具包或陪跑服务，已支付的 999 元可抵扣首期费用。',
  },
  {
    label: '03',
    title: '选择路径',
    description: '根据诊断结果选择固定化业务、购买工具包，或进入增长陪跑。',
  },
];

export default function HomePage() {
  return (
    <>
      <section className="overflow-hidden border-b bg-[linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--card))_52%,hsl(var(--muted))_100%)]">
        <div className="container grid min-h-[620px] max-w-6xl items-center gap-10 py-14 md:grid-cols-[0.98fr_1.02fr] md:py-20 lg:gap-14">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-semibold text-primary shadow-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              中小企业 AI 诊断 + 工具交付
            </div>
            <h1 className="mt-7 max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-[-0.04em] text-foreground md:text-5xl lg:text-6xl">
              给中小企业老板的 AI 工具与落地咨询
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              先用 999 诊断把业务问题看清楚，再接入 OCR、SEO / GEO 等工具。
              合同、发票、对公付款和人工审核都在同一套交付流程里。
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
              >
                查看三档套餐 <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/diagnosis"
                className="inline-flex items-center justify-center gap-2 rounded-xl border bg-card px-6 py-3 text-sm font-semibold transition hover:bg-accent"
              >
                先做 AI 自测
              </Link>
              <Link
                href="/cases"
                className="inline-flex items-center justify-center gap-2 rounded-xl border bg-card px-6 py-3 text-sm font-semibold transition hover:bg-accent"
              >
                看看案例
              </Link>
            </div>
            <div className="mt-7 flex flex-wrap gap-2.5 text-sm text-muted-foreground">
              {trustSignals.map((signal) => (
                <span key={signal} className="rounded-full border bg-card/80 px-3 py-1">
                  {signal}
                </span>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/70 blur-3xl" />
            <div className="relative rounded-[1.75rem] border bg-card/95 p-5 shadow-2xl shadow-slate-900/10 md:p-6">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-primary">
                    PONT-AI 交付路径
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    先诊断，再抵扣升级，最后按结果选择工具或陪跑
                  </p>
                </div>
                <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
                  Diagnosis first
                </span>
              </div>

              <div className="mt-5 grid gap-3">
                <PathCard plan={plans[0]} featured />

                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <ReceiptText className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">
                        02 抵扣规则
                      </p>
                      <h2 className="mt-1 text-lg font-extrabold">999 诊断费可抵扣后续升级</h2>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        购买 2999 工具包或 9999 增长陪跑时，已支付的 999 元可抵扣首期服务费。
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <PathCard plan={plans[1]} compact />
                  <PathCard plan={plans[2]} compact />
                </div>
              </div>

              <Link
                href="/tools/ocr-invoice"
                className="group mt-5 block rounded-2xl bg-primary p-5 text-primary-foreground transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold opacity-80">当前可用工具</p>
                    <p className="mt-2 text-2xl font-bold tracking-tight">OCR 发票识别</p>
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
                    5 credits / 次
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 opacity-80">
                  先把一件高频、低风险的工作跑通，再扩展到 SEO / GEO 诊断。
                </p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold">
                  打开工具 <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container max-w-6xl py-16">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              PONT-AI workflow
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">
              不是直接卖工具，而是先用诊断把购买路径定下来
            </h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              客户先用 999 诊断降低决策风险；诊断后如果继续购买 2999 工具包或 9999
              增长陪跑，诊断费进入抵扣逻辑，避免重复付费。
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.label} className="rounded-2xl border bg-card p-5 shadow-sm">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {step.label}
                </span>
                <h3 className="mt-5 text-lg font-semibold tracking-tight">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.description}</p>
                {index === 1 && (
                  <div className="mt-4 rounded-xl bg-accent px-3 py-2 text-xs font-semibold text-accent-foreground">
                    诊断费可抵扣后续工具包或陪跑服务
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container max-w-6xl pb-16">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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

function PathCard({
  plan,
  featured = false,
  compact = false,
}: {
  plan: (typeof plans)[number];
  featured?: boolean;
  compact?: boolean;
}) {
  return (
    <Link
      href={plan.href}
      className={
        featured
          ? 'group block rounded-2xl border-2 border-primary bg-background p-4 transition hover:-translate-y-0.5 hover:shadow-lg'
          : 'group block rounded-2xl border bg-background/80 p-4 transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md'
      }
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">
            {plan.step} / ¥{plan.price}
          </p>
          <h2 className={compact ? 'mt-2 text-lg font-extrabold' : 'mt-2 text-xl font-extrabold'}>
            {plan.title}
          </h2>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">{plan.subtitle}</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{plan.description}</p>
        </div>
        <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
        {plan.cta}
      </span>
    </Link>
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
