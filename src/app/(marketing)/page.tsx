import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Sparkles } from 'lucide-react';

const stats = [
  { value: '999', label: '元 AI 落地启动包', sub: '一次性付款' },
  { value: '免费', label: '40-60 分钟咨询', sub: '资深顾问 1v1' },
  { value: '100%', label: '抵扣后续工具包', sub: '30 天内升级' },
  { value: '对公', label: '合同 + 正规发票', sub: '可财务报销' },
];

// 痛点 + 愿景叙事块
const visionPoints = [
  {
    eyebrow: 'Why now',
    title: '大企业转型慢，中小企业其实有窗口',
    description:
      '大型企业从信息化到 AI 的过渡周期普遍 18-36 个月——预算长、决策慢、工具堆叠厚。中小企业反而能更快地拍板、上线、迭代，关键是把第一步的方向定对。',
  },
  {
    eyebrow: 'Our mission',
    title: '助力中小企业全面实现 AI 落地与转型',
    description:
      '不要求客户必须先做完数字化才能用 AI。无论你已有 ERP、CRM 等数字化基础，还是仍以 Excel + 微信跑业务，我们都能从你现在的起点出发，给出可执行的 AI 落地路径。',
  },
  {
    eyebrow: 'How it lands',
    title: '工具 + 顾问 + 合同发票，一次跑通',
    description:
      'OCR / SEO / GEO 工具 + 远程诊断 + 1v1 顾问陪跑，配合电子合同与正规发票，从第一天起就符合企业财务与采购流程。',
  },
];

// 启动包流程：先付 → 免费咨询 → 抵扣升级
const path = [
  {
    step: '01',
    label: 'Activate',
    title: '999 启动包',
    description:
      '一次性支付 999 元，立刻进入企业 AI 落地通道：免费 40-60 分钟顾问咨询 + 50 credits 工具体验 + AI 工具抵扣券。',
    cta: '申请启动包',
    href: '/pricing/apply',
  },
  {
    step: '02',
    label: 'Diagnose',
    title: '免费诊断会议',
    description:
      '40-60 分钟远程 1v1，把发票、合同、客服、获客、内容等环节挨个拆开，输出一份《企业 AI 落地路线图》PDF。会议本身在话术与定价上都是免费的。',
    cta: '了解诊断内容',
    href: '/diagnosis',
  },
  {
    step: '03',
    label: 'Upgrade',
    title: '抵扣升级工具包',
    description:
      '30 天内决定升级 2999 工具包或 9999 增长陪跑，已支付的 999 元全额抵扣首期。结果上等于一分钱没花就拿到了完整的 AI 落地诊断。',
    cta: '看抵扣规则',
    href: '/pricing',
  },
];

