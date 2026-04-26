import Link from 'next/link';
import { ArrowRight, CheckCircle2, ClipboardCheck, FileText, Timer } from 'lucide-react';
import { DiagnosisChecklist } from './diagnosis-checklist';

export const metadata = {
  title: 'AI 诊断自测',
  description: '用 3 分钟判断企业当前最适合从哪个 AI 工具或流程切入。',
};

const signals = [
  {
    icon: <FileText className="h-5 w-5" />,
    title: '票据和合同仍靠人工整理',
    description: '发票、合同、客户资料需要人工复制粘贴，容易漏项、错项。',
  },
  {
    icon: <Timer className="h-5 w-5" />,
    title: '重复沟通占用老板时间',
    description: '销售、客服、交付有大量固定问答和追进度工作，难以沉淀成流程。',
  },
  {
    icon: <ClipboardCheck className="h-5 w-5" />,
    title: '内容和获客缺少稳定机制',
    description: '官网、SEO、行业资料长期断更，线索来源依赖熟人和临时推广。',
  },
];

export default function DiagnosisPage() {
  return (
    <div className="container py-16">
      <section className="mx-auto max-w-3xl text-center">
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border bg-muted/40 px-4 py-2 text-sm text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          3 分钟完成，不需要注册
        </div>
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">先判断 AI 值不值得做，再决定买什么</h1>
        <p className="mt-5 text-lg text-muted-foreground">
          这份自测帮助老板快速看清：当前业务更适合先观察一阵，还是直接申请 999 启动包，把流程拆明白后再决定升级工具包。
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="#checklist"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            开始自测 <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center rounded-md border px-5 py-3 text-sm font-medium hover:bg-accent"
          >
            查看服务套餐
          </Link>
        </div>
      </section>

      <section className="mt-16 grid gap-4 md:grid-cols-3">
        {signals.map((signal) => (
          <div key={signal.title} className="rounded-lg border bg-card p-6">
            <div className="mb-4 text-primary">{signal.icon}</div>
            <h2 className="font-semibold">{signal.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{signal.description}</p>
          </div>
        ))}
      </section>

      <section id="checklist" className="mx-auto mt-16 max-w-4xl scroll-mt-24">
        <DiagnosisChecklist />
      </section>
    </div>
  );
}
