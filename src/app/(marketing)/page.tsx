import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Sparkles } from 'lucide-react';

const stats = [
  { value: '999', label: '元起步诊断', sub: '一次性付费' },
  { value: '60', label: '分钟可执行报告', sub: '远程 1v1' },
  { value: '100%', label: '抵扣首期', sub: '诊断后 30 天内' },
  { value: '对公', label: '合同 / 正规发票', sub: '可财务报销' },
];

const path = [
  {
    step: '01',
    label: 'Diagnose',
    title: '999 诊断',
    description: '60 分钟远程把业务问题、数据来源和落地边界讲清楚，输出一份可执行 PDF 报告。',
    cta: '预约诊断',
    href: '/pricing/apply?plan=999',
  },
  {
    step: '02',
    label: 'Credit',
    title: '抵扣升级',
    description:
      '诊断后 30 天内升级 2999 工具包或 9999 增长陪跑时，已支付的 999 元全额抵扣首期费用。',
    cta: '查看抵扣规则',
    href: '/pricing',
  },
  {
    step: '03',
    label: 'Choose',
    title: '选择落地路径',
    description: '工具包按月跑通 OCR / SEO / GEO；增长陪跑额外配人，把 Prompt 与流程一起跑通。',
    cta: '比较套餐',
    href: '/pricing',
  },
];

const plans = [
  {
    id: '999',
    name: '诊断',
    tagline: '判断 AI 值不值得做',
    price: '¥999',
    cycle: '一次性',
    bullets: [
      '60 分钟远程 1v1 会议',
      '可执行 PDF 诊断报告',
      '会后 7 天微信答疑',
      '50 credits 体验工具',
    ],
    highlight: false,
    href: '/pricing/apply?plan=999',
  },
  {
    id: '2999',
    name: '工具包',
    tagline: '已经知道要用什么',
    price: '¥2999',
    cycle: '/ 月',
    bullets: [
      '每月 200 credits',
      'OCR / SEO / GEO 工具',
      '999 诊断可抵首期',
      'SLA 月度可用率 > 99%',
    ],
    highlight: true,
    href: '/pricing/apply?plan=2999',
  },
  {
    id: '9999',
    name: '增长陪跑',
    tagline: '需要人陪着把流程跑通',
    price: '¥9999',
    cycle: '/ 月',
    bullets: [
      '工具包全部权益',
      '每月 500 credits',
      '月度专项诊断 + Prompt 调优',
      '999 诊断可抵首期',
    ],
    highlight: false,
    href: '/pricing/apply?plan=9999',
  },
];

const tools = [
  {
    name: 'OCR 发票识别',
    status: '已上线',
    cost: '5 credits / 次',
    description: '上传 PDF 或图片，提取结构化发票数据，可对接报销与对账。',
    href: '/tools/ocr-invoice',
    available: true,
  },
  {
    name: 'SEO 诊断',
    status: '即将上线',
    cost: '10 credits / 次',
    description: '输入网址，生成技术 SEO 检测报告，定位获客瓶颈。',
    href: '/pricing',
    available: false,
  },
  {
    name: 'GEO 诊断',
    status: '路线图',
    cost: '待定',
    description: '判断品牌在 DeepSeek、Claude 等 AI 平台被推荐的概率。',
    href: '/pricing',
    available: false,
  },
];