const offerings = [
  {
    id: '999',
    name: 'AI 落地启动包',
    tagline: '所有客户的必经第一步',
    price: '¥999',
    cycle: '一次性',
    bullets: [
      '免费 40-60 分钟顾问诊断',
      '《企业 AI 落地路线图》PDF',
      '50 credits 工具体验',
      '999 元 AI 工具抵扣券',
    ],
    highlight: true,
    href: '/pricing/apply',
  },
  {
    id: '2999',
    name: 'AI 工具 SaaS 订阅',
    tagline: '诊断后按月解锁完整工具',
    price: '¥2999',
    cycle: '/ 月',
    bullets: [
      '完整 OCR / SEO / GEO 工具',
      '每月 200 credits',
      '999 启动包全额抵扣首期',
      '首月只补差 ¥2000',
    ],
    highlight: false,
    href: '/pricing',
  },
  {
    id: '9999',
    name: 'AI 增长陪跑包',
    tagline: '工具 + 专项诊断 + 顾问陪跑',
    price: '¥9999',
    cycle: '/ 月',
    bullets: [
      '工具包全部权益',
      '每月 500 credits + 专项诊断',
      '999 启动包全额抵扣首期',
      '首月只补差 ¥9000',
    ],
    highlight: false,
    href: '/pricing',
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
      <VisionSection />
      <PathSection />
      <OfferingSection />
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
          PONT·AI · 助力中小企业 AI 落地
        </span>
        <h1 className="mt-7 max-w-4xl text-balance text-5xl font-black leading-[1.02] tracking-[-0.045em] text-white md:text-7xl">
          中小企业的 AI 落地，
          <br className="hidden md:block" />
          从 999 元启动包开始。
        </h1>
        <p className="mt-7 max-w-2xl text-pretty text-lg leading-8 text-white/70">
          大企业从数字化转型到 AI 普遍要走 18-36 个月，慢且贵。我们专注扶持中小企业——
          无论你已有数字化基础，还是仍在 Excel + 微信里跑业务，都能从 999 元启动包跑通第一步。
          <br />
          <span className="mt-2 inline-block font-semibold text-white/90">
            支付 999 元，免费获得 40-60 分钟顾问诊断 + AI 工具抵扣券，升级工具包时全额抵扣，等于一分钱没花就把完整诊断拿到手。
          </span>
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link
            href="/pricing/apply"
            className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-[#00a0e9] px-7 py-3.5 text-sm font-bold text-[#04122c] shadow-lg shadow-[#00a0e9]/25 transition hover:bg-[#28b3f0]"
          >
            申请 999 启动包
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-7 py-3.5 text-sm font-bold text-white transition hover:bg-white/10"
          >
            看完整服务结构
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

function VisionSection() {
  return (
    <section className="relative bg-[#070b1c] text-white">
      <div className="container max-w-6xl pb-24">
        <div className="border-t border-white/10 pt-20">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/45">
                Vision &amp; Pain Point
              </p>
              <h2 className="mt-3 text-3xl font-black leading-[1.08] tracking-[-0.04em] md:text-5xl">
                我们只服务中小企业。
                <br className="hidden md:block" />
                因为大企业转型已经太晚、太慢。
              </h2>
            </div>
            <p className="max-w-md text-sm leading-7 text-white/60">
              企业级 AI 落地不该只是大厂的故事。Pontai 的使命是把"诊断 + 工具 + 陪跑"做成一条对中小企业老板友好的标准链路。
            </p>
          </div>

          <div className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 lg:grid-cols-3">
            {visionPoints.map((p) => (
              <div key={p.title} className="flex flex-col gap-4 bg-[#070b1c]/95 p-8">
                <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#00a0e9]">
                  {p.eyebrow}
                </span>
                <h3 className="text-2xl font-black tracking-[-0.04em] text-white">{p.title}</h3>
                <p className="text-sm leading-7 text-white/65">{p.description}</p>
              </div>
            ))}
          </div>
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
                999 元启动 → 免费诊断 → 抵扣升级
              </h2>
            </div>
            <p className="max-w-md text-sm leading-7 text-white/60">
              第一步必经 999 启动包，咨询服务和路线图全部免费交付；这 999 元等同于一张
              AI 工具抵扣券——升级 2999 工具包时全额扣除，等于一分钱没花。
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

function OfferingSection() {
  return (
    <section className="bg-[#f4f6fb] py-24 text-slate-900">
      <div className="container max-w-6xl">
        <div className="flex flex-col gap-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-500">
            What You Get
          </p>
          <h2 className="max-w-2xl text-3xl font-black leading-[1.08] tracking-[-0.04em] md:text-5xl">
            一条完整链路：启动包 → 工具包 → 增长包
          </h2>
          <p className="max-w-2xl text-sm leading-7 text-slate-600">
            首单永远是 999 启动包；客户跑完免费诊断会议后，再自主决定是否升级到工具包或增长陪跑。所有套餐都走对公合同 + 正规发票。
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {offerings.map((plan) => (
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
                  Start here
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
                {plan.highlight ? '立即申请启动包' : '在启动包后升级'}
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
            先用 OCR 发票识别验证 ROI，再按节奏接入 SEO 诊断、GEO 诊断；工具之间共用同一套账户与 credits。
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
                999 元锁定企业 AI 落地的第一步
              </h3>
              <p className="mt-4 text-sm leading-7 text-white/70">
                填一张表，1 个工作日内回复。免费 40-60 分钟顾问咨询、《AI 落地路线图》PDF、50 credits 工具体验，工具包升级时 999 元全额抵扣。
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row md:flex-col md:items-end">
              <Link
                href="/pricing/apply"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#00a0e9] px-7 py-3.5 text-sm font-bold text-[#04122c] shadow-lg shadow-[#00a0e9]/25 transition hover:bg-[#28b3f0]"
              >
                申请 999 启动包
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