export default function HomePage() {
  return (
    <>
      <Hero />
      <PathSection />
      <PricingSection />
      <ToolsSection />
      <ClosingCta />
    </>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#070b1c] text-white">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,160,233,0.22),transparent_55%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.05),transparent_45%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"
      />
      <div className="container relative max-w-6xl py-20 md:py-28">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-white/85">
          <Sparkles className="h-3.5 w-3.5 text-[#00a0e9]" />
          PONT·AI workspace
        </span>
        <h1 className="mt-7 max-w-4xl text-balance text-5xl font-black leading-[1.02] tracking-[-0.045em] text-white md:text-7xl">
          为中小企业老板，
          <br className="hidden md:block" />把 AI 落到合同、发票、流程里。
        </h1>
        <p className="mt-7 max-w-2xl text-pretty text-lg leading-8 text-white/70">
          先用 999 诊断把问题看清楚，再用 OCR、SEO / GEO
          等工具按需上线。合同、发票、对公付款和人工审核都在同一套交付流程里。
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link
            href="/pricing/apply?plan=999"
            className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-[#00a0e9] px-7 py-3.5 text-sm font-bold text-[#04122c] shadow-lg shadow-[#00a0e9]/25 transition hover:bg-[#28b3f0]"
          >
            999 元先做诊断
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-7 py-3.5 text-sm font-bold text-white transition hover:bg-white/10"
          >
            对比三档套餐
          </Link>
          <Link
            href="/diagnosis"
            className="inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-bold text-white/80 transition hover:text-white"
          >
            先做 3 分钟自测
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-[#070b1c]/95 p-6">
              <div className="text-3xl font-black tracking-[-0.04em] text-white md:text-4xl">
                {s.value}
              </div>
              <div className="mt-2 text-sm font-semibold text-white/85">{s.label}</div>
              <div className="mt-1 text-xs text-white/45">{s.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PathSection() {
  return (
    <section className="relative bg-[#070b1c] text-white">
      <div className="container max-w-6xl pb-24">
        <div className="border-t border-white/10 pt-20">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/45">
                Workflow
              </p>
              <h2 className="mt-3 text-3xl font-black leading-[1.08] tracking-[-0.04em] md:text-5xl">
                不是直接卖工具，是先用 999 把购买路径定下来
              </h2>
            </div>
            <p className="max-w-md text-sm leading-7 text-white/60">
              客户先用 999 诊断降低决策风险；诊断后如果继续购买工具包或陪跑，已支付的 999
              元自动抵扣首期，避免重复付费。
            </p>
          </div>

          <div className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 lg:grid-cols-3">
            {path.map((p) => (
              <Link
                key={p.step}
                href={p.href}
                className="group relative flex flex-col gap-5 bg-[#070b1c]/95 p-8 transition hover:bg-white/[0.04]"
              >
                <div className="flex items-baseline justify-between text-[11px] font-bold uppercase tracking-[0.22em]">
                  <span className="text-[#00a0e9]">
                    {p.step} · {p.label}
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-white/30 transition group-hover:translate-x-0.5 group-hover:text-white/80" />
                </div>
                <h3 className="text-3xl font-black tracking-[-0.04em] text-white">{p.title}</h3>
                <p className="text-sm leading-7 text-white/60">{p.description}</p>
                <span className="mt-auto inline-flex items-center gap-2 text-sm font-bold text-white/90">
                  {p.cta}
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section className="bg-[#f4f6fb] py-24 text-slate-900">
      <div className="container max-w-6xl">
        <div className="flex flex-col gap-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-500">
            Pricing
          </p>
          <h2 className="max-w-2xl text-3xl font-black leading-[1.08] tracking-[-0.04em] md:text-5xl">
            三档服务，一条升级链路
          </h2>
          <p className="max-w-2xl text-sm leading-7 text-slate-600">
            999 诊断是入口，购买工具包或增长陪跑时全额抵扣，所有套餐都走对公合同 + 正规发票。
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <Link
              key={plan.id}
              href={plan.href}
              className={
                plan.highlight
                  ? 'group relative flex flex-col gap-6 rounded-3xl bg-[#070b1c] p-7 text-white shadow-xl shadow-slate-900/15 transition hover:-translate-y-0.5'
                  : 'group relative flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white p-7 text-slate-900 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md'
              }
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-7 inline-flex items-center rounded-full bg-[#00a0e9] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#04122c]">
                  Most-picked
                </span>
              )}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] opacity-70">
                  {plan.tagline}
                </p>
                <h3 className="mt-3 text-2xl font-black tracking-[-0.04em]">{plan.name}</h3>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-5xl font-black tracking-[-0.04em]">{plan.price}</span>
                <span className="text-sm font-semibold opacity-60">{plan.cycle}</span>
              </div>
              <ul className="space-y-2.5 text-sm leading-6">
                {plan.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2.5">
                    <span
                      aria-hidden="true"
                      className={
                        plan.highlight
                          ? 'mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#00a0e9]'
                          : 'mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-900'
                      }
                    />
                    <span className={plan.highlight ? 'text-white/85' : 'text-slate-700'}>{b}</span>
                  </li>
                ))}
              </ul>
              <span
                className={
                  plan.highlight
                    ? 'mt-2 inline-flex items-center gap-2 text-sm font-bold text-[#00a0e9]'
                    : 'mt-2 inline-flex items-center gap-2 text-sm font-bold text-slate-900'
                }
              >
                立即申请
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function ToolsSection() {
  return (
    <section className="bg-[#070b1c] py-24 text-white">
      <div className="container max-w-6xl">
        <div className="flex flex-col gap-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/45">Tools</p>
          <h2 className="max-w-2xl text-3xl font-black leading-[1.08] tracking-[-0.04em] md:text-5xl">
            同一套 credits，跑通工具矩阵
          </h2>
          <p className="max-w-2xl text-sm leading-7 text-white/60">
            先把 OCR 发票识别用起来验证 ROI，再按节奏接入 SEO 诊断、GEO
            诊断，工具之间共用同一个账户。
          </p>
        </div>

        <div className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 md:grid-cols-3">
          {tools.map((t) => (
            <Link
              key={t.name}
              href={t.href}
              className="group flex flex-col gap-3 bg-[#070b1c]/95 p-7 transition hover:bg-white/[0.04]"
            >
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.2em]">
                <span className={t.available ? 'text-[#00a0e9]' : 'text-white/40'}>{t.status}</span>
                <span className="text-white/35">{t.cost}</span>
              </div>
              <h3 className="text-2xl font-black tracking-[-0.04em] text-white">{t.name}</h3>
              <p className="text-sm leading-7 text-white/60">{t.description}</p>
              <span className="mt-auto inline-flex items-center gap-2 text-sm font-bold text-white/90">
                {t.available ? '打开工具' : '加入路线图'}
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function ClosingCta() {
  return (
    <section className="bg-[#070b1c] pb-24 text-white">
      <div className="container max-w-6xl">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#00a0e9]/15 via-white/[0.02] to-transparent p-10 md:p-14">
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#00a0e9]">
                Start here
              </p>
              <h3 className="mt-3 text-3xl font-black tracking-[-0.04em] md:text-4xl">
                先 999 诊断一次，把买什么定下来
              </h3>
              <p className="mt-4 text-sm leading-7 text-white/70">
                花一杯咖啡的时间填表单，1 个工作日内审核。电子合同 + 对公打款 + 30 天内升级抵扣。
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row md:flex-col md:items-end">
              <Link
                href="/pricing/apply?plan=999"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#00a0e9] px-7 py-3.5 text-sm font-bold text-[#04122c] shadow-lg shadow-[#00a0e9]/25 transition hover:bg-[#28b3f0]"
              >
                申请 999 诊断
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/diagnosis"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 px-7 py-3.5 text-sm font-bold text-white transition hover:bg-white/5"
              >
                先做 3 分钟自测
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
